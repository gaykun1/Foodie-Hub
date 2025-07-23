import { Category, Restaurant, User } from "@/redux/reduxTypes";
import axios, { isAxiosError } from "axios";


export const SignUp = async (password: string, username: string): Promise<User | void> => {
    try {
        const res = await axios.post("http://localhost:5200/api/auth/signup", { username, password }, { withCredentials: true });
        if (!res) return;
        return res.data;
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            console.log(err.response.data.message);
        }
    }
}
export const LogIn = async (password: string, username: string): Promise<User | void> => {
    try {
        const res = await axios.post("http://localhost:5200/api/auth/login", { username, password }, { withCredentials: true });
        if (!res) return;
        return res.data;
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            console.log(err.response.data.message);
        }
    }
}

export const LogOut = async (): Promise<void> => {
    try {
        const res = await axios.post("http://localhost:5200/api/auth/logout", {}, { withCredentials: true });
        if (!res) return;
        return res.data;
    } catch (err) {
        console.error(err);
    }
}
export const getRestaurantsFiltered = async (categorie: string): Promise<void | Restaurant[]> => {
    try {
        if (!categorie) return;
        const res = await axios.get(`http://localhost:5200/api/restaurant/restaurants/filter?categorie=${encodeURIComponent(categorie)}`,);
        if (!res) return;
        return res.data;
    } catch (err) {
        console.error(err);
    }
}



