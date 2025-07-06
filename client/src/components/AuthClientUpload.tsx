"use client"
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import { getCart } from '@/redux/cartSlice';
import { Cart } from '@/redux/reduxTypes';
import axios from 'axios';
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

                const cartRes = await axios.get("http://localhost:5200/api/cart/get-cart", {
                    withCredentials: true,
                });
                dispatch(getCart(cartRes.data));
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [dispatch]);



    return null;
}

export default AuthClientUpload