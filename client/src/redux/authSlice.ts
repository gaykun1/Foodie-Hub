"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./reduxTypes";

/**
 * `status` exists so the UI can tell "we haven't asked the server yet" apart
 * from "we asked, and this visitor is not signed in". Without that distinction
 * every consumer had to treat the initial render as logged-out, which is why
 * the app used to bounce visitors to /auth/login before the profile request
 * had even resolved.
 */
export type AuthStatus = "loading" | "guest" | "authenticated";

interface AuthType {
    user: User | null;
    isAuthenticated: boolean;
    status: AuthStatus;
}

const initialState: AuthType = {
    user: null,
    isAuthenticated: false,
    status: "loading",
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action: PayloadAction<User>) => {
            state.user = action.payload
            state.isAuthenticated = true;
            state.status = "authenticated";
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.status = "guest";
        },
        /** The profile probe came back 401 (or failed) — this is an anonymous visitor. */
        setGuest: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.status = "guest";
        },
        updateFavourites: (state, action: PayloadAction<string[]>) => {
            if (state.user)
                state.user.favourites = action.payload;
        }
    }
})

export const { login, logout, setGuest, updateFavourites } = authSlice.actions;

export default authSlice.reducer;
