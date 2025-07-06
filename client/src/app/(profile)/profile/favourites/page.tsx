"use client";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login } from "@/redux/authSlice";
import { Restaurant, User } from "@/redux/reduxTypes";
import axios from "axios";
import { Link, Pen } from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type formType = {
  username: string,
  password: string,
  newPassword: string,
  newPasswordAgain: string,
  phoneNumber: string,
  email: string,

}

const Page = () => {

  const { user } = useAppSelector((state) => state.auth);
  const [items, setItems] = useState<Restaurant[]>();

  useEffect(() => {
    const getFavourites = async () => {
      try {
        const res = await axios.get("http://localhost:5200/api/restaurant/favourites", { withCredentials: true });
        setItems(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    getFavourites();

  }, [])


  return (
    <div className="min-h-[150px] border-borderColor rounded-md border-[2px] p-3 ">
      {items ? (

        <div className='flex flex-col gap-4'>{
          items.map((item, index) => {
            return (
              <div key={index} className="flex justify-between overflow-hidden rounded-md items-center border-[1px]">
                <div className="flex gap-3 basis-[350px]">
                  <img src={item.imageUrl} className='max-w-[100px] w-full h-[70px] border-r-[1px]' alt="" />
                  <h1 className='text-2xl font-medium '>Restaurant "{item.title}" </h1>

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
