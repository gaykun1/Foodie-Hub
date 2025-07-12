"use client"
import CourierOrderCard from '@/components/CourierOrderCard';
import OrderCard from '@/components/order/OrderCard';
import { useAppSelector } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import { Order } from '@/redux/reduxTypes'
import axios from 'axios';
import { Bike, Calendar, DollarSign, MapPin, PackageCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client';
import "leaflet/dist/leaflet.css";
import { MapContainer } from 'react-leaflet';
const Page = () => {
    const [freeOrders, setFreeOrders] = useState<Order[] | null>(null);
    const [courierOrders, setCourierOrders] = useState<Order[] | null>(null);
    const [isWorking, setIsWorking] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>();
    const [viewDetails, setViewDetails] = useState<Order | null>(null);
    const { courier } = useAppSelector(state => state.courier);
    const [location, setLocation] = useState<[number, number]>([49.8397, 24.0297])
    const socket = io("http://localhost:5200");
    const getFreeOrders = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/order/free-orders/${courier.city}`);
                setFreeOrders(res.data);
            }
        } catch (err) {
            console.log(err);
        }
    }
    const getYourOrders = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/order/get-orders-courier`, { withCredentials: true });
                if (res.data) {

                    setCourierOrders(res.data);
                }
            }

        } catch (err) {
            console.log(err);
        }
    }

    const checkIfHasOrder = async () => {
        try {
            if (courier) {

                const res = await axios.get(`http://localhost:5200/api/courier/check-if-has-order/${courier._id}`,);
                setIsWorking(res.data);
                setViewDetails(res.data);

            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        setLoading(true);
        checkIfHasOrder();
        if (!isWorking) {
            getFreeOrders();
        }
        getYourOrders();

        setLoading(false);
    }, [courier]);

    useEffect(() => {
        socket.emit("joinOrder", isWorking?._id);
        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setLocation([latitude, longitude]);
                    socket.emit("updateLocation", isWorking?._id, { latitude, longitude });

                },
                (err) => console.error(err),
                { enableHighAccuracy: true },
            )
        }, 5000);
        return () => clearInterval(interval);
        //що це взагалі
    }, [isWorking])

    return (
        <div className='flex flex-col gap-6 py-8'>

            <div className="flex gap-8">
                <div className="basis-[874px]  pt-1">
                    {!isWorking ? <>
                        <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">

                            <h2 className="text-2xl leading-8 font-bold mb-4.5 ">Free orders ( {freeOrders?.length} )</h2>

                            <div className="gap-4 grid grid-cols-2">
                                {freeOrders?.map((order, idx) => (
                                    <div className="" key={idx}>
                                        <CourierOrderCard setViewDetails={setViewDetails} order={order} />


                                    </div>
                                ))}
                            </div>






                        </div>


                        <div className="mt-9 shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                            <h2 className="text-2xl leading-8 font-bold mb-4.5">Past Orders (  {courierOrders?.length || 0} )</h2>
                            <div className="gap-4 grid grid-cols-2">
                                {courierOrders && courierOrders.length < 0 ? courierOrders?.filter(item => item.status == "Delivered").map((order, idx) => (
                                    <div className="" key={idx}>
                                        <OrderCard setViewDetails={setViewDetails} order={order} />

                                    </div>
                                )) : (<span className='text-lg leading-7 font-semibold'>No taken orders yet!</span>)}

                            </div>
                        </div>


                    </> : (<div className='flex flex-col gap-6'>
                        <h2 className="text-2xl leading-8 font-bold mb-4.5 ">Taking Order ID: "{isWorking._id}" </h2>
                        <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px] flex flex-col gap-4 items-center">
                            <h2 className="section-title">
                                Change order status
                            </h2>
                            <div className="">
                                <MapContainer center={location} ></MapContainer>
                                {/* тут має бути по дефолту місце доставки їди і два маркери у маркерах є властивість position а у тайлі атрибут та  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" */}
                            </div>
                            <div className="flex items-center gap-7">
                                <button className="btn flex items-center p-3 gap-3 text-lg!"><Bike />Delivering</button>
                                <button className="btn flex items-center p-3 gap-3 text-lg!"><PackageCheck />Delivered</button>
                            </div>
                        </div>
                    </div>
                    )}

                </div>


                <div className=" grow-1 ">
                    <div className="shadow-xs border-[1px] border-borderColor rounded-lg"></div>
                    <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">

                        {viewDetails ?
                            (<> <div className="flex flex-col gap-1 pb-4 mb-6 border-b-[1px] border-borderColor ">
                                <h2 className='text-2xl leading-8 font-bold '>Order Details</h2>
                                <p className='tetx-sm leading-5 text-gray'>ID:{viewDetails?._id}</p>
                            </div>
                                <div className="pb-4 mb-6 border-b-[1px] border-borderColor flex flex-col gap-3">
                                    <div className="flex items-start gap-4 text-gray text-base leading-6 font-medium">
                                        <Calendar size={20} />
                                        <div className="flex flex-col">
                                            <span>Date:</span>
                                            <span className='font-semibold text-secondary'>{new Date(viewDetails.createdAt).toDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 text-gray text-base leading-6 font-medium">
                                        <User size={20} />
                                        <div className="flex flex-col">
                                            <span>Customer:</span>
                                            <span className='font-semibold text-secondary'>{viewDetails.fullName}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 text-gray text-base leading-6 font-medium">
                                        <MapPin size={20} />
                                        <div className="flex flex-col">
                                            <span>Delivery To:</span>
                                            <span className='font-semibold text-secondary'>№{viewDetails.adress.apartmentNumbr ? viewDetails.adress.apartmentNumbr : "..."}, {viewDetails.adress.houseNumber} {viewDetails.adress.street}, {viewDetails.adress.city}, {viewDetails.adress.countryOrRegion}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h2 className='text-lg leading-7 font-bold'>Order Items ( {viewDetails.items.length} )</h2>
                                    {viewDetails.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b-[1px] border-borderColor py-2">
                                            <div className="flex items-center gap-4">
                                                <div className=" border-[1px] size-20 relative  border-borderColor rounded-md overflow-hidden">
                                                    <img className="object-cover absolute top-0 left-0 w-full h-full" src={item.imageUrl} alt="dish image" />

                                                </div>
                                                <div className="">
                                                    <h3 className='text-base leading-6 font-semibold'>
                                                        {item.title}
                                                    </h3>
                                                    <span className='text-sm leading-5 text-gray'>Quantity: {item.amount}</span>
                                                </div>
                                            </div>
                                            <div className="font-bold ">${item.price.toFixed(2)}</div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-primary text-xl leading-7 font-bold">
                                        <span>Total:</span>
                                        <span className='flex items-center '><DollarSign size={20} />{viewDetails.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div></>) : <h2 className='text-2xl leading-8 font-bold '>Order Details</h2>}
                    </div>


                </div>
            </div>


        </div>
    )
}

export default Page