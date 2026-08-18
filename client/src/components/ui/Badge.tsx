import React from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "info" | "danger" | "brand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand-100 text-sand-700",
  success: "bg-success100 text-success800",
  warning: "bg-warning100 text-warning800",
  info: "bg-info100 text-info800",
  danger: "bg-danger100 text-danger",
  brand: "bg-ember-100 text-ember-700",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const Badge = ({ tone = "neutral", className, children, ...rest }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold leading-5 whitespace-nowrap",
      tones[tone],
      className
    )}
    {...rest}
  >
    {children}
  </span>
);

// Must match the server's Order.status enum (server/models/Order.ts) — "Created"
// is the real just-placed state; "Processing" was never a value the backend
// actually sets for orders (that's a Courier application status).
export type OrderStatus = "Delivering" | "Delivered" | "Created" | "Preparing" | "Cancelled";

const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  Created: "neutral",
  Preparing: "warning",
  Delivering: "info",
  Delivered: "success",
  Cancelled: "danger",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={orderStatusTone[status]}>{status}</Badge>
);
