import { IOrderDocument } from "../models/Order";

export const orderConfirmationEmail = (order: IOrderDocument, username: string) => {
    const itemsHtml = order.items
        .map(item => `<tr><td style="padding:4px 0">${item.title} × ${item.amount}</td><td style="padding:4px 0;text-align:right">$${item.price.toFixed(2)}</td></tr>`)
        .join("");

    return {
        subject: `Your FoodieHub order from ${order.restaurantTitle} is confirmed`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2>Thanks, ${username}!</h2>
                <p>Your order from <strong>${order.restaurantTitle}</strong> has been placed and paid for.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">${itemsHtml}</table>
                <p><strong>Total: $${order.totalPrice.toFixed(2)}</strong></p>
                <p>Order ID: ${order._id}</p>
                <p>We'll email you again as your order's status changes.</p>
            </div>
        `,
    };
};
