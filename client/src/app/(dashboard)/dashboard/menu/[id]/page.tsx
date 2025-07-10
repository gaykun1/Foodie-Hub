"use client"

import DishCard from "@/components/Dashboard/DishCard";
import { Dish } from "@/redux/reduxTypes";
import axios from "axios";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type formFields = {
    title: string,
    description: string,
    price: number,
    image: FileList,
    typeOfFood: string,
}
const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Images");

    const res = await fetch("https://api.cloudinary.com/v1_1/dv3j72lqn/image/upload", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Cloudinary error:", data);
        return null;
    }

    return data.secure_url || null;
};
const page = () => {
    const [dishesLoading, setDishesLoading] = useState<boolean>(false);
    const [menu, setMenu] = useState<Dish[]>([]);
    const { id } = useParams() as { id: string };
    const { register, handleSubmit, reset, formState: { errors } } = useForm<formFields>();
    const [loading, setLoading] = useState<boolean>(false);
    const createDish: SubmitHandler<formFields> = async (data) => {
        console.log("hello");
        try {
            setLoading(true);
            const imageUrl = await uploadImageToCloudinary(data.image[0]);
            const dish = {
                title: data.title,
                description: data.description,
                price: data.price,
                imageUrl: imageUrl,
                typeOfFood: data.typeOfFood,

            }

            const res = await axios.post("http://localhost:5200/api/restaurant/dishes", { dish, id });
            reset();
            setMenu([...menu, res.data]);
        } catch (err) {
            console.error(err);
            return;
        } finally {
            setLoading(false);
        }


    }

    const getDishes = async () => {
        try {
            setDishesLoading(true);
            const res = await axios.get(`http://localhost:5200/api/restaurant/dishes/${id}`);
            if (res.data)
                setMenu(res.data.dishes);
        } catch (err) {
            console.error(err);
        } finally {
            setDishesLoading(false);

        }
    }

    useEffect(() => {
        getDishes();
    }, []);
    console.log(menu);

    return (
        <>
            <div className="mb-7 pb-3 border-b-[1px] border-borderColor flex flex-col gap-3 ">
                <h1 className="section-title">Create a dish</h1>
                <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit(createDish)} >
                    <div className=" flex flex-col gap-4">
                        <div className="">
                            <label className="text-lg  font-medium" htmlFor="title">Title</label>
                            <input className="input p-1 mt-3 " {...register("title")} type="text" />
                        </div>
                        <div className="">
                            <label className="text-lg  font-medium" htmlFor="description">Description</label>
                            <input className="input p-1 mt-3" {...register("description")} type="text" />
                        </div>
                        <div className=" flex flex-col">
                            <label className=" text-lg  font-medium" htmlFor="mySelect">Choose type of food</label>
                            <select className="border-[1px] input p-1 rounded-sm " id="mySelect" {...register("typeOfFood")}>
                                <option value="Appetizers">Appetizers</option>
                                <option value="Main Courses">Main Courses</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Drinks">Drinks</option>

                            </select>
                        </div>
                    </div>
                    <div className=" flex flex-col gap-4">
                        <div className="">
                            <label className="text-lg  font-medium" htmlFor="price">Price</label>
                            <input className="input p-1 mt-3" {...register("price", { valueAsNumber: true })} type="text" />
                        </div>

                        <div className="">
                            <label className="text-lg  font-medium" htmlFor="image">Image</label>
                            <input className="input p-1 mt-3" {...register("image")} type="file" />
                        </div>
                    </div>

                    <button type="submit" className="btn ml-auto p-3 text-lg w-[100px] " disabled={loading}>
                        {loading ? "Creating..." : "Create"}
                    </button>
                </form>

            </div>
            <div className="flex flex-col gap-3 ">
                <h1 className="section-title">Menu</h1>
                {menu.length > 0 ?

                    (<div>

                        {dishesLoading
                            ?
                            (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) :
                            <div className="grid grid-cols-4 gap-[25px]">
                                {menu.map((dish, idx) => {
                                    return (
                                        <div className="" key={idx}>
                                            <DishCard dish={dish} toCart={false} onDeleted={getDishes} />
                                        </div>
                                    )
                                })}
                            </div>
                        }
                    </div>)

                    : (
                        <div className="text-center mt-5">
                            No dishes!
                        </div>
                    )}




            </div >
        </>
    )
}

export default page