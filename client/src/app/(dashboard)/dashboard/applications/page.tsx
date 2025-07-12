"use client"

import axios from "axios";
import { Check, User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ICourier {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    age: number,
    _id: string,
    city: string,
}

const Page = () => {
    const [applications, setApplications] = useState<ICourier[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const getApplications = async () => {
        try {
            const res = await axios.get("http://localhost:5200/api/courier/get-applications");
            if (!res.data) {
                return;
            }
            setApplications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {

        getApplications();
    }, [])


    const toggleApplication = async (status: string, id: string) => {
        try {
            const res = await axios.post("http://localhost:5200/api/courier/toggle-application", { status, id });
            if (res) {

                getApplications();
            }
        } catch (err) {
            console.error(err);
        }
    }
    return (
        <div>
            <h1 className='section-title mb-6'>Job applications</h1>
            <div className="flex pl-4 flex-col gap-6 w-full ">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div> : (!applications || applications.length == 0) ? <span className="text-xl font-bold text-center pt-10 leading-8">No applications</span> : applications?.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b-[1px] border-borderColor py-2">
                        <div className="flex items-center gap-4 mr-4">
                            <div className=" border-[1px] size-14 flex items-center justify-center   border-borderColor rounded-md overflow-hidden">
                                <User size={24} />
                            </div>
                            <div className="border-r-[1px] border-borderColor pr-4 mr-4">
                                <h3 className='text-base leading-6 font-semibold'>
                                    {app.fullname}
                                </h3>
                                <span className='text-sm leading-5 text-gray'>Age: {app.age} City: {app.city}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={async () => await toggleApplication("accepted", app._id)} className="btn p-3"><Check /></button>
                                <button onClick={async () => await toggleApplication("declined", app._id)} className="btn p-3"><X /></button>
                            </div>
                        </div>
                        <div className="flex justify-between flex-col">
                            <span className='text-sm leading-5 text-gray'>Email: {app.email}</span>
                            <span className='text-sm leading-5 text-gray'>Phone number: {app.phoneNumber}</span>
                        </div>
                    </div>
                ))}


            </div>
        </div>
    )
}

export default Page