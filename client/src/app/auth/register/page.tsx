"use client"
import { SignUp } from '@/api/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';

// using useForm for better and easy validation 
type FormFiedsType = {
  password: string,
  username: string,
}
const Page = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormFiedsType>();
  const router = useRouter();

  const onSubmit: SubmitHandler<FormFiedsType> = async (data: FormFiedsType) => {
    try {
      // func api for signing up
      await SignUp(data.password, data.username);
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <div className=" flex justify-center mt-[150px] mx-5  text-primary">
      <div className='max-w-[550px] w-full rounded-[25px] border-[2px] border-borderColor flex flex-col gap-4 p-6'>
        <h2 className="text-3xl font-bold">Sign up</h2>
        <form onSubmit={handleSubmit(onSubmit)} className=" flex flex-col gap-2">
          <div className="flex flex-col gap-1 ">
            <label className='text-[18px]'>Username</label>
            <input {...register("username")} placeholder='Type in your username...' type="text" className=' ml-2 input h-[40px] px-2' />
          </div>
          <div className="flex flex-col gap-1 ">
            <label className='text-[18px]'>Password</label>
            <input {...register("password", {
              validate: {
                // validating password for safety 
                password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value) || "Password must have at least one lowercase, one uppercase, one digit and minimum 8 characters",
              }
            })} placeholder='Type in your password...' type="password" className=' ml-2 input h-[40px] px-2' />
            {errors.password && (
              <span className="text-red-500 font-medium ">
                {errors.password.message}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button className='btn py-1 px-2 text-base!'>Sign up</button>
            <Link className='underline' href='login'>Log in</Link>
          </div>
        </form>

      </div>
    </div>
  )
}
export default Page;