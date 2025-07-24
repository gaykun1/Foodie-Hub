"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.updateProfile = exports.profile = exports.logout = exports.login = exports.signup = void 0;
// bcrypt for managing password system
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
// for creating token 
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Signing with bcrypt for hashing password
const signup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.default.create({ username: username, password: hashedPassword });
        // creating token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        // adding token to cookie field with name "token"
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000, //life of token - 1hour
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });
        res.json({
            user: {
                username: user.username,
                favourites: user.favourites,
                _id: user._id,
            }
        });
        return;
    }
    catch (err) {
        res.status(400).json({ message: `Failed: ${err}` });
        return;
    }
};
exports.signup = signup;
// Login func
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User_1.default.findOne({ username: username });
        if (!user) {
            res.status(404).json("Not found");
            return;
        }
        // comparing
        const isGood = await bcryptjs_1.default.compare(password, user.password);
        if (!isGood) {
            res.status(401).json("Wrong password!");
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });
        res.json({
            user: {
                username: user.username,
                favourites: user.favourites,
                _id: user._id,
            }
        });
        return;
    }
    catch (err) {
        res.status(500).json({ message: `Server Error` });
        return;
    }
};
exports.login = login;
const logout = async (req, res) => {
    res.clearCookie("token", {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
    });
    try {
        res.status(200).json({ message: "Logged out" });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.logout = logout;
// profile get func
const profile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId).populate({ path: "usualPromocode", select: "discountPercent" }).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found!" });
            return;
        }
        res.json({
            message: `Welcome, user ${user.username}`,
            user
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.profile = profile;
// Partly updating  profile fields  (including new password)
const updateProfile = async (req, res) => {
    const { payload } = req.body;
    try {
        const user = await User_1.default.findOne({ _id: req.userId });
        if (user) {
            if (payload.username)
                user.username = payload.username;
            if (payload.email)
                user.email = payload.email;
            if (payload.phoneNumber)
                user.phoneNumber = payload.phoneNumber;
            if (payload.city)
                user.address.city = payload.city;
            if (payload.street)
                user.address.street = payload.street;
            if (payload.houseNumber)
                user.address.houseNumber = payload.houseNumber;
            if (payload.password && payload.newPassword) {
                let isGood = await bcryptjs_1.default.compare(payload.password, user.password);
                if (!isGood) {
                    res.status(400).json("Wrong password!");
                    return;
                }
                isGood = (payload.newPassword === payload.newPasswordAgain);
                if (!isGood) {
                    res.status(400).json("Wrong password!");
                    return;
                }
                const hashedPassword = await bcryptjs_1.default.hash(payload.newPassword, 10);
                user.password = hashedPassword;
            }
            await user?.save();
            res.status(200).json(user);
            return;
        }
        res.status(404).json("Not Found");
        return;
    }
    catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
};
exports.updateProfile = updateProfile;
// for checking user role 
const checkRole = async (req, res) => {
    try {
        res.json({ role: req.role });
        return;
    }
    catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
};
exports.checkRole = checkRole;
