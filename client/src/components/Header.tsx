"use client"

import { LogOut } from '@/api/auth'
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks'
import { logout } from '@/redux/authSlice'
import { updateAmount } from '@/redux/cartSlice'
import { Cart, Restaurant, User } from '@/redux/reduxTypes'
import axios from 'axios'
import { Minus, Plus, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Header = () => {

  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { cart } = useAppSelector(state => state.cart);

  const [activePanel, setActivePanel] = useState<null | "cart" | "menu" | "search">(null);
  const [word, setWord] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const searchRestaurants = async (word: string): Promise<void | Restaurant[]> => {
    if (word === "" || word.length < 2) {
      setActivePanel(null);
      setRestaurants([]);
      return;
    }
    if (word.length >= 2) {
      try {
        const res = await axios.post("http://localhost:5200/api/restaurant/search-restaurants", { chars: word });
        if (!res) return;
        return res.data;
      } catch (err) {
        console.error(err);
      }
    }
  }
  console.log();

  const updateCount = async (amount: number, id: string, title: string) => {
    try {
      if (amount <= 0) {
        return;
      }
      dispatch(updateAmount({ amount: amount, dishId: id }));
      const res = await axios.post("http://localhost:5200/api/cart/amount", { amount: amount, dishId: id, title: title }, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
  }


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".panel")) {
        setActivePanel(null);
      }
    };

    if (activePanel) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activePanel]);

  const createOrder = async () => {
    try {
      const res = await axios.post("http://localhost:5200/api/order/create-order", { cart }, { withCredentials: true });
      if (res.data)
        return res.data;
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <header className=" shadow-borderShadow border-b-[1px] border-borderColor z-100 relative">
      <div className='py-2 flex items-center justify-between  _container'>
        <div className="basis-[650px] flex justify-between">
          <div className='basis-[250px] '>
            <Link className='  flex gap-2 items-center group font-bold' href={"/"}>
              <Image className='transition-transform group-hover:rotate-90' width={40} height={40} src={"logo.svg"} alt='logo' />
              <span className='default-link group:hover text-xl'>Foodie Hub</span>
            </Link>
          </div>
          <nav className='basis-[250px] grow-1  flex gap-[18px] items-center'>
            {user?.role !== "admin" ? (<><Link className='hover:text-primary font-bold' href={"/"}>Home</Link>
              <Link className='hover:text-primary font-bold' href={"/restaurants/category/all-restaurants"}>Restaurants</Link>
              <Link className='hover:text-primary font-bold' href={"/orders"}>Orders</Link>
              {user?.role === "courier" ? (<Link className='hover:text-primary font-bold' href={"/courier"}>Courier page</Link>
              ) : (<Link className='hover:text-primary font-bold' href={"/job"}>Get a job</Link>
              )}
            </>

            ) : (<Link className='hover:text-primary font-bold' href={"/dashboard"}>Dashboard</Link>)}
          </nav>
        </div>
        <div className="flex gap-5 items-center relative">
          <div className="relative w-[270px]">
            {activePanel === "search" ? (<button className='cursor-pointer flex items-center ' onClick={() => { setActivePanel(null); setWord(""); }}> <X className='absolute left-2.5 top-2' /></button>
            ) : (<button className='cursor-pointer flex items-center ' onClick={() => {


            }}><Search className='absolute left-2.5 top-2' /></button>)}

            <input value={word} onChange={async (e) => {

              setWord(e.target.value);
              const info = await searchRestaurants(word);
              if (info && word.length >= 1) {
                setRestaurants(info);
                setActivePanel("search");

              }

            }} placeholder='Search for restaurants or dishes...'
              type="text"
              className='leading-[22px] pl-[38px] h-[40px] pr-3  text-sm input'
            />

            {activePanel === "search" ? <div className="min-w-[200px] flex flex-col top-full panel  left-0 absolute border-borderColor mt-1  bg-primary  p-3 border-[1px] rounded-[6px]">
              <div className="flex flex-col gap-2 items-start text-sm font-semibold">
                {restaurants.length > 0 ? restaurants.map((restaurant, index) => {
                  return (
                    <Link href={`/restaurant/menu/${restaurant._id}`} key={index}>{restaurant.title}</Link>
                  )
                }) : (<span className=''>Not found!</span>)}
              </div>
            </div>
              : ""}



          </div>

          {activePanel === "cart" &&
            <div className="absolute flex flex-col gap-3 text-left border-borderColor panel border-[2px] rounded-lg p-3 top-[150%] right-0 bg-primary  min-w-[300px]">
              <h2 className='text-lg font-bold pb-1 border-borderColor text-white border-b-[1px] '>Cart</h2>
              {cart?.items.length ? (<> <div className="flex flex-col gap-2 ">
                {cart
                  ? cart.items.map((item, idx) => {


                    return (
                      <div className='rounded-lg p-2 border-borderColor border-[1px]' key={idx}>
                        <div className="flex  justify-between ">
                          <div className="flex gap-4 items-center ">
                            <img className="size-16 object-cover rounded-lg border-[1px] border-borderColor" src={item.dishId.imageUrl} alt="" />
                            <div className="text-white">
                              <h3 className="font-medium ">{item.dishId.title}</h3>
                              <p className="text-sm leading-5  ">Quantity: {item.amount}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">

                            <button onClick={async () => updateCount(item.amount + 1, item.dishId._id, item.dishId.title)} className='btn p-1 border-[1px] border-borderColor'><Plus /></button>

                            <button disabled={(item.amount - 1) <= 0} onClick={async () => updateCount(item.amount - 1, item.dishId._id, item.dishId.title)} className={`btn p-1 border-[1px] border-borderColor disabled:bg-gray! `}><Minus /></button>

                          </div>
                        </div>
                      </div>
                    )
                  })
                  : <span>Loading cart...</span>}


              </div>
                <button onClick={async () => {
                  const id = await createOrder();
                  redirect(`/orders/order/${id}`)
                }} className='btn border-borderColor border-[1px]! font-medium text-lg p-3 '>Place order</button> </>) : (<span>Cart is clear</span>)}

            </div>
          }
          <button onClick={() => setActivePanel(activePanel === "cart" ? null : "cart")} className="relative cursor-pointer transition-colors hover:text-primary">
            <ShoppingCart size={30} />
            <span className='rounded-full p-1 bg-primary absolute top-[55%] -left-[15%] text-white  font-semibold px-2 text-sm'>{cart?.items.length}</span>

          </button>
          <div className="rounded-full relative p-3 border-borderColor border-[2px] ">



            <button className='cursor-pointer transition-colors hover:text-primary flex items-center' onClick={() => {
              setActivePanel(activePanel === "menu" ? null : "menu")

            }}>{activePanel === "menu" ? (<X />) : (<UserRound />)} </button>

            {/* menu */}
            {activePanel === "menu" ? (<div className="min-w-[200px] flex flex-col top-full panel  right-0 absolute  border-borderColor mt-1  bg-primary  p-3 border-[1px] rounded-[6px]">
              <span className='text-white text-base font-bold border-b-[1px] border-borderColor pb-1 mb-2'>Welcome back {user?.username}!</span>
              <div className="flex flex-col gap-2 items-start">
                <Link href="/profile" className=" text-sm font-semibold text-white transition-all hover:opacity-65">Profile</Link>
                <button onClick={async () => {
                  const data = await LogOut();
                  dispatch(logout());
                  setActivePanel(null);
                  redirect("/auth/login");
                }} className="text-white text-sm font-semibold transition-all hover:opacity-65 cursor-pointer">Log out</button>
              </div>
            </div>) : ""}

          </div>
        </div>
      </div>

    </header >
  )

}
export default Header;
