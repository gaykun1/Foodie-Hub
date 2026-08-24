import { apiClient } from "@/lib/apiClient";
import type { Address } from "@/redux/reduxTypes";

export const getAddresses = async (): Promise<Address[]> => {
  const res = await apiClient.get(`/api/address/addresses`);
  return res.data;
};

export const createAddress = async (payload: Omit<Address, "_id">): Promise<Address> => {
  const res = await apiClient.post(`/api/address/addresses`, payload);
  return res.data;
};

export const updateAddress = async (id: string, payload: Partial<Address>): Promise<Address> => {
  const res = await apiClient.patch(`/api/address/addresses/${id}`, payload);
  return res.data;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/address/addresses/${id}`);
};
