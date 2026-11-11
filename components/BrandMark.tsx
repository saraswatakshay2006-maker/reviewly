export default function BrandMark({
  inverted = false,
  showWordmark = true,
  size = "md",
}: {
  inverted?: boolean;
  showWordmark?: boolean;
  size?: "sm" | "md";
}) {
  const boxSize = size === "sm" ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-[9px]";
  const iconSize = size === "sm" ? 15 : 17;

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`${boxSize} inline-flex items-center justify-center shrink-0 transition-colors ${
          inverted ? "bg-white text-ink" : "bg-surface-dark text-white"
        }`}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 3 4.5 6.2v5.3c0 4.7 3.1 8.8 7.5 10.3 4.4-1.5 7.5-5.6 7.5-10.3V6.2L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m9.2 12.2 1.9 1.9 3.8-4"
            stroke={inverted ? "#1A4BE0" : "#60A5FA"}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={`font-display font-semibold tracking-tight text-[17px] ${
            inverted ? "text-white" : "text-ink"
          }`}
        >
          Reviewly
        </span>
      )}
    </span>
  );
}

