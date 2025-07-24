"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleToPreparing = exports.getFreeOrders = exports.updateOrder = exports.getOrdersCourier = exports.getNumbers = exports.getLastSevenOrders = exports.getOrdersCreated = exports.getOrders = exports.getOrder = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const server_1 = require("../server");
const Dish_1 = __importDefault(require("../models/Dish"));
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const createOrder = async (req, res) => {
    const { cart } = req.body;
    try {
        const order = await Order_1.default.findOne({ userId: req.userId, status: null });
        if (order) {
            res.status(200).json(order._id);
            return;
        }
        else {
            const order = await Order_1.default.create({ userId: req.userId, items: [], shippingPrice: null, totalPrice: 0, approxTime: 0, restaurantTitle: cart.restaurantId.title, restaurantImage: cart?.restaurantId.imageUrl });
            let sum = 0;
            // loop for pushing cart items to order items including summing all the prices
            cart.items.forEach(item => {
                order.items.push({ title: item.dishId.title, price: item.dishId.price, amount: item.amount, imageUrl: item.dishId.imageUrl });
                sum += (item.amount * item.dishId.price);
            });
            order.totalPrice = +sum.toFixed(2);
            await order.save();
            res.status(201).json(order._id);
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.createOrder = createOrder;
const getOrder = async (req, res) => {
    const id = req.params.id;
    try {
        const order = await Order_1.default.findOne({ _id: id, userId: req.userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(order);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getOrder = getOrder;
const getOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({ userId: req.userId });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getOrders = getOrders;
const getOrdersCreated = async (req, res) => {
    const id = req.params.id;
    try {
        const restaurant = await Restaurant_1.default.findById(id);
        const orders = await Order_1.default.find({ restaurantTitle: restaurant?.title, status: "Created" });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getOrdersCreated = getOrdersCreated;
const getLastSevenOrders = async (req, res) => {
    const id = req.params.id;
    try {
        if (id == null) {
            const orders = await Order_1.default.find({ status: { $ne: null } }).sort({ updatedAt: -1 }).limit(7);
            if (!orders) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(orders);
            return;
        }
        else {
            const restaurant = await Restaurant_1.default.findById(id);
            const orders = await Order_1.default.find({ status: { $nin: [null, "Created"] }, restaurantTitle: restaurant?.title }).sort({ updatedAt: -1 }).limit(7);
            if (!orders) {
                res.status(404).json("Not found!");
                return;
            }
            res.status(200).json(orders);
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getLastSevenOrders = getLastSevenOrders;
// func for getting start of the week with the date
const getMondayDate = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const newDate = date.getDate() - day + (day === 0 ? -6 : +1);
    // returning date with start of the week
    date.setDate(newDate);
    date.setHours(0, 0, 0, 0);
    return date;
};
// func for getting statistics for the week (dashboard)
const getNumbers = async (req, res) => {
    try {
        const id = req.query.id;
        let orders = [];
        if (id == null) {
            orders = await Order_1.default.find({ status: { $ne: "Created" } });
            if (!orders.length) {
                res.status(404).json({ message: "No orders found!" });
                return;
            }
        }
        else {
            const restaurant = await Restaurant_1.default.findById(id);
            orders = await Order_1.default.find({ restaurantTitle: restaurant?.title, status: { $ne: "Created" } });
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
        const [ordersThisWeek, ordersLastWeek] = await Promise.all([
            Order_1.default.find({ createdAt: { $gte: startOfThisWeek, $lte: endOfThisWeek } }),
            Order_1.default.find({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } })
        ]);
        const totalOrdersThisWeek = ordersThisWeek.length;
        const totalOrdersLastWeek = ordersLastWeek.length;
        const revenueThisWeek = ordersThisWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const revenueLastWeek = ordersLastWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const avgOrderValueThisWeek = totalOrdersThisWeek > 0 ? +(revenueThisWeek / totalOrdersThisWeek).toFixed(2) : 0;
        const avgOrderValueLastWeek = totalOrdersLastWeek > 0 ? +(revenueLastWeek / totalOrdersLastWeek).toFixed(2) : 0;
        const percentNumOfOrders = totalOrdersLastWeek > 0
            ? +((totalOrdersThisWeek - totalOrdersLastWeek) / totalOrdersLastWeek * 100).toFixed(2)
            : 0;
        const percentTotalRevenue = revenueLastWeek > 0
            ? +((revenueThisWeek - revenueLastWeek) / revenueLastWeek * 100).toFixed(2)
            : 0;
        const percentAvgOrderValue = avgOrderValueLastWeek > 0
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error!" });
    }
};
exports.getNumbers = getNumbers;
const getOrdersCourier = async (req, res) => {
    const id = req.params.id;
    try {
        const orders = await Order_1.default.find({ courierId: id });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getOrdersCourier = getOrdersCourier;
const updateOrder = async (req, res) => {
    const { formData, shipping, cartId, totalPrice, percent } = req.body;
    try {
        if (formData.city && formData.countryOrRegion && formData.houseNumber && formData.street) {
            const order = await Order_1.default.findOneAndUpdate({ status: null, userId: req.userId }, {
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
            const cart = await Cart_1.default.findOneAndUpdate({ userId: req.userId, _id: cartId }, { $set: { restaurantId: null, items: [] } });
            if (order) {
                // incrementing sold with $inc
                for (const item of order.items) {
                    const dish = await Dish_1.default.findOneAndUpdate({ title: item.title }, {
                        $inc: { sold: item.amount }
                    });
                }
            }
            // emitting incoming orders to restaurant dashboard
            const restaurant = await Restaurant_1.default.findOne({ title: order?.restaurantTitle });
            for (const [id, socket] of server_1.restaurantsSocketsMap.entries()) {
                if (id === restaurant?.id) {
                    const orders = await Order_1.default.find({ status: "Created", restaurantTitle: restaurant.title });
                    socket.emit("incomingOrders", orders);
                }
            }
            res.status(200).json("Created!");
            return;
        }
        res.status(400).json("Form error!");
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.updateOrder = updateOrder;
const getFreeOrders = async (req, res) => {
    const city = req.params.city;
    try {
        const orders = await Order_1.default.find({ status: { $in: ["Preparing"] }, "adress.city": city, courierId: null });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getFreeOrders = getFreeOrders;
const toggleToPreparing = async (req, res) => {
    const id = req.params.id;
    try {
        await Order_1.default.findByIdAndUpdate(id, { $set: { status: "Preparing" } });
        res.status(200).json("Toggled status to Preparing");
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.toggleToPreparing = toggleToPreparing;
