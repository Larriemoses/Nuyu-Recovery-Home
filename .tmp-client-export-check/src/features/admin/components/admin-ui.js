import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const accentClasses = {
    primary: "bg-[rgba(47,93,50,0.1)] text-[var(--nuyu-primary)]",
    gold: "bg-[rgba(169,131,24,0.12)] text-[var(--nuyu-gold)]",
    muted: "bg-[rgba(69,87,72,0.1)] text-[var(--nuyu-muted)]",
};
export function AdminPanel({ eyebrow, title, description, actions, footer, className, contentClassName, children, }) {
    return (_jsxs("section", { className: [
            "admin-panel rounded-2xl p-4 sm:p-5 lg:p-6",
            className ?? "",
        ].join(" "), children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [eyebrow ? (_jsx("p", { className: "text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]", children: eyebrow })) : null, _jsx("h2", { className: "mt-2 text-[1.18rem] font-semibold tracking-[-0.03em] text-[var(--nuyu-ink)] sm:text-[1.32rem]", children: title }), description ? (_jsx("p", { className: "mt-2 max-w-3xl text-sm leading-6 text-[var(--nuyu-muted)]", children: description })) : null] }), actions ? _jsx("div", { className: "shrink-0", children: actions }) : null] }), _jsx("div", { className: ["mt-4", contentClassName ?? ""].join(" "), children: children }), footer ? _jsx("div", { className: "mt-4", children: footer }) : null] }));
}
export function AdminMetricCard({ label, value, helper, accent = "muted", }) {
    return (_jsxs("article", { className: "admin-metric-card h-full rounded-[1.35rem] p-4 sm:p-5", children: [_jsx("div", { className: [
                    "inline-flex rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em]",
                    accentClasses[accent],
                ].join(" "), children: label }), _jsx("div", { className: "mt-4 break-words text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-[2rem]", children: value }), helper ? (_jsx("p", { className: "mt-2 text-sm leading-6 text-[var(--nuyu-muted)]", children: helper })) : null] }));
}
export function AdminActionTile({ title, description, meta, className, }) {
    return (_jsxs("div", { className: [
            "admin-quiet-card rounded-[1.35rem] p-4 text-sm text-[var(--nuyu-muted)]",
            className ?? "",
        ].join(" "), children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: "font-semibold text-[var(--nuyu-ink)]", children: title }), meta ? (_jsx("span", { className: "rounded-full bg-white/80 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--nuyu-muted)]", children: meta })) : null] }), _jsx("p", { className: "mt-2 leading-6", children: description })] }));
}
