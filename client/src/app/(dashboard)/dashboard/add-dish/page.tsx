"use client"

import { useAppSelector } from "@/hooks/reduxHooks";
import { AddDishPanel } from "@/components/Dashboard/AddDishPanel";

const Page = () => {
    const { user } = useAppSelector(state => state.auth);
    return <AddDishPanel restaurantId={user?.restaurantId} />
}

export default Page
