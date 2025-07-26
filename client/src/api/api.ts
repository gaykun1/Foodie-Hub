import {  Restaurant } from "@/redux/reduxTypes";
import axios, { isAxiosError } from "axios";


export const SignUp = async (password: string, username: string): Promise<number | void> => {
    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, { username, password }, { withCredentials: true });
        if (!res) return;
        return res.status;
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            console.log(err.response.data.message);
        }
    }
}
export const LogIn = async (password: string, username: string): Promise<number|void> => {
    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, { username, password }, { withCredentials: true });
        if (!res) return;
        return res.status;
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            console.log(err.response.data.message);
            return err.response.status;
        }
    }
}

export const LogOut = async (): Promise<void> => {
    try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {}, { withCredentials: true });
        if (!res) return;
        return res.data;
    } catch (err) {
        console.error(err);
    }
}
export const getRestaurantsFiltered = async (categorie: string): Promise<void | Restaurant[]> => {
    try {
        if (!categorie) return;
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/filter?categorie=${encodeURIComponent(categorie)}`,);
        if (!res) return;
        return res.data;
    } catch (err) {
        console.error(err);
    }
}



