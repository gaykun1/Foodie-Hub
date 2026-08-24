import Order, { IOrderDocument, IGeoPoint } from "../models/Order";
import Restaurant from "../models/Restaurant";
import Courier from "../models/Courier";
import User from "../models/User";
import { activeAdmins, io, restaurantsSocketsMap, socketsMap } from "../socket";
import { sendOrderStatusEmail } from "../utils/sendOrderEmail";
import { geocodeStructured } from "../utils/geocode";
import { TERMINAL_STATUSES, type OrderStatus } from "../utils/orderStatus";

/**
 * Drives a real order through its lifecycle without a human restaurant or
 * courier on the other end.
 *
 * A portfolio demo has nobody staffing the kitchen dashboard, so a visitor who
 * checks out would otherwise watch an order sit at "Created" forever and never
 * see the tracking map do anything. This walks the order Created -> Preparing
 * -> Delivering -> Delivered on a timer, interpolating the courier's position
 * along the stored route and emitting exactly the same socket events a real
 * courier's device would.
 *
 * It writes real state through the real model, so what the visitor sees is the
 * genuine system, not a mock.
 */

/** Enabled only when the deployment opts in. */
export const isSimulationEnabled = (): boolean => process.env.DEMO_SIMULATION === "true";

/**
 * Wall-clock pacing, compressed so the whole journey fits in about ninety
 * seconds. Overridable so tests can run it in milliseconds.
 */
export interface SimulationTiming {
    /** Delay before the restaurant "accepts" the order. */
    acceptAfterMs: number;
    /** How long the kitchen takes before a courier collects. */
    prepareForMs: number;
    /** Total travel time from restaurant to customer. */
    deliverForMs: number;
    /** Interval between courier position updates while in transit. */
    tickEveryMs: number;
}

export const DEFAULT_TIMING: SimulationTiming = {
    acceptAfterMs: 6_000,
    prepareForMs: 20_000,
    deliverForMs: 60_000,
    tickEveryMs: 2_000,
};

/** Simulations currently in flight, keyed by order id, so one order runs once. */
const running = new Map<string, { cancel: () => void }>();

export const isSimulating = (orderId: string): boolean => running.has(orderId);

export const activeSimulationCount = (): number => running.size;

/** Straight-line interpolation between two points; `t` runs 0 to 1. */
export const interpolate = (from: IGeoPoint, to: IGeoPoint, t: number): IGeoPoint => {
    const clamped = Math.min(Math.max(t, 0), 1);
    return {
        lat: from.lat + (to.lat - from.lat) * clamped,
        lng: from.lng + (to.lng - from.lng) * clamped,
    };
};

/**
 * Resolves the route for an order, preferring the coordinates persisted at
 * checkout and falling back to geocoding for orders created before that field
 * existed. Returns null when neither end can be resolved.
 */
export const resolveRoute = async (
    order: IOrderDocument
): Promise<{ restaurant: IGeoPoint; customer: IGeoPoint } | null> => {
    let restaurantPoint = order.route?.restaurant ?? null;
    let customerPoint = order.route?.customer ?? null;

    if (!restaurantPoint) {
        const restaurant = await Restaurant.findOne({ title: order.restaurantTitle });
        restaurantPoint = restaurant?.location?.lat != null
            ? { lat: restaurant.location.lat, lng: restaurant.location.lng }
            : await geocodeStructured(restaurant?.address ?? {});
    }
    if (!customerPoint) {
        customerPoint = await geocodeStructured(order.address ?? {});
    }
    if (!restaurantPoint || !customerPoint) return null;
    return { restaurant: restaurantPoint, customer: customerPoint };
};

/** Mirrors the fan-out the real restaurant/courier handlers perform. */
const broadcastStatus = async (order: IOrderDocument, status: OrderStatus) => {
    const restaurant = await Restaurant.findOne({ title: order.restaurantTitle });
    if (restaurant) {
        for (const [id, socket] of restaurantsSocketsMap.entries()) {
            if (id === restaurant.id) {
                socket.emit("incomingOrders", await Order.find({ status: "Created", restaurantTitle: restaurant.title }));
                socket.emit(
                    "updateRestaurantOrders",
                    await Order.find({ restaurantTitle: restaurant.title }).sort({ updatedAt: -1 }).limit(7)
                );
            }
        }
    }

    const recent = await Order.find().sort({ updatedAt: -1 }).limit(7);
    activeAdmins.forEach((adminId) => io.to(adminId.toString()).emit("updateOrders", recent));

    const customerSocket = socketsMap.get(order.userId.toString());
    if (customerSocket) {
        customerSocket.emit("updateOrderStatus", { status, id: order._id });
    }
};

