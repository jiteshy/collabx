type BrandProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  compact?: boolean;
};

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25 24L15 36L25 48"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47 24L57 36L47 48"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 22L34 50"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-[family:var(--font-dm-sans)] text-white lowercase tracking-[0.015em] ${className}`.trim()}
    >
      kodecollab
    </span>
  );
}

export function Brand({
  className = '',
  iconClassName = '',
  textClassName = '',
  compact = false,
}: BrandProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-' : 'gap-1'} ${className}`.trim()}>
      <BrandMark
        className={`${compact ? 'h-10 w-10 text-orange-500' : 'h-11 w-11 lg:h-12 lg:w-12 text-orange-500'} ${iconClassName}`.trim()}
      />
      <BrandWordmark
        className={`${compact ? 'text-[1.5rem]' : 'text-[2rem] lg:text-[2.65rem]'} leading-none font-semibold ${textClassName}`.trim()}
      />
    </div>
  );
}
