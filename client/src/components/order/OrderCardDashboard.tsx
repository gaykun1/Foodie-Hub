"use client"

import { Order } from "@/redux/reduxTypes"
import axios from "axios";
import { Check, ChevronsRight, ClipboardList, Clock, DollarSign } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
const OrderCardDashboard = ({ order, setOrders }: { order: Order, setOrders: Dispatch<SetStateAction<Order[]>> }) => {
    const date = new Date((order.createdAt)).toDateString();

    const toggleToPreparing = async () => {
        try {
            const res = await axios.patch(`http://localhost:5200/api/order/orders/${order._id}/status`, { }, { withCredentials: true });
            setOrders((prev) => prev.filter(item => item._id !== order._id));
        } catch (err) {
            console.error(err);
        }
    }

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

                    <button onClick={async () => await toggleToPreparing()} className="btn p-2 ">Toggle to "Preparing"</button>


                </div>
            </div>

        </div>
    )
}

export default OrderCardDashboard