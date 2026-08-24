"use client"
import CourierOrderCard from '@/components/CourierOrderCard';
import OrderCard from '@/components/order/OrderCard';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Order } from '@/redux/reduxTypes'
import { courierApi, ordersApi } from '@/api';
import { errorMessage, isNotFound } from '@/lib/apiClient';
import { ALLOWED_NEXT_BY_COURIER } from '@/lib/courierActions';
import { Bike, ChevronDown, ChevronsRight, PackageCheck, PackageSearch, PackageOpen, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrderListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { isOrderStatus, type OrderStatus } from '@/lib/orderStatus';
import { cn } from '@/lib/cn';
import { useCallback, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import dynamic from 'next/dynamic';

const MapTracker = dynamic(() => import('@/components/order/MapTracker'), { ssr: false });

const CourierView = () => {
    const [freeOrders, setFreeOrders] = useState<Order[] | null>(null);
    const [courierOrders, setCourierOrders] = useState<Order[] | null>(null);
    const [isWorking, setIsWorking] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [viewDetails, setViewDetails] = useState<Order | null>(null);
    const { courier } = useAppSelector(state => state.courier);
    const [status, setStatus] = useState<OrderStatus | "">("");
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<boolean>(false);
    const toast = useToast();

    useEffect(() => {
        const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
        setSocket(sock);
        return () => { sock.disconnect(); }
    }, []);

    const load = useCallback(async () => {
        if (!courier) return;
        setLoading(true);
        setError(false);
        try {
            // A 404 from any of these means "nothing to show", which is an empty
            // state — only a genuine failure should blank the page.
            const current = await courierApi.getCurrentOrder().catch((err) => {
                if (isNotFound(err)) return null;
                throw err;
            });
            setIsWorking(current);
            setViewDetails(current);
            if (current && isOrderStatus(current.status)) setStatus(current.status);

            if (!current) {
                const free = await ordersApi.getFreeOrders(courier.city).catch((err) => {
                    if (isNotFound(err)) return [];
                    throw err;
                });
                setFreeOrders(free);
            }

            const mine = await ordersApi.getCourierOrders().catch((err) => {
                if (isNotFound(err)) return [];
                throw err;
            });
            setCourierOrders(mine);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [courier]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [viewDetails]);

    const toggleOrderStatus = async (next: OrderStatus, id: string) => {
        try {
            setUpdatingStatus(true);
            await courierApi.changeOrderStatus(id, next);
            setStatus(next);
            if (next === "Delivered") {
                setIsWorking(null);
                await load();
            }
        } catch (err) {
            console.error(err);
            // The server enforces the legal transitions, so its message ("Cannot
            // move an order from X to Y") is the useful thing to show here.
            toast.error(errorMessage(err, "Couldn't update this order's status."));
        } finally {
            setUpdatingStatus(false);
        }
    }

    useEffect(() => {
        // Only publish a position while actually carrying an order, and only
        // once the socket exists — the previous `!socket && !isWorking` guard
        // was an AND, so it kept polling geolocation with nothing to send to.
        if (!socket || !isWorking) return;

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCourierLocation([latitude, longitude]);
                    socket.emit("updateLocation", { orderId: isWorking._id, lat: latitude, lng: longitude });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true },
            )
        }, 5000);
        return () => clearInterval(interval);
    }, [socket, isWorking])

    const currentStatus = status || isWorking?.status || "";
    const nextStatuses = isOrderStatus(currentStatus) ? ALLOWED_NEXT_BY_COURIER[currentStatus] : [];
    const deliveredOrders = courierOrders?.filter(item => item.status === "Delivered") ?? [];

    const body = () => {
        if (loading) return <OrderListSkeleton count={4} />;

        if (error) {
            return (
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="Couldn't load your deliveries"
                    description="The request didn't get through. Nothing has been assigned or unassigned."
                    action={<Button onClick={load}>Try again</Button>}
                />
            );
        }

        if (!isWorking) {
            return (
                <div className="flex flex-col gap-9">
                    <Card>
                        <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Free orders ({freeOrders?.length ?? 0})</h2>
                        <div className="gap-4 grid lg:grid-cols-2">
                            {freeOrders && freeOrders.length > 0 ? freeOrders.map((order) => (
                                <CourierOrderCard key={order._id} onTaken={load} setViewDetails={setViewDetails} order={order} />
                            )) : (
                                <div className="lg:col-span-2">
                                    <EmptyState
                                        icon={<PackageSearch size={22} />}
                                        title="No free orders right now"
                                        description={`Orders in ${courier?.city ?? "your city"} appear here as soon as a kitchen starts preparing them.`}
                                    />
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
                                    <EmptyState icon={<PackageOpen size={22} />} title="No completed deliveries yet" description="Deliveries you've completed will appear here." />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-6 items-center sm:items-start">
                <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-2xl leading-8 font-bold text-ink">
                        Delivering order #{isWorking._id.slice(-8).toUpperCase()}
                    </h2>
                    {isOrderStatus(currentStatus) && <OrderStatusBadge status={currentStatus} />}
                </div>
                <Card className="w-full flex flex-col gap-4 items-center">
                    <h2 className="section-title">Change order status</h2>
                    <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden">
                        <MapTracker isWorking={isWorking} courierLocation={courierLocation} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        {/* Only transitions the server will actually accept are
                            offered, so the courier can't be shown a dead button. */}
                        <Button
                            size="lg"
                            icon={<Bike size={18} />}
                            loading={updatingStatus}
                            disabled={!nextStatuses.includes("Delivering")}
                            onClick={() => toggleOrderStatus("Delivering", isWorking._id)}
                        >
                            Picked up
                        </Button>
                        <Button
                            size="lg"
                            variant="success"
                            icon={<PackageCheck size={18} />}
                            loading={updatingStatus}
                            disabled={!nextStatuses.includes("Delivered")}
                            onClick={() => toggleOrderStatus("Delivered", isWorking._id)}
                        >
                            Delivered
                        </Button>
                    </div>
                    {nextStatuses.length === 0 && (
                        <p className="text-sm text-inkMuted">This order has reached its final state.</p>
                    )}
                </Card>
            </div>
        );
    };

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
                <div className="lg:basis-[874px] w-full pt-1">{body()}</div>
                <div className="hidden grow lg:block">
                    <ViewDetailsSideBar viewDetails={viewDetails} />
                </div>
            </div>
        </div>
    )
}

const Page = () => (
    <RequireAuth
        roles={["courier"]}
        title="Sign in to your courier account"
        description="Delivery work is tied to an approved courier account."
    >
        <CourierView />
    </RequireAuth>
);

export default Page
