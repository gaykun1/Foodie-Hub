"use client"

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { updateFavourites } from "@/redux/authSlice";
import { Restaurant } from "@/redux/reduxTypes";
import { calculateStars } from "@/utils/rating";
import { current } from "@reduxjs/toolkit";
import axios from "axios";
import { Clock, Globe, Heart, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react"




export default function HeaderRestaurant() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { id } = useParams() as { id: string };
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const getRestaurantInfo = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`http://localhost:5200/api/restaurant/get-restaurant-by-id/${id}`);
        setCurrentRestaurant(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    getRestaurantInfo();
  }, [])

  const path  = usePathname();

  const addToFavourite = async () => {
    try {
      const res = await axios.post("http://localhost:5200/api/restaurant/add-to-favourite", { restaurantId: id }, { withCredentials: true });
      dispatch(updateFavourites(res.data));
      return;
    } catch (err) {
      console.error(err);
    }
  }
  const links: Record<string, string> = {
    Menu: `/restaurant/menu/${id}`,
    About: `/restaurant/about/${id}`,
    Reviews: `/restaurant/reviews/${id}`,
  }
  return (
    <>
      <div className="relative w-full h-[600px]">
        <img
          src={currentRestaurant?.imageUrl}
          alt="restaurant photo"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 custom-gradient z-10" />


        <div className="relative z-20 p-12 flex flex-col justify-end h-full basis-full gap-3 text-white _container">
          <h1 className=" text-5xl leading-12 font-semibold mb-1">{currentRestaurant?.title}</h1>
          <p className="text-2xl leading-8 text-[ #E8618CFF]">{currentRestaurant?.description}</p>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2 items-center  max-w-[135px] w-full">

              {calculateStars(currentRestaurant?.rating || 0).map((star, idx) => (
                <span key={idx}>{star}</span>
              ))}
            </div>
            <div className=" text-lg leading-7 font-medium flex gap-1">
              <span>{currentRestaurant?.rating}</span>
              <span>({currentRestaurant?.reviews.length} Reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg leading-7  ">
              <MapPin size={20} />
              <span>{currentRestaurant?.adress}</span>
            </div>
            <div className="flex items-center gap-2 text-lg leading-7  ">
              <Clock size={20} />
              <div className="gap-1 items-center flex">
                <div className="">
                  <span>{currentRestaurant?.startDay}</span>-<span>{currentRestaurant?.endDay}</span>
                </div>
                :
                <div className="">
                  <span>{currentRestaurant?.startHour}</span>-<span>{currentRestaurant?.endHour}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link className="btn p-2 max-w-[158px]! w-full leading-7! text-lg! font-semibold! " href={"/"}>Order Now</Link>
          </div>
        </div>
      </div>
      {/* header */}

      <div className="my-10 border-b-[1px] border-borderColor  py-6 flex items-center justify-between pl-5 pr-2.5 _container">
        <div className="flex gap-4">
          <div className="flex gap-1 items-center">
            <Phone size={18} />
            <span>{currentRestaurant?.phone}</span>
          </div>
          <div className="flex gap-1 items-center">
            <Globe size={18} />
            <Link className="hover:underline" href={currentRestaurant?.websiteUrl || "#"}> {currentRestaurant?.websiteUrl}</Link>
          </div>
        </div>
        <div className="">
          <button onClick={() => addToFavourite()} className="rounded-md border-borderColor border-[1px] transition-all hover:bg-[#E8618CFF] cursor-pointer  px-4 py-2 flex items-center font-medium leading-5.5 gap-2">
            <Heart size={14} className={` ${user?.favourites?.includes(id) ? "fill-[#E8618CFF]" : ""}`} />
            <span>Favorite</span>

          </button>
        </div>
      </div>
      <div className="border-b-[1px] border-borderColor pb-3 flex gap-10 items-cente justify-center">
        {Object.entries(links).map(([text, link],idx) => (
          <Link key={idx} className={`btn py-2 basis-[342px] ${path==link ? "" :"bg-borderColor! text-gray!"} `} href={link}>{text}</Link>
        ))}
      </div>
    </>
  )



}
//  {isLoading
//           ?
//           (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :