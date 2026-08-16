"use client"
import OrderCardDashboard from "@/components/order/OrderCardDashboard";
import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { useCallback, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

const Page = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useAppSelector((state) => state.auth);

    const getCreatedOrders = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/${user?.restaurantId}/created`, { withCredentials: true });
            if (res.data) setOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [user?.restaurantId])

    useEffect(() => {
        const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`);
        setSocket(sock);
        return () => { sock.disconnect(); }
    }, []);

    useEffect(() => {
        if (user?.restaurantId && socket) {
            getCreatedOrders();
            socket.emit("joinDashboardRestaurant", user.restaurantId);
            socket.on("incomingOrders", (orders) => {
                setOrders(orders);
            })
        }
    }, [socket, user?.restaurantId, getCreatedOrders]);

    return (
        <div>
            <h1 className="section-title mb-8">Incoming orders</h1>
            {orders.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderCardDashboard setOrders={setOrders} key={order._id} order={order} />
                    ))}
                </div>
            ) : (
                <EmptyState icon={<ClipboardList size={22} />} title="No orders yet" description="New incoming orders will show up here." />
            )}
        </div>
    )
}

export default Page
