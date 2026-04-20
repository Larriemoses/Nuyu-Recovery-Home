import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "./helpers";
const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-6 w-6 border-[2.5px]",
};
export function Spinner({ size = "md", className, label = "Loading", }) {
    return (_jsx("span", { role: "status", "aria-label": label, className: cn("inline-flex items-center justify-center", className), children: _jsx("span", { className: cn("inline-block animate-spin rounded-full border-[var(--color-border)] border-t-current", sizeClasses[size]) }) }));
}
