"use client"
import { useAppDispatch } from '@/hooks/reduxHooks';
import { login, setGuest } from '@/redux/authSlice';
import { getCart } from '@/redux/cartSlice';
import { getInfo } from '@/redux/courierSlice';
import { apiClient } from '@/lib/apiClient';
import { mergeGuestCartIntoAccount } from '@/hooks/useCart';
import { readGuestCart, toCartShape } from '@/lib/guestCart';
import { useEffect } from 'react';

/**
 * Resolves the visitor's session once per page load and puts the result in the
 * store. It deliberately does **not** navigate anywhere: browsing restaurants
 * and menus is public, so a 401 here means "this is a guest", not "send them to
 * the login screen". Pages that genuinely require an account gate themselves
 * with <RequireAuth>, and actions that require one use `useRequireAuth()`.
 */
const AuthClientUpload = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        let cancelled = false;

        const loadSession = async () => {
            let user;
            try {
                const res = await apiClient.get(`/api/auth/profile`);
                user = res.data.user;
            } catch {
                // Anonymous visitor (or the API is unreachable) — either way there
                // is no session to load, and browsing continues normally. Any
                // basket they built as a guest is restored from localStorage.
                if (!cancelled) {
                    dispatch(setGuest());
                    dispatch(getCart(toCartShape(readGuestCart())));
                }
                return;
            }

            if (cancelled) return;
            dispatch(login(user));

            // The cart and courier profile are both session-scoped, so they are
            // only worth fetching once we know there *is* a session.
            if (user.role === 'courier') {
                try {
                    const courierRes = await apiClient.get(`/api/courier/profile`);
                    if (!cancelled) dispatch(getInfo(courierRes.data));
                } catch {
                    // A courier account whose application is still pending has no
                    // courier profile yet; the courier pages handle that state.
                }
            }

            // Anything the visitor put in a basket before signing in is replayed
            // onto their account cart, so signing in at checkout never loses it.
            await mergeGuestCartIntoAccount();

            try {
                const cartRes = await apiClient.get(`/api/cart/`);
                if (!cancelled) dispatch(getCart(cartRes.data));
            } catch {
                // An empty/absent cart is not an error worth surfacing on load.
            }
        };

        void loadSession();
        return () => { cancelled = true; };
    }, [dispatch]);

    return null;
}

export default AuthClientUpload
