"use client"

import { Order } from "@/redux/reduxTypes"
import { ordersApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { Dispatch, SetStateAction, useState } from "react";
import OrderCard from "./OrderCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Order card for the restaurant incoming-orders dashboard — reuses the
// shared OrderCard shell, adds the "toggle to Preparing" action.
const OrderCardDashboard = ({ order, setOrders }: { order: Order, setOrders: Dispatch<SetStateAction<Order[]>> }) => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const acceptOrder = async () => {
        try {
            setLoading(true);
            await ordersApi.acceptOrder(order._id);
            // Leaves the incoming queue once accepted; couriers pick it up from
            // there.
            setOrders((prev) => prev.filter(item => item._id !== order._id));
            toast.success("Order accepted - it is now visible to couriers");
        } catch (err) {
            console.error(err);
            toast.error(errorMessage(err, "Couldn't accept this order. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <OrderCard
            order={order}
            actions={
                <Button size="sm" loading={loading} onClick={acceptOrder}>
                    Accept &amp; start preparing
                </Button>
            }
        />
    )
}

export default OrderCardDashboard
