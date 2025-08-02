"use client"
import { LogIn } from '@/api/api';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const Page = () => {
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      try {

        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          withCredentials: true,
        });
        if (res.data) {
          router.push("/");
        }
      } catch {
        console.log("Not authorized!");
      }

    }
    getUser();

  }, [router]);
  return (
    <div className=" flex justify-center mt-[150px] mx-5 text-primary">
      <div className='max-w-[550px] w-full rounded-[25px] border-[2px] border-borderColor flex flex-col gap-4 p-6'>
        <h2 className="text-3xl font-bold">Login</h2>
        <div className=" flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor='label1' className='text-[18px]'>Username</label>
            <input id='label1' onChange={(e) => { setUsername(e.target.value) }} placeholder='Type in your username...' type="text" className=' ml-2 input h-[40px] px-2' />
          </div>
          <div className="flex flex-col gap-1 ">
            <label htmlFor='label2' className='text-[18px]'>Password</label>
            <input id='label2' onChange={(e) => { setPassword(e.target.value) }} placeholder='Type in your password...' type="password" className=' ml-2 input h-[40px] px-2' />
          </div>
          {error &&
            <span data-testid="error" className="text-red-500 font-medium ">
              Not found!
            </span>
          }

        </div>
        <div className="flex items-center justify-between">
          <button onClick={async () => {
            const status = await LogIn(password, username);
            if (status === 200) {
              setError(false);
              setTimeout(() => {
                router.push("/");
              }, 300);
            } else if (status === 404) {
              setError(true);
            }
          }} className='btn py-1 px-2 text-base!'>Log in</button>
          <Link className='underline' href='register'>Sign up</Link>
        </div>
      </div>
    </div>
  )
}
export default Page;