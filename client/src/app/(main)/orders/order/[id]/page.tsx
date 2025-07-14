"use client"
import { redirect, useParams } from "next/navigation";
import { Order } from "@/redux/reduxTypes";
import { useEffect, useState } from "react";
import axios from "axios";
import getStripe from "@/utils/stripe";
import { convertToSubcurrency } from "@/utils/payment";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/order/CheckoutForm";

enum Shipping {
    Economy = 2.20,
    Standart = 3.20,
    Express = 5.20,
}

const Page = () => {
    const [shipping, setShipping] = useState<Shipping>(Shipping.Economy);
    const { id } = useParams() as { id: string };
    const [order, setOrder] = useState<Order>();

    const getOrder = async () => {
        try {
            const res = await axios.get(`http://localhost:5200/api/order/get-order/${id}`, { withCredentials: true });
            if (res.data) {
                setOrder(res.data);

            } 
        } catch (err) {
            redirect("/orders");

            console.error(err);
        }
    }

    useEffect(() => {
        getOrder();

    }, [])



    return (
        <>

            {order && (
                <Elements options={{
                    mode: "payment",
                    currency: "usd",
                    amount: convertToSubcurrency(shipping + order.totalPrice)
                }} stripe={getStripe()}>

                    <CheckoutForm order={order} />
                </Elements>)}

        </>
    )
}

export default Page