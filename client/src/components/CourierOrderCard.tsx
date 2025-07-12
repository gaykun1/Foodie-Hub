"use client"

import { useAppSelector } from "@/hooks/reduxHooks";
import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { Check, ChevronsRight, ClipboardList, Clock, DollarSign } from "lucide-react";
import Link from "next/link";

const takeOrder = async (id: string, courierId: string) => {
    try {
        const res = await axios.post("http://localhost:5200/api/courier/take-order", { id, courierId }, { withCredentials: true });
    } catch (err) {
        console.error(err);
    }

}

const CourierOrderCard = ({ order, setViewDetails, }: { order: Order, setViewDetails: React.Dispatch<React.SetStateAction<Order | null>>, }) => {
    const { courier } = useAppSelector(state => state.courier);
    const date = new Date((order.createdAt)).toDateString();
    return (
        <div className={`rounded-lg shadow-xs border-[1px]  ${order.status == "Delivering" ? "border-[#636AE8FF]" : "border-borderColor"}`}>
            {/* header */}
            <div className=" border-b-[1px] border-borderColor pb-2 mb-4">
                <div className="px-4 py-5 flex flex-col gap-[2px]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-7 font-semibold ">{order.restaurantTitle}</h3>

                        <span className="text-sm leading-5 text-gray">{date}</span>
                    </div>
                    <span className="text-sm leading-5 text-gray ">Order ID: {order._id}</span>
                </div>
            </div>
            <div className="px-4 pb-5">
                <div className=" flex   gap-4 mb-7.5">
                    <div className=" border-[1px] size-[96px] relative  border-borderColor rounded-md overflow-hidden">
                        <img className="object-cover absolute top-0 left-0 w-full h-full" src={order.restaurantImage} alt="restaurant image" />
                    </div>
                    <div className="flex flex-col justify-between">
                        <span className="leading-6 font-medium flex items-center  gap-2">
                            <ClipboardList size={16} />
                            <span >Items: {order.items.length}</span>
                        </span>
                        <span className="font-bold text-2xl laeding-8 flex text-primary items-center font-archivo"><DollarSign size={24} /><span>{order.totalPrice.toFixed(2)}</span></span>
                        <span className="leading-5 text-sm flex items-center text-gray  gap-2">
                            <Clock size={16} />
                            <span >Aprox.Time: {order.
                                approxTime} min</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className={`border-[1px] py-2 px-4 ${order.status === "Delivering" ? "text-primary border-primary bg-[#636AE833]" : order.status == "Delivered" ? "text-[#37db70] border-[#37db70] bg-[#DCFCE7FF]" : "text-primary border-primary bg-[#4d55ed33]"}  rounded-4xl  text-xs leading-5 font-medium `}>{order.status}</div>
                    {order.status === "Delivering" ? (
                        <div className="flex gap-2">
                            <button className="btn py-1.5 px-2">Track order</button>

                            <button onClick={() => setViewDetails(order)} className="border-[1px] flex items-center gap-1 border-borderColor rounded-md py-1.5  hover:text-white cursor-pointer px-2 hover:bg-gray transition-colors">
                                <span>View Details</span>
                                <ChevronsRight />
                            </button>
                        </div>
                    ) : order.status === "Delivered" ? (<button onClick={() => setViewDetails(order)} className="border-[1px] flex items-center gap-1 border-borderColor rounded-md py-1.5  hover:text-white cursor-pointer px-2 hover:bg-gray transition-colors">
                        <span>View Details</span>
                        <ChevronsRight />
                    </button>) : courier && (
                        <button onClick={async () => await takeOrder(order._id, courier._id)} className="border-[1px] flex items-center gap-1  rounded-md py-1.5 text-[#37db70] bg-[#DCFCE7FF] border-[#37db70] hover:text-[#37db70de] cursor-pointer px-2 hover:bg-[#c6f8d7] transition-colors">
                            <span>Take order</span>
                            <Check />
                        </button>
                    )}
                </div>
            </div>

        </div>
    )
}

export default CourierOrderCard