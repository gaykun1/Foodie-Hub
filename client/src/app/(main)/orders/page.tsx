"use client"
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { useEffect, useState } from 'react'

const Page = () => {
  const [orders, setOrders] = useState<Order[] | null>();
  useEffect(() => {
    const getOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5200/api/order/get-orders", { withCredentials: true });
        if (res) setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    getOrders();
  }, [])

  return (
    <div className='pt-8'>
      <h1 className='text-[36px] font-extrabold leading-10 mb-9'>Your Orders</h1>
      {orders ?(
       <div className="flex justify-between">
        <div className="basis-[874px]  ">
          {/* current orders */}
          <div className="">
            <h2 className="text-2xl leading-8 font-bold ">Current Orders ( {orders.filter(order=>order)} )</h2>
            { }
          </div>

          {/* past orders */}
            <div className="">
            <h2 className="text-2xl leading-8 font-bold ">Past Orders ( {orders.filter(order=>order)} )</h2>
            { }
          </div>
        </div>
        <div className="grow-1 shadow-xs border-[1px] border-borderColor rounded-lg"></div>
      </div>


      ):(<span className='text-2xl leading-8 font-bold'>No orders yet!</span>)}
      
    </div>
  )
}

export default Page