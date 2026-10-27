import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  nextSpotlightSlide,
  prevSpotlightSlide,
  setActiveSpotlightIndex,
} from "~/redux/features/homeSlice";
import {
  SparklesIcon,
  ArrowRightIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { SpotlightSectionSkeleton } from "~/components/main/Skeletons";
import {
  normalizeGoogleDriveImageUrl,
  type SpotlightBadgeColor,
  type SpotlightThemeStyle,
  type SpotlightBanner,
  initialSpotlightBanners,
} from "~/firebase";

const BADGE_COLOR_MAP: Record<SpotlightBadgeColor, string> = {
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  stone: "bg-stone-500/20 text-stone-300 border-stone-500/30",
};

export default function SpotlightSection() {
  const dispatch = useAppDispatch();
  const { spotlightBanners, activeSpotlightIndex, loading } = useAppSelector(
    (state) => state.home
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter active banners with fallback to initial presets so slider never disappears
  const pool =
    spotlightBanners && spotlightBanners.length > 0
      ? spotlightBanners
      : initialSpotlightBanners;
  const filtered = pool.filter((b) => b.isActive !== false);
  const liveBanners = filtered.length > 0 ? filtered : initialSpotlightBanners;

  // Keep index within range
  const currentIndex =
    liveBanners.length > 0
      ? activeSpotlightIndex % liveBanners.length
      : 0;

  // Auto-slide every 6.5s if more than 1 banner exists and not paused by hover
  useEffect(() => {
    if (liveBanners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      dispatch(nextSpotlightSlide());
    }, 6500);

    return () => clearInterval(interval);
  }, [dispatch, liveBanners.length, isPaused]);

  if (loading && (!liveBanners || liveBanners.length === 0)) {
    return <SpotlightSectionSkeleton />;
  }

  if (!liveBanners || liveBanners.length === 0) return null;

  const currentBanner: SpotlightBanner = liveBanners[currentIndex] || liveBanners[0];

  const handleCopyCode = (code: string, discount?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(currentBanner.id);
    toast.success(
      `Copied code ${code}${discount ? ` (${discount})` : ""} to clipboard!`
    );
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Touch Swipe Handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (diff > minSwipeDistance) {
      // Swiped left -> next slide
      dispatch(nextSpotlightSlide());
    } else if (diff < -minSwipeDistance) {
      // Swiped right -> prev slide
      dispatch(prevSpotlightSlide());
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getThemeClasses = (style?: SpotlightThemeStyle) => {
    switch (style) {
      case "gradient-sunset":
        return "bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 text-white border-orange-900/30";
      case "gradient-ocean":
        return "bg-gradient-to-br from-stone-950 via-slate-900 to-cyan-950 text-white border-cyan-900/30";
      case "gradient-emerald":
        return "bg-gradient-to-br from-stone-950 via-neutral-900 to-emerald-950 text-white border-emerald-900/30";
      case "gradient-royal":
        return "bg-gradient-to-br from-stone-950 via-neutral-900 to-purple-950 text-white border-purple-900/30";
      case "clean-light":
        return "bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-white border-stone-200 dark:border-neutral-800";
      case "dark-stone":
      default:
        return "bg-stone-900 text-white border-stone-800";
    }
  };

  const badgeClass =
    BADGE_COLOR_MAP[currentBanner.badgeColor || "orange"] ||
    BADGE_COLOR_MAP.orange;

  const isLightStyle = currentBanner.themeStyle === "clean-light";

  return (
    <section
      className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Campaign Spotlight Banners"
    >
      <div
        className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 border ${getThemeClasses(
          currentBanner.themeStyle
        )}`}
      >
        {/* Subtle Ambient Decorative Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-600/10 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-600/10 blur-[100px]"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] relative z-10">
          {/* Text Content Column */}
          <div className="lg:col-span-7 p-7 sm:p-12 lg:p-16 flex flex-col justify-between z-10 space-y-6">
            <div className="space-y-4">
              {/* Badge & Slide Counter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${badgeClass}`}
                >
                  <SparklesIcon className="size-4 shrink-0" />
                  <span>{currentBanner.tag}</span>
                </div>

                {liveBanners.length > 1 && (
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-xs border border-white/10 text-stone-300">
                    <span className="text-orange-400">
                      {String(currentIndex + 1).padStart(2, "0")}
                    </span>
                    <span>/</span>
                    <span>{String(liveBanners.length).padStart(2, "0")}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2
                className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                  isLightStyle
                    ? "text-gray-900 dark:text-white"
                    : "text-white"
                }`}
              >
                {currentBanner.title}
              </h2>

              {/* Description */}
              <p
                className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                  isLightStyle
                    ? "text-gray-600 dark:text-stone-300"
                    : "text-stone-300"
                }`}
              >
                {currentBanner.description}
              </p>

              {/* Coupon Discount Tag with 1-click Copy */}
              {currentBanner.discountCode && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div
                    onClick={() =>
                      handleCopyCode(
                        currentBanner.discountCode!,
                        currentBanner.discountPercent
                      )
                    }
                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 dark:bg-white/10 hover:bg-black/40 dark:hover:bg-white/20 border border-white/20 text-xs font-mono font-bold tracking-wider text-orange-400 hover:text-orange-300 cursor-pointer transition shadow-xs"
                    title="Click to copy voucher code"
                  >
                    <TagIcon className="size-4 shrink-0" />
                    <span>CODE: {currentBanner.discountCode}</span>
                    {currentBanner.discountPercent && (
                      <span className="text-[11px] text-stone-300 font-sans font-normal">
                        ({currentBanner.discountPercent})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    {copiedId === currentBanner.id ? (
                      <>
                        <CheckIcon className="size-4 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">
                          Copied to clipboard!
                        </span>
                      </>
                    ) : (
                      <span>Click voucher code to copy</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                to={currentBanner.ctaLink}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm shadow-lg hover:shadow-orange-700/30 transition hover:scale-[1.02] cursor-pointer"
              >
                <span>{currentBanner.ctaText}</span>
                <ArrowRightIcon className="size-4" />
              </Link>

              {currentBanner.secondaryCtaText && currentBanner.secondaryCtaLink && (
                <Link
                  to={currentBanner.secondaryCtaLink}
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border transition hover:scale-[1.02] cursor-pointer ${
                    isLightStyle
                      ? "border-stone-300 dark:border-neutral-700 text-gray-800 dark:text-stone-200 hover:bg-stone-200/50"
                      : "border-stone-700 text-stone-200 hover:bg-stone-800/60"
                  }`}
                >
                  <span>{currentBanner.secondaryCtaText}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Image Column */}
          <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-auto overflow-hidden">
            <img
              src={normalizeGoogleDriveImageUrl(currentBanner.image)}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            {/* Visual Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-900/95 via-stone-900/40 lg:via-stone-900/30 to-transparent" />
          </div>
        </div>

        {/* Carousel Prev / Next Arrow Controls (Shown when multiple banners exist) */}
        {liveBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => dispatch(prevSpotlightSlide())}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition hover:scale-110 cursor-pointer shadow-lg"
              title="Previous banner"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="size-5 sm:size-6" />
            </button>

            <button
              type="button"
              onClick={() => dispatch(nextSpotlightSlide())}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition hover:scale-110 cursor-pointer shadow-lg"
              title="Next banner"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="size-5 sm:size-6" />
            </button>

            {/* Bottom Dots Navigation Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              {liveBanners.map((b, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={() => dispatch(setActiveSpotlightIndex(idx))}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "w-7 bg-orange-500 shadow-xs"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    title={`Go to slide ${idx + 1}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
