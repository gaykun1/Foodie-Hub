"use client"
import { getRestaurantsFiltered } from "@/api/api";
import RestaurantCard from "@/components/mainPage/RestaurantCard";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Category } from "@/redux/reduxTypes";
import { getRestaurants } from "@/redux/restaurantSlice";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const links: Record<Category, string> = {
  [Category.All]: "all-restaurants",
  [Category.FastFood]: "fast-food",
  [Category.Desserts]: "desserts",
  [Category.FineDining]: "finedining",
  [Category.Healthy]: "healthy",
};

export default function Home() {
  const dispatch = useAppDispatch();
  const { restaurants } = useAppSelector(state => state.restaurants);
  const { category } = useParams() as { category: string };
  const [isActiveFilterMenu, setIsActiveFilterMenu] = useState<boolean>(false);
  const entry = Object.entries(links).find(([key, val]) => val === category);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentTitle = entry ? entry[0] : Category.All;
  // optimized func for fetching 
  const fetchRestaurants = useCallback(async (category: string) => {
    try {
      setIsLoading(true);

      const info = await getRestaurantsFiltered(category);
      if (info) dispatch(getRestaurants(info));

    } catch (err) {

      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch])

  
  useEffect(() => {
    fetchRestaurants(currentTitle);
  }, [currentTitle, fetchRestaurants])

  return (
    <section className="mx-5 my-10 border-[2px] border-borderColor rounded-lg sm:p-8 p-6 ">
      <div className="border-b-[1px] border-gray  mb-6 h-10 pb-4 flex justify-between gap-4 items-center">
        <h1 className="section-title">{currentTitle}</h1>
        <div
          onMouseEnter={() => setIsActiveFilterMenu(true)}
          onMouseLeave={() => setIsActiveFilterMenu(false)}
          className="relative "
        >
          <button onClick={() => setIsActiveFilterMenu(!isActiveFilterMenu)} className={`text-xl relative  flex items-center gap-2 cursor-pointer group ${isActiveFilterMenu ? "text-primary" : ""}`}>
            <span className="group-hover:text-primary font-semibold transition-colors hidden sm:block ">Filter</span>
            <SlidersHorizontal className={`group-hover:text-primary  transition-all ${isActiveFilterMenu ? "rotate-90 " : ""}`} size={18} />


          </button>
          {isActiveFilterMenu && (
            <div className="absolute w-[200px] top-full right-0">
              <div className=" mt-3  p-3 w-full  bg-primary  rounded-md border-gray items-start font-medium text-white border-[1px] text-base flex flex-col gap-1 ">
                {Object.entries(links).map(([key, value], index) => {
                  return (
                    <Link className="transition-opacity hover:opacity-65" key={index} href={`${value}`}>{key}</Link>
                  )
                })}
              </div>
            </div>

          )}
        </div>
      </div>
      {
        isLoading
          ?
          (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
          (<div className="grid  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6 gap-6 ">
            {restaurants?.map((restaurant, index) => {
              return (
                <RestaurantCard key={index} restaurant={restaurant} />
              )
            })}
          </div>)
      }

      {restaurants?.length == 0 && (<h2 className='text-xl font-semibold text-center mb-6'>No restaurants</h2>)}
    </section >
  );
}
