"use client"
import OrderCard from '@/components/order/OrderCard';
import { LiveTrackingExperience } from '@/components/order/LiveTrackingExperience';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import RateOrderModal from '@/components/order/RateOrderModal';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Order } from '@/redux/reduxTypes'
import { demoApi, ordersApi, ratingsApi } from '@/api';
import { isNotFound } from '@/lib/apiClient';
import { canCancel, isActiveStatus } from '@/lib/orderStatus';
import { ChevronDown, ChevronsRight, PackageSearch, PlayCircle, Star, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import { Button, ButtonLink } from '@/components/ui/Button';
import { OrderListSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const OrdersView = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewDetails, setViewDetails] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set());
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [simulationEnabled, setSimulationEnabled] = useState<boolean>(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
    setSocket(sock);
    return () => { sock.disconnect(); }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewDetails]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setOrders(await ordersApi.getOrders());
    } catch (err) {
      // A 404 from this endpoint means "you have no orders", which is an empty
      // state, not a failure.
      if (isNotFound(err)) {
        setOrders([]);
      } else {
        console.error(err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void demoApi.getDemoStatus().then(({ simulationEnabled: enabled }) => setSimulationEnabled(enabled));
  }, []);

  useEffect(() => {
    if (!socket || !orders) return;

    // Join every order still in motion so its live location and status updates
    // arrive. The server authorises each join from the auth cookie.
    orders.filter((order) => isActiveStatus(order.status))
      .forEach((order) => socket.emit("joinOrder", { orderId: order._id }));

    const handleLocationUpdate = ({ lat, lng }: { lat: number; lng: number }) => {
      setCourierLocation([lat, lng]);
    };
    const handleStatusUpdate = ({ status, id }: { status: Order["status"]; id: string }) => {
      setOrders((prev) => prev?.map((order) => order._id === id ? { ...order, status } : order) ?? prev);
    };

    socket.on("locationUpdate", handleLocationUpdate);
    socket.on("updateOrderStatus", handleStatusUpdate);

    return () => {
      socket.off("locationUpdate", handleLocationUpdate);
      socket.off("updateOrderStatus", handleStatusUpdate);
    };
  }, [socket, orders])

  const currentOrders = useMemo(
    () => orders?.filter((order) => isActiveStatus(order.status)) ?? [],
    [orders]
  );
  const pastOrders = useMemo(
    () => orders?.filter((order) => !isActiveStatus(order.status)) ?? [],
    [orders]
  );
  // "Created" is included so a just-placed order immediately shows the tracking
  // timeline and route rather than an empty page until the kitchen accepts.
  const activeTrackingOrder = useMemo(() => currentOrders[0] ?? null, [currentOrders]);

  useEffect(() => {
    if (orders?.length) setViewDetails(currentOrders[0] ?? orders[0]);
  }, [orders, currentOrders])

  const deliveredOrderIds = useMemo(
    () => orders?.filter((order) => order.status === "Delivered").map((order) => order._id).join(",") ?? "",
    [orders]
  );

  useEffect(() => {
    if (!deliveredOrderIds) return;
    const ids = deliveredOrderIds.split(",");
    const checkRatings = async () => {
      const results = await Promise.all(ids.map(async (id) => {
        try {
          return (await ratingsApi.getOrderRating(id)) ? id : null;
        } catch {
          return null;
        }
      }));
      setRatedOrderIds(new Set(results.filter((id): id is string => id !== null)));
    };
    void checkRatings();
  }, [deliveredOrderIds]);

  const cancelOrder = async (order: Order) => {
    try {
      setCancellingId(order._id);
      await ordersApi.cancelOrder(order._id);
      setOrders((prev) => prev?.map(o => o._id === order._id ? { ...o, status: "Cancelled" } : o) ?? null);
      toast.success("Order cancelled and refunded");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't cancel this order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  // Demo affordance: with no real kitchen or courier staffing the dashboards,
  // this drives the order through its real lifecycle so the tracking map has
  // something to show.
  const runSimulation = async (order: Order) => {
    try {
      setSimulatingId(order._id);
      await demoApi.simulateDelivery(order._id);
      toast.success("Simulating delivery — watch the map update live");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't start the delivery simulation.");
      setSimulatingId(null);
    }
  };

  const orderActions = (order: Order) => (
    <>
      {canCancel(order.status, "customer") && (
        <Button
          variant="danger" size="sm" icon={<X size={16} />}
          loading={cancellingId === order._id}
          onClick={() => cancelOrder(order)}
        >
          Cancel order
        </Button>
      )}
      {simulationEnabled && order.status === "Created" && (
        <Button
          variant="outline" size="sm" icon={<PlayCircle size={16} />}
          loading={simulatingId === order._id}
          onClick={() => runSimulation(order)}
        >
          Simulate delivery
        </Button>
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

  if (loading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl sm:text-[36px] font-extrabold leading-10 text-ink mb-9">Your Orders</h1>
        <OrderListSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <h1 className="text-3xl sm:text-[36px] font-extrabold leading-10 text-ink mb-9">Your Orders</h1>
        <EmptyState
          icon={<TriangleAlert size={22} />}
          title="We couldn't load your orders"
          description="Nothing has been lost — the request just didn't get through."
          action={<Button onClick={loadOrders}>Try again</Button>}
        />
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="py-8">
        <h1 className="text-3xl sm:text-[36px] font-extrabold leading-10 text-ink mb-9">Your Orders</h1>
        <EmptyState
          icon={<PackageSearch size={22} />}
          title="No orders yet"
          description="Browse restaurants and place your first order — it'll show up here with live tracking."
          action={<ButtonLink href="/restaurants/category/all-restaurants">Browse restaurants</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="py-8">
      {!activeTrackingOrder ? (
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
      ) : null}

      <div className="flex flex-col gap-6 lg:border-b-0 border-b-2 border-border">
        {activeTrackingOrder ? (
          <LiveTrackingExperience
            order={activeTrackingOrder}
            courierLocation={courierLocation}
            onSimulate={
              simulationEnabled && activeTrackingOrder.status === "Created"
                ? () => runSimulation(activeTrackingOrder)
                : undefined
            }
            simulating={simulatingId === activeTrackingOrder._id}
          />
        ) : null}
        {activeSidebar && (
          <div className="lg:hidden border-b-2 border-border pb-6 flex flex-col gap-6">
            <ViewDetailsSideBar viewDetails={viewDetails} />
          </div>
        )}
        <div className="flex relative gap-8">
          <div className="lg:basis-[865px] w-full pt-1">
            <div>
              <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Current Orders ({currentOrders.length})</h2>
              <div className="gap-4 grid lg:grid-cols-2">
                {currentOrders.length > 0 ? currentOrders.map((order) => (
                  <OrderCard key={order._id} order={order} actions={orderActions(order)} />
                )) : (
                  <div className="lg:col-span-2">
                    <EmptyState icon={<PackageSearch size={22} />} title="No current orders" description="Place an order to see it show up here with live tracking." />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-9">
              <h2 className="text-2xl leading-8 font-bold mb-4 text-ink">Past Orders ({pastOrders.length})</h2>
              <div className="gap-4 grid lg:grid-cols-2">
                {pastOrders.length > 0 ? pastOrders.map((order) => (
                  <OrderCard key={order._id} order={order} actions={orderActions(order)} />
                )) : (
                  <div className="lg:col-span-2">
                    <EmptyState icon={<PackageSearch size={22} />} title="No past orders yet" description="Your delivered and cancelled orders will appear here." />
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

const Page = () => (
  <RequireAuth
    title="Sign in to see your orders"
    description="Your order history and live tracking live with your account. Browsing restaurants doesn't need one."
  >
    <OrdersView />
  </RequireAuth>
);

export default Page
