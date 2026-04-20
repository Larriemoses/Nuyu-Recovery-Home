type CarouselControlButtonProps = {
  direction: "left" | "right";
  onClick: () => void;
};

export function CarouselControlButton({
  direction,
  onClick,
}: CarouselControlButtonProps) {
  const label = direction === "left" ? "Scroll left" : "Scroll right";

  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nuyu-line)] bg-[rgba(252,250,244,0.94)] text-[var(--nuyu-primary)] shadow-[0_10px_24px_rgba(29,51,33,0.1)] transition hover:bg-[rgba(47,93,50,0.08)]"
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === "left" ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}
