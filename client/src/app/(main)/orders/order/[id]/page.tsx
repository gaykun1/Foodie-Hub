"use client"
import { useParams, useRouter } from "next/navigation";
import { Order } from "@/redux/reduxTypes";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import getStripe from "@/utils/stripe";
import { convertToSubcurrency } from "@/utils/payment";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/order/CheckoutForm";

// shipping prices
export enum Shipping {
    Economy = 2.20,
    Standart = 3.20,
    Express = 5.20,
}

const Page = () => {
    const [shipping, setShipping] = useState<Shipping>(Shipping.Economy);
    const { id } = useParams() as { id: string };
    const [order, setOrder] = useState<Order>();
    const router = useRouter();
    const getOrder = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/order/orders/${id}`, { withCredentials: true });
            if (res.data) {
                setOrder(res.data);

            }
        } catch (err) {
            router.push("/orders");
            console.error(err);
        }
    }
        , [id])
    useEffect(() => {
        getOrder();

    }, [getOrder])



    return (
        <>

            {order && (
                // container for Stripe payment 
                <Elements options={{
                    mode: "payment",
                    currency: "usd",
                    amount: convertToSubcurrency(shipping + order.totalPrice)
                }} stripe={getStripe()}>
                    
                    <CheckoutForm shipping={shipping} setShipping={setShipping} order={order} />
                </Elements>)}

        </>
    )
}

export default Page