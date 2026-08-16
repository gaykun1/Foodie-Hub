"use client"

import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import OrderCard from "./OrderCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Order card for the restaurant incoming-orders dashboard — reuses the
// shared OrderCard shell, adds the "toggle to Preparing" action.
const OrderCardDashboard = ({ order, setOrders }: { order: Order, setOrders: Dispatch<SetStateAction<Order[]>> }) => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const toggleToPreparing = async () => {
        try {
            setLoading(true);
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/${order._id}/status`, {}, { withCredentials: true });
            setOrders((prev) => prev.filter(item => item._id !== order._id));
        } catch (err) {
            console.error(err);
            toast.error("Couldn't update the order. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <OrderCard
            order={order}
            actions={
                <Button size="sm" loading={loading} onClick={toggleToPreparing}>
                    Toggle to Preparing
                </Button>
            }
        />
    )
}

export default OrderCardDashboard
