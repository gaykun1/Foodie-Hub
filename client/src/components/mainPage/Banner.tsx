import Link from 'next/link'
import React from 'react'

const Banner = () => {
  return (
       <section className="mt-12 pt-[83px] pb-[86] pl-16 mb-[50px]   bg-gray-600">
      <div className="flex flex-col gap-[21px] items-center justify-start max-w-[544px] w-full">
        <h1 className="font-extrabold text-[60px] leading-[60px]">Taste the City, Delivered to Your Door!</h1>
        <p className="text-xl leading-7 text-gray">Discover local gems, exclusive deals, and your next favorite meal, all at your fingertips.</p>
        <Link className="btn w-full h-[44px] mt-[9px]" href={"/restaurants/category/all-restaurants"}>Explore Restaurants</Link>
      </div>
    </section>
  )
}

export default Banner