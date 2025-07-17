"use client"
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import { getCart } from '@/redux/cartSlice';
import { getInfo } from '@/redux/courierSlice';
import { Cart } from '@/redux/reduxTypes';
import axios, { isAxiosError } from 'axios';
import { useEffect } from 'react';

const AuthClientUpload = () => {
    const dispatch = useAppDispatch();



    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://localhost:5200/api/auth/profile", {
                    withCredentials: true,
                });
                dispatch(login(res.data.user));
                if (res.data.user.role === "courier") {
                    const res = await axios.get("http://localhost:5200/api/courier/get-courier-profile", { withCredentials: true });
                    if (res) {
                        dispatch(getInfo(res.data));
                    }
                }
                
                const cartRes = await axios.get("http://localhost:5200/api/cart/get-cart", {
                    withCredentials: true,
                });
                dispatch(getCart(cartRes.data));

            } catch (err) {
                if(isAxiosError(err) && err.response){

                    console.error(err.response.data);
                }
            }
        };

        fetchData();
    }, [dispatch]);



    return null;
}

export default AuthClientUpload