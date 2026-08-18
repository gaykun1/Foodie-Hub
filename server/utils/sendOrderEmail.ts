import { resend } from "./emailClient";
import { IOrderDocument } from "../models/Order";
import { orderConfirmationEmail } from "../emails/orderConfirmation";
import { orderStatusUpdateEmail } from "../emails/orderStatusUpdate";
import { orderCancelledEmail } from "../emails/orderCancelled";

export type OrderEmailKind = "confirmation" | "statusUpdate" | "cancelled";

const buildEmail = (kind: OrderEmailKind, order: IOrderDocument, username: string) => {
    if (kind === "confirmation") return orderConfirmationEmail(order, username);
    if (kind === "cancelled") return orderCancelledEmail(order, username);
    return orderStatusUpdateEmail(order, username);
};

// Fire-and-forget by design: never awaited from the request path. A slow or
// unavailable email provider must never delay or break checkout, a status
// change, or a cancellation — those are the actual product; email is a
// courtesy on top. No-ops if the user has no email on file (it's optional).
export const sendOrderStatusEmail = (
    order: IOrderDocument,
    user: { email?: string | null; username: string } | null,
    kind: OrderEmailKind
): void => {
    if (!user?.email) return;
    const { subject, html } = buildEmail(kind, order, user.username);
    resend.emails
        .send({ from: process.env.EMAIL_FROM!, to: user.email, subject, html })
        .catch(err => console.error("[email] failed to send order email:", err));
};
