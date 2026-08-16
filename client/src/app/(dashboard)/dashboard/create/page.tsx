"use client";
import { Category } from "@/redux/reduxTypes";
import { uploadImageToCloudinary } from "@/utils/uploadImageToCloudinary";
import axios from "axios";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

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
  endHour: string,
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = ["6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const Page = () => {
  const { register, handleSubmit, reset } = useForm<formFields>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<formFields> = async (data) => {
    setLoading(true);
    try {
      const imageFile = data.image[0];
      const imageUrl = await uploadImageToCloudinary(imageFile);

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

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants`,
        restaurantData,
        { withCredentials: true }
      );

      setServerError(null);
      reset();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.message || "Something went wrong";
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="section-title border-b border-border pb-3">Add a new restaurant</h1>

      {serverError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-danger100 text-danger text-sm font-medium">
          <AlertCircle size={16} />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <Input id="create-title" label="Title" {...register("title", { required: true })} />
            <Textarea id="create-description" label="Description" className="h-[100px] resize-none" {...register("description")} />
            <Input id="create-street" label="Street" {...register("street", { required: true })} />
            <Input id="create-house-number" label="House Number" {...register("houseNumber", { required: true })} />
            <Input id="create-city" label="City" {...register("city", { required: true })} />
          </div>

          <div className="flex flex-col gap-4">
            <Input id="create-phone" label="Phone" type="tel" {...register("phone", { required: true })} />
            <Input id="create-website" label="Website Link" type="url" {...register("websiteUrl", { required: true })} />
            <Input id="create-image" label="Image" type="file" accept="image/*" {...register("image", { required: true })} />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink">Categories</label>
              <div className="flex flex-col gap-2">
                {Object.values(Category)
                  .filter((cat) => cat !== "All Restaurants")
                  .map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        {...register("categories")}
                        type="checkbox"
                        value={category}
                        id={`category-${index}`}
                        className="size-4 accent-brand"
                      />
                      <label htmlFor={`category-${index}`} className="text-sm text-ink">{category}</label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">First working day of the week</span>
            <div className="flex gap-3">
              <Select id="create-start-day" label="Day" wrapperClassName="flex-1" {...register("startDay")}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select id="create-start-hour" label="Hour" wrapperClassName="flex-1" {...register("startHour")}>
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Last working day of the week</span>
            <div className="flex gap-3">
              <Select id="create-end-day" label="Day" wrapperClassName="flex-1" {...register("endDay")}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select id="create-end-hour" label="Hour" wrapperClassName="flex-1" {...register("endHour")}>
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-fit">
          Create
        </Button>
      </form>
    </div>
  );
};

export default Page;
