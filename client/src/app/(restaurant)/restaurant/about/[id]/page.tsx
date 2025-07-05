"use client"
import DishCard from '@/components/Dashboard/DishCard';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Dish } from '@/redux/reduxTypes';
import axios from 'axios';
import { Check, Pen, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const Page = () => {

    const { id } = useParams() as { id: string }
    const [info, setInfo] = useState<string>();
    const { user } = useAppSelector(state => state.auth);
    const [active, setActive] = useState<boolean>();
    const getTextAbout = async () => {
        try {
            const res = await axios.get(`http://localhost:5200/api/restaurant/about/${id}`,);
            setInfo(res.data);
        } catch (err) {
            console.error(err);
        }

    }
    const handleTextAbout = async () => {
        try {
            const res = await axios.post(`http://localhost:5200/api/restaurant/about`,{id,info});
            setInfo(res.data);
        } catch (err) {
            console.error(err);
        }

    }
    useEffect(() => {

        getTextAbout();

    }, [])
    return (
        <div className='flex flex-col gap-5 mb-12'>
            <div className="flex items-center justify-between">
                <h1 className='section-title'>About</h1>
                {user?.role == "admin" && (
                <div className="flex items-start gap-3 text-lg">
                    <span>Change or Create info</span>
                    
                      
                        {active ?(  <button onClick={() => {
                    setActive(false);

                }} className='p-3 rounded-md btn  '><X size={16} /></button>) : (  <button onClick={() => {
                    setActive(true);

                }} className='p-3 rounded-md btn '><Pen size={16} /></button>)}
                   
                </div>
                 )}
            </div>
            {active &&
                (
                    <div className='relative'>
                        <textarea onChange={(e) => setInfo(e.target.value)} value={info} className='input p-3 resize-none h-[250px] pb-[38px'></textarea>
                        <button onClick={async () => {
                            setActive(false);
                            await handleTextAbout();
                        }} className='btn p-2 absolute bottom-[7px] right-0'>Create</button>
                    </div>
                )}
            {info ? (
                <p className="text-lg leading-5 font-medium mt-6 whitespace-pre-wrap ">{info}</p>

            ) : (
                <span className='text-lg leading-5 font-medium text-center mt-6'>No info yet!</span>
            )}

        </div>
    )
}

export default Page