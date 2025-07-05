"use client"

import { LogOut } from '@/api/auth'
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks'
import { logout } from '@/redux/authSlice'
import { User } from '@/redux/reduxTypes'
import axios from 'axios'
import { Search, ShoppingCart, UserRound, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React, { useState } from 'react'

const Header = () => {

  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [isMenuActive, setIsMenuActive] = useState<boolean>(false);
  const [word, setWord] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  const searchUsers = async (word: string): Promise<void | User[]> => {
    if (word === "" || word.length < 2) {
      setIsSearchActive(false)
      setUsers([]);
      return;
    }
    if (word.length >= 2) {
      try {
        const res = await axios.post("http://localhost:5200/api/auth/searchUsers", { chars: word });
        if (!res) return;
        return res.data;
      } catch (err) {
        console.error(err);
      }
    }
  }
  return (
    <header className=" shadow-borderShadow border-b-[1px] border-borderColor z-100 relative">
      <div className='py-2 flex items-center justify-between  _container'>
        <div className="basis-[480px] flex justify-between">
          <div>
            <Link className='basis-[150px] flex gap-2 items-center group font-bold' href={"/"}>
              <Image className='transition-transform group-hover:rotate-90' width={40} height={40} src={"logo.svg"} alt='logo' />
              <span className='default-link group:hover text-xl'>Foodie Hub</span>
            </Link>
          </div>
          <nav className='basis-[180px] flex gap-[18px] items-center'>
            {user?.role !== "admin" ? (<><Link className='hover:text-primary font-bold' href={"/"}>Home</Link>
              <Link className='hover:text-primary font-bold' href={"/restaurants/category/all-restaurants"}>Restaurants</Link>
              <Link className='hover:text-primary font-bold' href={"#"}>Orders</Link></>

            ) : (<Link className='hover:text-primary font-bold' href={"/dashboard"}>Dashboard</Link>)}
          </nav>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-[270px]">
            {isSearchActive ? (<button className='cursor-pointer flex items-center ' onClick={() => { setIsSearchActive(false); setWord(""); }}> <X className='absolute left-2.5 top-2' /></button>
            ) : (<button className='cursor-pointer flex items-center ' onClick={() => {
              setIsSearchActive(true);
              if (isMenuActive) {
                setIsMenuActive(false)
              }
            }}><Search className='absolute left-2.5 top-2' /></button>)}

            <input value={word} onChange={async (e) => {
              if (isMenuActive) {
                setIsMenuActive(false)
              }
              setWord(e.target.value);
              const info = await searchUsers(word);
              if (info && word.length >= 1) {
                setUsers(info);
                setIsSearchActive(true);

              }

            }} placeholder='Search for restaurants or dishes...'
              type="text"
              className='leading-[22px] pl-[38px] h-[40px] pr-3  text-sm input'
            />
          
            {isSearchActive ? <div className="min-w-[200px] flex flex-col top-full  left-0 absolute border-borderColor mt-1  bg-primary  p-3 border-[1px] rounded-[6px]">
              <div className="flex flex-col gap-2 items-start text-sm font-semibold">
                {users.length > 0 ? users.map((user, index) => {
                  return (
                    <span key={index}>{user.username}</span>
                  )
                }) : (<span className=''>Not found!</span>)}
              </div>
            </div>
              : ""}



          </div>




          <div className="rounded-full relative p-3 border-borderColor border-[2px] ">

              

            <button className='cursor-pointer transition-colors hover:opacity-70 flex items-center' onClick={() => {
              setIsMenuActive(!isMenuActive);
              if (isSearchActive) {
                setIsSearchActive(false)
              }
            }}>{isMenuActive ? (<X />) : (<UserRound />)} </button>

            {/* menu */}
            {isMenuActive ? (<div className="min-w-[200px] flex flex-col top-full  right-0 absolute border-borderColor mt-1  bg-primary  p-3 border-[1px] rounded-[6px]">
              <span className='text-white text-base font-bold border-b-[1px] border-borderColor pb-1 mb-2'>Welcome back {user?.username}!</span>
              <div className="flex flex-col gap-2 items-start">
                <Link href="/profile" className=" text-sm font-semibold text-white transition-all hover:opacity-65">Profile</Link>
                <button onClick={async () => {
                  const data = await LogOut();
                  dispatch(logout());
                  setIsMenuActive(false);
                  redirect("/auth/login");
                }} className="text-white text-sm font-semibold transition-all hover:opacity-65 cursor-pointer">Log out</button>
              </div>
            </div>) : ""}

          </div>
        </div>
      </div>
    </header>
  )
}

export default Header;
