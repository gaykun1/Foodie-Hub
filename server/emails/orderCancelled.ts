import { IOrderDocument } from "../models/Order";

export const orderCancelledEmail = (order: IOrderDocument, username: string) => {
    return {
        subject: `Your FoodieHub order from ${order.restaurantTitle} was cancelled`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2>Hi ${username},</h2>
                <p>Your order from <strong>${order.restaurantTitle}</strong> was cancelled${order.cancelReason ? `: "${order.cancelReason}"` : "."}</p>
                <p><strong>$${order.totalPrice.toFixed(2)}</strong> has been refunded to your original payment method — it may take a few business days to appear.</p>
                <p>Order ID: ${order._id}</p>
            </div>
        `,
    };
};
