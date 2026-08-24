import { apiClient } from "@/lib/apiClient";

export interface Promocode {
  _id: string;
  code: string;
  discountPercent: number;
  expiresAt?: string;
}

export const createPromocode = async (payload: Record<string, unknown>): Promise<Promocode> => {
  const res = await apiClient.post(`/api/promocode/promocodes`, payload);
  return res.data;
};

export const claimPromocode = async (code: string): Promise<Promocode> => {
  const res = await apiClient.post(`/api/promocode/promocodes/${encodeURIComponent(code)}`, {});
  return res.data;
};

/** Redeems a one-time "Special" code; resolves to the extra percent it grants. */
export const usePromocode = async (code: string): Promise<number> => {
  const res = await apiClient.post<{ discount: number }>(
    `/api/promocode/promocodes/${encodeURIComponent(code)}/use`,
    {}
  );
  return res.data.discount;
};
