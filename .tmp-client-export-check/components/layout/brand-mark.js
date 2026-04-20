import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const styles = {
    sm: {
        container: "gap-3",
        image: "h-12 w-12",
        title: "text-base leading-5 sm:text-xl sm:leading-normal",
        subtitle: "hidden text-[0.62rem] tracking-[0.34em] sm:block",
    },
    md: {
        container: "gap-4",
        image: "h-16 w-16",
        title: "text-2xl sm:text-3xl",
        subtitle: "text-[0.66rem] tracking-[0.38em]",
    },
    lg: {
        container: "gap-5",
        image: "h-20 w-20 sm:h-24 sm:w-24",
        title: "text-3xl sm:text-4xl",
        subtitle: "text-[0.72rem] tracking-[0.42em]",
    },
};
export function BrandMark({ size = "md", align = "left", subtitle = "Post-op stays, wellness recovery, and private care", tone = "default", }) {
    const selected = styles[size];
    return (_jsxs("div", { className: [
            "flex items-center",
            selected.container,
            align === "center" ? "justify-center text-center" : "text-left",
        ].join(" "), children: [_jsx("img", { src: "/nuyu-logo.jpeg", alt: "Nuyu Recovery Home logo", className: `${selected.image} rounded-full border border-[rgba(227,199,84,0.18)] object-cover shadow-[0_18px_40px_rgba(35,72,38,0.16)]` }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-[var(--nuyu-gold)]", children: "Nuyu Recovery Home" }), _jsx("p", { className: [
                            "display-font mt-1 font-semibold",
                            tone === "inverse" ? "text-[var(--nuyu-cream)]" : "text-[var(--nuyu-ink)]",
                            selected.title,
                        ].join(" "), children: "Private recovery made calm, structured, and beautiful" }), _jsx("p", { className: [
                            "mt-2",
                            tone === "inverse"
                                ? "text-[rgba(255,253,246,0.82)]"
                                : "text-[var(--nuyu-muted)]",
                            selected.subtitle,
                        ].join(" "), children: subtitle })] })] }));
}
