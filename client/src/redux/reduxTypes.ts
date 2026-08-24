import type { OrderStatus } from "@/lib/orderStatus";

export type { OrderStatus };

/** A resolved map coordinate, mirroring the server's IGeoPoint. */
export type GeoPoint = {
    lat: number,
    lng: number,
}

export interface User {
    username: string,
    favourites: string[] | null,
    role: string,
    email: string,
    phoneNumber: string,
    _id: string,
    address: {
        street: string,
        houseNumber: number,
        city: string
    }
    usualPromocode: {
        discountPercent: number,
    }
    restaurantId?: string,

}


export interface ICourier {
    _id: string,
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    age: number,
    status: "Working" | "Processing",
    city: string,

}

export type Dish = {
    title: string,
    description: string,
    price: number,
    imageUrl: string,
    _id: string,
    typeOfFood: string,
    sold: number,
}

export type Review = {
    sender: {
        username: string,
    },
    text: string,
    rating: number,
    restaurantId?: string,
    _id: string,
    createdAt: Date,

}
export interface Cart {
    restaurantId: {
        title: string;
        imageUrl: string,
    }
    items: {
        dishId: Dish,
        amount: number,
    }[]
    _id: string,
}

// shipping prices
export enum Shipping {
    Economy = 2.20,
    Standart = 3.20,
    Express = 5.20,
}

export type Order = {
    restaurantTitle: string,
    restaurantImage: string,
    _id: string,
    shippingPrice: number,
    discountPercent: number,
    items: {
        title: string,
        price: number,
        amount: number,
        imageUrl: string,
    }[],
    totalPrice: number,
    createdAt: Date,
    courierId: string,
    status: OrderStatus,
    approxTime: number,
    fullName: string,
    address: {
        city: string,
        countryOrRegion: string,
        houseNumber: number,
        street: string,
        apartmentNumbr?: number;
    },
    /**
     * Restaurant and delivery coordinates resolved once at checkout, so the
     * tracking map does not geocode both endpoints every time it opens.
     * Optional because orders placed before this field existed lack it.
     */
    route?: {
        restaurant?: GeoPoint | null,
        customer?: GeoPoint | null,
    } | null,
    cancelledAt?: string | null,
    cancelledBy?: "customer" | "restaurant" | "admin" | null,
    cancelReason?: string | null,
    refundedAt?: string | null,
    isSimulated?: boolean,
}

export type Address = {
    _id: string,
    label: string,
    street: string,
    houseNumber: number,
    apartmentNumbr?: number | null,
    city: string,
    countryOrRegion: string,
    isDefault: boolean,
}

export type OrderRating = {
    _id: string,
    orderId: string,
    sender: string,
    restaurantRating: number,
    courierRating?: number | null,
    comment?: string | null,
    courierId?: string | null,
}



export interface Restaurant {
    title: string,
    rating: number,
    place: string,
    categories: Omit<Category[], "All">,
    imageUrl: string,
    websiteUrl: string,
    phone: string,
    address: {
        city: string,
        street: string,
        houseNumber: string,
    },
    location?: GeoPoint | null,
    description: string,
    _id: string,
    startDay: string,
    endDay: string,
    startHour: string,
    endHour: string,
    reviews: string[],
}

export enum Category {
    All = "All Restaurants",
    FastFood = "Fast Food",
    FineDining = "Fine Dining",
    Healthy = "Healthy",
    Desserts = "Desserts",
}