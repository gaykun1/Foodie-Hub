"use client"

import Image from "next/image";
import { Order } from "@/redux/reduxTypes"
import { ClipboardList, Clock } from "lucide-react";
import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface OrderCardProps {
    order: Order;
    actions?: React.ReactNode;
    onViewDetails?: (order: Order) => void;
}

// Shared presentational order card — used (via thin role-specific wrappers)
// by the customer orders page, the restaurant incoming-orders dashboard, and
// the courier dashboard. Each caller supplies its own `actions` for the
// footer since those differ by role; everything else was byte-identical
// across the three previous copies.
const OrderCard = React.memo(({ order, actions, onViewDetails }: OrderCardProps) => {
    const date = useMemo(() => new Date(order.createdAt).toDateString(), [order.createdAt]);

    return (
        <Card
            padding="none"
            interactive={!!onViewDetails}
            onClick={onViewDetails ? () => onViewDetails(order) : undefined}
            className={cn(order.status === "Delivering" && "border-brand")}
        >
            <div className="border-b border-border px-4 py-5 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-ink truncate">{order.restaurantTitle}</h3>
                    <span className="text-sm text-inkMuted whitespace-nowrap">{date}</span>
                </div>
                <span className="text-sm text-inkMuted">Order ID: {order._id}</span>
            </div>
            <div className="p-4 flex flex-col gap-5">
                <div className="flex gap-4">
                    <div className="relative size-24 shrink-0 rounded-md overflow-hidden border border-border bg-sand-100">
                        <Image src={order.restaurantImage} alt={order.restaurantTitle} fill sizes="96px" className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-between py-0.5">
                        <span className="flex items-center gap-2 font-medium text-ink">
                            <ClipboardList size={16} />
                            Items: {order.items.length}
                        </span>
                        <span className="text-2xl font-bold text-brand font-display">
                            ${order.totalPrice.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-inkMuted">
                            <Clock size={16} />
                            Approx. time: {order.approxTime} min
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <OrderStatusBadge status={order.status} />
                    {actions && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
});
OrderCard.displayName = "OrderCard";
export default OrderCard
