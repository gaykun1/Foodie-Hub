import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order, { IOrderDocument } from "../models/Order";
import Cart from "../models/Cart";
import { activeAdmins, io, restaurantsSocketsMap, socketsMap } from "../socket";
import Dish from "../models/Dish";
import Restaurant from "../models/Restaurant";
import Courier from "../models/Courier";
import User from "../models/User";
import { computeOrderPricing } from "../utils/pricing";
import { stripe } from "../utils/stripeClient";
import { sendOrderStatusEmail } from "../utils/sendOrderEmail";
import { geocodeStructured } from "../utils/geocode";
import { stopSimulation } from "../services/deliverySimulator";
import {
    NON_REVENUE_STATUSES,
    canCancel,
    canTransition,
    type CancelActor,
} from "../utils/orderStatus";
import { consumeSpecialPromocodes } from "../utils/pricing";

/**
 * True if the acting restaurant-role user owns the given restaurant id.
 *
 * Several restaurant-scoped endpoints below (`:id` in the URL, or `?id=` on
 * the statistics route) previously trusted that id outright once
 * `restaurantMiddleware`/`dashboardMiddleware` had proven "some restaurant
 * account" — never that it was *this* id's restaurant. That let any
 * restaurant account read (or, on `toggleToPreparing`, mutate) another
 * restaurant's orders and revenue by simply passing a different id.
 */
const ownsRestaurant = async (userId: string, restaurantId: string): Promise<boolean> => {
    const actingUser = await User.findById(userId).select("restaurantId");
    return actingUser?.restaurantId?.toString() === restaurantId;
};

interface CartItem {
    dishId: {
        title: string;
        description: string;
        price: number;
        imageUrl: string;
        _id: string;
        typeOfFood: string;
    };
    amount: number;

}

interface Cart {
    restaurantId: {
        title: string,
        imageUrl: string,
        _id: string,
    }
    items: CartItem[];
}


export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { cart }: { cart: Cart } = req.body;
    try {
        const order = await Order.findOne({ userId: (req as AuthRequest).userId, status: null });
        if (order) {
            res.status(200).json(order._id);
            return;
        } else {

            const order = await Order.create({ userId: (req as AuthRequest).userId, items: [], shippingPrice: null, totalPrice: 0, approxTime: 0, restaurantTitle: cart.restaurantId.title, restaurantImage: cart?.restaurantId.imageUrl });
            let sum = 0;
            // loop for pushing cart items to order items including summing all the prices
            (cart as Cart).items.forEach(item => {
                order.items.push({ title: item.dishId.title, price: item.dishId.price, amount: item.amount, imageUrl: item.dishId.imageUrl });
                sum += (item.amount * item.dishId.price);

            });
            order.totalPrice = +sum.toFixed(2);

            await order.save();
            res.status(201).json(order._id);
            return;
        }
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}


export const getOrder = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(order);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        // status: null is an in-progress checkout draft (created but never
        // confirmed — no address/shipping/payment yet), not a real order the
        // user has placed. Including it here crashed the client's order-details
        // view, which assumes every order it's given already has an address.
        const orders = await Order.find({ userId: (req as AuthRequest).userId, status: { $ne: null } });
        if (orders.length === 0) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}


export const getOrdersCreated = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        // Restaurant-only route — without this a restaurant account could pass
        // any other restaurant's id and read its freshly placed orders.
        if (!(await ownsRestaurant((req as AuthRequest).userId, id))) {
            res.status(403).json("Access denied");
            return;
        }
        const restaurant = await Restaurant.findById(id);
        const orders = await Order.find({ restaurantTitle: restaurant?.title, status: "Created" });
        if (orders.length === 0) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}

