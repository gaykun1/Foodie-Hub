import { Request, Response } from "express"
import Promocode from "../models/Promocode";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
export const getPromocode = async (req: Request, res: Response): Promise<void> => {
    const { promoC } = req.body;

    try {
        const promocode = await Promocode.findOne({ code: promoC });
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
    console.log(data);
    try {
        if (data.type === "Special") {
            const promocode = await Promocode.create({ code: data.code, discountPercent: data.percent, type: data.type, isUsed: false });

        } else {
            const promocode = await Promocode.create({ code: data.code, discountPercent: data.percent, type: data.type, });

        }
        res.status(200).json("Successfully created");
        return;

    } catch (err) {
        res.status(500).json("Server error");
    }
}

export const usePromocode = async (req: Request, res: Response): Promise<void> => {
    const { PromoC } = req.body;
    console.log(PromoC);
    try {
        const promocode = await Promocode.findOne({ code: PromoC });
        console.log(promocode);
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
