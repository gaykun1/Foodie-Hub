

export interface User {
    username: string,
    favourites: string[] | null,
    role: string,
    email: string,
    phoneNumber: string,
}



export interface AuthType {
    user: User | null;
    isAuthenticated: boolean;

}

export type Dish = {
    title: string,
    description: string,
    price: number,
    imageUrl: string,
    _id: string,
    typeOfFood: string,
}

export type Review = {
    sender: {
        username: string,
    },
    text: string,
    rating: number,
    restaurantId?: string,


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

export type Order = {
    restaurantTitle: string,
    restaurantImage: string,
    _id: string,
    items: {
        title: string,
        price: number,
        amount: number,
        imageUrl: string,
    }[],
    totalPrice: number,
    createdAt: Date,

    status: "Delivering" | "Delivered" | "Processing" | "Preparing",
    approxTime: number,
    fullName: string,
    adress: {
        city: string,
        countryOrRegion: string,
        houseNumber: number,
        street: string,
        apartmentNumbr?: number;
    }
}



export interface Restaurant {
    title: string,
    rating: number,
    place: string,
    categories: Omit<Category[], "All">,
    imageUrl: string,
    websiteUrl: string,
    phone: string,
    adress: string,
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