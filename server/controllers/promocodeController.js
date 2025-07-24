"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePromocode = exports.createPromocode = exports.getPromocode = void 0;
const Promocode_1 = __importDefault(require("../models/Promocode"));
const User_1 = __importDefault(require("../models/User"));
const getPromocode = async (req, res) => {
    const code = req.params.code;
    try {
        const promocode = await Promocode_1.default.findOne({ code: code });
        const user = await User_1.default.findById(req.userId);
        if (promocode && promocode.type === "Usual") {
            if (user) {
                if (user.usualPromocode !== null) {
                    res.status(400).json("You alreadly have promocode!");
                    return;
                }
                else {
                    user.usualPromocode = promocode._id;
                    await user.save();
                    res.status(200).json("Used");
                    return;
                }
            }
        }
        else {
            if (user?.usualPromocode !== null) {
                res.status(400).json("You alreadly have promocode!");
                return;
            }
            res.status(404).json("Not found!");
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error");
    }
};
exports.getPromocode = getPromocode;
const createPromocode = async (req, res) => {
    const { data } = req.body;
    console.log(data);
    try {
        if (data.type === "Special") {
            const promocode = await Promocode_1.default.create({ code: data.code, discountPercent: data.percent, type: data.type, isUsed: false });
        }
        else {
            const promocode = await Promocode_1.default.create({ code: data.code, discountPercent: data.percent, type: data.type, });
        }
        res.status(200).json("Successfully created");
        return;
    }
    catch (err) {
        res.status(500).json("Server error");
    }
};
exports.createPromocode = createPromocode;
const usePromocode = async (req, res) => {
    const code = req.params.code;
    try {
        const promocode = await Promocode_1.default.findOne({ code: code });
        console.log(promocode);
        if (promocode && promocode.type === "Special") {
            const user = await User_1.default.findById(req.userId);
            if (!promocode.isUsed) {
                user?.promocodes?.push(promocode._id);
                promocode.isUsed = true;
                await user?.save();
                await promocode?.save();
                res.status(200).json({ discount: promocode.discountPercent });
                return;
            }
            else {
                res.status(400).json("Promocode was used!");
                return;
            }
        }
        else {
            res.status(404).json("Not found!");
            return;
        }
    }
    catch (err) {
        res.status(500).json("Server error");
    }
};
exports.usePromocode = usePromocode;
