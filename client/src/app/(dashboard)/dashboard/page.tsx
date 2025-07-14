"use client"

import axios from 'axios'
import { Box, DollarSign, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'

const page = () => {

  const [numOfOrders, setNumOfOrders] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [averageOrderValue, setAverageOrderValue] = useState<number | null>(null);


  useEffect(() => {

    const getNumbers = async () => {
      try {
        const res = await axios.get("http://localhost:5200/api/order/order-values");
        setNumOfOrders(res.data.numOfOrders);
        setTotalRevenue(res.data.totalRevenue);
        setAverageOrderValue(res.data.averageOrderValue);
      } catch (err) {
        console.error(err);
      }
    }

    getNumbers();
  }, [])


  return (
    <div>
      <h1 className='section-title mb-8'>Dashboard Overview</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="p-[50px] rounded-lg border-borderColor border-[1px]">
          <div className="flex items-center justify-between mb-2.5">
            <span className='text-sm leading-5 font-medium text-gray'>Total Orders</span>
            <Box className='text-primary' size={16} />
          </div>
          <div className="flex flex-col">
            <span className='text-2xl leading-8 font-bold'>{numOfOrders}</span>
            <span className='text-xs leading-4  text-gray'>Increased by 15% this week</span>

          </div>
        </div>

         <div className="p-[50px] rounded-lg border-borderColor border-[1px]">
          <div className="flex items-center justify-between mb-2.5">
            <span className='text-sm leading-5 font-medium text-gray'>Total Revenue</span>
            <DollarSign className='text-primary' size={16} />
          </div>
          <div className="flex flex-col">
            <span className='text-2xl leading-8 font-bold'>${totalRevenue}</span>
            <span className='text-xs leading-4  text-gray'>Up 10% from last month</span> 
            {/* Додати щось  */}

          </div>
        </div>

         <div className="p-[50px] rounded-lg border-borderColor border-[1px]">
          <div className="flex items-center justify-between mb-2.5">
            <span className='text-sm leading-5 font-medium text-gray'>Avg. Order Value</span>
            <Utensils className='text-primary' size={16} />
          </div>
          <div className="flex flex-col">
            <span className='text-2xl leading-8 font-bold'>{averageOrderValue}</span>
            <span className='text-xs leading-4  text-gray'>Consistent over time</span>

          </div>
        </div>
      </div>
    </div>
  )
}

export default page