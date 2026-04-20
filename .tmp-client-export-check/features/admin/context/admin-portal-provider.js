import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, startTransition, useContext, useEffect, useState, } from "react";
import { apiRequest } from "../../../lib/api/client";
import { useAdminAuth } from "./admin-auth-provider";
const AdminPortalContext = createContext(undefined);
export function AdminPortalProvider({ children }) {
    const { accessToken } = useAdminAuth();
    const [state, setState] = useState({
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
            const data = await apiRequest("/admin/dashboard", {
                accessToken,
            });
            startTransition(() => {
                setState({
                    data,
                    isLoading: false,
                });
            });
        }
        catch (error) {
            startTransition(() => {
                setState({
                    data: undefined,
                    isLoading: false,
                    errorMessage: error instanceof Error
                        ? error.message
                        : "Unable to load the admin dashboard.",
                });
            });
        }
    }
    useEffect(() => {
        void loadDashboard();
    }, [accessToken]);
    return (_jsx(AdminPortalContext.Provider, { value: {
            ...state,
            refresh: loadDashboard,
        }, children: children }));
}
export function useAdminPortal() {
    const context = useContext(AdminPortalContext);
    if (!context) {
        throw new Error("useAdminPortal must be used inside the AdminPortalProvider.");
    }
    return context;
}
