"use client"
import axios, { isAxiosError } from 'axios'
import {  useState } from 'react'

const Page = () => {
    const [promocode, setPromocode] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    // func for using promocode and checking if it`s used
    const checkPromo = async () => {
        // validating input 
        if (!promocode.trim()) {
            setError("Please enter a promocode");
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/promocode/promocodes/${promocode}`, {}, { withCredentials: true });
            if (res.data) {
                setError("Used");
                setPromocode("");
            }
        } catch (err) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data);
            }
        } finally {
            setLoading(false);
        }
    }

    return (<div className="flex items-center justify-center pt-30  flex-col">
        <div className='flex flex-col gap-6 items-center py-4 px-8 border-borderColor rounded-lg  border-[1px] max-w-[500px] h-[300px] justify-center '>
            <h1 className='section-title '>Enter your Promocode</h1>
            <div className='flex gap-3 items-center' >
                <input value={promocode} onChange={(e) => setPromocode(e.target.value)} type="text" className=' py-2 px-1 input ' />
                <button onClick={checkPromo} className={`btn py-2 px-1 ${loading ? "bg-gray" : ""} `}>Use</button>
            </div>
            {error != null && (<span className={error === "Used" ? "text-green-500" : "text-red-500"}>{error}</span>)}
        </div>
    </div>
    )
}

export default Page