import { apiClient, isAxiosError } from "@/lib/apiClient";
import type { User } from "@/redux/reduxTypes";

/**
 * Signup/login resolve to a status code rather than throwing, because both
 * screens branch on 403 "username taken" / 404 "bad credentials" as ordinary
 * form states rather than as errors.
 */
const statusOf = async (request: Promise<{ status: number }>): Promise<number | void> => {
  try {
    const res = await request;
    return res.status;
  } catch (err) {
    if (isAxiosError(err) && err.response) return err.response.status;
  }
};

export const SignUp = (password: string, username: string): Promise<number | void> =>
  statusOf(apiClient.post(`/api/auth/signup`, { username, password }));

export const LogIn = (password: string, username: string): Promise<number | void> =>
  statusOf(apiClient.post(`/api/auth/login`, { username, password }));

export const logOut = async (): Promise<void> => {
  await apiClient.post(`/api/auth/logout`, {});
};

export const getProfile = async (): Promise<User> => {
  const res = await apiClient.get(`/api/auth/profile`);
  return res.data.user;
};

export const getRole = async (): Promise<string> => {
  const res = await apiClient.get(`/api/auth/profile/roles`);
  return res.data.role;
};

export const updateProfile = async (payload: Record<string, unknown>): Promise<User> => {
  const res = await apiClient.patch(`/api/auth/profile`, payload);
  return res.data.user ?? res.data;
};
