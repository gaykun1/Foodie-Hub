import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import Cart from "../models/Cart";
import { activeAdmins, io } from "../server";
import Dish from "../models/Dish";

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
    restaurantId: {
        title: string,
        imageUrl: string,
        _id: string,
    }
    items: CartItem[];
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { cart }: { cart: Cart } = req.body;
    try {
        const order = await Order.findOne({ userId: (req as AuthRequest).userId, status: null });
        if (order) {
            res.status(200).json(order._id);
            return;
        } else {

            const order = await Order.create({ userId: (req as AuthRequest).userId, items: [], totalPrice: 0, approxTime: 0, restaurantTitle: cart.restaurantId.title, restaurantImage: cart?.restaurantId.imageUrl });
            let sum = 0;
            (cart as Cart).items.forEach(item => {
                order.items.push({ title: item.dishId.title, price: item.dishId.price, amount: item.amount, imageUrl: item.dishId.imageUrl });
                sum += (item.amount * item.dishId.price);

            });
            order.totalPrice = +sum.toFixed(2);

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

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find({ userId: (req as AuthRequest).userId });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}
export const getLastSevenOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find().sort({ updatedAt: -1 }).limit(7);
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return
    }
    catch (err) {


        res.status(500).json("Server error!");
        return;




    }
}


export const getNumbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find({});
        if (!orders.length) {
            res.status(404).json({ message: "No orders found!" });
            return;
        }

        const now = new Date();

        const numOfOrders = orders.length;
        const totalRevenue = orders.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const averageOrderValue = +(totalRevenue / numOfOrders).toFixed(2);

        const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const endOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [ordersThisWeek, ordersLastWeek] = await Promise.all([
            Order.find({ createdAt: { $gte: startOfThisWeek, $lte: endOfThisWeek } }),
            Order.find({ createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } })
        ]);

        const totalOrdersThisWeek = ordersThisWeek.length;
        const totalOrdersLastWeek = ordersLastWeek.length;
        const revenueThisWeek = ordersThisWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);
        const revenueLastWeek = ordersLastWeek.reduce((acc, cur) => acc + cur.totalPrice, 0);

        const avgOrderValueThisWeek = totalOrdersThisWeek > 0 ? +(revenueThisWeek / totalOrdersThisWeek).toFixed(2) : 0;
        const avgOrderValueLastWeek = totalOrdersLastWeek > 0 ? +(revenueLastWeek / totalOrdersLastWeek).toFixed(2) : 0;

        const percentNumOfOrders =
            totalOrdersLastWeek > 0
                ? +((totalOrdersThisWeek - totalOrdersLastWeek) / totalOrdersLastWeek * 100).toFixed(2)
                : 0;

        const percentTotalRevenue =
            revenueLastWeek > 0
                ? +((revenueThisWeek - revenueLastWeek) / revenueLastWeek * 100).toFixed(2)
                : 0;

        const percentAvgOrderValue =
            avgOrderValueLastWeek > 0
                ? +((avgOrderValueThisWeek - avgOrderValueLastWeek) / avgOrderValueLastWeek * 100).toFixed(2)
                : 0;

        res.status(200).json({
            numOfOrders: {
                number: +numOfOrders.toFixed(2),
                percent: percentNumOfOrders
            },
            totalRevenue: {
                number: +totalRevenue.toFixed(2),
                percent: percentTotalRevenue
            },
            averageOrderValue: {
                number: +averageOrderValue.toFixed(2),
                percent: percentAvgOrderValue
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error!" });
    }
};



export const getOrdersCourier = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const orders = await Order.find({ courierId: id });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
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

            const order = await Order.findOneAndUpdate({ status: null, userId: (req as AuthRequest).userId }, {
                $set: {
                    status: "Preparing",
                    approxTime: shipping == 2.2 ? 50 : shipping == 3.2 ? 30 : 15,
                    fullName: (formData.name + " " + formData.surname),
                    "adress.city": formData.city,
                    "adress.countryOrRegion": formData.countryOrRegion,
                    "adress.houseNumber": formData.houseNumber,
                    "adress.apartmentNumbr": formData.apartmentNumbr,
                    "adress.street": formData.street,
                }
            }, { new: true });
            const cart = await Cart.findOneAndDelete({ userId: (req as AuthRequest).userId, _id: cartId });
            if (order) {
                for (const item of order.items) {
                    const dish = await Dish.findOneAndUpdate({ title: item.title }, {
                        $inc: { sold: item.amount }
                    })
                }
            }

            const orders = await Order.find().sort({ updatedAt: -1 }).limit(7);
            activeAdmins.forEach(adminId => {
                io.to(adminId).emit("updateOrders", orders);
            });
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




export const getFreeOrders = async (req: Request, res: Response): Promise<void> => {
    const city = req.params.city;
    try {
        const orders = await Order.find({ status: "Preparing", "adress.city": city, courierId: null });
        if (!orders) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(orders);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}



