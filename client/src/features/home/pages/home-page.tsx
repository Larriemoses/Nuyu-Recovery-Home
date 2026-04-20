import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card } from "../../../components/ui";
import { SectionCard } from "../../../components/ui/section-card";
import { CarouselControlButton } from "../../../components/ui/carousel-control-button";
import { useServiceCatalog } from "../../../hooks/use-service-catalog";
import { formatCurrency } from "../../../utils/currency";
import { PublicBookingDialog } from "../../booking/components/public-booking-dialog";
import {
  getServiceMedia,
  homeShowcaseMedia,
} from "../../services/data/service-media";

const trustPoints = [
  "Private recovery support",
  "Simple booking flow",
  "Clear service pricing",
];

const bookingSteps = [
  {
    label: "Choose",
    detail: "Pick the service that fits your recovery or wellness plan.",
  },
  {
    label: "Select",
    detail: "Choose the date, time, or stay range inside the booking dialog.",
  },
  {
    label: "Save",
    detail: "Save the request first. Payment opens here when Paystack is connected.",
  },
];

function getServiceMeta(service: {
  bookingKind: string;
  durationMinutes?: number;
  sessionsCount?: number;
  minStayDays?: number;
  maxStayDays?: number;
}) {
  if (service.bookingKind === "stay" && service.minStayDays && service.maxStayDays) {
    return `${service.minStayDays}-${service.maxStayDays} day stay`;
  }

  if (service.bookingKind === "package" && service.sessionsCount) {
    return `${service.sessionsCount} sessions`;
  }

  return `${service.durationMinutes ?? 60} mins`;
}

function getServicePrice(service: {
  bookingKind: string;
  basePriceKobo: number;
  packages?: Array<{ packagePriceKobo: number }>;
}) {
  if (service.bookingKind === "package" && service.packages?.length) {
    return service.packages[0].packagePriceKobo;
  }

  return service.basePriceKobo;
}

export function HomePage() {
  const { services, source, isLoading, errorMessage } = useServiceCatalog();
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingModalOpen = searchParams.get("book") === "1";
  const selectedServiceSlug = searchParams.get("service");

  function scrollServices(direction: "left" | "right") {
    const container = servicesRef.current;

    if (!container) {
      return;
    }

    const distance = Math.min(360, container.clientWidth * 0.9);

    container.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  }

  function openBookingDialog(serviceSlug?: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("book", "1");

    if (serviceSlug) {
      nextSearchParams.set("service", serviceSlug);
    } else {
      nextSearchParams.delete("service");
    }

    setSearchParams(nextSearchParams, { replace: true });
  }

  function closeBookingDialog() {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("book");
    nextSearchParams.delete("service");
    setSearchParams(nextSearchParams, { replace: true });
  }

  return (
    <>
      <div className="space-y-4">
        <section className="public-panel overflow-hidden rounded-[1.7rem] p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr] lg:items-stretch">
            <div className="space-y-4">
              <div className="public-subtle-panel rounded-[1.5rem] p-4 sm:p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--nuyu-gold)]">
                  Private Recovery Home
                </p>
                <h1 className="mt-3 max-w-3xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--nuyu-ink)] sm:text-[2.6rem]">
                  Recovery stays and wellness treatments in one calm booking flow.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--nuyu-muted)] sm:text-base">
                  Everything stays here on one page. Review the services, then open the
                  booking dialog when you are ready.
                </p>

                <div className="mt-5">
                  <Button size="lg" onClick={() => openBookingDialog()} className="min-w-[11rem]">
                    Book now
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <Card key={point} variant="flat" className="rounded-xl">
                    <p className="text-sm font-medium text-[var(--color-text)]">{point}</p>
                  </Card>
                ))}
              </div>
            </div>

            <article className="group public-panel relative overflow-hidden rounded-[1.5rem]">
              <img
                src={homeShowcaseMedia.imageUrl}
                alt={homeShowcaseMedia.alt}
                className="nuyu-image h-full min-h-[16rem] w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,31,18,0.08),rgba(17,31,18,0.68))]" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-[var(--nuyu-cream)]">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--nuyu-gold-soft)]">
                  {homeShowcaseMedia.eyebrow}
                </p>
                <p className="text-lg font-medium leading-7 sm:text-xl">
                  Calm support, clear options, and one direct place to book.
                </p>
              </div>
            </article>
          </div>
        </section>

        <SectionCard
          eyebrow="Services"
          title="Choose your service"
          description="Browse the services below. Tap any service to open the booking dialog with it selected."
          footer={
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span className="public-pill rounded-full px-3 py-2">
                {source === "supabase"
                  ? "Live service list connected"
                  : "Starter service list showing"}
              </span>
              <span>Swipe on mobile or use the arrows.</span>
            </div>
          }
        >
          {errorMessage ? (
            <Card variant="flat" className="mb-4 rounded-xl">
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">{errorMessage}</p>
            </Card>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3"
                >
                  <div className="aspect-[4/3] rounded-xl bg-[var(--color-surface)]" />
                  <div className="mt-3 h-4 rounded bg-[var(--color-surface)]" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-[var(--color-surface)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-1 top-1/2 z-10 -translate-y-1/2">
                <CarouselControlButton direction="left" onClick={() => scrollServices("left")} />
              </div>
              <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2">
                <CarouselControlButton direction="right" onClick={() => scrollServices("right")} />
              </div>

              <div ref={servicesRef} className="nuyu-carousel px-1">
                {services.map((service, index) => {
                  const media = getServiceMedia(service.slug);

                  return (
                    <button
                      key={service.slug}
                      type="button"
                      className="nuyu-carousel-card group nuyu-hover-lift nuyu-reveal public-panel overflow-hidden rounded-[1.45rem] p-3 text-left"
                      style={{ animationDelay: `${index * 70}ms` }}
                      onClick={() => openBookingDialog(service.slug)}
                    >
                      <div className="overflow-hidden rounded-[1.1rem]">
                        <img
                          src={media.imageUrl}
                          alt={media.alt}
                          loading="lazy"
                          decoding="async"
                          className="nuyu-image aspect-[4/3] w-full object-cover"
                        />
                      </div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--nuyu-gold)]">
                            {service.bookingKind === "stay"
                              ? "Recovery stay"
                              : service.bookingKind === "package"
                                ? "Treatment package"
                                : "Wellness session"}
                          </p>
                          <h3 className="mt-2 text-base font-medium leading-6 text-[var(--nuyu-ink)]">
                            {service.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
                            {service.summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-[var(--nuyu-muted)]">
                          <span className="public-pill rounded-full px-3 py-1.5">
                            From {formatCurrency(getServicePrice(service))}
                          </span>
                          <span className="public-pill rounded-full px-3 py-1.5">
                            {getServiceMeta(service)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Booking"
          title="How booking works"
          description="A short, direct flow from service selection to saved request."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <Card key={step.label} variant="flat" className="rounded-xl">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {step.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">
                  {step.detail}
                </p>
              </Card>
            ))}
          </div>
        </SectionCard>
      </div>

      <PublicBookingDialog
        open={bookingModalOpen}
        onClose={closeBookingDialog}
        initialServiceSlug={selectedServiceSlug}
      />
    </>
  );
}
