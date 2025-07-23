"use client"
import CourierOrderCard from '@/components/CourierOrderCard';
import OrderCard from '@/components/order/OrderCard';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { Bike, ChevronDown, PackageCheck, } from 'lucide-react';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
const MapTracker = dynamic(() => import('@/components/order/MapTracker'), {
    ssr: false,
})
import ViewDetailsSideBar from '@/components/ViewDetailsSideBar';
import dynamic from 'next/dynamic';

const Page = () => {
    const [freeOrders, setFreeOrders] = useState<Order[] | null>(null);
    const [courierOrders, setCourierOrders] = useState<Order[] | null>(null);
    const [isWorking, setIsWorking] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewDetails, setViewDetails] = useState<Order | null>(null);
    const { courier } = useAppSelector(state => state.courier);
    const [status, setStatus] = useState<string>("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
    const [activeSidebar, setActiveSidebar] = useState<boolean>(false);

    // creating a socket connection
    useEffect(() => {

        const sock = io("http://localhost:5200");
        setSocket(sock);


        return () => { sock.disconnect(); }


    }, []);
    // requests for getting orders (free,past-delivered)
    const getFreeOrders = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/order/free-orders/${courier.city}`, { withCredentials: true });
                setFreeOrders(res.data);
            }
        } catch (err) {
            console.log(err);
        }
    }
    const getYourOrders = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/order/couriers/${courier._id}/orders`, { withCredentials: true });
                if (res.data) {
                    setCourierOrders(res.data);
                }
            }

        } catch (err) {
            console.log(err);
        }
    }

    // request for checking courier`s status (whether he`s taking an order)
    const checkIfHasOrder = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/courier/orders/${courier._id}/status`);
                setIsWorking(res.data);
                setViewDetails(res.data);
                return res.data;
            }
        } catch (err) {
            console.error(err);
        }
    }

    //changing status of the order
    const toggleOrderStatus = async (status: string, id: string) => {
        try {
            const res = await axios.patch(`http://localhost:5200/api/courier/orders/${id}/status`, { status: status }, { withCredentials: true });
            if (res) {

                setStatus(res.data);
            }


        } catch (err) {
            console.error(err);
        }
    }


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [viewDetails]);

    // loading content on the page - [courier]
    useEffect(() => {
        const load = async () => {
            setLoading(true);

            const order = await checkIfHasOrder();
            if (!order) {
                await getFreeOrders();
            } else {
                setStatus(order.status);
            }

            await getYourOrders();

            setLoading(false);
        };

        load();


    }, [courier]);

    // socket using for dynamic tracking courier every 5sec(interval)
    useEffect(() => {

        if (!socket && !isWorking) return;


        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCourierLocation([latitude, longitude]);
                    socket?.emit("updateLocation", { orderId: isWorking?._id, lat: latitude, lng: longitude });

                },
                (err) => console.error(err),
                { enableHighAccuracy: true },
            )
        }, 5000);
        return () => clearInterval(interval);


    }, [socket, isWorking])

    return (
        <div className='flex flex-col gap-6 py-8'>
            <div className="lg:hidden">
                <button onClick={() => setActiveSidebar(!activeSidebar)} className={`text-2xl  leading-8 font-bold flex gap-1 transition-all items-center  ${activeSidebar ? "text-primary" : ""} `}>Current Order Info <div className={`transition-all ${activeSidebar ? "rotate-180" : ""}`}><ChevronDown /></div></button>
            </div>
            <div className="lg:hidden ">

                <div className={` grow-1  flex-col gap-8  ${activeSidebar ? "h-auto flex" : "h-0 hidden"}`}>
                    <ViewDetailsSideBar viewDetails={viewDetails} />

                </div>
            </div>
            <div className="flex gap-8 w-full ">
                <div className="lg:basis-[874px] w-full pt-1">
                    {!loading ? !isWorking ? (<>
                        <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">

                            <h2 className="text-2xl leading-8 font-bold mb-4.5 ">Free orders ( {freeOrders?.length} )</h2>

                            <div className="gap-4 grid lg:grid-cols-2">
                                {freeOrders && freeOrders.length > 0 ? freeOrders?.map((order, idx) => (
                                    <div className="" key={idx}>
                                        <CourierOrderCard checkIfHasOrder={checkIfHasOrder} setViewDetails={setViewDetails} order={order} />

                                    </div>
                                )) : <span className='text-lg leading-7 font-semibold'>No free orders yet!</span>}
                            </div>






                        </div>


                        <div className="mt-9 shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                            <h2 className="text-2xl leading-8 font-bold mb-4.5">Past Orders (  {courierOrders?.length || 0} )</h2>
                            <div className="gap-4 grid lg:grid-cols-2">
                                {courierOrders && courierOrders.length > 0 ? courierOrders?.filter(item => item.status == "Delivered").map((order, idx) => (
                                    <div className="" key={idx}>
                                        <OrderCard setViewDetails={setViewDetails} order={order} />

                                    </div>
                                )) : (<span className='text-lg leading-7 font-semibold'>No taken orders yet!</span>)}

                            </div>
                        </div>


                    </>) : (<div className='flex flex-col gap-6 items-center sm:items-start  mb-4.5'>
                        <div className="flex items-center gap-4 flex-wrap">
                            <h2 className="text-2xl leading-8 font-bold  ">Taking Order ID: "{isWorking._id}" </h2>
                            <div className={`border-[1px] py-2 px-4 ${status === "Delivering" ? "text-primary border-primary bg-[#636AE833]" : status == "Delivered" ? "text-[#37db70] border-[#37db70] bg-[#DCFCE7FF]" : "text-primary border-primary bg-[#4d55ed33]"}  rounded-4xl  text-xs leading-5 font-medium `}>{status ? status : isWorking.status}</div>

                        </div>
                        <div className="shadow-xs border-[1px]   border-borderColor rounded-lg sm:p-[25px] p-2 flex flex-col gap-4 items-center w-fit sm:w-full ">
                            <h2 className="section-title">
                                Change order status
                            </h2>
                            <div className="">
                                <div className="sm:h-80 sm:w-100 h-80  w-80">
                                    <MapTracker isWorking={isWorking} socket={socket} courierLocation={courierLocation} />
                                </div>
                            </div>
                            <div className="flex items-center gap-7">
                                <button disabled={status === "Delivered" || status === "Delivering"} onClick={async () => await toggleOrderStatus("Delivering", isWorking._id)} className="btn flex items-center p-3 gap-3 text-lg!"><Bike />Delivering</button>
                                <button disabled={status === "Delivered"} onClick={async () => { await toggleOrderStatus("Delivered", isWorking._id); setIsWorking(null) }} className="btn flex items-center p-3 gap-3 text-lg!"><PackageCheck />Delivered</button>
                            </div>
                        </div>
                    </div>
                    ) : (<div className="animate-spin rounded-full h-12 w-12 border-t-4  border-blue-500 border-solid "></div> )}


                </div>
                <div className="hidden grow-1  lg:block">

                    <ViewDetailsSideBar viewDetails={viewDetails} />
                </div>
            </div>


        </div>
    )
}

export default Page