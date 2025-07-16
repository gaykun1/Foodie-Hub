import { Request, Response } from "express";
// bcrypt for managing password system
import bcrypt from "bcryptjs";
import User from "../models/User";
// for creating token 
import jwt from "jsonwebtoken";
// Using middleware that returns userId
import { AuthRequest } from "../middleware/authMiddleware";

// Signing with bcrypt for hashing password
export const signup = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    try {

        const hashedPasword = await bcrypt.hash(password, 10);
        const user = await User.create({ username: username, password: hashedPasword, favourites: [], phoneNumber: "", email: "" });
        // creating token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        // adding token to cookie field with name "token"
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000,//life of token - 1hour
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        })
        res.json({
            user: {
                username: user.username,
                favourites: user.favourites,
                _id: user._id,
            }
        });
        return;
    } catch (err) {
        res.status(400).json({ message: `Failed: ${err}` });
        return;
    }
}

// Login func
export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username });

        if (!user) {
            res.status(404).json("Not found");
            return;
        }
        // comparing
        const isGood = await bcrypt.compare(password, user.password);

        if (!isGood) {
            res.status(401).json("Wrong password!");
            return;
        }




        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        })
        res.json({
            user: {
                username: user.username,
                favourites: user.favourites,
                _id: user._id,

            }
        });
        return;
    } catch (err) {
        res.status(500).json({ message: `Server Error` });
        return;
    }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("token", {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
    });
    try {

        res.status(200).json({ message: "Logged out" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
// profile get func
export const profile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as AuthRequest).userId).populate({ path: "usualPromocode", select: "discountPercent" }).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found!" });
            return;
        }

        res.json({
            message: `Welcome, user ${user.username}`,
            user
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Partly updating  profile fields  (including new password)
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const { payload } = req.body;
    console.log(payload);
    try {
        const user = await User.findOne({ _id: (req as AuthRequest).userId })
        if (user) {
            if (payload.username) user.username = payload.username;
            if (payload.email) user.email = payload.email;
            if (payload.phoneNumber) user.phoneNumber = payload.phoneNumber;
            if (payload.city) user.address.city = payload.city;
            if (payload.street) user.address.street = payload.street;
            if (payload.houseNumber) user.address.houseNumber = payload.houseNumber;
            if (payload.password && payload.newPassword) {
                let isGood = await bcrypt.compare(payload.password, user.password);
                if (!isGood) {
                    res.status(400).json("Wrong password!");
                    return;
                }
                isGood = (payload.newPassword === payload.newPasswordAgain);
                if (!isGood) {
                    res.status(400).json("Wrong password!");
                    return;
                }
                const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
                user.password = hashedPassword;
            }

            await user?.save();
            res.status(200).json(user);
            return;
        }
        res.status(404).json("Not Found");
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}

// for checking if token.role===admin using adminMiddleware out there in route
export const checkIfAdmin = async (req: Request, res: Response): Promise<void> => {


    try {


        res.json({ role: "admin" });
        return;
    } catch (err) {
        res.status(500).json({ error: 'Search error!' });
        return;
    }
}