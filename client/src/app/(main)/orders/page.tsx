"use client"
import MapTracker from '@/components/order/MapTracker';
import OrderCard from '@/components/order/OrderCard';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { Map, } from 'lucide-react';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';

const Page = () => {
  const [orders, setOrders] = useState<Order[] | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewDetails, setViewDetails] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);

  // creating a socket connection
  useEffect(() => {

    const sock = io("http://localhost:5200");
    setSocket(sock);


    return () => { sock.disconnect(); }


  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleLocationUpdate = ({ lat, lng }: { lat: number; lng: number }) => {
      setCourierLocation([lat, lng]);
      console.log("locationUpdate:", lat, lng);
    };

    socket.on("locationUpdate", handleLocationUpdate);

    return () => {
      socket.off("locationUpdate", handleLocationUpdate);
    };


  }, [socket])

  useEffect(() => {
    const getOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5200/api/order/get-orders", { withCredentials: true });
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
    if (orders) {

      const item = orders?.find(order => order.status === "Preparing") || orders[0];
      setViewDetails(item);

    }

  }, [orders])
  const currentOrders = orders?.filter(order => order.status !== "Delivered");
  const pastOrders = orders?.filter(order => order.status == "Delivered");

  return (
    <div className='py-8 '>
      <h1 className='text-[36px] font-extrabold leading-10 mb-9'>Your Orders</h1>
      {orders && orders.length > 0 ? (
        <div className="flex gap-8">
          <div className="basis-[874px]  pt-1">
            {/* current orders */}
            <div className="">
              <h2 className="text-2xl leading-8 font-bold mb-4.5 ">Current Orders ( {currentOrders?.length} )</h2>
              <div className="gap-4 grid grid-cols-2">
                {currentOrders?.map((order, idx) => (
                  <div className="" key={idx}>
                    <OrderCard setViewDetails={setViewDetails} order={order} />

                  </div>
                ))}
              </div>
            </div>

            {/* past orders */}
            <div className="mt-9">
              <h2 className="text-2xl leading-8 font-bold mb-4.5">Past Orders (  {pastOrders?.length} )</h2>
              <div className="gap-4 grid grid-cols-2">
                {pastOrders?.map((order, idx) => (
                  <div className="" key={idx}>
                    <OrderCard setViewDetails={setViewDetails} order={order} />

                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className=" grow-1 flex flex-col gap-8">
            {(viewDetails?.status !== "Delivered" && viewDetails?.courierId !== null) && (
              <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                <div className="flex flex-col mb-8 gap-1.5">
                  <div className="flex items-center gap-2">
                    <Map className='text-primary' size={20} />
                    <h2 className='text-xl leading-7 font-bold'>Live Tracking</h2>
                  </div>

                  <p className='text-sm leading-5 text-gray'>Your order is on its way to {viewDetails?.adress.houseNumber} {viewDetails?.adress.street}</p>
                </div>
                <div className="overflow-hidden  rounded-lg">
                  <MapTracker Width='420px' Height='250px' courierLocation={courierLocation} socket={socket} isWorking={viewDetails} />

                </div>
              </div>
            )}

            <ViewDetailsSideBar viewDetails={viewDetails} />

          </div>
        </div>


      ) : (<span className='text-2xl leading-8 font-bold'>No orders yet!</span>)}

    </div>
  )
}

export default Page