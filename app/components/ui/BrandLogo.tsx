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
  const [loadFailed, setLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setLoadFailed(false);
  }, [customSrc]);

  if (isLoading) {
    return <NavbarLogoSkeleton className={className} showText={showText} />;
  }

  const isDriveUrl =
    typeof customSrc === "string" &&
    (customSrc.includes("drive.google.com") || customSrc.includes("googleusercontent.com"));

  if (customSrc && !loadFailed && !isDriveUrl) {
    return (
      <img
        src={customSrc}
        alt={alt}
        className={clsx("object-contain", className)}
        referrerPolicy="no-referrer"
        onError={() => {
          setLoadFailed(true);
          onError?.();
        }}
      />
    );
  }

  // Official fixed brand logo
  if (variant === "dark") {
    return (
      <img
        src="/silken-drift-logo-dark.png"
        alt={alt}
        className={clsx("object-contain", className)}
      />
    );
  }

  if (variant === "light") {
    return (
      <img
        src="/silken-drift-logo-light.png"
        alt={alt}
        className={clsx("object-contain", className)}
      />
    );
  }

  // "auto": light logo in light mode, dark logo in dark mode
  return (
    <>
      <img
        src="/silken-drift-logo-light.png"
        alt={alt}
        className={clsx("object-contain dark:hidden", className)}
      />
      <img
        src="/silken-drift-logo-dark.png"
        alt={alt}
        className={clsx("object-contain hidden dark:block", className)}
      />
    </>
  );
}

export default BrandLogo;
