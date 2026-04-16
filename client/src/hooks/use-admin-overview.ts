import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "../lib/api/client";
import type { AdminOverviewResponse } from "../types/booking";

type AdminOverviewState = {
  data?: AdminOverviewResponse;
  isLoading: boolean;
  errorMessage?: string;
};

export function useAdminOverview(accessToken?: string) {
  const [state, setState] = useState<AdminOverviewState>({
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      if (!accessToken) {
        startTransition(() => {
          setState({
            isLoading: false,
          });
        });
        return;
      }

      try {
        const data = await apiRequest<AdminOverviewResponse>("/reports/overview", {
          accessToken,
        });

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setState({
            data,
            isLoading: false,
          });
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setState({
            isLoading: false,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Unable to load the admin overview.",
          });
        });
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return state;
}
