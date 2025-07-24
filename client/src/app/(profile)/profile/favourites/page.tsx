"use client";
import { useAppSelector } from "@/hooks/reduxHooks";
import { Restaurant } from "@/redux/reduxTypes";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const Page = () => {

  const [items, setItems] = useState<Restaurant[]>();

  // getting favourite restaurants
  useEffect(() => {
    const getFavourites = async () => {
      try {
        const res = await axios.get("http://localhost:5200/api/restaurant/restaurants/favourites", { withCredentials: true });
        setItems(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    getFavourites();

  }, []);


  return (
    <div className="min-h-[150px] border-borderColor rounded-md border-[2px] p-3 ">
      {items ? (

        <div className='grid md:grid-cols-2  xl:grid-cols-3 gap-4'>{
          items.map((item, index) => {
            return (
              <div key={index} className="flex  gap-4 border-[1px] p-4 rounded-lg border-borderColor ">
                <div className=" border-[1px] size-20 relative  border-borderColor rounded-md overflow-hidden">
                  <img className="object-cover absolute top-0 left-0 w-full h-full" src={item.imageUrl} alt="dish image" />

                </div>
                <div className="flex flex-col justify-between gap-2">
                  <h3 className='text-xl leading-6 font-semibold'>
                    {item.title}
                  </h3>
                  <Link href={`/restaurant/menu/${item._id}`} className="btn py-2  flex items-center gap-1" >
                    <span>Go to restaurant page</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            )
          })
        } </div>
      )

        : (
          <span>Not found!</span>
        )}
    </div>
  );
};

export default Page;
