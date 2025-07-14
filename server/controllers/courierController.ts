import { application, Request, Response } from "express";
import Order from "../models/Order";
import { AuthRequest } from "../middleware/courierMiddleware";
import Courier from "../models/Courier";
import User from "../models/User";
import { activeAdmins, io } from "../server";



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





export const createApplication = async (req: Request, res: Response): Promise<void> => {
    const { data } = req.body;
    try {

        // створення стартового темплейта для кур'єра 
        const newCourier = await Courier.create({
            fullname: data.name + " " + data.surname,
            phoneNumber: data.phoneNumber,
            email: data.email,
            transport: data.transport,
            userId: (req as AuthRequest).userId,
            city: data.city,
            age: data.age,
            status: "Processing",
        })

        res.status(200).json({ status: true });
        return;


    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}


export const checkIfSentApplication = async (req: Request, res: Response): Promise<void> => {


    try {

        const courier = await Courier.findOne({ userId: (req as AuthRequest).userId })
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

export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id, status } = req.body;
    try {


        const order = await Order.findByIdAndUpdate(id, { $set: { status: status } });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        const orders = await Order.find().sort({ updatedAt: -1 }).limit(7);
        activeAdmins.forEach(adminId => {
            io.to(adminId).emit("updateOrders", orders);
        });
        res.status(200).json(status);
        return;



    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const toggleApplication = async (req: Request, res: Response): Promise<void> => {

    const { id, status } = req.body;
    try {
        const application = await Courier.findById(id);
        if (!application) {
            res.status(404).json("Not found!");
            return;
        }
        if (status === "accepted") {
            const application = await Courier.findByIdAndUpdate(id, { $set: { status: "Working" } });
            const user = await User.findByIdAndUpdate(application?.userId, { $set: { role: "courier" } })
            res.status(200).json("application accepted");
            return;
        } else {
            const application = await Courier.findByIdAndDelete(id);
            res.status(200).json("application declined");
            return;
        }




    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}



export const profile = async (req: Request, res: Response): Promise<void> => {

    try {
        const courier = await Courier.findOne({ userId: (req as AuthRequest).userId });

        res.status(200).json(courier);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const takeOrder = async (req: Request, res: Response): Promise<void> => {
    const { id, courierId } = req.body;

    try {
        const order = await Order.findOneAndUpdate({ _id: id }, { $set: { courierId: courierId } });
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

export const checkIfHasOrder = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const order = await Order.findOne({ courierId: id, status: { $in: ["Delivering", "Preparing"] } });
        res.status(200).json(order);
        return;
    } catch {
        res.status(404).json("Not found!");
        return;
    }
}