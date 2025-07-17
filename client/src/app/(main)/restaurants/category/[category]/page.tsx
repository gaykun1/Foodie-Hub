"use client"
import { getRestaurantsFiltered } from "@/api/api";
import RestaurantCard from "@/components/mainPage/RestaurantCard";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Category } from "@/redux/reduxTypes";
import { getRestaurants } from "@/redux/restaurantSlice";
import { ChevronRight, Clock, SlidersHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  const fetchRestaurants = async (category: string) => {
    try {
      setIsLoading(true);

      const info = await getRestaurantsFiltered(category);
      if (info) dispatch(getRestaurants(info));

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(currentTitle);
  }, [])

  return (
    <section className="mx-5 my-10 border-[2px] border-borderColor rounded-lg p-8 ">
      <div className="border-b-[1px] border-gray  mb-6 h-10 pb-4 flex justify-between items-center">
        <h1 className="section-title">{currentTitle}</h1>
        <button onClick={() => setIsActiveFilterMenu(!isActiveFilterMenu)} className={`text-xl relative  flex items-center gap-2 cursor-pointer group ${isActiveFilterMenu ? "text-primary" : ""}`}>
          <span className="group-hover:text-primary font-semibold transition-colors ">Filter</span>
          <SlidersHorizontal className="group-hover:text-primary group-hover:rotate-90  transition-all" size={18} />
          {isActiveFilterMenu && (
            <div className="absolute w-[200px] p-3 bg-primary mt-3 rounded-md border-gray items-start font-medium text-white border-[1px] text-base flex flex-col gap-1 top-full right-0">
              {Object.entries(links).map(([key, value], index) => {
                return (
                  <Link className="transition-opacity hover:opacity-65" key={index} href={`${value}`}>{key}</Link>
                )
              })}
            </div>

          )}

        </button>
      </div>
       {isLoading
                ?
                (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
                ( <div className="grid grid-cols-4 mb-6 gap-x-6 ">
                            {restaurants?.map((restaurant, index) => {
                                return (
                                     <RestaurantCard key={index} restaurant={restaurant}/>
                                )
                            })}
                        </div>)}
         
                        {restaurants?.length==0 && (<h2 className='text-xl font-semibold text-center mb-6'>No restaurants</h2>)}
    </section>
  );
}
