"use client";

/**
 * Colourful concierge icon (handbag + sparkle) used in the FAB and in the Concierge header on mobile.
 */
export function ConciergeFABIcon({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3.93a2 2 0 0 0 1.66-.9l.82-1.2a2 2 0 0 1 1.66-.9H19a2 2 0 0 1 2 2z" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute -top-0.5 -right-0.5 w-3 h-3"
      >
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      </svg>
    </span>
  );
}
