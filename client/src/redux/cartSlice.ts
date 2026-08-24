import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cart } from "./reduxTypes";

type initialStateType = {
    cart: Cart | null,
}

const initialState: initialStateType = {
    cart: null,
}
const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        // Accepts null so an emptied guest cart can clear the badge without a
        // separate action — `toCartShape` returns null for an empty basket.
        getCart: (state, action: PayloadAction<Cart | null>) => {
            state.cart = action.payload;
        },
        updateAmount: (state, action: PayloadAction<{ dishId: string; amount: number }>) => {
            if (!state.cart) return;

            const item = state.cart.items.find(item => item.dishId._id === action.payload.dishId);
            if (item) {
                item.amount = action.payload.amount;
            }
        },
        deleteItem: (state, action: PayloadAction<string>) => {
            if (!state.cart) return;

            state.cart.items = state.cart.items.filter(item => item.dishId.title !== action.payload);
        }
    }
})

export const { getCart, updateAmount, deleteItem } = cartSlice.actions;
export default cartSlice.reducer;
