"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToCart = exports.updateCartAmount = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Order_1 = __importDefault(require("../models/Order"));
const Dish_1 = __importDefault(require("../models/Dish"));
// get cart func
const getCart = async (req, res) => {
    try {
        let cart = await Cart_1.default.findOne({ userId: req.userId }).populate({ path: "items.dishId" }).populate({ path: "restaurantId", select: "title imageUrl" });
        if (!cart) {
            cart = await Cart_1.default.create({ userId: req.userId, items: [], restaurantId: null });
            cart = await Cart_1.default.findOne({ userId: req.userId })
                .populate({ path: "items.dishId" }).populate({ path: "restaurantId", select: "title imageUrl" });
            res.status(200).json(cart);
            return;
        }
        res.status(200).json(cart);
        return;
    }
    catch (err) {
        res.status(500).json(err);
        return;
    }
};
exports.getCart = getCart;
// updating cart items amount
const updateCartAmount = async (req, res) => {
    const { amount, title } = req.body;
    const id = req.params.id;
    console.log(req.body, req.params);
    try {
        const order = await Order_1.default.findOne({ userId: req.userId, status: null });
        if (amount === 0) {
            const cart = await Cart_1.default.findOneAndUpdate({ userId: req.userId }, { $pull: { items: { dishId: id } } }, { new: true });
            if (cart?.items.length == 0) {
                await Cart_1.default.findOneAndUpdate({ userId: req.userId }, { $set: { restaurantId: null } });
            }
            if (order) {
                order.items = order.items.filter((item) => item.title !== title); //deleting items out of the cart if amount equals 0
                if (order.items.length == 0) {
                    await Order_1.default.findByIdAndDelete(order._id);
                }
                await order.save();
            }
            res.status(200);
            return;
        }
        else {
            const cart = await Cart_1.default.findOneAndUpdate({ userId: req.userId, "items.dishId": id }, { $set: { "items.$.amount": amount } });
            if (order) {
                const item = order.items.find(item => item.title == title);
                if (item)
                    item.amount = amount;
                const sum = order.items.reduce((acc, cur) => acc + (cur.amount * cur.price), 0);
                order.totalPrice = sum;
                await order.save();
            }
            res.status(200);
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.updateCartAmount = updateCartAmount;
// add to cart func with validation "if in cart already"
const addToCart = async (req, res) => {
    const { id } = req.body;
    console.log(id);
    try {
        const cart = await Cart_1.default.findOne({ userId: req.userId });
        if (cart) {
            const dish = await Dish_1.default.findById(id);
            if (!dish) {
                res.status(404).json("Dish not found");
                return;
            }
            //validation for checking if dish from other restaurant 
            if (!cart.restaurantId?.equals(dish.restaurantId) && cart.restaurantId !== null) {
                res.status(400).json("Not allowed other restaurants!");
                return;
            }
            if (dish.restaurantId)
                cart.restaurantId = dish.restaurantId;
            const item = cart.items.find(item => item.dishId.equals(id));
            if (item) {
                item.amount += 1;
            }
            else {
                cart?.items.push({ dishId: id, amount: 1 });
            }
            await cart.save();
            const updatedCart = await Cart_1.default.findOne({ userId: req.userId })
                .populate("items.dishId").populate({ path: "restaurantId", select: "title imageUrl" });
            res.status(201).json(updatedCart);
            return;
        }
        res.status(401).json("Unauthorized");
        return;
    }
    catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
exports.addToCart = addToCart;
