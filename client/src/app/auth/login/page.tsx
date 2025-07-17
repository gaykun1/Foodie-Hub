"use client"
import { LogIn } from '@/api/api';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const Page = () => {
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (
    <div className=" flex justify-center mt-[150px]  text-primary">
      <div className='max-w-[550px] w-full rounded-[25px] border-[2px] border-borderColor flex flex-col gap-4 p-6'>
        <h2 className="text-3xl font-bold">Login</h2>
        <div className=" flex flex-col gap-2">
          <div className="flex flex-col gap-1 ">
            <label className='text-[18px]'>Username</label>
            <input onChange={(e) => { setUsername(e.target.value) }} placeholder='Type in your username...' type="text" className=' ml-2 input h-[40px] px-2' />
          </div>
          <div className="flex flex-col gap-1 ">
            <label className='text-[18px]'>Password</label>
            <input onChange={(e) => { setPassword(e.target.value) }} placeholder='Type in your password...' type="password" className=' ml-2 input h-[40px] px-2' />
          </div>

        </div>
        <div className="flex items-center justify-between">
          <button onClick={async () => {
            const user = await LogIn(password, username);
            if (user) dispatch(login(user));
            router.push("/");
          }} className='btn py-1 px-2 text-base!'>Log in</button>
          <Link className='underline' href='register'>Sign up</Link>
        </div>
      </div>
    </div>
  )
}
export default Page;