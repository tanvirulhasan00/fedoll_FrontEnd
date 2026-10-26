import React from "react";
import clsx from "clsx";

interface BrandLogoProps {
  customSrc?: string;
  className?: string;
  variant?: "light" | "dark" | "auto";
  alt?: string;
  onError?: () => void;
  showText?: boolean;
  isLoading?: boolean;
}

export function NavbarLogoSkeleton({
  className = "h-11 sm:h-12",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2.5 select-none animate-pulse py-1",
        className
      )}
      aria-label="Loading brand logo..."
    >
      <div className="size-8 sm:size-9 rounded-full bg-stone-200/90 dark:bg-neutral-800/90 shrink-0 ring-1 ring-stone-300/50 dark:ring-neutral-700/50" />
      {showText && (
        <div className="flex flex-col gap-1.5 text-left">
          <div className="h-4 sm:h-4.5 w-24 sm:w-28 rounded-md bg-stone-200/90 dark:bg-neutral-800/90" />
          <div className="h-2 sm:h-2.5 w-16 sm:w-20 rounded-md bg-stone-200/70 dark:bg-neutral-800/70" />
        </div>
      )}
    </div>
  );
}

export function BrandLogo({
  customSrc,
  className = "h-11 sm:h-12 w-auto",
  variant = "auto",
  alt = "SilkenDrift",
  onError,
  showText = true,
  isLoading = false,
}: BrandLogoProps) {
  if (isLoading) {
    return <NavbarLogoSkeleton className={className} showText={showText} />;
  }

  if (customSrc) {
    return (
      <img
        src={customSrc}
        alt={alt}
        className={clsx("object-contain", className)}
        onError={onError}
      />
    );
  }

  const isDark = variant === "dark";
  const isLight = variant === "light";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2.5 select-none",
        isDark ? "text-white" : isLight ? "text-stone-900" : "text-stone-900 dark:text-white"
      )}
    >
      <svg
        className="size-8 sm:size-9 shrink-0"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="30"
          cy="30"
          r="28"
          className={clsx(
            isDark
              ? "fill-neutral-800 stroke-neutral-700"
              : isLight
              ? "fill-stone-100 stroke-stone-300"
              : "fill-stone-100 dark:fill-neutral-800 stroke-stone-300 dark:stroke-neutral-700"
          )}
          strokeWidth="1.5"
        />
        <path
          d="M38 21C35 18 25 18 23 23C21 28 39 30 37 37C35 43 25 43 21 39"
          stroke="#ea580c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="38" cy="21" r="2.5" fill="#ea580c" />
        <circle cx="21" cy="39" r="2.5" fill="#f59e0b" />
      </svg>
      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-sans font-black tracking-tight text-lg sm:text-xl leading-none">
            Silken<span className="text-orange-600 dark:text-orange-400">Drift</span>
          </span>
          <span className="font-sans text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 font-semibold leading-tight mt-0.5">
            Apparel Atelier
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
