"use client"
import MapTracker from '@/components/order/MapTracker';
import OrderCard from '@/components/order/OrderCard';
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { ArrowLeft, ChevronDown, Map, } from 'lucide-react';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';

const Page = () => {
  const [orders, setOrders] = useState<Order[] | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewDetails, setViewDetails] = useState<Order | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const [activeSidebar, setActiveSidebar] = useState<boolean>(false);
  // creating a socket connection
  useEffect(() => {


    const sock = io("http://localhost:5200");
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
        console.log("locationUpdate:", lat, lng);
      };
      socket.on("locationUpdate", handleLocationUpdate);
      socket.on("updateOrderStatus", ({ status, id }) => {
        const order = orders?.find(order => order._id === id);
        if (order) {
          setOrders((prev) => prev?.map(order => order._id === id ? { ...order, status } : order));
          console.log(status);
        }
      });

      return () => {
        socket.off("locationUpdate", handleLocationUpdate);
        socket.off("updateOrderStatus");
      };
    }

  }, [socket, orders])



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
      <div className={`flex sm:items-center gap-4  sm:justify-between sm:mb-9 flex-col ${activeSidebar ? "mb-6" : ""} sm:flex-row`}>
        <h1 className='text-[36px] font-extrabold leading-10 '>Your Orders</h1>
        <div className="lg:hidden">
          <button onClick={() => setActiveSidebar(!activeSidebar)} className={`text-2xl  leading-8 font-bold flex gap-1 transition-all items-center  ${activeSidebar ? "text-primary" : ""} `}>Current Order Info <div className={`transition-all ${activeSidebar ? "rotate-180" : ""}`}><ChevronDown /></div></button>
        </div>
      </div>
      {orders && orders.length > 0 ? (
        <div className='flex flex-col gap-6 border-b-[2px] border-borderColor'>
          <div className="lg:hidden border-b-[2px] border-borderColor pb-3">

            <div className={` grow-1  flex-col gap-8  ${activeSidebar ? "h-auto flex" : "h-0 hidden"}`}>
              {(viewDetails?.status !== "Delivered" && viewDetails?.courierId !== null) && (
                <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                  <div className="flex flex-col mb-8 gap-1.5">
                    <div className="flex items-center gap-2">
                      <Map className='text-primary' size={20} />
                      <h2 className='text-xl leading-7 font-bold '>Live Tracking</h2>
                    </div>

                    <p className='text-sm leading-5 text-gray'>Your order is on its way to {viewDetails?.adress.houseNumber} {viewDetails?.adress.street}</p>
                  </div>
                  <div className="overflow-hidden h-[250px] w-[420px]  rounded-lg">
                    <MapTracker  courierLocation={courierLocation} socket={socket} isWorking={viewDetails} />

                  </div>
                </div>
              )}

              <ViewDetailsSideBar viewDetails={viewDetails} />

            </div>
          </div>
          <div className="flex relative gap-8">
            <div className="lg:basis-[874px] w-full  pt-1">
              {/* current orders */}
              <div className="">
                <h2 className="text-2xl leading-8 font-bold mb-4.5 ">Current Orders ( {currentOrders?.length} )</h2>
                <div className="gap-4 grid  lg:grid-cols-2">
                  { currentOrders && currentOrders.length > 0 ?  currentOrders?.map((order, idx) => (
                    <div className="" key={idx}>
                      <OrderCard setViewDetails={setViewDetails} order={order} />

                    </div>
                  ))  :<span className='text-lg leading-7 font-semibold'>No current orders yet!</span>}
                
                </div>
              </div>

              {/* past orders */}
              <div className="mt-9">
                <h2 className="text-2xl leading-8 font-bold mb-4.5">Past Orders (  {pastOrders?.length} )</h2>
                <div className="gap-4 grid  lg:grid-cols-2">
                          { pastOrders && pastOrders.length > 0 ?  pastOrders?.map((order, idx) => (
                    <div className="" key={idx}>
                      <OrderCard setViewDetails={setViewDetails} order={order} />

                    </div>
                  ))  : <span className='text-lg leading-7 font-semibold'>No past orders yet!</span>}
                </div>
              </div>
            </div>

            <div className=" grow-1 lg:flex flex-col gap-8 hidden">
              {(viewDetails?.status !== "Delivered" && viewDetails?.courierId !== null) && (
                <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                  <div className="flex flex-col mb-8 gap-1.5">
                    <div className="flex items-center gap-2">
                      <Map className='text-primary' size={20} />
                      <h2 className='text-xl leading-7 font-bold '>Live Tracking</h2>
                    </div>

                    <p className='text-sm leading-5 text-gray'>Your order is on its way to {viewDetails?.adress.houseNumber} {viewDetails?.adress.street}</p>
                  </div>
                  <div className="overflow-hidden  rounded-lg max-h-[250px] max-w-[420px]">
                    <MapTracker  courierLocation={courierLocation} socket={socket} isWorking={viewDetails} />

                  </div>
                </div>
              )}

              <ViewDetailsSideBar viewDetails={viewDetails} />

            </div>

          </div>
        </div>

      ) : (<span className='text-2xl leading-8 font-bold'>No orders yet!</span>)}

    </div>
  )
}

export default Page