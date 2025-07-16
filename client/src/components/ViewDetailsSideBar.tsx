"use client"

import { Order } from "@/redux/reduxTypes"
import { Calendar, MapPin, User } from "lucide-react"

const ViewDetailsSideBar = ({ viewDetails }: { viewDetails: Order | null }) => {

    return (
        <>
            <div className="shadow-xs border-[1px] border-borderColor rounded-lg p-[25px]">
                {viewDetails ?
                    (
                        <>
                            <div className="flex flex-col gap-1 pb-4 mb-6 border-b-[1px] border-borderColor ">
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
                                <div className="">
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
                                </div>
                                <div className="flex flex-col gap-2 text-base leading-6 font-medium">
                                   
                                    <div className="flex items-center justify-between  ">
                                        <span className="text-gray">Shipping</span>
                                        <span className="text-black">${viewDetails.shippingPrice}</span>
                                    </div>
                                    <div className="flex items-center justify-between  ">
                                        <span className="text-gray">Discount</span>
                                        <span className={`text-black ${viewDetails.discountPercent > 0 ? "text-green-600" : ""}`}>{viewDetails.discountPercent}%</span>
                                    </div>
                                </div>
                                <div className="mt-[18px] mb-[30px] text-lg leading-7 font-bold flex items-center justify-between">
                                    <span>Total</span>
                                    <span>{viewDetails.totalPrice}</span>
                                </div>
                            </div>
                        </>

                    ) : (
                        <>
                            <div className="flex flex-col gap-1 pb-4 mb-6 border-b-[1px] border-borderColor ">
                                <h2 className='text-2xl leading-8 font-bold '>Order Details</h2>
                            </div></>
                    )
                }
            </div>
        </>
    )


}

export default ViewDetailsSideBar