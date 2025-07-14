"use client";
import { Category } from "@/redux/reduxTypes";
import axios from "axios";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type formFields = {
  title: string;
  description: string;
  city: string;
  street: string;
  houseNumber: string;
  phone: string;
  websiteUrl: string;
  image: FileList;
  categories: string[];
  startDay: string,
  endDay: string,
  startHour: string,
  endHour: String,
};

// Функція для завантаження зображення на Cloudinary
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


const Page = () => {
  const { register, handleSubmit, reset } = useForm<formFields>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<formFields> = async (data) => {
    setLoading(true);
    try {
      const imageFile = data.image[0];

      const imageUrl = await uploadImageToCloudinary(imageFile);

      // Дані ресторану
      const restaurantData = {
        title: data.title,
        description: data.description,
        city: data.city,
        houseNumber: data.houseNumber,
        street: data.street,
        phone: data.phone,
        websiteUrl: data.websiteUrl,
        imageUrl: imageUrl,
        categories: data.categories || [],
        startDay: data.startDay,
        endDay: data.endDay,
        startHour: data.startHour,
        endHour: data.endHour,
      };


      const res = await axios.post(
        "http://localhost:5200/api/restaurant/create-restaurant",
        restaurantData,
        {

          withCredentials: true,
        }
      );

      setServerError(null);
      reset();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.message || "Axios error";
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <>
      <div className="mb-2">
        <h1 className="text-2xl font-semibold border-b-[1px] pb-1 border-borderColor inline-block">
          Add a new restaurant
        </h1>
      </div>

      {serverError && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          Error: {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 mb-4">
          <div className="p-2 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-lg font-medium">
                Title
              </label>
              <input {...register("title", { required: true })} className="input p-1" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-lg font-medium">
                Description
              </label>
              <textarea {...register("description")} className="input p-1 h-[100px] resize-none" />
            </div>
            <div className="flex flex-col gap-2">

              <label htmlFor="adress" className="text-lg font-medium">Street</label>
              <input {...register("street", { required: true })} className="input p-1" />
              <label htmlFor="adress" className="text-lg font-medium">House Number</label>
              <input {...register("houseNumber", { required: true })} className="input p-1" />
              <label htmlFor="adress" className="text-lg font-medium">City</label>
              <input {...register("city", { required: true })} className="input p-1" />

            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="mySelect">First working day of the week:</label>
              <div className="flex  gap-3 w-[350px]">
                <select className="border-[1px] rounded-sm " id="mySelect" {...register("startDay")}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
                <select className="border-[1px] rounded-sm " id="mySelect" {...register("startHour")}>
                  <option value="6:00">6:00</option>
                  <option value="7:00">7:00</option>
                  <option value="8:00">8:00</option>
                  <option value="9:00">9:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="mySelect">Last working day of the week:</label>
              <div className="flex  gap-3 w-[350px]">
                <select className="border-[1px] rounded-sm " id="mySelect" {...register("endDay")}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
                <select className="border-[1px] rounded-sm " id="mySelect" {...register("endHour")}>
                  <option value="6:00">6:00</option>
                  <option value="7:00">7:00</option>
                  <option value="8:00">8:00</option>
                  <option value="9:00">9:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="">
                <label htmlFor="phone" className="text-lg font-medium">
                  Phone
                </label>
                <input {...register("phone", { required: true })} type="tel" className="input p-1" />
              </div>
              <div className="">
                <label htmlFor="websiteUrl" className="text-lg font-medium">
                  Website Link
                </label>
                <input {...register("websiteUrl", { required: true })} type="url" className="input p-1" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="image" className="text-lg font-medium">
                Image
              </label>
              <input {...register("image", { required: true })} type="file" accept="image/*" className="input p-1" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="categories" className="text-lg font-medium">
                Categories
              </label>
              {Object.values(Category)
                .filter((cat) => cat !== "All Restaurants")
                .map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      {...register("categories")}
                      type="checkbox"
                      value={category}
                      id={`category-${index}`}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`category-${index}`}>{category}</label>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <button type="submit" className="btn ml-2 p-3 text-lg w-[100px]" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </>

  );
};

export default Page;
