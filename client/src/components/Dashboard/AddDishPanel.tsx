"use client"

import DishCard from "@/components/Dashboard/DishCard";
import { Dish } from "@/redux/reduxTypes";
import { uploadImageToCloudinary } from "@/utils/uploadImageToCloudinary";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CardGridSkeleton, DishCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UtensilsCrossed } from "lucide-react";

type formFields = {
    title: string,
    description: string,
    price: number,
    image: FileList,
    typeOfFood: string,
}

// Shared "create dish + menu grid" panel — used by the restaurant owner's
// own add-dish page (restaurantId from the logged-in user) and the admin's
// per-restaurant menu editor (restaurantId from the route param). The two
// were previously near-identical copies.
export const AddDishPanel = ({ restaurantId }: { restaurantId: string | undefined }) => {
    const [dishesLoading, setDishesLoading] = useState<boolean>(false);
    const [menu, setMenu] = useState<Dish[]>([]);
    const { register, handleSubmit, reset } = useForm<formFields>();
    const [loading, setLoading] = useState<boolean>(false);

    const createDish: SubmitHandler<formFields> = async (data) => {
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

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes`, { dish, id: restaurantId });
            reset();
            setMenu([...menu, res.data]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getDishes = useCallback(async () => {
        try {
            setDishesLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/dishes/${restaurantId}`);
            if (res.data) setMenu(res.data.dishes);
        } catch (err) {
            console.error(err);
        } finally {
            setDishesLoading(false);
        }
    }, [restaurantId])

    useEffect(() => {
        if (restaurantId) getDishes();
    }, [restaurantId, getDishes]);

    return (
        <div className="flex flex-col gap-8">
            <div className="pb-6 border-b border-border flex flex-col gap-4">
                <h1 className="section-title">Create a dish</h1>
                <form className="grid sm:grid-cols-2 gap-4" onSubmit={handleSubmit(createDish)}>
                    <div className="flex flex-col gap-4">
                        <Input id="dish-title" label="Title" {...register("title")} />
                        <Input id="dish-description" label="Description" {...register("description")} />
                        <Select id="dish-type" label="Type of food" {...register("typeOfFood")}>
                            <option value="Appetizers">Appetizers</option>
                            <option value="Main Courses">Main Courses</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Drinks">Drinks</option>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Input id="dish-price" label="Price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
                        <Input id="dish-image" label="Image" type="file" accept="image/*" {...register("image")} />
                    </div>

                    <Button type="submit" loading={loading} className="w-fit">
                        Create
                    </Button>
                </form>
            </div>
            <div className="flex flex-col gap-4">
                <h2 className="section-title">Menu</h2>
                {dishesLoading ? (
                    <CardGridSkeleton count={4} item={DishCardSkeleton} />
                ) : menu.length > 0 ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {menu.map((dish) => (
                            <DishCard key={dish._id} dish={dish} toCart={false} onDeleted={getDishes} />
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<UtensilsCrossed size={22} />} title="No dishes yet" description="Add the first dish using the form above." />
                )}
            </div>
        </div>
    )
}
