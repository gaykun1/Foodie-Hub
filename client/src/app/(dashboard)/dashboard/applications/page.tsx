"use client"

import axios from "axios";
import { useEffect, useState } from "react";

interface ICourier {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    age: number,
}

const Page = () => {
    const [applications, setApplications] = useState<ICourier[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
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
        getApplications();
    }, [])

    return (
        <div>
            <h1 className='section-title mb-6'>Job applications</h1>
            <div className="flex pl-4 flex-col gap-6 w-full ">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div> : applications == null ? <span className="text-xl font-bold text-center pt-10 leading-8">No applications</span> : applications.map((app, idx) => (
                    <div key={idx} className="">{app.age}</div>
                ))}


            </div>
        </div>
    )
}

export default Page