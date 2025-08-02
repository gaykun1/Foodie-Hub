import { Request, Response } from "express";
import Order from "../models/Order";
import Courier from "../models/Courier";
import User from "../models/User";
import { activeAdmins, io, restaurantsSocketsMap, socketsMap } from "../socket";
import Restaurant from "../models/Restaurant";
import { AuthRequest } from "../middleware/authMiddleware";



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

        // creating initial model for courier
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
    const { status } = req.body;
    const id = req.params.id;
    try {


        const order = await Order.findByIdAndUpdate(id, { $set: { status: status } });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        // taking last 7 updated and emitting it through socket for admin panel
        const orders = await Order.find().sort({ updatedAt: -1 }).limit(7);
        activeAdmins.forEach(adminId => {
            io.to(adminId.toString()).emit("updateOrders", orders);
        });
        const restaurant = await Restaurant.findOne({ title: order.restaurantTitle });
        if (restaurant) {
            // taking last 7 updated and emitting it through socket for restaurant panel
            //finding id of a rest.  in the map of sockets [ids,sockets]
            for (const [id, socket] of restaurantsSocketsMap.entries()) {
                if (id === restaurant.id) {
                    const orders = await Order.find({ restaurantTitle: restaurant.title }).sort({ updatedAt: -1 }).limit(7);
                    socket.emit("updateRestaurantOrders", orders);

                }
            }
        }
        //emitting order status
        const socketUser = socketsMap.get(order.userId.toString());
    

        if (socketUser) {
            socketUser.emit("updateOrderStatus", { status, id: order._id });
          
        }
        res.status(200).json(status);
        return;



    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
}

export const toggleApplication = async (req: Request, res: Response): Promise<void> => {

    const { status } = req.body;
    const id = req.params.id;
    
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
            //deleting courier if declined
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
    const { courierId } = req.body;
    const id = req.params.id;
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
        const order = await Order.findOne({ courierId: id, status: { $in: ["Delivering", "Preparing", "Created"] } });
        res.status(200).json(order);
        return;
    } catch {
        res.status(404).json("Not found!");
        return;
    }
}