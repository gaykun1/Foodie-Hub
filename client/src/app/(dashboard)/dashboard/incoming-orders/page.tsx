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
    const getCreatedOrders = async () => {
        try {
            const res = await axios.get(`http://localhost:5200/api/order/get-created-orders/${user?.restaurantId}`, { withCredentials: true });
            if (res.data) {
                setOrders(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }
    useEffect(() => {
        const sock = io("http://localhost:5200");
        setSocket(sock);

    }, []);

    useEffect(() => {
        if (user?.restaurantId && socket) {
            getCreatedOrders();
            const restaurantId = user?.restaurantId;
            socket.emit("joinDashboardRestaurant", restaurantId);
            socket.on("incomingOrders", (orders) => {
                setOrders(orders);
            })
        }
    }, [socket, user]);

    return (
        <div>
            <h1 className='section-title mb-8'>Incoming orders</h1>
            {orders.length > 0 ? (

                <div className="grid md:grid-cols-2  lg:grid-cols-3 gap-6">
                    {orders.map((order, idx) => (
                        <OrderCardDashboard setOrders={setOrders} key={idx} order={order}/>
                    ))}
                        </div>
                    ) : <span className="text-lg leading-7 font-medium">No orders yet!</span>}

                </div>
            )
}

            export default Page