"use client"
import OrderCard from '@/components/order/OrderCard';
import { LiveTrackingExperience } from '@/components/order/LiveTrackingExperience';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import RateOrderModal from '@/components/order/RateOrderModal';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { ChevronDown, ChevronsRight, PackageSearch, Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const Page = () => {
  const [orders, setOrders] = useState<Order[] | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewDetails, setViewDetails] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set());
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const toast = useToast();

  useEffect(() => {
    const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
    setSocket(sock);
    return () => { sock.disconnect(); }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewDetails]);

  useEffect(() => {
    const getOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders`, { withCredentials: true });
        if (res) setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getOrders();
  }, [])

  useEffect(() => {
    if (!socket) return;
    if (orders) {
      const activeOrders = orders.filter(
        order => order.status === "Preparing" || order.status === "Delivering"
      );

      activeOrders.forEach(order => {
        // Server now identifies the joiner from their auth cookie, not this userId.
        socket.emit("joinOrder", { orderId: order._id });
      });

      const handleLocationUpdate = ({ lat, lng }: { lat: number; lng: number }) => {
        setCourierLocation([lat, lng]);
      };
      socket.on("locationUpdate", handleLocationUpdate);
      socket.on("updateOrderStatus", ({ status, id }) => {
        const order = orders?.find(order => order._id === id);
        if (order) {
          setOrders((prev) => prev?.map(order => order._id === id ? { ...order, status } : order));
        }
      });

      return () => {
        socket.off("locationUpdate", handleLocationUpdate);
        socket.off("updateOrderStatus");
      };
    }
  }, [socket, orders])

  useEffect(() => {
    if (orders) {
      const item = orders?.find(order => order.status === "Preparing") || orders[0];
      setViewDetails(item);
    }
  }, [orders])

  const currentOrders = useMemo(() => orders?.filter(order => order.status !== "Delivered" && order.status !== "Cancelled"), [orders])
  const pastOrders = useMemo(() => orders?.filter(order => order.status === "Delivered" || order.status === "Cancelled"), [orders])
  const activeTrackingOrder = useMemo(() => currentOrders?.find(order => order.status === "Delivering" || order.status === "Preparing") ?? null, [currentOrders])
  const deliveredOrderIds = useMemo(() => orders?.filter(order => order.status === "Delivered").map(order => order._id).join(",") ?? "", [orders])

  useEffect(() => {
    if (!deliveredOrderIds) return;
    const ids = deliveredOrderIds.split(",");
    const checkRatings = async () => {
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/rating/orders/${id}/rating`, { withCredentials: true });
          return res.data ? id : null;
        } catch {
          return null;
        }
      }));
      setRatedOrderIds(new Set(results.filter((id): id is string => id !== null)));
    };
    checkRatings();
  }, [deliveredOrderIds]);

  const cancelOrder = async (order: Order) => {
    try {
      setCancellingId(order._id);
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/${order._id}/cancel`, {}, { withCredentials: true });
      setOrders((prev) => prev?.map(o => o._id === order._id ? { ...o, status: "Cancelled" } : o));
      toast.success("Order cancelled and refunded");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't cancel this order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const orderActions = (order: Order) => (
    <>
      {order.status === "Created" && (
        <Button
          variant="danger" size="sm" icon={<X size={16} />}
          loading={cancellingId === order._id}
          onClick={() => cancelOrder(order)}
        >
          Cancel order
        </Button>
      )}
      {order.status === "Delivering" && (
        <Button variant="outline" size="sm">Track order</Button>
      )}
      {order.status === "Delivered" && !ratedOrderIds.has(order._id) && (
        <Button variant="outline" size="sm" icon={<Star size={16} />} onClick={() => setRatingOrder(order)}>
          Rate order
        </Button>
      )}
      <Button variant="secondary" size="sm" icon={<ChevronsRight size={16} />} onClick={() => setViewDetails(order)}>
        View Details
      </Button>
    </>
  );

  return (
    <div className="py-8">
      {!activeTrackingOrder ? <div className={cn("flex sm:items-center gap-4 sm:justify-between sm:mb-9 flex-col sm:flex-row", activeSidebar && "mb-6")}>
        <h1 className="text-3xl sm:text-[36px] font-extrabold leading-10 text-ink">Your Orders</h1>
        <div className="lg:hidden">
          <button
            onClick={() => setActiveSidebar(!activeSidebar)}
            aria-expanded={activeSidebar}
            className={cn("text-lg font-bold flex gap-1 transition-colors items-center cursor-pointer", activeSidebar ? "text-brand" : "text-ink")}
          >
            Current Order Info
            <ChevronDown className={cn("transition-transform", activeSidebar && "rotate-180")} />
          </button>
        </div>
      </div> : null}

      {loading ? (
        <PageSpinner />
      ) : orders && orders.length > 0 ? (
        <div className="flex flex-col gap-6 lg:border-b-0 border-b-2 border-border">
          {activeTrackingOrder ? <LiveTrackingExperience order={activeTrackingOrder} socket={socket} courierLocation={courierLocation} /> : null}
          {activeSidebar && (
            <div className="lg:hidden border-b-2 border-border pb-6 flex flex-col gap-6">
              <ViewDetailsSideBar viewDetails={viewDetails} />
            </div>
          )}
          <div className="flex relative gap-8">
            <div className="lg:basis-[865px] w-full pt-1">
              <div>
                <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Current Orders ({currentOrders?.length ?? 0})</h2>
                <div className="gap-4 grid lg:grid-cols-2">
                  {currentOrders && currentOrders.length > 0 ? currentOrders.map((order) => (
                    <OrderCard key={order._id} order={order} actions={orderActions(order)} />
                  )) : (
                    <div className="lg:col-span-2">
                      <EmptyState icon={<PackageSearch size={22} />} title="No current orders yet" description="Place an order to see it show up here." />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-9">
                <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Past Orders ({pastOrders?.length ?? 0})</h2>
                <div className="gap-4 grid lg:grid-cols-2">
                  {pastOrders && pastOrders.length > 0 ? pastOrders.map((order) => (
                    <OrderCard key={order._id} order={order} actions={orderActions(order)} />
                  )) : (
                    <div className="lg:col-span-2">
                      <EmptyState icon={<PackageSearch size={22} />} title="No past orders yet" description="Your delivered orders will appear here." />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grow lg:flex flex-col gap-6 hidden">
              <ViewDetailsSideBar viewDetails={viewDetails} />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState icon={<PackageSearch size={22} />} title="No orders yet" description="Browse restaurants to place your first order." />
      )}

      {ratingOrder && (
        <RateOrderModal
          order={ratingOrder}
          open={!!ratingOrder}
          onClose={() => setRatingOrder(null)}
          onSubmitted={() => setRatedOrderIds((prev) => new Set(prev).add(ratingOrder._id))}
        />
      )}
    </div>
  )
}

export default Page
