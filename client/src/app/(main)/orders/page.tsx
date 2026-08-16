"use client"
const MapTracker = dynamic(() => import('@/components/order/MapTracker'), {
  ssr: false,
})
import OrderCard from '@/components/order/OrderCard';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { ChevronDown, ChevronsRight, Map, PackageSearch } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

const Page = () => {
  const [orders, setOrders] = useState<Order[] | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewDetails, setViewDetails] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const [activeSidebar, setActiveSidebar] = useState<boolean>(false);

  useEffect(() => {
    const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`);
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
        socket.emit("joinOrder", { orderId: order._id, userId: user?._id });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, orders])

  useEffect(() => {
    if (orders) {
      const item = orders?.find(order => order.status === "Preparing") || orders[0];
      setViewDetails(item);
    }
  }, [orders])

  const currentOrders = useMemo(() => orders?.filter(order => order.status !== "Delivered"), [orders])
  const pastOrders = useMemo(() => orders?.filter(order => order.status === "Delivered"), [orders])

  const orderActions = (order: Order) => (
    <>
      {order.status === "Delivering" && (
        <Button variant="outline" size="sm">Track order</Button>
      )}
      <Button variant="secondary" size="sm" icon={<ChevronsRight size={16} />} onClick={() => setViewDetails(order)}>
        View Details
      </Button>
    </>
  );

  const trackingPanel = (viewDetails?.status !== "Delivered" && viewDetails?.courierId !== null) && (
    <Card>
      <div className="flex flex-col mb-6 gap-1.5">
        <div className="flex items-center gap-2">
          <Map className="text-brand" size={20} />
          <h2 className="text-xl leading-7 font-bold text-ink">Live Tracking</h2>
        </div>
        <p className="text-sm leading-5 text-inkMuted">
          Your order is on its way to {viewDetails?.adress.houseNumber} {viewDetails?.adress.street}
        </p>
      </div>
      <div className="w-full overflow-hidden rounded-lg h-[250px]">
        <MapTracker courierLocation={courierLocation} socket={socket} isWorking={viewDetails} />
      </div>
    </Card>
  );

  return (
    <div className="py-8">
      <div className={cn("flex sm:items-center gap-4 sm:justify-between sm:mb-9 flex-col sm:flex-row", activeSidebar && "mb-6")}>
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
      </div>

      {loading ? (
        <PageSpinner />
      ) : orders && orders.length > 0 ? (
        <div className="flex flex-col gap-6 lg:border-b-0 border-b-2 border-border">
          {activeSidebar && (
            <div className="lg:hidden border-b-2 border-border pb-6 flex flex-col gap-6">
              {trackingPanel}
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
              {trackingPanel}
              <ViewDetailsSideBar viewDetails={viewDetails} />
            </div>
          </div>
        </div>
      ) : (
        <EmptyState icon={<PackageSearch size={22} />} title="No orders yet" description="Browse restaurants to place your first order." />
      )}
    </div>
  )
}

export default Page
