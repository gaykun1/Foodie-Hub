import Link from 'next/link'
import React from 'react'

const JobBanner = () => {
  return (
    <section className="mt-12 pt-[83px] pb-[86] pl-16 mb-[50px]   bg-gray-600">
      <div className="flex flex-col gap-[21px] items-center justify-start max-w-[544px] w-full">
        <h1 className="font-extrabold text-[60px] leading-[60px]">
          Join our courier team!</h1>
        <p className="text-xl leading-7 text-gray">Flexible schedule, decent pay, friendly team. Bring happiness to our clients!</p>
      </div>
    </section>
  )
}

export default JobBanner