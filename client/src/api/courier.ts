import { apiClient } from "@/lib/apiClient";
import type { ICourier, Order } from "@/redux/reduxTypes";
import type { OrderStatus } from "@/lib/orderStatus";

export const getCourierProfile = async (): Promise<ICourier> => {
  const res = await apiClient.get(`/api/courier/profile`);
  return res.data;
};

export const createApplication = async (payload: Record<string, unknown>) => {
  const res = await apiClient.post(`/api/courier/applications`, payload);
  return res.data;
};

export const getApplicationStatus = async () => {
  const res = await apiClient.get(`/api/courier/applications/status`);
  return res.data;
};

export const getApplications = async (): Promise<ICourier[]> => {
  const res = await apiClient.get(`/api/courier/applications`);
  return res.data;
};

export const decideApplication = async (id: string, payload: Record<string, unknown>) => {
  const res = await apiClient.post(`/api/courier/applications/${id}`, payload);
  return res.data;
};

export const takeOrder = async (orderId: string): Promise<Order> => {
  const res = await apiClient.post(`/api/courier/orders/${orderId}/take`, {});
  return res.data;
};

export const getCurrentOrder = async (): Promise<Order | null> => {
  const res = await apiClient.get(`/api/courier/orders/status`);
  return res.data;
};

export const changeOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  await apiClient.patch(`/api/courier/orders/${orderId}/status`, { status });
};
