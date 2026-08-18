import { Request, Response } from "express"
import Promocode from "../models/Promocode";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";

export const getPromocode = async (req: Request, res: Response): Promise<void> => {
   const code = req.params.code;
    try {
        const promocode = await Promocode.findOne({ code: code });
        const user = await User.findById((req as AuthRequest).userId);
        if (promocode && promocode.type === "Usual") {
            if (user) {

                if (user.usualPromocode !== null) {
                    res.status(400).json("You alreadly have promocode!");
                    return;
                } else {
                    user.usualPromocode = promocode._id;
                    await user.save();
                    res.status(200).json("Used");
                    return;
                }

            }
        } else {
            if (user?.usualPromocode !== null) {
                res.status(400).json("You alreadly have promocode!");
                return;
            }
            res.status(404).json("Not found!");
            return;
        }


    } catch (err) {
        res.status(500).json("Server error");
    }
};
export const createPromocode = async (req: Request, res: Response): Promise<void> => {
    const { data } = req.body;
    try {
        // The dashboard form already bounds this client-side, but nothing
        // previously stopped a direct API call from creating a promocode with,
        // say, a 500% or negative discount.
        if (!data?.code || typeof data.code !== "string") {
            res.status(400).json("Code is required");
            return;
        }
        if (data.type !== "Usual" && data.type !== "Special") {
            res.status(400).json("Invalid promocode type");
            return;
        }
        const percent = Number(data.percent);
        if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
            res.status(400).json("Percent must be between 1 and 100");
            return;
        }

        if (data.type === "Special") {
            await Promocode.create({ code: data.code, discountPercent: percent, type: data.type, isUsed: false });
        } else {
            await Promocode.create({ code: data.code, discountPercent: percent, type: data.type });
        }
        res.status(200).json("Successfully created");
        return;

    } catch (err: any) {
        if (err?.code === 11000) {
            res.status(409).json("That code already exists");
            return;
        }
        res.status(500).json("Server error");
    }
}

export const usePromocode = async (req: Request, res: Response): Promise<void> => {
    const code = req.params.code;
    try {
        const promocode = await Promocode.findOne({ code: code });
        (promocode);
        if (promocode && promocode.type === "Special") {
            const user = await User.findById((req as AuthRequest).userId);
            if (!promocode.isUsed) {
                user?.promocodes?.push(promocode._id);
                promocode.isUsed = true;
                await user?.save();
                await promocode?.save();
                res.status(200).json({ discount: promocode.discountPercent });
                return;
            } else {
                res.status(400).json("Promocode was used!");
                return;
            }

        } else {
            res.status(404).json("Not found!");
            return;
        }


    } catch (err) {
        res.status(500).json("Server error");
    }
}
