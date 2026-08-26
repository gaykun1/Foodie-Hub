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

/*
 * In-flight request tracking, used to tell the user when the backend is cold.
 *
 * The API is hosted on a free tier that suspends the service after a stretch of
 * inactivity, so the first request after a lull waits ~50s for the container to
 * boot while every subsequent one answers in ~200ms. Without this the app just
 * shows skeleton placeholders for a minute and reads as broken.
 *
 * `pendingSince` is the moment the app started waiting *continuously* — it is
 * set when the in-flight count goes 0 -> 1 and cleared when it returns to 0, so
 * a burst of parallel requests counts as one wait rather than restarting the
 * clock. Deliberately a module-level store rather than redux state: this is
 * transport-layer bookkeeping, it changes on every request, and nothing outside
 * the notice below needs to render from it.
 */
let pendingCount = 0;
let pendingSince: number | null = null;
const pendingListeners = new Set<() => void>();

const notifyPendingListeners = (): void => {
  for (const listener of pendingListeners) listener();
};

/** Subscribe to changes in whether the app is waiting on the backend. */
export const subscribeToPendingRequests = (listener: () => void): (() => void) => {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
};

/** Timestamp the app began continuously waiting on the backend, or null if idle. */
export const getPendingSince = (): number | null => pendingSince;

apiClient.interceptors.request.use((config) => {
  pendingCount += 1;
  if (pendingCount === 1) {
    pendingSince = Date.now();
    notifyPendingListeners();
  }
  return config;
});

const settleRequest = (): void => {
  // Guarded against going negative: a request rejected *before* the request
  // interceptor ran would otherwise settle without ever having been counted.
  pendingCount = Math.max(0, pendingCount - 1);
  if (pendingCount === 0 && pendingSince !== null) {
    pendingSince = null;
    notifyPendingListeners();
  }
};

apiClient.interceptors.response.use(
  (response) => {
    settleRequest();
    return response;
  },
  (error) => {
    settleRequest();
    return Promise.reject(error);
  }
);

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
