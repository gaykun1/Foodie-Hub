"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthType, ICourier, User } from "./reduxTypes";

type initialStateType = {
    courier: ICourier | null,

}
const initialState:initialStateType= {
    courier: null
}

const courierSlice = createSlice({
    name: "courier",
    initialState,
    reducers: {
        getInfo: (state, action: PayloadAction<ICourier>) => {

            state.courier = action.payload
        },


    }
})



export const { getInfo } = courierSlice.actions;

export default courierSlice.reducer;