import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import RestaurantReducer from "./restaurantSlice";


export const store = configureStore({
    reducer:{
        auth:authReducer,
        restaurants:RestaurantReducer
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;