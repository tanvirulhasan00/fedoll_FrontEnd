import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
} from "~/firebase";
import { FeaturedCategoriesSkeleton } from "~/components/main/Skeletons";

export default function FeaturedCategories() {
  const { featuredCategories, loading } = useAppSelector((state) => state.home);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);

    if (typeof window !== "undefined" && window.innerWidth < 640) {
      const idx = Math.round(scrollLeft / (clientWidth || 1));
      setActiveMobileIndex(Math.max(0, Math.min(idx, featuredCategories.length - 1)));
    }
  }, [featuredCategories.length]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, featuredCategories]);

  const scrollPrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 640;
    const scrollAmount = isMobile ? el.clientWidth : el.clientWidth * 0.75;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 640;
    const scrollAmount = isMobile ? el.clientWidth : el.clientWidth * 0.75;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollToCard = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  if (loading && (!featuredCategories || featuredCategories.length === 0)) {
    return <FeaturedCategoriesSkeleton />;
  }

  if (!featuredCategories || featuredCategories.length === 0) return null;

  const getCategoryLink = (cat: { id: string; name: string; link?: string }) => {
    if (cat.link && !cat.link.startsWith("/blogs")) {
      return cat.link;
    }
    return `/products?category=${encodeURIComponent(cat.name)}`;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500 mb-1.5">
            <Squares2X2Icon className="size-4" />
            Shop By Category
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Explore Our Collections
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-md mt-1.5">
            Discover premium clothing designed for Bangladeshi weather, everyday comfort, and long-lasting style.
          </p>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            id="featured-categories-prev"
            onClick={scrollPrev}
            disabled={!canScrollLeft}
            aria-label="Previous categories"
            className={`size-9 sm:size-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollLeft
                ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronLeftIcon className="size-4 sm:size-5" />
          </button>
          <button
            type="button"
            id="featured-categories-next"
            onClick={scrollNext}
            disabled={!canScrollRight}
            aria-label="Next categories"
            className={`size-9 sm:size-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollRight
                ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronRightIcon className="size-4 sm:size-5" />
          </button>
        </div>
      </div>

      {/* Categories Slider */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
      >
        {featuredCategories.map((cat, idx) => (
          <Link
            key={cat.id || idx}
            to={getCategoryLink(cat)}
            className="group relative shrink-0 snap-start rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-900 shadow-xs hover:shadow-xl transition-all duration-500 h-[300px] sm:h-[320px] lg:h-[350px] flex flex-col justify-end p-5 sm:p-5 border border-gray-200/80 dark:border-neutral-800 w-full sm:w-[calc((100%-32px)/3)] lg:w-[calc((100%-64px)/5)] cursor-pointer"
          >
            {/* Background Image with Zoom */}
            <img
              src={normalizeGoogleDriveImageUrl(cat.image)}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              onError={(e) => {
                const target = e.currentTarget;
                const fileId = extractGoogleDriveFileId(cat.image);
                if (fileId && !target.dataset.triedThumbnail) {
                  target.dataset.triedThumbnail = "true";
                  target.src = getGoogleDriveThumbnailUrl(cat.image, 1000);
                  return;
                }
                target.src =
                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
              }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Top pill badge */}
            <div className="absolute top-4 left-4">
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                {cat.itemCount}
              </span>
            </div>

            {/* Top Right Floating Arrow */}
            <div className="absolute top-4 right-4 size-8 sm:size-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-orange-700 group-hover:rotate-45 transition-all duration-300">
              <ArrowUpRightIcon className="size-4" />
            </div>

            {/* Card Content */}
            <div className="relative z-10 text-white space-y-1">
              <h3 className="text-base sm:text-base lg:text-lg font-bold tracking-tight group-hover:text-orange-400 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                {cat.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile Dot Indicators */}
      {featuredCategories.length > 1 && (
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
          {featuredCategories.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCard(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeMobileIndex
                  ? "w-6 bg-orange-600 shadow-xs"
                  : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
              }`}
              aria-label={`Go to category ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
