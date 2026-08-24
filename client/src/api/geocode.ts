import { apiClient } from "@/lib/apiClient";

export interface GeocodeResult {
  lat: string;
  lon: string;
}

/**
 * Fallback only. Orders now persist the restaurant and delivery coordinates at
 * checkout (see `Order.route` on the server), so tracking no longer geocodes
 * every time it opens. This remains for orders saved before that field existed.
 */
export const geocodeAddress = async (query: string): Promise<[number, number] | null> => {
  const res = await apiClient.get<GeocodeResult[]>(`/api/geocode`, { params: { q: query } });
  const first = res.data?.[0];
  if (!first) return null;
  return [Number(first.lat), Number(first.lon)];
};
