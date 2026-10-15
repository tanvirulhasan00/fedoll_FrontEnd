import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`size-9 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      id={showLabel ? "mobile-theme-toggle" : "desktop-theme-toggle"}
      data-testid={showLabel ? "mobile-theme-toggle" : "desktop-theme-toggle"}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-amber-400 hover:text-orange-700 dark:hover:text-amber-300 hover:border-orange-500/40 dark:hover:border-amber-400/40 p-2 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${className}`}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="relative size-5 flex items-center justify-center">
        {isDark ? (
          <SunIcon className="size-5 transition-transform duration-500 rotate-0 hover:rotate-90 text-amber-400" />
        ) : (
          <MoonIcon className="size-5 transition-transform duration-500 rotate-0 hover:-rotate-45 text-neutral-700 group-hover:text-orange-700" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold pr-1.5 text-neutral-700 dark:text-neutral-200">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
