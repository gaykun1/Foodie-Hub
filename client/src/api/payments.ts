import { apiClient } from "@/lib/apiClient";

export const createPaymentIntent = async (
  payload: Record<string, unknown>
): Promise<{ clientSecret: string }> => {
  const res = await apiClient.post(`/api/payment/payment-intent`, payload);
  return res.data;
};
