"use client"
import { useParams, useRouter } from "next/navigation";
import { Order, Shipping } from "@/redux/reduxTypes";
import { useCallback, useEffect, useState } from "react";
import { ordersApi } from "@/api";
import getStripe from "@/utils/stripe";
import { convertToSubcurrency } from "@/utils/payment";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/order/CheckoutForm";



const Page = () => {
    const [shipping, setShipping] = useState<Shipping>(Shipping.Economy);
    const { id } = useParams() as { id: string };
    const [order, setOrder] = useState<Order>();
    const router = useRouter();
    const getOrder = useCallback(async () => {
        try {
            const data = await ordersApi.getOrder(id);
            if (data) setOrder(data);
        } catch (err) {
            console.error(err);
            router.push("/orders");
        }
        // `router` belongs in the dependency list: it is read inside the
        // callback, and omitting it was the reported exhaustive-deps warning.
        // Next's router identity is stable, so including it does not re-run
        // the effect below on every render.
    }, [id, router])
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