import { Request, Response } from "express";
import Cart from "../models/Cart";
import { AuthRequest } from "../middleware/authMiddleware";

export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        let cart = await Cart.findOne({ userId: (req as AuthRequest).userId }).populate({ path: "items.dishId" }).select("items -_id");
        if (!cart) {
            cart = await Cart.create({ userId: (req as AuthRequest).userId, items: [] });
            cart = await Cart.findOne({ userId: (req as AuthRequest).userId })
                .populate({ path: "items.dishId" })
                .select("items -_id");
            res.status(200).json(cart);
            return;
        }
        res.status(200).json(cart);
        return;
    } catch (err) {


        res.status(404).json("Not found!");
        return;

    }

}

export const updateCartAmount = async (req: Request, res: Response): Promise<void> => {
    const { dishId, amount } = req.body;
    try {
        const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId, "items.dishId": dishId }, { $set: { "items.$.amount": amount } }, { new: true });
        res.status(200);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }

}

export const addToCart = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;
    try {
        const cart = await Cart.findOne({ userId: (req as AuthRequest).userId });
        if (cart) {


            const item = cart.items.find(item => item.dishId.equals(id));

            if (item) {
                item.amount += 1;
            } else {


                cart?.items.push({ dishId: id, amount: 1 });

            }
            await cart.save();

            const updatedCart = await Cart.findOne({ userId: (req as AuthRequest).userId })
                .populate("items.dishId")
                .select("items -_id");

            res.status(201).json(updatedCart);
            return;
        }
        res.status(401).json("Unauthorized");
        return;

    } catch (err) {


        res.status(404).json("Not found!");
        return;

    }


}