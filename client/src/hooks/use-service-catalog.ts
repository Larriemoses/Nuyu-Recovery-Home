import { startTransition, useEffect, useState } from "react";
import { serviceCatalog } from "../features/services/data/service-catalog";
import { supabase } from "../lib/supabase/client";
import type {
  BookingKind,
  ServiceCatalogItem,
  ServiceCatalogState,
} from "../types/booking";

type SupabaseServiceRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  booking_kind: BookingKind;
  base_price_kobo: number;
  duration_minutes: number | null;
  min_stay_days: number | null;
  max_stay_days: number | null;
  sort_order: number | null;
  service_packages:
    | Array<{
        id: string;
        label: string;
        sessions_count: number;
        package_price_kobo: number;
      }>
    | null;
};

const initialState: ServiceCatalogState = {
  services: serviceCatalog,
  source: "fallback",
  isLoading: true,
};

function normalizeService(row: SupabaseServiceRow): ServiceCatalogItem {
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
  const [state, setState] = useState<ServiceCatalogState>(initialState);

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
              errorMessage:
                "Supabase is not configured in this browser session yet, so the page is showing the local starter catalog.",
            });
          }
        });
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .select(
          "id, slug, name, summary, booking_kind, base_price_kobo, duration_minutes, min_stay_days, max_stay_days, sort_order, service_packages ( id, label, sessions_count, package_price_kobo )",
        )
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
            errorMessage:
              error.code === "PGRST205"
                ? "The hosted Supabase project is connected, but the database tables have not been created yet. Showing the local starter catalog until migrations are pushed."
                : `Supabase returned an error while loading services: ${error.message}`,
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
            errorMessage:
              "No live services were found in Supabase yet, so the local starter catalog is being shown.",
          });
        });
        return;
      }

      startTransition(() => {
        setState({
          services: data.map((row) => normalizeService(row as SupabaseServiceRow)),
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
