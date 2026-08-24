"use client"

import { io, Socket } from 'socket.io-client';
import { useCallback, useEffect, useState } from 'react'
import { Dish, Order, Review } from '@/redux/reduxTypes';
import { ordersApi, restaurantsApi } from '@/api';
import { isNotFound } from '@/lib/apiClient';
import { DashboardOverviewView } from '@/components/Dashboard/DashboardOverviewView';

type Metric = { number: number; percent: number } | null;

const Page = () => {
  const [numOfOrders, setNumOfOrders] = useState<Metric>(null);
  const [totalRevenue, setTotalRevenue] = useState<Metric>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<Metric>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [topDishes, setTopDishes] = useState<Dish[] | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    // Each panel resolves independently: a 404 here means "nothing yet", which
    // is an empty state rather than a failure, and one empty panel must not
    // blank out the others.
    const results = await Promise.allSettled([
      ordersApi.getStatistics(),
      ordersApi.getRecentOrders(),
      restaurantsApi.getRecentReviews(),
      restaurantsApi.getTopDishes(),
    ]);

    const [stats, recentOrders, recentReviews, dishes] = results;

    if (stats.status === "fulfilled") {
      setNumOfOrders(stats.value.numOfOrders);
      setTotalRevenue(stats.value.totalRevenue);
      setAverageOrderValue(stats.value.averageOrderValue);
    } else if (isNotFound(stats.reason)) {
      setNumOfOrders({ number: 0, percent: 0 });
      setTotalRevenue({ number: 0, percent: 0 });
      setAverageOrderValue({ number: 0, percent: 0 });
    }

    setOrders(recentOrders.status === "fulfilled" ? recentOrders.value : []);
    setReviews(recentReviews.status === "fulfilled" ? recentReviews.value : []);
    setTopDishes(dishes.status === "fulfilled" ? dishes.value : []);

    // Only a genuine failure (not a 404 empty state) counts as an error.
    const hardFailure = results.some(
      (result) => result.status === "rejected" && !isNotFound(result.reason)
    );
    setError(hardFailure);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
    // The server derives the admin's own id from their auth cookie — it does
    // not trust a client-supplied adminId.
    socket.emit("joinDashboard");
    socket.on("updateOrders", setOrders);
    socket.on("updateReviews", setReviews);

    // The socket is created and torn down in the same effect, so there is
    // nothing missing from the dependency list any more — this is what the
    // stale eslint-disable in the previous version was suppressing.
    return () => {
      socket.off("updateOrders", setOrders);
      socket.off("updateReviews", setReviews);
      socket.disconnect();
    };
  }, []);

  return (
    <DashboardOverviewView
      title="Dashboard Overview"
      numOfOrders={numOfOrders}
      totalRevenue={totalRevenue}
      averageOrderValue={averageOrderValue}
      orders={orders}
      reviews={reviews}
      topDishes={topDishes}
      accordion={accordion}
      setAccordion={setAccordion}
      loading={loading}
      error={error}
      onRetry={load}
    />
  )
}

export default Page
