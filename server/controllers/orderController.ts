import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import Cart from "../models/Cart";

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


            const order = await Order.create({ userId: (req as AuthRequest).userId, items: [], totalPrice: 0, status: "Processing" });
            let sum = 0;
            (cart as Cart).items.forEach(item => {
                order.items.push({ title: item.dishId.title, price: item.dishId.price, amount: item.amount, imageUrl: item.dishId.imageUrl });
                sum += (item.amount * item.dishId.price);

            });
            order.totalPrice = sum;

            await order.save();
            res.status(201).json(order._id);
            return;
        }
    } catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}


export const getOrder = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(order);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
    const { formData, shipping, cartId } = req.body;


    try {
        if (formData.city && formData.countryOrRegion && formData.houseNumber && formData.street) {


            const order = await Order.findOneAndUpdate({ status: "Processing", userId: (req as AuthRequest).userId }, {
                $set: {
                    status: "Preparing",
                    aproxTime: shipping,
                    fullName: (formData.name + " " + formData.surname),
                    "adress.city": formData.city,
                    "adress.countryOrRegion": formData.countryOrRegion,
                    "adress.houseNumber": formData.houseNumber,
                    "adress.apartmentNumbr": formData.apartmentNumbr,
                    "adress.street": formData.street,
                }
            },);
            const cart = await Cart.findOneAndDelete({ userId: (req as AuthRequest).userId, _id: cartId });

            res.status(200).json("Created!");
            return
        }
        res.status(400).json("Form error!");
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}




