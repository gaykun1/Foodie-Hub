"use client"
import CourierOrderCard from '@/components/CourierOrderCard';
import OrderCard from '@/components/order/OrderCard';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { Bike, ChevronDown, ChevronsRight, PackageCheck, PackageSearch, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatusBadge, OrderStatus } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
const MapTracker = dynamic(() => import('@/components/order/MapTracker'), {
    ssr: false,
})
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import dynamic from 'next/dynamic';

const KNOWN_STATUSES: OrderStatus[] = ["Created", "Preparing", "Delivering", "Delivered"];

const Page = () => {
    const [freeOrders, setFreeOrders] = useState<Order[] | null>(null);
    const [courierOrders, setCourierOrders] = useState<Order[] | null>(null);
    const [isWorking, setIsWorking] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewDetails, setViewDetails] = useState<Order | null>(null);
    const { courier } = useAppSelector(state => state.courier);
    const [status, setStatus] = useState<string>("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<boolean>(false);

    useEffect(() => {
        const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
        setSocket(sock);
        return () => { sock.disconnect(); }
    }, []);

    const getFreeOrders = async () => {
        try {
            if (courier) {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/free-orders/${courier.city}`, { withCredentials: true });
                setFreeOrders(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }
    const getYourOrders = async () => {
        try {
            if (courier) {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/couriers/orders`, { withCredentials: true });
                if (res.data) {
                    setCourierOrders(res.data);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    const checkIfHasOrder = async () => {
        try {
            if (courier) {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/orders/status`, { withCredentials: true });
                setIsWorking(res.data);
                setViewDetails(res.data);
                return res.data;
            }
        } catch (err) {
            console.error(err);
        }
    }

    const toggleOrderStatus = async (status: string, id: string) => {
        try {
            const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/orders/${id}/status`, { status: status }, { withCredentials: true });
            if (res) {
                setStatus(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [viewDetails]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const order = await checkIfHasOrder();
            if (!order) {
                await getFreeOrders();
            } else {
                setStatus(order.status);
            }
            await getYourOrders();
            setLoading(false);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courier]);

    useEffect(() => {
        if (!socket && !isWorking) return;

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCourierLocation([latitude, longitude]);
                    socket?.emit("updateLocation", { orderId: isWorking?._id, lat: latitude, lng: longitude });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true },
            )
        }, 5000);
        return () => clearInterval(interval);
    }, [socket, isWorking])

    const currentStatus = status || isWorking?.status || "";
    const deliveredOrders = courierOrders?.filter(item => item.status === "Delivered") ?? [];

    return (
        <div className="flex flex-col gap-6 py-8">
            <div className="lg:hidden">
                <button
                    onClick={() => setActiveSidebar(!activeSidebar)}
                    aria-expanded={activeSidebar}
                    className={cn("text-lg font-bold flex gap-1 transition-colors items-center cursor-pointer", activeSidebar ? "text-brand" : "text-ink")}
                >
                    Current Order Info
                    <ChevronDown className={cn("transition-transform", activeSidebar && "rotate-180")} />
                </button>
                {activeSidebar && (
                    <div className="mt-4">
                        <ViewDetailsSideBar viewDetails={viewDetails} />
                    </div>
                )}
            </div>
            <div className="flex gap-8 w-full">
                <div className="lg:basis-[874px] w-full pt-1">
                    {loading ? (
                        <PageSpinner />
                    ) : !isWorking ? (
                        <div className="flex flex-col gap-9">
                            <Card>
                                <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Free orders ({freeOrders?.length ?? 0})</h2>
                                <div className="gap-4 grid lg:grid-cols-2">
                                    {freeOrders && freeOrders.length > 0 ? freeOrders.map((order) => (
                                        <CourierOrderCard key={order._id} checkIfHasOrder={checkIfHasOrder} setViewDetails={setViewDetails} order={order} />
                                    )) : (
                                        <div className="lg:col-span-2">
                                            <EmptyState icon={<PackageSearch size={22} />} title="No free orders yet" description="Check back soon — new orders in your city will show up here." />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card>
                                <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Past Orders ({deliveredOrders.length})</h2>
                                <div className="gap-4 grid lg:grid-cols-2">
                                    {deliveredOrders.length > 0 ? deliveredOrders.map((order) => (
                                        <OrderCard
                                            key={order._id}
                                            order={order}
                                            actions={
                                                <Button variant="secondary" size="sm" icon={<ChevronsRight size={16} />} onClick={() => setViewDetails(order)}>
                                                    View Details
                                                </Button>
                                            }
                                        />
                                    )) : (
                                        <div className="lg:col-span-2">
                                            <EmptyState icon={<PackageOpen size={22} />} title="No taken orders yet" description="Deliveries you've completed will appear here." />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 items-center sm:items-start">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h2 className="text-2xl leading-8 font-bold text-ink">Taking Order ID: {isWorking._id}</h2>
                                {KNOWN_STATUSES.includes(currentStatus as OrderStatus) && (
                                    <OrderStatusBadge status={currentStatus as OrderStatus} />
                                )}
                            </div>
                            <Card className="w-full flex flex-col gap-4 items-center">
                                <h2 className="section-title">Change order status</h2>
                                <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden">
                                    <MapTracker isWorking={isWorking} socket={socket} courierLocation={courierLocation} />
                                </div>
                                <div className="flex items-center gap-4 flex-wrap justify-center">
                                    <Button
                                        size="lg"
                                        icon={<Bike size={18} />}
                                        disabled={status === "Delivered" || status === "Delivering"}
                                        onClick={() => toggleOrderStatus("Delivering", isWorking._id)}
                                    >
                                        Delivering
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="success"
                                        icon={<PackageCheck size={18} />}
                                        disabled={status === "Delivered"}
                                        onClick={async () => { await toggleOrderStatus("Delivered", isWorking._id); setIsWorking(null) }}
                                    >
                                        Delivered
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
                <div className="hidden grow lg:block">
                    <ViewDetailsSideBar viewDetails={viewDetails} />
                </div>
            </div>
        </div>
    )
}

export default Page
