"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish, Order, Review } from '@/redux/reduxTypes';
import { ordersApi, restaurantsApi } from '@/api';
import { isNotFound } from '@/lib/apiClient';
import { useCallback, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import { DashboardOverviewView } from '@/components/Dashboard/DashboardOverviewView';

type Metric = { number: number; percent: number } | null;

const Page = () => {
  const { user } = useAppSelector((state) => state.auth);
  const restaurantId = user?.restaurantId;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [topDishes, setTopDishes] = useState<Dish[] | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);
  const [numOfOrders, setNumOfOrders] = useState<Metric>(null);
  const [totalRevenue, setTotalRevenue] = useState<Metric>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<Metric>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(false);

    // Panels resolve independently so one empty section can't blank the rest;
    // a 404 means "nothing yet", which the view renders as an empty state.
    const results = await Promise.allSettled([
      ordersApi.getStatistics(restaurantId),
      ordersApi.getRecentOrders(restaurantId),
      restaurantsApi.getRecentReviews(restaurantId),
      restaurantsApi.getTopDishes(restaurantId),
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

    setError(results.some((r) => r.status === "rejected" && !isNotFound(r.reason)));
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
    // The server resolves this account's restaurant from the auth cookie.
    socket.emit("joinDashboardRestaurant");
    socket.on("updateRestaurantOrders", setOrders);
    socket.on("updateRestaurantReviews", setReviews);

    return () => {
      socket.off("updateRestaurantOrders", setOrders);
      socket.off("updateRestaurantReviews", setReviews);
      socket.disconnect();
    };
  }, [restaurantId])

  return (
    <DashboardOverviewView
      title="Restaurant Overview"
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
