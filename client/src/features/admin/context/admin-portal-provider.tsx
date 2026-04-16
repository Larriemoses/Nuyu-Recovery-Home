import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { apiRequest } from "../../../lib/api/client";
import type { AdminDashboardResponse } from "../../../types/admin";
import { useAdminAuth } from "./admin-auth-provider";

type AdminPortalContextValue = {
  data?: AdminDashboardResponse;
  isLoading: boolean;
  errorMessage?: string;
  refresh: () => Promise<void>;
};

const AdminPortalContext = createContext<AdminPortalContextValue | undefined>(
  undefined,
);

export function AdminPortalProvider({ children }: PropsWithChildren) {
  const { accessToken } = useAdminAuth();
  const [state, setState] = useState<{
    data?: AdminDashboardResponse;
    isLoading: boolean;
    errorMessage?: string;
  }>({
    isLoading: true,
  });

  async function loadDashboard() {
    if (!accessToken) {
      startTransition(() => {
        setState({
          isLoading: false,
          data: undefined,
          errorMessage: "Admin access token is missing.",
        });
      });
      return;
    }

    startTransition(() => {
      setState((current) => ({
        ...current,
        isLoading: true,
        errorMessage: undefined,
      }));
    });

    try {
      const data = await apiRequest<AdminDashboardResponse>("/admin/dashboard", {
        accessToken,
      });

      startTransition(() => {
        setState({
          data,
          isLoading: false,
        });
      });
    } catch (error) {
      startTransition(() => {
        setState({
          data: undefined,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load the admin dashboard.",
        });
      });
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [accessToken]);

  return (
    <AdminPortalContext.Provider
      value={{
        ...state,
        refresh: loadDashboard,
      }}
    >
      {children}
    </AdminPortalContext.Provider>
  );
}

export function useAdminPortal() {
  const context = useContext(AdminPortalContext);

  if (!context) {
    throw new Error("useAdminPortal must be used inside the AdminPortalProvider.");
  }

  return context;
}