const advance = async (orderId: string, status: OrderStatus): Promise<IOrderDocument | null> => {
    try {
        // Conditional, single-round-trip update. Reading, checking and saving
        // separately left a window in which a customer cancellation landing
        // mid-flight would be overwritten by the next scheduled step — and
        // `save()` on an order deleted in the meantime throws outright.
        const order = await Order.findOneAndUpdate(
            { _id: orderId, status: { $nin: [...TERMINAL_STATUSES] } },
            { $set: { status } },
            { new: true }
        );
        if (!order) return null;
        await broadcastStatus(order, status);
        return order;
    } catch {
        // The order may have been removed while a step was queued. Nothing to
        // advance, and nothing worth crashing a demo animation over.
        return null;
    }
};

/**
 * Starts a simulation for `orderId`. Resolves once the run is scheduled, not
 * once it completes — the caller is an HTTP handler that should return
 * immediately.
 */
export const startSimulation = async (
    orderId: string,
    timing: SimulationTiming = DEFAULT_TIMING
): Promise<{ ok: true } | { ok: false; reason: string }> => {
    if (running.has(orderId)) return { ok: false, reason: "Already simulating this order" };

    const order = await Order.findById(orderId);
    if (!order) return { ok: false, reason: "Order not found" };
    if (order.status !== "Created") {
        return { ok: false, reason: `Only a newly placed order can be simulated (this one is ${order.status ?? "a draft"})` };
    }

    const route = await resolveRoute(order);
    if (!route) return { ok: false, reason: "Could not resolve a delivery route for this order" };

    // Assign the demo courier so the order looks and behaves like a claimed one,
    // and so the customer's tracking view has a courier to name.
    const demoCourier = await Courier.findOne({ status: "Working" }).sort({ createdAt: 1 });
    await Order.updateOne(
        { _id: orderId },
        { $set: { isSimulated: true, courierId: demoCourier?._id ?? null, "route.restaurant": route.restaurant, "route.customer": route.customer } }
    );

    const timers: NodeJS.Timeout[] = [];
    let cancelled = false;
    const schedule = (fn: () => void, ms: number) => {
        const timer = setTimeout(() => {
            if (cancelled) return;
            fn();
        }, ms);
        // Don't hold the process open purely for a demo animation.
        timer.unref?.();
        timers.push(timer);
    };

    const finish = () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        running.delete(orderId);
    };

    running.set(orderId, { cancel: finish });

    // 1. Restaurant accepts.
    schedule(() => {
        void (async () => {
            const accepted = await advance(orderId, "Preparing");
            if (!accepted) return finish();

            // 2. Courier collects and starts moving.
            schedule(() => {
                void (async () => {
                    const collected = await advance(orderId, "Delivering");
                    if (!collected) return finish();

                    const steps = Math.max(1, Math.round(timing.deliverForMs / timing.tickEveryMs));
                    for (let step = 1; step <= steps; step++) {
                        const position = interpolate(route.restaurant, route.customer, step / steps);
                        schedule(() => {
                            io.to(orderId).emit("locationUpdate", position);
                        }, timing.tickEveryMs * step);
                    }
                    // The final position is emitted alongside the arrival, so a
                    // slow tick can never leave the courier pin short of the door.

                    // 3. Arrival.
                    schedule(() => {
                        void (async () => {
                            io.to(orderId).emit("locationUpdate", route.customer);
                            const delivered = await advance(orderId, "Delivered");
                            if (delivered) {
                                const customer = await User.findById(delivered.userId).select("email username");
                                sendOrderStatusEmail(delivered, customer, "statusUpdate");
                            }
                            finish();
                        })();
                    }, timing.deliverForMs);
                })();
            }, timing.prepareForMs);
        })();
    }, timing.acceptAfterMs);

    return { ok: true };
};

/** Stops a running simulation, e.g. because the order was cancelled. */
export const stopSimulation = (orderId: string): boolean => {
    const handle = running.get(orderId);
    if (!handle) return false;
    handle.cancel();
    return true;
};

/** Clears every in-flight simulation — used by tests to avoid leaking timers. */
export const stopAllSimulations = () => {
    for (const handle of running.values()) handle.cancel();
    running.clear();
};
