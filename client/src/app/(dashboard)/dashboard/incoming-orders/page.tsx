"use client"
import OrderCardDashboard from "@/components/order/OrderCardDashboard";
import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import { ordersApi } from "@/api";
import { isNotFound } from "@/lib/apiClient";
import { useCallback, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderListSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ClipboardList, TriangleAlert } from "lucide-react";

const Page = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useAppSelector((state) => state.auth);

    const getCreatedOrders = useCallback(async () => {
        if (!user?.restaurantId) return;
        try {
            setLoading(true);
            setError(false);
            setOrders(await ordersApi.getIncomingOrders(user.restaurantId));
        } catch (err) {
            // No incoming orders comes back as a 404 - an empty kitchen queue,
            // not a failure.
            if (isNotFound(err)) {
                setOrders([]);
            } else {
                console.error(err);
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.restaurantId])

    useEffect(() => {
        const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
        setSocket(sock);
        return () => { sock.disconnect(); }
    }, []);

    useEffect(() => {
        if (!user?.restaurantId || !socket) return;
        void getCreatedOrders();
        // The server resolves the restaurant from the caller's auth cookie.
        socket.emit("joinDashboardRestaurant");
        const handleIncoming = (incoming: Order[]) => setOrders(incoming);
        socket.on("incomingOrders", handleIncoming);
        // Without this the handler stacked up on every re-render, so one order
        // could trigger several state updates.
        return () => { socket.off("incomingOrders", handleIncoming); };
    }, [socket, user?.restaurantId, getCreatedOrders]);

    return (
        <div>
            <h1 className="section-title mb-8">Incoming orders</h1>
            {loading ? (
                <OrderListSkeleton count={3} />
            ) : error ? (
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="Couldn't load incoming orders"
                    description="The request didn't get through. No order has been missed - try again."
                    action={<Button onClick={getCreatedOrders}>Try again</Button>}
                />
            ) : orders.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderCardDashboard setOrders={setOrders} key={order._id} order={order} />
                    ))}
                </div>
            ) : (
                <EmptyState icon={<ClipboardList size={22} />} title="No orders waiting" description="New orders appear here the moment a customer checks out." />
            )}
        </div>
    )
}

export default Page
