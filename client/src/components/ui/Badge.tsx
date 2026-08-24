import React from "react";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, type OrderStatus } from "@/lib/orderStatus";

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

// The status vocabulary itself lives in @/lib/orderStatus, which mirrors
// server/utils/orderStatus.ts — this file only owns how a status *looks*.
export type { OrderStatus };

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
);
