"use client"
import getStripe from "@/utils/stripe";
import PaymentCard from "@/components/order/PaymentCard";
import { useAppSelector } from "@/hooks/reduxHooks"
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { Lock, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { convertToSubcurrency } from "@/utils/payment";
import { useForm } from "react-hook-form";
import { getEventListeners } from "events";
import { Order } from "@/redux/reduxTypes";

enum Shipping {
    Economy = 2.20,
    Standart = 3.20,
    Express = 5.20,
}

type FormFields = {
    name: string,
    surname: string,
    city: string,
    countryOrRegion: string,
    street: string,
    houseNumber: number,
    apartmentNumbr: number,
}
const CheckoutForm = ({ order }: { order: Order }) => {
    const { register, trigger, getValues, formState: { errors } } = useForm<FormFields>()
    const { user } = useAppSelector(state => state.auth);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const stripe = useStripe();
    const elements = useElements();
    const [shipping, setShipping] = useState<Shipping>(Shipping.Economy);
    const { cart } = useAppSelector(state => state.cart)

    useEffect(() => {
        const getClientSecret = async () => {
            try {

                if (order) {

                    const res = await axios.post("http://localhost:5200/api/payment/payment-intent", { amount: convertToSubcurrency((shipping + order.totalPrice)) });
                    setClientSecret(res.data.clientSecret);
                }
            } catch (err) {
                console.error(err);
            }
        }
        getClientSecret();
        console.log(cart);

    }, [])

    const placeOrder = async () => {
        setLoading(true);

        const formData = getValues();
        console.log(formData, "yes");
        if (!stripe || !elements) return;
        const { error: submitError } = await elements.submit();
        if (submitError && submitError.message) {
            setError(submitError.message);
            setLoading(false);
        }
        if (order) {
            const res = await axios.patch("http://localhost:5200/api/order/update-order", { formData, shipping,cartId:cart?._id }, { withCredentials: true });
            const { error } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `http://localhost:3000/orders/order/sucess/${shipping + order.totalPrice}`,
                }
            })
            setLoading(false);
            if (error.message && error) {
                setError(error.message);
            } 


        }


    }
    return (
        <section className='flex gap-8 mt-10 items-start mb-12'>
            <div className="basis-[886px] grow-0 flex flex-col gap-8">
                <div className="shadow-xs border-borderColor border-[1px] rounded-xl py-7 px-6 flex flex-col gap-3">
                    <h2 className="text-2xl leading-8 font-bold text-secondary">Your Details</h2>
                    <p className="text-gray text-base! leading-7 ">{user?.email ? user.email : user?.username}</p>
                </div>
                <div className="shadow-xs border-borderColor border-[1px] rounded-xl py-7 px-6 text-sm leading-[22px] text-secondary  flex flex-col ">
                    <div className="">
                        <h2 className="text-2xl leading-8 font-bold ">Delivery Information</h2>
                        <div className="grid grid-cols-2  gap-4">
                            <div className="flex flex-col w-[50%] col-span-2 gap-1">
                                <label className="text-gray text-base! leading-7 ">Country/Region</label>
                                <select {...register("countryOrRegion", { required: true })} className="input py-2 px-3 ">
                                    <option value="Ukraine">Ukraine</option>
                                    <option value="Poland">Poland</option>
                                    <option value="Germany">Germany</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">Name</label>

                                <input type="text" {...register("name", {
                                    required: "Required!", pattern: {
                                        value: /^[A-Za-z]+$/,
                                        message: "Only letters"
                                    }
                                })} className="input py-2 px-3 " />
                                <div className="text-red-500">{errors.name?.message}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">Surname</label>

                                <input type="text" {...register("surname", {
                                    required: "Required!", pattern: {
                                        value: /^[A-Za-z]+$/,
                                        message: "Only letters"
                                    }
                                })} className="input py-2 px-3 " />
                                <div className="text-red-500">{errors.name?.message}</div>

                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">City </label>

                                <input type="text" {...register("city", {
                                    required: "Required!", pattern: {
                                        value: /^[A-Za-z]+$/,
                                        message: "Only letters"
                                    }
                                })} className="input py-2 px-3 " />
                                <div className="text-red-500">{errors.name?.message}</div>

                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">Street</label>

                                <input type="text" {...register("street", {
                                    required: "Required!", pattern: {
                                        value: /^[A-Za-z]+$/,
                                        message: "Only letters"
                                    }
                                })} className="input py-2 px-3 " />
                                <div className="text-red-500">{errors.name?.message}</div>

                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">House number</label>

                                <input {...register("houseNumber", { required: "Required!" })} className="input py-2 px-3 " />
                                <div className="text-red-500">{errors.name?.message}</div>

                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-gray text-base! leading-7 ">
                                    Apartment number (optionally)</label>

                                <input {...register("apartmentNumbr", { required: true, })} className="input py-2 px-3 " />

                            </div>
                        </div>
                    </div>
                </div>

                <div className="shadow-xs border-borderColor border-[1px] rounded-xl py-7 px-6 flex flex-col ">
                    <div className="">
                        <h2 className="text-2xl leading-8 font-bold text-secondary mb-3">Shipping Method</h2>
                        <div className="flex flex-col gap-6 w-full">
                            <div className="py-[15px] px-[17px] border-[1px] border-borderColor rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input checked={shipping === Shipping.Economy} onChange={() => setShipping(Shipping.Economy)} type="radio" className="accent-primary cursor-pointer" />
                                    <div className="leading-[14px] flex flex-col gap-1 text-sm font-medium">
                                        <span className="text-secondary">Economy Shipping</span>
                                        <span className="text-gray">~50+ minutes</span>
                                    </div>
                                </div>

                                <span className="text-sm leading-[14px] text-secondary font-semibold">${Shipping.Economy}</span>
                            </div>
                            <div className="py-[15px] px-[17px] border-[1px] border-borderColor rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input checked={shipping === Shipping.Standart} onChange={() => setShipping(Shipping.Standart)} type="radio" className="accent-primary cursor-pointer" />
                                    <div className="leading-[14px] flex flex-col gap-1 text-sm font-medium">
                                        <span className="text-secondary">Standart Shipping</span>
                                        <span className="text-gray">~30-50 minutes</span>
                                    </div>
                                </div>

                                <span className="text-sm leading-[14px] text-secondary font-semibold">${Shipping.Standart}</span>
                            </div>
                            <div className="py-[15px] px-[17px] border-[1px] border-borderColor rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input checked={shipping === Shipping.Express} onChange={() => setShipping(Shipping.Express)} type="radio" className="accent-primary cursor-pointer" />
                                    <div className="leading-[14px] flex flex-col gap-1 text-sm font-medium">
                                        <span className="text-secondary">Express Shipping</span>
                                        <span className="text-gray">~15-30 minutes</span>
                                    </div>
                                </div>

                                <span className="text-sm leading-[14px] text-secondary font-semibold">${Shipping.Express}</span>
                            </div>

                        </div>
                    </div>
                </div>
                {order && (<PaymentCard clientSecret={clientSecret} />)}

            </div>




            <div className=" shadow-xs  border-borderColor border-[1px] rounded-xl  py-[52px] pr-[42px] pl-[57px]">
                <h2 className="text-2xl leading-8 font-bold text-secondary mb-[21px]">Order Summary</h2>
                <div className="flex flex-col gap-8 pb-6 border-b-[1px] mb-6 border-borderColor">
                    {order?.items.map((item, idx) => {
                        return (
                            <div key={idx} className="flex items-center w-full justify-between  h-16">
                                <div className="flex gap-4 items-center ">
                                    <img className="size-16 object-cover rounded-lg border-[1px] border-borderColor" src={item.imageUrl} alt="" />
                                    <div className="">
                                        <h3 className="font-medium text-secondary">{item.title}</h3>
                                        <p className="text-sm leading-5  text-gray">Quantity: {item.amount}</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-secondary">${item.price}</p>
                            </div>
                        )
                    })}

                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm leading-5 ">
                        <span className="text-gray">Subtotal</span>
                        <span className="text-black">${order?.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm leading-5 ">
                        <span className="text-gray">Shipping</span>
                        <span className="text-black">${shipping.toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-[18px] mb-[30px] text-lg leading-7 font-bold flex items-center justify-between">
                    <span>Total</span>
                    <span>${(shipping + order.totalPrice).toFixed(2)}</span>
                </div>
                 <div className="flex items-center gap-2 relative overflow-hidden pr-14">
                    <label>Promocode: </label>
                    <input className="input px-2 py-1 uppercase" type="text" />
                    <button className="btn absolute right-0 px-2 py-1"><Send/></button>
                </div>
                <div className="w-full items-center flex flex-col gap-4">
                    <button onClick={placeOrder} type="submit" className="btn py-3   mt-6      px-2 max-w-[328px] w-full">{loading ? (<span>Processing...</span>) : (<span>Place Order</span>)}</button>

                    <p className="text-xs  leading-4 text-gray flex items-center justify-center gap-1" ><Lock size={12} /> All transactions are secure and encrypted.</p>
                    {error != null && (<span>{error}</span>)}
                </div>
            </div>
        </section>
    )
}

export default CheckoutForm