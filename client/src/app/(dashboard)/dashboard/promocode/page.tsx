"use client"
import axios from 'axios';
import { SubmitHandler, useForm } from 'react-hook-form'

const Page = () => {
    const { register, formState: { errors }, handleSubmit, reset } = useForm<formFields>();

    type formFields = {
        code: string,
        percent: number,
    }

    const onSubmit: SubmitHandler<formFields> = async (data) => {
        try {
            const res = await axios.post("http://localhost:5200/api/promocode/create", { data }, { withCredentials: true });
            if (res) {
                reset();
            }
        } catch (err) {
            console.error(err);
        }
    }
    return (
        <div className='flex flex-col gap-7'>
            <h1 className='section-title'>Promocodes</h1>
            <div className="flex flex-col gap-2 ">
                <h2 className='text-xl font-semibold'>Create promocode</h2>
                <form className='p-4 border-borderColor flex items-end gap-3 border-[1px] rounded-lg w-fit' onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-2">
                        <label >Code</label>
                        <input className='input p-2 uppercase' {...register("code", { required: "Code is required" })} type="text" />
                    </div>
                    <div className="flex flex-col gap-2 basis-[100px]">
                        <label >Percent</label>
                        <div className="flex gap-1 items-center"><input className='input p-2' {...register("percent", { required: "Percent is required" })} type="text" /><span className='font-semibold text-lg'>%</span></div>
                    </div>
                    <button className='btn p-2' type='submit'>Create</button>
                </form>
            </div>

        </div>
    )
}

export default Page