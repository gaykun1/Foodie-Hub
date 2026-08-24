import { apiClient } from "@/lib/apiClient";
import type { Cart } from "@/redux/reduxTypes";

export const getCart = async (): Promise<Cart> => {
  const res = await apiClient.get(`/api/cart/`);
  return res.data;
};

export const addToCart = async (dishId: string): Promise<Cart> => {
  const res = await apiClient.post(`/api/cart/items`, { id: dishId });
  return res.data;
};

/**
 * `title` is not redundant with `dishId`: the server mirrors quantity changes
 * into any in-progress order draft, whose line items are keyed by title rather
 * than by dish id (see `updateCartAmount` in the cart controller).
 */
export const updateCartAmount = async (dishId: string, amount: number, title: string): Promise<void> => {
  await apiClient.patch(`/api/cart/items/${dishId}`, { amount, title });
};
