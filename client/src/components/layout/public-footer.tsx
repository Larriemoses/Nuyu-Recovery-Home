const socialItems = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "WhatsApp", href: "https://wa.me/" },
];

function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (label === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M14 4v8.2a3.8 3.8 0 1 1-3.2-3.75" />
        <path d="M14 4c.8 1.9 2.1 3 4 3.4" />
      </svg>
    );
  }

  if (label === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M13 20v-6h2.5l.5-3H13V9.5c0-.9.3-1.5 1.7-1.5H16V5.2c-.2 0-.9-.2-2-.2-2.6 0-4 1.5-4 4.3V11H7v3h3v6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M20 12.1A8 8 0 0 1 8.3 19L4 20l1.1-4.1A8 8 0 1 1 20 12.1Z" />
      <path d="M9 10.2c.3-1 .6-1.2 1-.5l.5 1c.2.4.1.7-.2 1l-.3.3c.6 1.1 1.5 2 2.6 2.6l.3-.3c.3-.3.6-.4 1-.2l1 .5c.7.4.5.7-.5 1-1.1.3-2.4 0-3.8-1.1-1.8-1.3-2.6-3-2.1-4.3Z" />
    </svg>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--nuyu-line)] bg-[rgba(252,250,244,0.9)] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--nuyu-gold)]">
            Nuyu Recovery Home
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--nuyu-muted)]">
            Private recovery stays and wellness support in a calmer booking experience.
          </p>
          <p className="mt-3 text-sm text-[var(--nuyu-muted)]">
            Copyright {year} Nuyu Recovery Home. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {socialItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={item.label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--nuyu-line)] bg-white/75 text-[var(--nuyu-muted)] transition hover:bg-[rgba(47,93,50,0.06)] hover:text-[var(--nuyu-ink)]"
              title={item.label}
            >
              <SocialIcon label={item.label} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
