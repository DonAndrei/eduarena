export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-wide uppercase ${className}`}>
      <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
        <rect x="6" y="14" width="52" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="5" className="text-lime" />
        <line x1="32" y1="14" x2="32" y2="50" stroke="currentColor" strokeWidth="5" className="text-lime" />
        <circle cx="32" cy="32" r="7" fill="none" stroke="currentColor" strokeWidth="5" className="text-lime" />
      </svg>
      <span>Edu<span className="text-lime">Arena</span></span>
    </span>
  );
}
