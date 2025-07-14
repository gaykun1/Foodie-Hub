"use client";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login } from "@/redux/authSlice";
import { Restaurant, User } from "@/redux/reduxTypes";
import axios from "axios";
import { ArrowRight,  Pen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

        <div className='grid   grid-cols-3 gap-4'>{
          items.map((item, index) => {
            return (
              <div key={index} className="flex  gap-4 border-[1px] p-4 rounded-lg border-borderColor ">
                <div className=" border-[1px] size-20 relative  border-borderColor rounded-md overflow-hidden">
                  <img className="object-cover absolute top-0 left-0 w-full h-full" src={item.imageUrl} alt="dish image" />

                </div>
                <div className="flex flex-col justify-between">
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
