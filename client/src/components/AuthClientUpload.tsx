"use client"
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login } from '@/redux/authSlice';
import axios from 'axios';
import { useEffect } from 'react';

const AuthClientUpload = () => {
    const dispatch = useAppDispatch();



    useEffect(() => {
        const getProfile = async () => {
            try {
                const res = await axios.get("http://localhost:5200/api/auth/profile", {
                    withCredentials: true
                });
                dispatch(login(res.data.user));
            } catch (err) {
                console.error(err);
            }
        };
        getProfile();
    }, [dispatch]);



    return null;
}

export default AuthClientUpload