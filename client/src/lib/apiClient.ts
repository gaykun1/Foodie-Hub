import axios, { AxiosError, isAxiosError } from "axios";

/**
 * Single axios instance every client-side request goes through.
 *
 * Previously each component built its own `${process.env.NEXT_PUBLIC_API_URL}/...`
 * string and passed `withCredentials: true` by hand, which meant a missing flag
 * silently produced an unauthenticated request and a typo in the base URL only
 * showed up at runtime. Centralising it also gives us one place to attach
 * interceptors (see `isUnauthorized` below) and one place to swap transport.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

/** True when a rejected request failed because the caller is not signed in. */
export const isUnauthorized = (err: unknown): boolean =>
  isAxiosError(err) && err.response?.status === 401;

/** True when the resource simply does not exist yet — an empty state, not an error. */
export const isNotFound = (err: unknown): boolean =>
  isAxiosError(err) && err.response?.status === 404;

/**
 * Human-readable message for a failed request, falling back through the shapes
 * this API actually returns: `{ message }`, a bare JSON string, then the axios
 * error itself.
 */
export const errorMessage = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (isAxiosError(err)) {
    const data = (err as AxiosError<unknown>).response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    if (!err.response) return "Cannot reach the server. Please check your connection.";
  }
  return fallback;
};

export { isAxiosError };
