"use client"
import OrderCardDashboard from "@/components/order/OrderCardDashboard";
import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client";

const Page = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useAppSelector((state) => state.auth);

    // func for getting orders in status "Created"
    const getCreatedOrders = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/${user?.restaurantId}/created`, { withCredentials: true });
            if (res.data) {
                setOrders(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }
    // creating io server after rendering
    useEffect(() => {
        const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`);
        setSocket(sock);
        return () => {sock.disconnect();}
    }, []);

    //after this connecting to socket and listening to newly-created orders
    useEffect(() => {
        if (user?.restaurantId && socket) {
            getCreatedOrders();
            const restaurantId = user?.restaurantId;
            socket.emit("joinDashboardRestaurant", restaurantId);
            socket.on("incomingOrders", (orders) => {
                setOrders(orders);
            })
        }
    }, [socket, user?.restaurantId]);

    return (
        <div>
            <h1 className='section-title mb-8'>Incoming orders</h1>
            {orders.length > 0 ? (

                <div className="grid md:grid-cols-2  lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderCardDashboard setOrders={setOrders} key={order._id} order={order} />
                    ))}
                </div>
            ) : <span className="text-lg leading-7 font-medium">No orders yet!</span>}

        </div>
    )
}

export default Page