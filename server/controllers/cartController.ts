import { Request, Response } from "express";
import Cart from "../models/Cart";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import Dish from "../models/Dish";

export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        let cart = await Cart.findOne({ userId: (req as AuthRequest).userId }).populate({ path: "items.dishId" }).populate({ path: "restaurantId", select: "title imageUrl" });
        if (!cart) {
            cart = await Cart.create({ userId: (req as AuthRequest).userId, items: [], restaurantId: null });
            cart = await Cart.findOne({ userId: (req as AuthRequest).userId })
                .populate({ path: "items.dishId" }).populate({ path: "restaurantId", select: "title imageUrl" });
            res.status(200).json(cart);
            return;
        }
        res.status(200).json(cart);
        return;
    } catch (err) {


        res.status(500).json("Server error!");
        return;

    }

}

export const updateCartAmount = async (req: Request, res: Response): Promise<void> => {
    const { dishId, amount, title } = req.body;
    console.log(amount, title);
    try {
        const order = await Order.findOne({ userId: (req as AuthRequest).userId, status: null });
        if (amount === 0) {
            const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId }, { $pull: { items: { dishId: dishId } } },);
            if (order) {
                order.items = order.items.filter((item) => item.title !== title);
                if (order.items.length == 0) {
                    await Order.findByIdAndDelete(order._id);
                }
                await order.save();
            }
            res.status(200);

            return;
        } else {

            const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId, "items.dishId": dishId }, { $set: { "items.$.amount": amount } });

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

            const dish = await Dish.findById(id);
            if (!dish) {
                res.status(404).json("Dish not found");
                return;
            }
            if (!cart.restaurantId?.equals(dish.restaurantId) && cart.restaurantId != null) {
                res.status(400).json("Not allowed other restaurants!");
                return;
            }

            cart.restaurantId = dish.restaurantId;

            const item = cart.items.find(item => item.dishId.equals(id));

            if (item) {
                item.amount += 1;

            } else {


                cart?.items.push({ dishId: id, amount: 1 });

            }
            await cart.save();

            const updatedCart = await Cart.findOne({ userId: (req as AuthRequest).userId })
                .populate("items.dishId").populate({ path: "restaurantId", select: "title imageUrl" });


            res.status(201).json(updatedCart);
            return;
        }
        res.status(401).json("Unauthorized");
        return;

    } catch (err) {


        res.status(500).json("Server error!");
        return;

    }


}

