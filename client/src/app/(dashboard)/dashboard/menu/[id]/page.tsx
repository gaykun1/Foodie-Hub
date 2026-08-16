"use client"

import { useParams } from "next/navigation"
import { AddDishPanel } from "@/components/Dashboard/AddDishPanel";

const Page = () => {
    const { id } = useParams() as { id: string };
    return <AddDishPanel restaurantId={id} />
}

export default Page
