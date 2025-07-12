"use client"

import axios from "axios";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form"

type formFields = {
    name: string,
    surname: string,
    phoneNumber: string,
    email: string,
    age: string,
    transport: string,
    city: string,
}

const ApplicationForm = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<formFields>();
    const [loading, setLoading] = useState<boolean>(false);
    const [alreadySent, setAlreadySent] = useState<boolean>(false);
    const onSubmit: SubmitHandler<formFields> = async (data: formFields) => {

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5200/api/courier/create-application", { data }, { withCredentials: true });
            setAlreadySent(res.data.status);

            reset();

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const checkIfSent = async () => {
            try {


                const res = await axios.get("http://localhost:5200/api/courier/check-if-sent", { withCredentials: true })

                setAlreadySent(res.data.status);

            } catch (err) {
                console.error(err);
            }
        }
        checkIfSent()
    }, [])
    return (
        <form  onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 mb-4">
                <div className="p-2 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Name
                        </label>
                        <input {...register("name", { required: "Name is required" })} className="input p-1" />
                        <span className="text-red-500">{errors.name?.message}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Surname
                        </label>
                        <input {...register("surname", { required: "Surname is required" })} className="input p-1" />
                        <span className="text-red-500">{errors.surname?.message}</span>

                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Age
                        </label>
                        <input type="text" {...register("age", {
                            required: "Age is required", validate: {

                                isNumber: (value) => /^\d+$/.test(value) || "Must be number!",
                                min: (value) =>
                                    +value >= 18 || "Must be at least 18",
                                max: (value) =>
                                    +value <= 99 || "Must be at most 99",

                            }
                        })} className="input p-1" />
                        <span className="text-red-500">{errors.age?.message}</span>

                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            City
                        </label>
                        <select defaultValue={"Lviv"} {...register("city", { required: true })} className="input py-2 px-3 ">
                            <option value="Lviv">Lviv</option>
                            <option value="Warsaw">Warsaw</option>
                            <option value="Berlin">Berlin</option>
                        </select>

                    </div>
                </div>

                <div className="p-2 flex flex-col gap-3">

                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Email
                        </label>
                        <input {...register("email", {
                            required: "Email is required", validate: {

                                validEmail: (value) => /^\w+@\w+\.\w{2,3}$/.test(value) || "Wrong email format!"

                            }
                        })} className="input p-1" />
                        <span className="text-red-500">{errors.email?.message}</span>

                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Phone Number
                        </label>
                        <input {...register("phoneNumber", { required: "Phone number is required" })} type="tel" className="input p-1" />
                        <span className="text-red-500">{errors.phoneNumber?.message}</span>

                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-medium">
                            Transport
                        </label>
                        <input {...register("transport")} type="text" className="input p-1" />

                    </div>



                </div>
            </div>

            <button type="submit" className="btn ml-2 p-3 text-lg w-[100px] disabled:!bg-gray disabled:!cursor-auto " disabled={loading || alreadySent}>
                {alreadySent ? "Sent" : loading ? "Sending..." : "Send"}
            </button>
        </form>
    )
}

export default ApplicationForm