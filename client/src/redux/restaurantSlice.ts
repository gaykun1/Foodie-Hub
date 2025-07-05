import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Restaurant } from "./reduxTypes";

type initialType = {
    restaurants: Restaurant[] | null;
}

const initialState: initialType = {
    restaurants: null,
}

const restaurantsSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers: {
        getRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
            state.restaurants = action.payload;
        }
    }

})

export const {getRestaurants} = restaurantsSlice.actions;
export default restaurantsSlice.reducer;