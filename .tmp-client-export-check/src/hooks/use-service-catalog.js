import { startTransition, useEffect, useState } from "react";
import { serviceCatalog } from "../features/services/data/service-catalog";
import { supabase } from "../lib/supabase/client";
const initialState = {
    services: serviceCatalog,
    source: "fallback",
    isLoading: true,
};
function normalizeService(row) {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        bookingKind: row.booking_kind,
        basePriceKobo: row.base_price_kobo,
        durationMinutes: row.duration_minutes ?? undefined,
        minStayDays: row.min_stay_days ?? undefined,
        maxStayDays: row.max_stay_days ?? undefined,
        sessionsCount: row.service_packages?.[0]?.sessions_count,
        sortOrder: row.sort_order ?? undefined,
        packages: row.service_packages?.map((item) => ({
            id: item.id,
            label: item.label,
            sessionsCount: item.sessions_count,
            packagePriceKobo: item.package_price_kobo,
        })),
    };
}
export function useServiceCatalog() {
    const [state, setState] = useState(initialState);
    useEffect(() => {
        let cancelled = false;
        async function loadCatalog() {
            if (!supabase) {
                startTransition(() => {
                    if (!cancelled) {
                        setState({
                            services: serviceCatalog,
                            source: "fallback",
                            isLoading: false,
                            errorMessage: "The live service list is not available in this browser session yet, so the page is showing the starter service list.",
                        });
                    }
                });
                return;
            }
            const { data, error } = await supabase
                .from("services")
                .select("id, slug, name, summary, booking_kind, base_price_kobo, duration_minutes, min_stay_days, max_stay_days, sort_order, service_packages ( id, label, sessions_count, package_price_kobo )")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });
            if (cancelled) {
                return;
            }
            if (error) {
                startTransition(() => {
                    setState({
                        services: serviceCatalog,
                        source: "fallback",
                        isLoading: false,
                        errorMessage: error.code === "PGRST205"
                            ? "The live service list is not fully ready yet, so the starter service list is being shown for now."
                            : `The live service list could not be loaded right now: ${error.message}`,
                    });
                });
                return;
            }
            if (!data?.length) {
                startTransition(() => {
                    setState({
                        services: serviceCatalog,
                        source: "fallback",
                        isLoading: false,
                        errorMessage: "No live services were found yet, so the starter service list is being shown.",
                    });
                });
                return;
            }
            startTransition(() => {
                setState({
                    services: data.map((row) => normalizeService(row)),
                    source: "supabase",
                    isLoading: false,
                });
            });
        }
        void loadCatalog();
        return () => {
            cancelled = true;
        };
    }, []);
    return state;
}
