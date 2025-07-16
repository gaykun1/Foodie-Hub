"use client"
import {
    PaymentElement,
} from "@stripe/react-stripe-js";
import { User } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { convertToSubcurrency } from "@/utils/payment";

export default function PaymentCard({ clientSecret }: { clientSecret: string}) {

    return (
        <>
            {(!clientSecret ) ? (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) : (
                <div className="shadow-xs border-borderColor border-[1px] flex flex-col gap-4 rounded-xl py-7 px-6 ">
                    <div className=" flex flex-col gap-3">
                        <h2 className="text-2xl leading-8 font-bold text-secondary">Your Details</h2>
                        <p className="text-gray text-base! leading-7 "></p>
                    </div>
                    <form className="flex flex-col gap-6" >
                        
                        {clientSecret && <PaymentElement className="" />}
                    </form>
                </div>

            )}

        </>
    );
}
