"use client"

import axios from 'axios'
import { ArrowRight } from 'lucide-react'
import { FormEvent, useState } from 'react'



const Page = () => {
    const [promocode, setPromocode] = useState<string>("");
    const checkPromo = async () => {
       
        try {
            const res = await axios.post("http://localhost:5200/api/promocode/get", { promoC: promocode.toUpperCase() }, { withCredentials: true });

        } catch (err) {
            console.error(err);
        }
    }

    return (<div className="flex items-center justify-center pt-[150px]">
        <div className='flex flex-col gap-6 items-center py-4 px-8 border-borderColor rounded-lg  border-[1px] max-w-[500px] h-[300px] justify-center '>
            <h1 className='section-title '>Enter your Promocode</h1>
            <div className='flex gap-3 items-center' >
                <input onChange={(e) => setPromocode(e.target.value)} type="text" className=' py-2 px-1 input uppercase' />
                <button onClick={checkPromo} className='btn py-2 px-1  '>Use</button>
            </div>
        </div>
    </div>
    )
}

export default Page