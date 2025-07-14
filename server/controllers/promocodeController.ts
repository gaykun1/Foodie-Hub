import { Request, Response } from "express"
import Promocode from "../models/Promocode";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
export const getPromocode = async (req: Request, res: Response): Promise<void> => {
    const { promoC } = req.body;
    console.log(promoC);
    try {
        const promocode = await Promocode.findOne({ code: promoC });
        if (promocode) {
            const user = await User.findById((req as AuthRequest).userId);
            if (user) {


                user.promocodes.forEach(item => {
                    if (item.code?.equals(promoC)) {
                        res.status(400).json("You already have promocode!");
                        return;
                    }
                })

                user.promocodes?.push({ code: promocode._id, isUsed: false });
                await user.save();
                res.status(200).json("Used");
                return;
            }
            res.status(400);
            return;
        } else {
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
        const promocode = await Promocode.create({ code: data.code, discountPercent: data.percent });
        res.status(200).json("Successfully created");
        return;

    } catch (err) {
        res.status(500).json("Server error");
    }
}

