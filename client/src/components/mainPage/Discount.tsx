import Link from 'next/link'
import React from 'react'

const Banner = () => {
  return (
    <section className="mt-12 pt-[83px] pb-[86] pl-16 mb-[50px]   bg-[#E8618CCC] rounded-lg flex  items-center justify-center">
      <div className="max-w-[768px] w-full text-white text-center flex flex-col gap-5 items-center">
        <h2 className="font-bold text-[36px] leading-10">Weekend Feast: 20% Off All Orders!</h2>
        <p className="text-[18px] leading-7 ">Don't miss out on our limited-time offer. Use code FEAST20 at checkout for delicious savings.</p>
        <Link className="btn  h-[44px] text-black! bg-white! max-w-[170px] w-full hover:bg-primary! hover:text-white!" href={"/promocode"}>Claim Your Deal</Link>
      </div>
    </section>
  )
}

export default Banner