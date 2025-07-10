import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const page = () => {
  return (<div className="flex items-center justify-center pt-[150px]">
    <div className='flex flex-col gap-6 items-center py-4 px-3 border-borderColor rounded-lg  border-[1px] max-w-[500px] h-[300px] justify-center '>
      <h1 className='section-title '>Thank you for your order!</h1>
      <Link className='btn flex items-center gap-2 text-xl! px-2 py-3 group ' href={"/orders"}>
      <span>Go to your orders</span>
      <ArrowRight className='group-hover:translate-y-[2px] ' />
      </Link>
    </div>
    </div>
  )
}

export default page