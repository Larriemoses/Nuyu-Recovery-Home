import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "../context/admin-auth-provider";
export function AdminAuthScope() {
    return (_jsx(AdminAuthProvider, { children: _jsx(Outlet, {}) }));
}
