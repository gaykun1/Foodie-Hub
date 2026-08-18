import { IOrderDocument } from "../models/Order";

const STATUS_COPY: Record<string, string> = {
    Preparing: "is being prepared by the restaurant",
    Delivering: "is out for delivery",
    Delivered: "has been delivered — enjoy your meal!",
};

export const orderStatusUpdateEmail = (order: IOrderDocument, username: string) => {
    const description = STATUS_COPY[order.status ?? ""] ?? `status changed to ${order.status}`;

    return {
        subject: `Your FoodieHub order ${order.status === "Delivered" ? "has arrived" : "update"}`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2>Hi ${username},</h2>
                <p>Your order from <strong>${order.restaurantTitle}</strong> ${description}.</p>
                <p>Order ID: ${order._id}</p>
            </div>
        `,
    };
};
