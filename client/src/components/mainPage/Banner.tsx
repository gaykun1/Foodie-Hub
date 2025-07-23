import Link from 'next/link'
const Banner = () => {
  return (
       <section className="mt-12 pt-[83px] pb-[86] lg:pl-16 md:pl-10 pl-6 sm:pl-8 pr-4 sm:pr-0 mb-[50px]   bg-gray-600">
      <div className="flex flex-col gap-[21px] justify-start max-w-[544px] w-full">
        <h1 className="font-extrabold sm:text-[60px] text-5xl  sm:leading-[60px]">Taste the City, Delivered to Your Door!</h1>
        <p className="text-xl leading-7 text-gray">Discover local gems, exclusive deals, and your next favorite meal, all at your fingertips.</p>
        <Link className="btn sm:w-full w-[50%]  h-12 sm:h-[44px] mt-[9px]" href={"/restaurants/category/all-restaurants"}>Explore Restaurants</Link>
      </div>
    </section>
  )
}

export default Banner