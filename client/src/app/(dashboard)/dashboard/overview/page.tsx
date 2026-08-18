"use client"

import axios from 'axios'
import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react'
import { Dish, Order, Review } from '@/redux/reduxTypes';
import { DashboardOverviewView } from '@/components/Dashboard/DashboardOverviewView';

const Page = () => {
  const [numOfOrders, setNumOfOrders] = useState<{ number: number, percent: number } | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<{ number: number, percent: number } | null>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<{ number: number, percent: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [topDishes, setTopDishes] = useState<Dish[] | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);

  useEffect(() => {
    const getNumbers = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/statistics`, { withCredentials: true });
        setNumOfOrders(res.data.numOfOrders);
        setTotalRevenue(res.data.totalRevenue);
        setAverageOrderValue(res.data.averageOrderValue);
      } catch (err) {
        console.error(err);
      }
    }
    const sock = io(`${process.env.NEXT_PUBLIC_API_URL}`, { withCredentials: true });
    setSocket(sock);
    getNumbers();
  }, [])

  useEffect(() => {
    const getLastSevenOrders = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/recent`, { withCredentials: true });
        if (res) setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    const getLastSevenReviews = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/reviews/recent`, { withCredentials: true });
        if (res) setReviews(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    const getTopSevenDishes = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/dishes/top`, { withCredentials: true });
        if (res) setTopDishes(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    getTopSevenDishes();
    getLastSevenReviews();
    getLastSevenOrders();
  }, [])

  useEffect(() => {
    if (socket) {
      // Server derives the admin's own id from their auth cookie now — it no
      // longer trusts a client-supplied adminId (and this call previously sent
      // the wrong shape anyway: the handler expected a bare string, not an object).
      socket.emit("joinDashboard");
      socket.on("updateOrders", (orders) => {
        setOrders(orders);
      })
      socket.on("updateReviews", (reviews) => {
        setReviews(reviews);
      })

      return () => {
        socket.off();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

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
    />
  )
}

export default Page
