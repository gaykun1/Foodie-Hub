import { Request, Response } from "express";
import Cart from "../models/Cart";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import Dish from "../models/Dish";

// get cart func
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
    } catch {
        res.status(500).json(("Server error!"));
        return;
    }

}
// updating cart items amount
export const updateCartAmount = async (req: Request, res: Response): Promise<void> => {
    const { amount, title } = req.body;
    const id = req.params.id;
    try {
        // The client only ever sends 0 (remove) or a small positive integer, but
        // nothing previously stopped a direct call from sending a negative or
        // fractional amount — it was written straight through to both the cart
        // item and the pending order's line, corrupting order.totalPrice (and,
        // downstream, the checkout total computed from it).
        if (amount !== 0 && (!Number.isInteger(amount) || amount < 1 || amount > 999)) {
            res.status(400).json("Amount must be a whole number between 1 and 999, or 0 to remove the item");
            return;
        }
        const order = await Order.findOne({ userId: (req as AuthRequest).userId, status: null });
        if (amount === 0) {
            const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId }, { $pull: { items: { dishId: id } } }, { new: true });
            if (cart?.items.length == 0) {
                await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId }, { $set: { restaurantId: null } });
            }
            if (order) {
                order.items = order.items.filter((item) => item.title !== title); //deleting items out of the cart if amount equals 0
                if (order.items.length == 0) {
                    await Order.findByIdAndDelete(order._id);
                }
                await order.save();
            }
            res.status(200).json({});

            return;
        } else {

            const cart = await Cart.findOneAndUpdate({ userId: (req as AuthRequest).userId, "items.dishId": id }, { $set: { "items.$.amount": amount } });

            if (order) {
                const item = order.items.find(item => item.title == title);

                if (item)
                    item.amount = amount;

                const sum = order.items.reduce((acc, cur) => acc + (cur.amount * cur.price), 0);
                order.totalPrice = sum;
                await order.save();
            }
            res.status(200).json({});

            return;
        }


    } catch (err) {
        res.status(500).json(("Server error!"));
        return;
    }

}
// add to cart func with validation "if in cart already"
export const addToCart = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;

    try {
        // Falls back to creating the cart here too — getCart normally does this
        // first, but relying on that order-of-operations meant a user who reached
        // "Add to cart" before their cart was ever fetched got a response-less
        // hang (the function returned without calling res.json at all).
        let cart = await Cart.findOne({ userId: (req as AuthRequest).userId });
        if (!cart) {
            cart = await Cart.create({ userId: (req as AuthRequest).userId, items: [], restaurantId: null });
        }

        const dish = await Dish.findById(id);
        if (!dish) {
            res.status(404).json("Dish is not found");
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

        } else {


            cart.items.push({ dishId: id, amount: 1 });

        }
        await cart.save();

        const updatedCart = await Cart.findOne({ userId: (req as AuthRequest).userId })
            .populate("items.dishId").populate({ path: "restaurantId", select: "title imageUrl" });


        res.status(201).json(updatedCart);
        return;

    } catch (err) {


        res.status(500).json(("Server error!"));
        return;

    }


}

