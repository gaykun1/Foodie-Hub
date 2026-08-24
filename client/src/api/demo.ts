import { apiClient } from "@/lib/apiClient";

/**
 * Demo-only endpoints. The server 404s all of these unless DEMO_SIMULATION is
 * enabled, so callers must treat failure as "not available" rather than as an
 * error worth surfacing.
 */

export const getDemoStatus = async (): Promise<{ simulationEnabled: boolean }> => {
  try {
    const res = await apiClient.get(`/api/demo/status`);
    return res.data;
  } catch {
    return { simulationEnabled: false };
  }
};

/** Asks the server to walk this order through its lifecycle on a timer. */
export const simulateDelivery = async (orderId: string): Promise<void> => {
  await apiClient.post(`/api/demo/orders/${orderId}/simulate`, {});
};

export const stopSimulation = async (orderId: string): Promise<void> => {
  await apiClient.delete(`/api/demo/orders/${orderId}/simulate`);
};
