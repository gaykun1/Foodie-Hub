"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthType, User } from "./reduxTypes";

const initialState: AuthType = {
    user: null,
    isAuthenticated: false,
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action: PayloadAction<User>) => {

            state.user = action.payload
            state.isAuthenticated = true;
        },
        logout: (state) => {

            state.user = null;
            state.isAuthenticated = false;
        },
        updateFavourites:(state, action: PayloadAction<string[]>)=>{
           if(state.user)
            state.user.favourites = action.payload;
        }
       
    }
})



export const { login ,logout,updateFavourites} = authSlice.actions;

export default authSlice.reducer;