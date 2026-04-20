import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "../lib/api/client";
export function useAdminOverview(accessToken) {
    const [state, setState] = useState({
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
                const data = await apiRequest("/reports/overview", {
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
            }
            catch (error) {
                if (cancelled) {
                    return;
                }
                startTransition(() => {
                    setState({
                        isLoading: false,
                        errorMessage: error instanceof Error
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
