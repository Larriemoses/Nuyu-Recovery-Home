import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, startTransition, useContext, useEffect, useState, } from "react";
import { apiRequest } from "../../../lib/api/client";
import { supabase } from "../../../lib/supabase/client";
const AdminAuthContext = createContext(undefined);
async function loadAdminSession(accessToken) {
    return apiRequest("/admin/session", {
        accessToken,
    });
}
export function AdminAuthProvider({ children }) {
    const [state, setState] = useState({
        session: null,
        isLoading: true,
    });
    async function syncSession(session) {
        if (!supabase) {
            startTransition(() => {
                setState({
                    session: null,
                    isLoading: false,
                    errorMessage: "Supabase authentication is not configured in the client yet.",
                });
            });
            return {
                ok: false,
                message: "Supabase authentication is not configured in the client yet.",
            };
        }
        if (!session) {
            startTransition(() => {
                setState((current) => ({
                    session: null,
                    adminUser: undefined,
                    isLoading: false,
                    errorMessage: current.errorMessage,
                }));
            });
            return {
                ok: false,
            };
        }
        startTransition(() => {
            setState((current) => ({
                ...current,
                session,
                isLoading: true,
                errorMessage: undefined,
            }));
        });
        try {
            const { user } = await loadAdminSession(session.access_token);
            startTransition(() => {
                setState({
                    session,
                    adminUser: user,
                    isLoading: false,
                });
            });
            return {
                ok: true,
            };
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Unable to load the admin session.";
            await supabase.auth.signOut();
            startTransition(() => {
                setState({
                    session: null,
                    adminUser: undefined,
                    isLoading: false,
                    errorMessage: message,
                });
            });
            return {
                ok: false,
                message,
            };
        }
    }
    useEffect(() => {
        if (!supabase) {
            startTransition(() => {
                setState({
                    session: null,
                    adminUser: undefined,
                    isLoading: false,
                    errorMessage: "Supabase authentication is not configured in the client yet.",
                });
            });
            return;
        }
        let active = true;
        void supabase.auth
            .getSession()
            .then(({ data, error }) => {
            if (!active) {
                return;
            }
            if (error) {
                startTransition(() => {
                    setState({
                        session: null,
                        adminUser: undefined,
                        isLoading: false,
                        errorMessage: error.message,
                    });
                });
                return;
            }
            void syncSession(data.session);
        });
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) {
                return;
            }
            void syncSession(session);
        });
        return () => {
            active = false;
            data.subscription.unsubscribe();
        };
    }, []);
    const value = {
        ...state,
        accessToken: state.session?.access_token,
        hasSupabase: Boolean(supabase),
        isAuthenticated: Boolean(state.session),
        isAdmin: state.adminUser?.role === "admin",
        clearError() {
            startTransition(() => {
                setState((current) => ({
                    ...current,
                    errorMessage: undefined,
                }));
            });
        },
        async signIn(input) {
            if (!supabase) {
                return {
                    ok: false,
                    message: "Supabase authentication is not configured in the client yet.",
                };
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email: input.email,
                password: input.password,
            });
            if (error) {
                return {
                    ok: false,
                    message: error.message,
                };
            }
            if (!data.session) {
                return {
                    ok: false,
                    message: "Supabase did not return a usable admin session.",
                };
            }
            return syncSession(data.session);
        },
        async signOut() {
            if (!supabase) {
                startTransition(() => {
                    setState({
                        session: null,
                        adminUser: undefined,
                        isLoading: false,
                    });
                });
                return;
            }
            await supabase.auth.signOut();
            startTransition(() => {
                setState({
                    session: null,
                    adminUser: undefined,
                    isLoading: false,
                });
            });
        },
    };
    return (_jsx(AdminAuthContext.Provider, { value: value, children: children }));
}
export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error("useAdminAuth must be used inside the AdminAuthProvider.");
    }
    return context;
}
