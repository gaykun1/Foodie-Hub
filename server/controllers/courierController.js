"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfHasOrder = exports.takeOrder = exports.profile = exports.toggleApplication = exports.changeOrderStatus = exports.checkIfSentApplication = exports.createApplication = exports.getApplications = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Courier_1 = __importDefault(require("../models/Courier"));
const User_1 = __importDefault(require("../models/User"));
const server_1 = require("../server");
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const getApplications = async (req, res) => {
    try {
        const applications = await Courier_1.default.find({ status: "Processing" });
        if (!applications) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(applications);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.getApplications = getApplications;
const createApplication = async (req, res) => {
    const { data } = req.body;
    try {
        // creating initial model for courier
        const newCourier = await Courier_1.default.create({
            fullname: data.name + " " + data.surname,
            phoneNumber: data.phoneNumber,
            email: data.email,
            transport: data.transport,
            userId: req.userId,
            city: data.city,
            age: data.age,
            status: "Processing",
        });
        res.status(200).json({ status: true });
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.createApplication = createApplication;
const checkIfSentApplication = async (req, res) => {
    try {
        const courier = await Courier_1.default.findOne({ userId: req.userId });
        if (courier) {
            res.status(200).json({ status: true });
            return;
        }
        res.status(200).json({ status: false });
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.checkIfSentApplication = checkIfSentApplication;
const changeOrderStatus = async (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    try {
        const order = await Order_1.default.findByIdAndUpdate(id, { $set: { status: status } });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        // taking last 7 updated and emitting it through socket for admin panel
        const orders = await Order_1.default.find().sort({ updatedAt: -1 }).limit(7);
        server_1.activeAdmins.forEach(adminId => {
            server_1.io.to(adminId.toString()).emit("updateOrders", orders);
        });
        const restaurant = await Restaurant_1.default.findOne({ title: order.restaurantTitle });
        if (restaurant) {
            // taking last 7 updated and emitting it through socket for restaurant panel
            //finding id of a rest.  in the map of sockets [ids,sockets]
            for (const [id, socket] of server_1.restaurantsSocketsMap.entries()) {
                if (id === restaurant.id) {
                    const orders = await Order_1.default.find({ restaurantTitle: restaurant.title }).sort({ updatedAt: -1 }).limit(7);
                    socket.emit("updateRestaurantOrders", orders);
                }
            }
        }
        //emitting order status
        const socketUser = server_1.socketsMap.get(order.userId.toString());
        console.log(socketUser);
        if (socketUser) {
            socketUser.emit("updateOrderStatus", { status, id: order._id });
            console.log("ok");
        }
        res.status(200).json(status);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.changeOrderStatus = changeOrderStatus;
const toggleApplication = async (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    console.log(status, id);
    try {
        const application = await Courier_1.default.findById(id);
        if (!application) {
            res.status(404).json("Not found!");
            return;
        }
        if (status === "accepted") {
            const application = await Courier_1.default.findByIdAndUpdate(id, { $set: { status: "Working" } });
            const user = await User_1.default.findByIdAndUpdate(application?.userId, { $set: { role: "courier" } });
            res.status(200).json("application accepted");
            return;
        }
        else {
            //deleting courier if declined
            const application = await Courier_1.default.findByIdAndDelete(id);
            res.status(200).json("application declined");
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.toggleApplication = toggleApplication;
const profile = async (req, res) => {
    try {
        const courier = await Courier_1.default.findOne({ userId: req.userId });
        res.status(200).json(courier);
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.profile = profile;
const takeOrder = async (req, res) => {
    const { courierId } = req.body;
    const id = req.params.id;
    try {
        const order = await Order_1.default.findOneAndUpdate({ _id: id }, { $set: { courierId: courierId } });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json("Order is taken!");
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.takeOrder = takeOrder;
const checkIfHasOrder = async (req, res) => {
    const id = req.params.id;
    try {
        const order = await Order_1.default.findOne({ courierId: id, status: { $in: ["Delivering", "Preparing", "Created"] } });
        res.status(200).json(order);
        return;
    }
    catch {
        res.status(404).json("Not found!");
        return;
    }
};
exports.checkIfHasOrder = checkIfHasOrder;
