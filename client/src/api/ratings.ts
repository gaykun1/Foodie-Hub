import { apiClient } from "@/lib/apiClient";
import type { OrderRating } from "@/redux/reduxTypes";

export const getOrderRating = async (orderId: string): Promise<OrderRating> => {
  const res = await apiClient.get(`/api/rating/orders/${orderId}/rating`);
  return res.data;
};

export const createOrderRating = async (
  orderId: string,
  payload: { restaurantRating: number; courierRating?: number | null; comment?: string | null }
): Promise<OrderRating> => {
  const res = await apiClient.post(`/api/rating/orders/${orderId}/rating`, payload);
  return res.data;
};
