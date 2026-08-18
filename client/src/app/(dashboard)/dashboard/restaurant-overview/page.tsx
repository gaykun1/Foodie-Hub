"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish, Order, Review } from '@/redux/reduxTypes';
import axios from 'axios'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import { DashboardOverviewView } from '@/components/Dashboard/DashboardOverviewView';

const Page = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [topDishes, setTopDishes] = useState<Dish[] | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);
  const [numOfOrders, setNumOfOrders] = useState<{ number: number, percent: number } | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<{ number: number, percent: number } | null>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<{ number: number, percent: number } | null>(null);

  useEffect(() => {
    if (user?.restaurantId) {
      const getLastSevenOrders = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/restaurants/${user?.restaurantId}/orders/recent`, { withCredentials: true });
          if (res) setOrders(res.data);
        } catch (err) {
          console.error(err);
        }
      }
      const getLastSevenReviews = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${user?.restaurantId}/reviews/recent`, { withCredentials: true });
          if (res) setReviews(res.data);
        } catch (err) {
          console.error(err);
        }
      }
      const getTopSevenDishes = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${user?.restaurantId}/dishes/top`, { withCredentials: true });
          if (res) setTopDishes(res.data);
        } catch (err) {
          console.error(err);
        }
      }
      getTopSevenDishes();
      getLastSevenReviews();
      getLastSevenOrders();
    }
  }, [user?.restaurantId])

  useEffect(() => {
    if (user?.restaurantId) {
      const getNumbers = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/statistics?id=${user?.restaurantId}`, { withCredentials: true });
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
    }
  }, [user?.restaurantId])

  useEffect(() => {
    if (socket) {
      const restaurantId = user?.restaurantId;
      socket.emit("joinDashboardRestaurant", restaurantId);
      socket.on("updateRestaurantOrders", (orders) => {
        setOrders(orders);
      })
      socket.on("updateRestaurantReviews", (reviews) => {
        setReviews(reviews);
      })

      return () => {
        socket.off("updateRestaurantOrders");
        socket.off("updateRestaurantReviews");
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

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
    />
  )
}

export default Page
