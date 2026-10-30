import React, { useState, useEffect, useRef, useCallback } from "react";
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

const getThemeOverlay = (style?: SpotlightThemeStyle) => {
  switch (style) {
    case "gradient-sunset":
      return "bg-gradient-to-t from-stone-950 via-stone-950/80 to-orange-950/30";
    case "gradient-ocean":
      return "bg-gradient-to-t from-stone-950 via-slate-950/80 to-cyan-950/30";
    case "gradient-emerald":
      return "bg-gradient-to-t from-stone-950 via-stone-950/80 to-emerald-950/30";
    case "gradient-royal":
      return "bg-gradient-to-t from-stone-950 via-neutral-950/80 to-purple-950/30";
    case "clean-light":
      return "bg-gradient-to-t from-stone-950 via-stone-900/85 to-stone-900/35";
    case "dark-stone":
    default:
      return "bg-gradient-to-t from-stone-950 via-stone-900/85 to-stone-900/35";
  }
};

export default function SpotlightSection() {
  const dispatch = useAppDispatch();
  const { spotlightBanners, activeSpotlightIndex, loading } = useAppSelector(
    (state) => state.home
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Filter active banners with fallback to initial presets so slider never disappears
  const pool =
    spotlightBanners && spotlightBanners.length > 0
      ? spotlightBanners
      : initialSpotlightBanners;
  const filtered = pool.filter((b) => b.isActive !== false);
  const liveBanners = filtered.length > 0 ? filtered : initialSpotlightBanners;

  // Keep index within range
  const currentIndex =
    liveBanners.length > 0 ? activeSpotlightIndex % liveBanners.length : 0;

  // Scroll mobile container smoothly to a specific slide without affecting window scroll
  const scrollToMobileSlide = useCallback(
    (index: number) => {
      const container = mobileScrollRef.current;
      if (!container) return;
      const targetCard = slideRefs.current[index];
      if (targetCard) {
        isScrollingProgrammatically.current = true;
        const cardRect = targetCard.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeLeft =
          cardRect.left - containerRect.left + container.scrollLeft;
        const targetLeft =
          relativeLeft - (container.clientWidth - cardRect.width) / 2;

        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: "smooth",
        });
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 450);
      }
      setActiveMobileIndex(index);
      dispatch(setActiveSpotlightIndex(index));
    },
    [dispatch]
  );

  // Sync mobile index with activeSpotlightIndex from Redux
  useEffect(() => {
    setActiveMobileIndex(currentIndex);
  }, [currentIndex]);

  // Auto-slide every 6s if more than 1 banner exists and user is not touching/hovering
  useEffect(() => {
    if (liveBanners.length <= 1 || isPaused || isInteracting) return;

    const interval = setInterval(() => {
      const nextIdx = (currentIndex + 1) % liveBanners.length;
      dispatch(nextSpotlightSlide());
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        scrollToMobileSlide(nextIdx);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [
    dispatch,
    liveBanners.length,
    isPaused,
    isInteracting,
    currentIndex,
    scrollToMobileSlide,
  ]);

  if (loading && (!liveBanners || liveBanners.length === 0)) {
    return <SpotlightSectionSkeleton />;
  }

  if (!liveBanners || liveBanners.length === 0) return null;

  const currentBanner: SpotlightBanner =
    liveBanners[currentIndex] || liveBanners[0];

  const handleCopyCode = (code: string, discount?: string, bannerId?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(bannerId || currentBanner.id);
    toast.success(
      `Copied code ${code}${discount ? ` (${discount})` : ""} to clipboard!`
    );
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Track mobile touch scroll to update active dot indicator
  const handleMobileScroll = () => {
    if (isScrollingProgrammatically.current) return;
    const container = mobileScrollRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    let closestIndex = 0;
    let minDiff = Infinity;

    slideRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const scrollCenter = scrollLeft + containerWidth / 2;
      const diff = Math.abs(cardCenter - scrollCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activeMobileIndex) {
      setActiveMobileIndex(closestIndex);
      dispatch(setActiveSpotlightIndex(closestIndex));
    }
  };

  const badgeClass =
    BADGE_COLOR_MAP[currentBanner.badgeColor || "orange"] ||
    BADGE_COLOR_MAP.orange;

  const isLightStyle = currentBanner.themeStyle === "clean-light";

  return (
    <section
      className="py-5 sm:py-8 lg:py-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 select-none"
      aria-roledescription="carousel"
      aria-label="Campaign Spotlight Banners"
    >
      {/* ========================================================================= */}
      {/* MOBILE VIEW: Compact Touch Card Slider with Peek Cards (< 768px)          */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        {/* Horizontal Touch Snap Scroller */}
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsInteracting(false), 2500);
          }}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-1 py-1 scroll-smooth no-scrollbar overscroll-x-contain"
        >
          {liveBanners.map((banner, idx) => {
            const bBadgeClass =
              BADGE_COLOR_MAP[banner.badgeColor || "orange"] ||
              BADGE_COLOR_MAP.orange;
            const isCopied = copiedId === banner.id;

            return (
              <div
                key={banner.id || idx}
                ref={(el) => {
                  slideRefs.current[idx] = el;
                }}
                className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-2xl relative overflow-hidden h-[250px] shadow-md border border-stone-800/80 flex flex-col justify-between p-4 transition-all duration-300"
              >
                {/* Background Image with Fallback */}
                <img
                  src={normalizeGoogleDriveImageUrl(banner.image)}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80";
                  }}
                />

                {/* Theme Color Gradient Overlay */}
                <div
                  className={`absolute inset-0 ${getThemeOverlay(
                    banner.themeStyle
                  )}`}
                />

                {/* Top Row: Badge & Discount / Counter */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-xs shadow-xs ${bBadgeClass}`}
                  >
                    <SparklesIcon className="size-3 shrink-0" />
                    <span className="truncate max-w-[190px]">{banner.tag}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {banner.discountPercent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-600/90 text-white shadow-xs">
                        {banner.discountPercent}
                      </span>
                    )}
                    {liveBanners.length > 1 && (
                      <span className="text-[10px] font-mono text-stone-300 bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                        {idx + 1}/{liveBanners.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Content: Title, Description, Voucher, CTA */}
                <div className="relative z-10 space-y-2">
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight text-white leading-tight line-clamp-2 drop-shadow-xs">
                      {banner.title}
                    </h3>
                    <p className="text-[11px] text-stone-200/90 leading-snug line-clamp-2 mt-0.5 drop-shadow-xs">
                      {banner.description}
                    </p>
                  </div>

                  {/* Actions: Coupon Pill & Shop Button */}
                  <div className="pt-0.5 flex items-center justify-between gap-2">
                    {banner.discountCode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(
                            banner.discountCode!,
                            banner.discountPercent,
                            banner.id
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-xs border border-white/20 text-[11px] font-mono font-bold text-orange-400 active:scale-95 transition cursor-pointer shadow-xs"
                        title="Tap to copy voucher"
                      >
                        <TagIcon className="size-3 shrink-0" />
                        <span>{banner.discountCode}</span>
                        {isCopied ? (
                          <CheckIcon className="size-3 text-emerald-400 ml-0.5" />
                        ) : null}
                      </button>
                    ) : (
                      <div />
                    )}

                    <Link
                      to={banner.ctaLink}
                      prefetch="intent"
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-orange-700 hover:bg-orange-800 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRightIcon className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Pagination Dot Indicators */}
        {liveBanners.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {liveBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToMobileSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeMobileIndex
                    ? "w-5 bg-orange-500 shadow-xs"
                    : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: Sleek & Compact Promotional Banner (>= 768px)               */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:block relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl transition-all duration-700 border ${getThemeClasses(
          currentBanner.themeStyle
        )}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle Ambient Decorative Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-orange-600/10 blur-[90px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-600/10 blur-[90px]"
        />

        <div className="grid grid-cols-12 min-h-[340px] lg:min-h-[370px] relative z-10">
          {/* Text Content Column */}
          <div className="col-span-7 pl-14 sm:pl-16 pr-6 sm:pr-8 lg:pr-10 py-6 sm:py-8 lg:py-10 flex flex-col justify-between z-10 space-y-4">

            <div className="space-y-3">
              {/* Badge & Slide Counter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${badgeClass}`}
                >
                  <SparklesIcon className="size-3.5 shrink-0" />
                  <span>{currentBanner.tag}</span>
                </div>

                {liveBanners.length > 1 && (
                  <div className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-xs border border-white/10 text-stone-300">
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
                className={`text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-snug ${
                  isLightStyle
                    ? "text-gray-900 dark:text-white"
                    : "text-white"
                }`}
              >
                {currentBanner.title}
              </h2>

              {/* Description */}
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-lg ${
                  isLightStyle
                    ? "text-gray-600 dark:text-stone-300"
                    : "text-stone-300"
                }`}
              >
                {currentBanner.description}
              </p>

              {/* Coupon Discount Tag with 1-click Copy */}
              {currentBanner.discountCode && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <div
                    onClick={() =>
                      handleCopyCode(
                        currentBanner.discountCode!,
                        currentBanner.discountPercent,
                        currentBanner.id
                      )
                    }
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 dark:bg-white/10 hover:bg-black/40 dark:hover:bg-white/20 border border-white/20 text-xs font-mono font-bold tracking-wider text-orange-400 hover:text-orange-300 cursor-pointer transition shadow-xs"
                    title="Click to copy voucher code"
                  >
                    <TagIcon className="size-3.5 shrink-0" />
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
                        <CheckIcon className="size-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px]">Click code to copy</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={currentBanner.ctaLink}
                prefetch="intent"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-orange-700/30 transition hover:scale-[1.02] cursor-pointer"
              >
                <span>{currentBanner.ctaText}</span>
                <ArrowRightIcon className="size-3.5" />
              </Link>

              {currentBanner.secondaryCtaText &&
                currentBanner.secondaryCtaLink && (
                  <Link
                    to={currentBanner.secondaryCtaLink}
                    prefetch="intent"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition hover:scale-[1.02] cursor-pointer ${
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
          <div className="col-span-5 relative h-full min-h-[280px] overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/95 via-stone-900/30 to-transparent" />
          </div>
        </div>

        {/* Carousel Prev / Next Arrow Controls */}
        {liveBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => dispatch(prevSpotlightSlide())}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 items-center justify-center transition hover:scale-110 cursor-pointer shadow-md"
              title="Previous banner"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => dispatch(nextSpotlightSlide())}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 items-center justify-center transition hover:scale-110 cursor-pointer shadow-md"
              title="Next banner"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="size-4" />
            </button>

            {/* Bottom Dots Navigation Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              {liveBanners.map((b, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={() => dispatch(setActiveSpotlightIndex(idx))}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "w-5 bg-orange-500 shadow-xs"
                        : "w-1.5 bg-white/40 hover:bg-white/70"
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

