import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "../context/admin-auth-provider";

export function AdminAuthScope() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}
