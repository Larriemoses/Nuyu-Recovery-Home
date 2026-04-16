import { SectionCard } from "../../../components/ui/section-card";

const architecture = [
  {
    title: "Client",
    body: "React + TypeScript + Tailwind power the marketing pages, booking flow, and admin UI shell.",
  },
  {
    title: "Server",
    body: "An Express API gives you a clean home for Paystack verification, reporting endpoints, and orchestration.",
  },
  {
    title: "Supabase",
    body: "Postgres, Auth, migrations, seed data, and Edge Functions handle booking logic, slot holds, and admin security.",
  },
];

const priorities = [
  "Appointment, package, and recovery-stay bookings",
  "10-minute slot holds to reduce double-booking",
  "Private admin login with protected dashboard access",
  "Paystack verification and email touchpoints",
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Nuyu Platform"
        title="A full-stack wellness booking platform shaped around the Nuyu brand"
        description="Public users can browse services and create pre-payment bookings without login, while Supabase-backed admin accounts manage the private dashboard, schedules, holds, pricing, and recovery-stay visibility."
        footer={
          <div className="flex flex-wrap gap-3 text-sm text-[var(--nuyu-muted)]">
            <span className="rounded-full bg-white/80 px-4 py-2">React.js</span>
            <span className="rounded-full bg-white/80 px-4 py-2">TypeScript</span>
            <span className="rounded-full bg-white/80 px-4 py-2">Tailwind CSS</span>
            <span className="rounded-full bg-white/80 px-4 py-2">Supabase</span>
            <span className="rounded-full bg-white/80 px-4 py-2">Paystack-ready</span>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] bg-[rgba(255,255,255,0.72)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
              Core delivery areas
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {priorities.map((priority) => (
                <div
                  key={priority}
                  className="rounded-[1.5rem] border border-[rgba(47,93,50,0.08)] bg-white/75 p-4 text-sm leading-6 text-[var(--nuyu-muted)]"
                >
                  {priority}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(47,93,50,0.9),rgba(35,72,38,0.94))] p-6">
            <p className="text-sm font-semibold text-[var(--nuyu-gold-soft)]">
              Current build focus
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-[rgba(255,253,246,0.82)]">
              <li>1. Provision the first admin account with unique credentials.</li>
              <li>2. Review booking drafts, timed holds, and recovery-home stay requests.</li>
              <li>3. Add Paystack verification and post-payment confirmation flows.</li>
            </ol>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {architecture.map((item) => (
          <SectionCard key={item.title} title={item.title} description={item.body}>
            <div className="h-1.5 w-16 rounded-full bg-[var(--nuyu-primary)]" />
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
