"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish, Order, Review } from '@/redux/reduxTypes';
import { calculateStars } from '@/utils/rating';
import axios from 'axios'
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';

const Page = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [topDishes, setTopDishes] = useState<Dish[] | null>(null);
  const [accordion, setAccordion] = useState<string | null>(null);

  useEffect(() => {
    if (user?.restaurantId) {


      const getLastSevenOrders = async () => {
        try {
          const res = await axios.get(`http://localhost:5200/api/order/get-last-seven/${user?.restaurantId}`, { withCredentials: true });
          if (res) {
            setOrders(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      }
      const getLastSevenReviews = async () => {
        try {
          const res = await axios.get(`http://localhost:5200/api/restaurant/get-last-seven-reviews/${user?.restaurantId}`, { withCredentials: true });
          if (res) {
            setReviews(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      }
      const getTopSevenDishes = async () => {
        try {
          const res = await axios.get(`http://localhost:5200/api/restaurant/get-top-seven-dishes/${user?.restaurantId}`, { withCredentials: true });
          if (res) {
            setTopDishes(res.data);
          }
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
    const sock = io("http://localhost:5200");
    setSocket(sock);
  }, [])

  useEffect(() => {
    if (socket) {
      socket.emit("joinDashboardRestaurant", { restaurantId: user?._id });
      socket.on("updateRestaurantOrders", (orders) => {
        setOrders(orders);
      })
      socket.on("updateRestaurantOrders", (reviews) => {
        setReviews(reviews);
      })

      return () => {
        socket.off();
      };
    }
  }, [socket])

  return (
    <div>
      <h1 className="section-title mb-8 ">Restaurant overview</h1>
      <div className="flex flex-col gap-3 ">
        {/* Recent updated order table */}
        <div className="rounded-lg border-borderColor border-[1px] px-[25px] py-[50px] flex flex-col gap-6">
          <h2 className='text-xl leading-7 font-semibold'>Recent Orders</h2>
          <table className='text-sm leading-5 text-gray font-medium overflow-hidden'>
            <thead>
              <tr className=''>
                <th className='text-start py-2.5'>Order ID</th>
                <th className='text-start py-2.5'>Customer</th>
                <th className='text-start py-2.5'>Items</th>
                <th className='text-start py-2.5'>Total</th>
                <th className='text-start py-2.5'>Status</th>
                <th className='text-start py-2.5'>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order, idx) => (
                <tr key={idx} className=' border-t-[1px] border-borderColor '>

                  <td className='text-secondary py-6 px-1'>{order._id}</td>
                  <td className='font-base py-6 px-1'>{order.fullName}</td>
                  <td className='font-base py-6 px-1 flex flex-col  '>
                    {order.items.map((item, idx) => (
                      <span key={idx}>{item.amount}x {item.title}{item !== order.items[order.items.length - 1] ? "," : ""}</span>
                    ))}

                  </td>
                  <td className='font-base py-6 px-1 text-secondary'>${order.totalPrice}</td>
                  <td className='py-6 px-1'><span className={`border-[1px] py-2 px-4 ${order.status === "Delivering" ? "text-primary border-primary bg-[#636AE833]" : order.status == "Delivered" ? "text-[#37db70] border-[#37db70] bg-[#DCFCE7FF]" : "text-primary border-primary bg-[#4d55ed33]"}  rounded-4xl    font-medium `}>{order.status}</span></td>
                  <td className='py-6 px-1'>{Math.round((new Date().getTime() / 1000 - new Date(order.createdAt).getTime() / 1000) / 60) > 60 ? Math.round((new Date().getTime() / 1000 - new Date(order.createdAt).getTime() / 1000) / 3600) + " Hours ago" : Math.round((new Date().getTime() / 1000 - new Date(order.createdAt).getTime() / 1000) / 60) + " Min. ago"}</td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>

        <div className="flex gap-6 items-start">
          {/* last 7 reviews table */}
          <div className="rounded-lg border-borderColor border-[1px]  px-[25px] py-[50px] flex flex-col basis-[550px]  gap-6">
            <div className="flex flex-col gap-1">
              <h2 className='text-xl leading-7 font-semibold '>Customer Feedback</h2>
              <p className='text-sm leading-5 text-gray'>Recent ratings and comments</p>
            </div>
            {reviews && (
              <>
                {reviews.map((review, idx) => (
                  <div key={idx} className="  px-4 py-6 text-gray border-b-[1px] border-borderColor">
                    <div className="flex items-center">
                      <div className="basis-[265px] gap-2 flex items-center">
                        <span className='text-sm leading-5  font-semibold '>{review.sender?.username}</span>
                        <div className="flex gap-0.5">{calculateStars(review.rating, 16)}</div>
                      </div>
                      <span className='text-xs font-medium leading-4 grow-1'>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <button>
                        <ChevronDown onClick={() => setAccordion((prev) => prev == review._id ? null : review._id)} className={`text-secondary transition-transform p-1 cursor-pointer hover:bg-gray-100 rounded-full hover ${accordion === review._id ? "" : "rotate-180"}`} />
                      </button>
                    </div>
                    {accordion === review._id &&
                      <div className="wrap-anywhere pt-6 transition-all">{review.text}</div>
                    }
                  </div>
                ))}
              </>
            )}



          </div>
          {/* top 7 dishes by solds */}
          <div className="rounded-lg grow-1 border-borderColor border-[1px]  px-[25px] py-[50px] flex flex-col  gap-6">
            <div className="flex flex-col gap-1">
              <h2 className='text-xl leading-7 font-semibold '>Top-Selling Dishes</h2>
              <p className='text-sm leading-5 text-gray'>Your most popular items by sales count </p>
            </div>
            <div className="flex flex-col gap-4">
              {
                topDishes?.map((dish, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 relative overflow-hidden rounded-full">
                        <img className='absolute w-full object-fill inset-0 h-full' src={dish.imageUrl} alt="dish image" />
                      </div>
                      <span>{dish.title}</span>
                    </div>
                    <span className='px-2 py-1  text-primary text-xs leading-5 font-semibold rounded-4xl bg-[#F7F7F7FF]'>{dish.sold} Sold</span>
                  </div>

                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page