import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";

interface CartItem {
    dishId: {
        title: string;
        description: string;
        price: number;
        imageUrl: string;
        _id: string;
        typeOfFood: string;
    };
    amount: number;

}

interface Cart {
    items: CartItem[];
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { cart } = req.body;
    try {
        const order = await Order.findOne({ userId: (req as AuthRequest).userId });
        if (order) {
            res.status(200).json(order._id);
            return;
        } else {


            const order = await Order.create({ userId: (req as AuthRequest).userId, items: [], totalPrice: 0 });
            console.log(order);
            let sum = 0;
            console.log(order);
            (cart as Cart).items.forEach(item => {
                order.items.push({ title: item.dishId.title, price: item.dishId.price, amount: item.amount, });
                sum += (item.amount * item.dishId.price);

            });
            order.totalPrice = sum;

            await order.save();
            console.log(order);
            res.status(201).json(order._id);
            return;
        }
    } catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}


