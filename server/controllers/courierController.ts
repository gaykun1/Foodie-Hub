import { Request, Response } from "express";
import Order from "../models/Order";
import { AuthRequest } from "../middleware/courierMiddleware";
import Courier from "../models/Courier";


export const getFreeOrders = async (req: Request, res: Response): Promise<void> => {
    const city = req.params.city;
    try {
        const orders = await Order.find({ status: "Preparing", "adress.city": city });
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


export const getApplications = async (req: Request, res: Response): Promise<void> => {

    try {
        const applications = await Courier.find({ status: "Processing" });
        if (!applications) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json(applications);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}



export const takeOrder = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;

    try {
        const order = await Order.findOneAndUpdate({ _id: id }, { $set: { courierId: (req as AuthRequest).userId } });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json("Order is taken!");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id, status } = req.body;

    try {
        const order = await Order.findOneAndUpdate({ _id: id, courierId: (req as AuthRequest).userId }, { $set: { status: status } });

        res.status(200).json("Order status has been changed!");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const createApplication = async (req: Request, res: Response): Promise<void> => {
    const { data } = req.body;

    try {

        // створення стартового темплейта для кур'єра 
        const newCourier = await Courier.create({
            fullname: data.name + "" + data.surname,
            phoneNumber: data.phoneNumber,
            email: data.email,
            transport: data.transport,
            userId: (req as AuthRequest).userId,
            age: data.age,
            status: "Processing",
        })

        res.status(200).json({ status: "sent" });
        return;


    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}


export const checkIfSentApplication = async (req: Request, res: Response): Promise<void> => {


    try {

        const courier = await Courier.find({ userId: (req as AuthRequest).userId })
        if (courier) {
            res.status(200).json({ status: true });
            return;
        }

        res.status(200).json({ status: false });
        return;


    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}



