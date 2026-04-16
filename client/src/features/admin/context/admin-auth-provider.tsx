import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "../../../lib/api/client";
import { supabase } from "../../../lib/supabase/client";
import type { AdminIdentity, AdminSessionResponse } from "../../../types/admin";

type SignInInput = {
  email: string;
  password: string;
};

type SignInResult = {
  ok: boolean;
  message?: string;
};

type AdminAuthState = {
  session: Session | null;
  adminUser?: AdminIdentity;
  isLoading: boolean;
  errorMessage?: string;
};

type AdminAuthContextValue = AdminAuthState & {
  accessToken?: string;
  hasSupabase: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  clearError: () => void;
  signIn: (input: SignInInput) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

async function loadAdminSession(accessToken: string) {
  return apiRequest<AdminSessionResponse>("/admin/session", {
    accessToken,
  });
}

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AdminAuthState>({
    session: null,
    isLoading: true,
  });

  async function syncSession(session: Session | null) {
    if (!supabase) {
      startTransition(() => {
        setState({
          session: null,
          isLoading: false,
          errorMessage:
            "Supabase authentication is not configured in the client yet.",
        });
      });

      return {
        ok: false,
        message: "Supabase authentication is not configured in the client yet.",
      } satisfies SignInResult;
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
      } satisfies SignInResult;
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
      } satisfies SignInResult;
    } catch (error) {
      const message =
        error instanceof Error
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
      } satisfies SignInResult;
    }
  }

  useEffect(() => {
    if (!supabase) {
      startTransition(() => {
        setState({
          session: null,
          adminUser: undefined,
          isLoading: false,
          errorMessage:
            "Supabase authentication is not configured in the client yet.",
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

  const value: AdminAuthContextValue = {
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

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside the AdminAuthProvider.");
  }

  return context;
}
