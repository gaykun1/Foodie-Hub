import ApplicationForm from '@/components/job/ApplicationForm'
import JobBanner from '@/components/job/JobBanner'
import { ArrowRight, BadgeDollarSign, Bike, Calendar, CalendarSync, Check, CircleOff, Dot } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const page = () => {
    return (
        <>
            <JobBanner />
            <section className="p-4  border-[2px] rounded-lg text-primary shadow-xs my-6">
                <h2 className='section-title mb-4'>Advantages</h2>
                <div className="flex flex-col gap-3 ml-2">
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><BadgeDollarSign /> tips + bonuses</span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><Bike /> work in your own transport or ours</span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><CircleOff /> no experience required</span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><CalendarSync /> flexible schedule</span>
                </div>
            </section>
            <section className="p-4  border-[2px] rounded-lg text-primary shadow-xs my-6">
                <h2 className='section-title mb-4'>Requirements</h2>
                <div className="flex flex-col gap-3 ml-2">
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'> age 18+ <Check /></span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'> smartphone <Check /></span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'>attentiveness and politeness
                        <Check /></span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'> — preferably — bicycle/motorcycle/car (if necessary) <Check /></span>
                </div>
            </section>
            <section className="p-4  border-[2px] rounded-lg text-primary shadow-xs my-6">
                <h2 className='section-title mb-4'>How it works (steps)</h2>
                <div className="flex flex-col gap-3 ml-2">
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><Dot /> You fill out an application</span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><Dot /> We call and conduct a short interview</span>
                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><Dot /> We sign a contract</span>

                    <span className='text-lg leading-6 font-bold    flex items-center gap-2 uppercase'><Dot /> You go out for delivery</span>
                </div>
            </section>
            <section className='p-4  border-[2px] rounded-lg text-primary shadow-xs my-6'>
                <h2 className='section-title mb-4'>Application Form</h2>

                <ApplicationForm />
            </section>
        </>


    )
}

export default page