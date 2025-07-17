import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order, { IOrder } from "../models/Order";
import Cart from "../models/Cart";
import { activeAdmins, io, restaurantsSocketsMap } from "../server";
import Dish from "../models/Dish";
import Restaurant from "../models/Restaurant";

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
        const orders = await Order.find({ userId: (req as AuthRequest).userId });
        if (!orders) {
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
            if (!orders) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(orders);
            return
        } else {
            const restaurant = await Restaurant.findById(id);
            const orders = await Order.find({ status: { $nin: [null, "Created"] }, restaurantTitle: restaurant?.title }).sort({ updatedAt: -1 }).limit(7);
            if (!orders) {
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

const getMondayDate = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const newDate = date.getDate() - day + (day === 0 ? -6 : +1);

    date.setDate(newDate);
    date.setHours(0, 0, 0, 0);
    return date;
}


export const getNumbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        console.log(id);
        let orders = [];
        if (id == null) {
            orders = await Order.find({});
            if (!orders.length) {
                res.status(404).json({ message: "No orders found!" });
                return;
            }
        } else {
            const restaurant = await Restaurant.findById(id);
            orders = await Order.find({ restaurantTitle: restaurant?.title });
            if (!orders.length) {
                res.status(404).json({ message: "No orders found!" });
                return;
            }
        }


        const now = new Date();

        const numOfOrders = orders.length;
        const totalRevenue = orders.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const averageOrderValue = +(totalRevenue / numOfOrders).toFixed(2);
        const startOfThisWeek = getMondayDate(new Date());
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        const [ordersThisWeek, ordersLastWeek] = await Promise.all([
            Order.find({ createdAt: { $gte: startOfThisWeek, $lte: endOfThisWeek } }),
            Order.find({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } })
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
    const id = req.params.id;
    try {
        const orders = await Order.find({ courierId: id });
        if (!orders) {
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
    const { formData, shipping, cartId, totalPrice, percent } = req.body;

    console.log(req.body);

    try {
        if (formData.city && formData.countryOrRegion && formData.houseNumber && formData.street) {

            const order = await Order.findOneAndUpdate({ status: null, userId: (req as AuthRequest).userId }, {
                $set: {
                    status: "Created",
                    approxTime: shipping == 2.2 ? 50 : shipping == 3.2 ? 30 : 15,
                    shippingPrice: shipping,
                    discountPercent: percent,
                    fullName: (formData.name + " " + formData.surname),
                    "adress.city": formData.city,
                    "adress.countryOrRegion": formData.countryOrRegion,
                    "adress.houseNumber": formData.houseNumber,
                    "adress.apartmentNumbr": formData.apartmentNumbr,
                    "adress.street": formData.street,
                    totalPrice: totalPrice,
                }
            }, { new: true });
            const cart = await Cart.findOneAndDelete({ userId: (req as AuthRequest).userId, _id: cartId });
            if (order) {
                for (const item of order.items) {
                    const dish = await Dish.findOneAndUpdate({ title: item.title }, {
                        $inc: { sold: item.amount }
                    })
                }
            }
            const restaurant = await Restaurant.findOne({ title: order?.restaurantTitle });
            for (const [id, socket] of restaurantsSocketsMap.entries()) {
                if (id === restaurant?.id) {
                    const orders = await Order.find({ status: "Created", restaurantTitle: restaurant.title });
                    socket.emit("incomingOrders", orders);
                }
            }

            //      activeAdmins.forEach(adminId => {
            //     io.to(adminId).emit("updateOrders", orders);
            // });
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
    const city = req.params.city;
    try {
        const orders = await Order.find({ status: { $in: ["Preparing", "Created"] }, "adress.city": city, courierId: null });
        if (!orders) {
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