export const getLastSevenOrders = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        if (id == null) {
            const orders = await Order.find({ status: { $ne: null } }).sort({ updatedAt: -1 }).limit(7);
            if (orders.length === 0) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(orders);
            return
        } else {
            // Reached only via the restaurant-scoped route — without this a
            // restaurant account could pass any other restaurant's id here.
            if (!(await ownsRestaurant((req as AuthRequest).userId, id))) {
                res.status(403).json("Access denied");
                return;
            }
            const restaurant = await Restaurant.findById(id);
            const orders = await Order.find({ status: { $nin: [null, "Created"] }, restaurantTitle: restaurant?.title }).sort({ updatedAt: -1 }).limit(7);
            if (orders.length === 0) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(orders);
            return
        }

    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}

// func for getting start of the week with the date
const getMondayDate = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const newDate = date.getDate() - day + (day === 0 ? -6 : +1);
    // returning date with start of the week
    date.setDate(newDate);
    date.setHours(0, 0, 0, 0);
    return date;
}

// func for getting statistics for the week (dashboard)
export const getNumbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.query.id;
        let orders = [];
        // "Created" is excluded because it's the placed-but-not-yet-fulfilled
        // state, not revenue-worthy yet; "Cancelled" is excluded because it was
        // refunded — counting it would inflate revenue by money that went back out.
        if (id == null) {
            // dashboardMiddleware also admits "restaurant" accounts, but
            // platform-wide figures are admin-only — a restaurant account
            // calling without an id must not see every restaurant's revenue.
            if ((req as AuthRequest).role !== "admin") {
                res.status(403).json("Access denied");
                return;
            }
            orders = await Order.find({ status: { $nin: [...NON_REVENUE_STATUSES] } });
            if (!orders.length) {
                res.status(404).json({ message: "No orders found!" });
                return;
            }
        } else {
            // A restaurant account may only see its own figures — the id came
            // from the query string, so without this it could read any rival's.
            if ((req as AuthRequest).role === "restaurant" && !(await ownsRestaurant((req as AuthRequest).userId, String(id)))) {
                res.status(403).json("Access denied");
                return;
            }
            const restaurant = await Restaurant.findById(id);
            orders = await Order.find({ restaurantTitle: restaurant?.title, status: { $nin: [...NON_REVENUE_STATUSES] } });
            if (!orders.length) {
                res.status(404).json({ message: "No orders found!" });
                return;
            }
        }


        const now = new Date();

        const numOfOrders = orders.length;
        const totalRevenue = orders.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const averageOrderValue = +(totalRevenue / numOfOrders).toFixed(2);
        // getting that func for start day
        const startOfThisWeek = getMondayDate(new Date());
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
        // making end of the week by adding 6 to start of the week
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        // func that making x promises at one time
        // Same revenue-relevant status filter as the totals above — otherwise a
        // cancelled/refunded order (or an abandoned checkout draft, status null)
        // would still count toward this week's revenue comparison.
        const [ordersThisWeek, ordersLastWeek] = await Promise.all([
            Order.find({ createdAt: { $gte: startOfThisWeek, $lte: endOfThisWeek }, status: { $nin: [...NON_REVENUE_STATUSES, null] } }),
            Order.find({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek }, status: { $nin: [...NON_REVENUE_STATUSES, null] } })
        ]);
        const totalOrdersThisWeek = ordersThisWeek.length;
        const totalOrdersLastWeek = ordersLastWeek.length;
        const revenueThisWeek = ordersThisWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const revenueLastWeek = ordersLastWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const avgOrderValueThisWeek = totalOrdersThisWeek > 0 ? +(revenueThisWeek / totalOrdersThisWeek).toFixed(2) : 0;
        const avgOrderValueLastWeek = totalOrdersLastWeek > 0 ? +(revenueLastWeek / totalOrdersLastWeek).toFixed(2) : 0;

        const percentNumOfOrders =
            totalOrdersLastWeek > 0
                ? +((totalOrdersThisWeek - totalOrdersLastWeek) / totalOrdersLastWeek * 100).toFixed(2)
                : 0;

        const percentTotalRevenue =
            revenueLastWeek > 0
                ? +((revenueThisWeek - revenueLastWeek) / revenueLastWeek * 100).toFixed(2)
                : 0;

        const percentAvgOrderValue =
            avgOrderValueLastWeek > 0
                ? +((avgOrderValueThisWeek - avgOrderValueLastWeek) / avgOrderValueLastWeek * 100).toFixed(2)
                : 0;
        // adding + in the start to convert string (toFixed->string) to number
        res.status(200).json({
            numOfOrders: {
                number: +numOfOrders.toFixed(2),
                percent: percentNumOfOrders
            },
            totalRevenue: {
                number: +totalRevenue.toFixed(2),
                percent: percentTotalRevenue
            },
            averageOrderValue: {
                number: +averageOrderValue.toFixed(2),
                percent: percentAvgOrderValue
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error!" });
    }
};



export const getOrdersCourier = async (req: Request, res: Response): Promise<void> => {
    try {
        // Was trusting an :id from the URL despite already being behind
        // courierMiddleware — any courier could read any other courier's order
        // history. Order.courierId stores the Courier-application doc id, not
        // the User id, so it has to be resolved from the authenticated user.
        const ownCourier = await Courier.findOne({ userId: (req as AuthRequest).userId });
        if (!ownCourier) {
            res.status(404).json("Not found!");
            return;
        }
        const orders = await Order.find({ courierId: ownCourier._id });
        if (orders.length === 0) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}


export const updateOrder = async (req: Request, res: Response): Promise<void> => {
    const { formData, shipping, cartId, percent, paymentIntentId } = req.body;

    try {
        if (formData.city && formData.countryOrRegion && formData.houseNumber && formData.street) {

            // totalPrice/discountPercent are recomputed server-side (never trust the
            // client's numbers — they were previously forwarded straight to the DB
            // and to Stripe, letting anyone pay whatever they liked for a real order).
            const pricing = await computeOrderPricing((req as AuthRequest).userId, shipping, percent);
            if (!pricing) {
                res.status(404).json("Not found!");
                return;
            }

            // The order used to get finalized (sent to the kitchen, sold counts
            // incremented) as soon as this endpoint was called — BEFORE the client
            // even attempted stripe.confirmPayment. A declined card, a closed tab,
            // or a failed 3D Secure challenge still produced a fully "Created",
            // unpaid order. Now this independently re-checks with Stripe that the
            // referenced PaymentIntent actually succeeded, and for the exact amount
            // this order comes to, before touching the order at all.
            if (!paymentIntentId) {
                res.status(402).json("Payment not completed");
                return;
            }
            let paymentIntent;
            try {
                paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            } catch {
                res.status(402).json("Payment not completed");
                return;
            }
            const expectedAmount = Math.round(pricing.totalPrice * 100);
            if (paymentIntent.status !== "succeeded" || paymentIntent.amount !== expectedAmount) {
                res.status(402).json("Payment not completed");
                return;
            }

            // Resolve both ends of the delivery route once, here, and store them
            // on the order. Tracking previously geocoded the restaurant and the
            // customer address through Nominatim on every single map open.
            // Failures are tolerated: a null point degrades the map, and must
            // never fail an already-paid checkout.
            const draft = await Order.findOne({ status: null, userId: (req as AuthRequest).userId });
            const restaurantDoc = await Restaurant.findOne({ title: draft?.restaurantTitle });
            const [restaurantPoint, customerPoint] = await Promise.all([
                restaurantDoc?.location?.lat != null
                    ? Promise.resolve(restaurantDoc.location)
                    : geocodeStructured(restaurantDoc?.address ?? {}),
                geocodeStructured({
                    street: formData.street,
                    houseNumber: formData.houseNumber,
                    city: formData.city,
                    countryOrRegion: formData.countryOrRegion,
                }),
            ]);

            const order = await Order.findOneAndUpdate({ status: null, userId: (req as AuthRequest).userId }, {
                $set: {
                    status: "Created",
                    approxTime: shipping == 2.2 ? 50 : shipping == 3.2 ? 30 : 15,
                    shippingPrice: pricing.shippingPrice,
                    discountPercent: pricing.discountPercent,
                    fullName: (formData.name + " " + formData.surname),
                    "address.city": formData.city,
                    "address.countryOrRegion": formData.countryOrRegion,
                    "address.houseNumber": formData.houseNumber,
                    "address.apartmentNumbr": formData.apartmentNumbr,
                    "address.street": formData.street,
                    "route.restaurant": restaurantPoint ?? null,
                    "route.customer": customerPoint ?? null,
                    totalPrice: pricing.totalPrice,
                    paymentIntentId,
                }
            }, { new: true });
            const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId, _id: cartId }, { $set: { restaurantId: null, items: [] } });
            if (order) {
                // Burns the Special (one-time) codes that funded this order's
                // discount — see consumeSpecialPromocodes for why this has to
                // happen here, once payment is actually confirmed, and not at
                // redemption time.
                await consumeSpecialPromocodes((req as AuthRequest).userId, pricing.discountPercent);
                // incrementing sold with $inc
                for (const item of order.items) {
                    const dish = await Dish.findOneAndUpdate({ title: item.title }, {
                        $inc: { sold: item.amount }
                    })
                }
            }
            // emitting incoming orders to restaurant dashboard
            const restaurant = await Restaurant.findOne({ title: order?.restaurantTitle });
            for (const [id, socket] of restaurantsSocketsMap.entries()) {
                if (id === restaurant?.id) {
                    const orders = await Order.find({ status: "Created", restaurantTitle: restaurant.title });
                    socket.emit("incomingOrders", orders);
                }
            }

            // Unawaited on purpose — see sendOrderStatusEmail's own comment.
            if (order) {
                const orderUser = await User.findById((req as AuthRequest).userId).select("email username");
                sendOrderStatusEmail(order, orderUser, "confirmation");
            }

            res.status(200).json("Created!");
            return
        }
        res.status(400).json("Form error!");
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}




export const getFreeOrders = async (req: Request, res: Response): Promise<void> => {
    const city = req.params.city.trim();
    try {
        const orders = await Order.find({ status: { $in: ["Preparing"] }, "address.city": city, courierId: null });
        if (orders.length === 0) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const toggleToPreparing = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        // This previously wrote the literal status straight through via
        // findByIdAndUpdate with no ownership check and no runValidators —
        // any restaurant account could move *any* order (belonging to any
        // restaurant, in any current status, including an already-delivered
        // or cancelled one) to "Preparing" just by knowing its id. Now scoped
        // to the caller's own restaurant, via .save() (which always runs
        // schema validators), and only a legal Created -> Preparing move.
        const actingUser = await User.findById((req as AuthRequest).userId).select("restaurantId");
        if (!actingUser?.restaurantId) {
            res.status(404).json("Not found!");
            return;
        }
        const restaurant = await Restaurant.findById(actingUser.restaurantId);
        if (!restaurant) {
            res.status(404).json("Not found!");
            return;
        }
        const order = await Order.findOne({ _id: id, restaurantTitle: restaurant.title });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (!canTransition(order.status, "Preparing")) {
            res.status(409).json(`Cannot move an order from ${order.status ?? "draft"} to Preparing`);
            return;
        }
        order.status = "Preparing";
        await order.save();
        res.status(200).json("Toggled status to Preparing");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

// Shared by every cancellation path: a real Stripe refund of whatever was
// actually charged (never a client-supplied amount — there isn't one), then
// the same post-cancellation bookkeeping regardless of who initiated it. If
// the refund call fails, the order is left completely untouched — no partial
// "cancelled but not refunded" state.
const performCancellation = async (
    order: IOrderDocument,
    { cancelledBy, reason }: { cancelledBy: CancelActor; reason?: string }
): Promise<{ ok: true } | { ok: false }> => {
    if (!order.paymentIntentId) {
        return { ok: false };
    }
    let refund;
    try {
        refund = await stripe.refunds.create({ payment_intent: order.paymentIntentId });
    } catch (err) {
        return { ok: false };
    }

    // If a demo simulation is walking this order through its lifecycle, stop it
    // before writing the terminal state — otherwise a queued tick would move a
    // cancelled order back to Delivering.
    stopSimulation(order._id.toString());

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancelReason = reason || null;
    order.refundedAt = new Date();
    order.refundId = refund.id;
    await order.save();

    // Reverse the sold-count increments made at checkout — otherwise a
    // cancelled order still inflates a dish's "sold" total forever.
    for (const item of order.items) {
        await Dish.findOneAndUpdate({ title: item.title }, { $inc: { sold: -item.amount } });
    }

    // Same notification fan-out updateOrder/changeOrderStatus already do for
    // other status changes: restaurant dashboard, admin dashboards, customer.
    const restaurant = await Restaurant.findOne({ title: order.restaurantTitle });
    if (restaurant) {
        for (const [id, socket] of restaurantsSocketsMap.entries()) {
            if (id === restaurant.id) {
                const incoming = await Order.find({ status: "Created", restaurantTitle: restaurant.title });
                socket.emit("incomingOrders", incoming);
                const recent = await Order.find({ restaurantTitle: restaurant.title }).sort({ updatedAt: -1 }).limit(7);
                socket.emit("updateRestaurantOrders", recent);
            }
        }
    }
    const recentOrders = await Order.find().sort({ updatedAt: -1 }).limit(7);
    activeAdmins.forEach(adminId => {
        io.to(adminId.toString()).emit("updateOrders", recentOrders);
    });
    const socketUser = socketsMap.get(order.userId.toString());
    if (socketUser) {
        socketUser.emit("updateOrderStatus", { status: "Cancelled", id: order._id });
    }

    const orderUser = await User.findById(order.userId).select("email username");
    sendOrderStatusEmail(order, orderUser, "cancelled");

    return { ok: true };
};

// Customer can only cancel their own order, and only before the restaurant
// has started preparing it.
export const cancelOrderCustomer = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (!canCancel(order.status, "customer")) {
            res.status(409).json("This order can no longer be cancelled");
            return;
        }
        const result = await performCancellation(order, { cancelledBy: "customer", reason });
        if (!result.ok) {
            res.status(502).json("Refund failed");
            return;
        }
        res.status(200).json("Order cancelled");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

// Restaurant can cancel its own orders ("can't fulfill this") up through
// Preparing — resolved from the caller's own restaurant, never a client id.
export const cancelOrderRestaurant = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const actingUser = await User.findById((req as AuthRequest).userId);
        if (!actingUser?.restaurantId) {
            res.status(404).json("Not found!");
            return;
        }
        const restaurant = await Restaurant.findById(actingUser.restaurantId);
        if (!restaurant) {
            res.status(404).json("Not found!");
            return;
        }
        const order = await Order.findOne({ _id: id, restaurantTitle: restaurant.title });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (!canCancel(order.status, "restaurant")) {
            res.status(409).json("This order can no longer be cancelled");
            return;
        }
        const result = await performCancellation(order, { cancelledBy: "restaurant", reason });
        if (!result.ok) {
            res.status(502).json("Refund failed");
            return;
        }
        res.status(200).json("Order cancelled");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

// Admin override — can cancel anything short of already-delivered/cancelled.
export const cancelOrderAdmin = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const order = await Order.findById(id);
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (!canCancel(order.status, "admin")) {
            res.status(409).json("This order can no longer be cancelled");
            return;
        }
        const result = await performCancellation(order, { cancelledBy: "admin", reason });
        if (!result.ok) {
            res.status(502).json("Refund failed");
            return;
        }
        res.status(200).json("Order cancelled");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

