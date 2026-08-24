import { apiClient } from "@/lib/apiClient";
import type { Cart, Order } from "@/redux/reduxTypes";

export const createOrder = async (cart: Cart): Promise<string> => {
  const res = await apiClient.post(`/api/order/orders`, { cart });
  return res.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get(`/api/order/orders`);
  return res.data;
};

export const getOrder = async (id: string): Promise<Order> => {
  const res = await apiClient.get(`/api/order/orders/${id}`);
  return res.data;
};

export interface FinalizeOrderPayload {
  formData: Record<string, unknown>;
  shipping: number;
  cartId: string;
  percent: number;
  paymentIntentId: string;
}

export const finalizeOrder = async (payload: FinalizeOrderPayload): Promise<void> => {
  await apiClient.patch(`/api/order/orders`, payload);
};

export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
  await apiClient.patch(`/api/order/orders/${id}/cancel`, { reason });
};

export const cancelOrderAsRestaurant = async (id: string, reason?: string): Promise<void> => {
  await apiClient.patch(`/api/order/orders/${id}/cancel/restaurant`, { reason });
};

export const cancelOrderAsAdmin = async (id: string, reason?: string): Promise<void> => {
  await apiClient.patch(`/api/order/orders/${id}/cancel/admin`, { reason });
};

export const getIncomingOrders = async (restaurantId: string): Promise<Order[]> => {
  const res = await apiClient.get(`/api/order/orders/${restaurantId}/created`);
  return res.data;
};

export const acceptOrder = async (orderId: string): Promise<void> => {
  await apiClient.patch(`/api/order/orders/${orderId}/status`, {});
};

export const getRecentOrders = async (restaurantId?: string): Promise<Order[]> => {
  const url = restaurantId
    ? `/api/order/restaurants/${restaurantId}/orders/recent`
    : `/api/order/orders/recent`;
  const res = await apiClient.get(url);
  return res.data;
};

export interface OrderStatistics {
  numOfOrders: { number: number; percent: number };
  totalRevenue: { number: number; percent: number };
  averageOrderValue: { number: number; percent: number };
}

export const getStatistics = async (restaurantId?: string): Promise<OrderStatistics> => {
  const res = await apiClient.get(`/api/order/orders/statistics`, {
    params: restaurantId ? { id: restaurantId } : undefined,
  });
  return res.data;
};

export const getCourierOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get(`/api/order/couriers/orders`);
  return res.data;
};

export const getFreeOrders = async (city: string): Promise<Order[]> => {
  const res = await apiClient.get(`/api/order/free-orders/${encodeURIComponent(city)}`);
  return res.data;
};
