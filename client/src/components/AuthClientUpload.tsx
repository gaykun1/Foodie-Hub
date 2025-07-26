"use client"
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import { getCart } from '@/redux/cartSlice';
import { getInfo } from '@/redux/courierSlice';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// fetching data component every reload
const AuthClientUpload = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    useEffect(() => {
        const getUser = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
                    withCredentials: true,
                });
                dispatch(login(res.data.user));
                if (res.data.user.role === `courier`) {
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/profile`, { withCredentials: true });
                    if (res) {
                        dispatch(getInfo(res.data));
                    }
                }
            } catch {
                router.push("/auth/login");
            }
        }
        getUser();

    }, [router]);


    // func for fetching profile + courierPrfoile + cart
    useEffect(() => {
        const fetchData = async () => {
            try {


                const cartRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/`, {
                    withCredentials: true,
                });
                dispatch(getCart(cartRes.data));

            } catch (err) {
                if (isAxiosError(err) && err.response) {

                    console.error(err.response.data);
                }
            }
        };

        fetchData();
    }, [dispatch]);



    return null;
}

export default AuthClientUpload