import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  nextHeroSlide,
  prevHeroSlide,
  setActiveHeroIndex,
  setHeroBannersFromProducts,
} from "~/redux/features/homeSlice";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
} from "~/firebase";
import { HeroSliderSkeleton } from "~/components/main/Skeletons";

export default function HeroSlider() {
  const dispatch = useAppDispatch();
  const {
    heroBanners,
    activeHeroIndex,
    products: homeProducts,
    loading,
  } = useAppSelector((state) => state.home);
  const { items: catalogProducts } = useAppSelector(
    (state) => state.products
  );

  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // If heroBanners is currently using static defaults but DB products are available,
  // pick 2 random products from DB and update heroBanners.
  useEffect(() => {
    const isUsingStaticDefault =
      heroBanners.length === 2 &&
      (heroBanners[0]?.id === "banner-1" || heroBanners[1]?.id === "banner-2");

    const availableDbProducts =
      homeProducts && homeProducts.length > 0
        ? homeProducts
        : catalogProducts && catalogProducts.length > 0
        ? catalogProducts
        : [];

    if (isUsingStaticDefault && availableDbProducts.length > 0) {
      dispatch(setHeroBannersFromProducts(availableDbProducts));
    }
  }, [dispatch, heroBanners, homeProducts, catalogProducts]);

  // Ensure activeHeroIndex is within valid range
  useEffect(() => {
    if (activeHeroIndex >= heroBanners.length && heroBanners.length > 0) {
      dispatch(setActiveHeroIndex(0));
    }
  }, [activeHeroIndex, heroBanners.length, dispatch]);

  // Auto-slide every 6.5s if multiple banners exist and not paused
  useEffect(() => {
    if (heroBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      dispatch(nextHeroSlide());
    }, 6500);
    return () => clearInterval(interval);
  }, [dispatch, heroBanners.length, isPaused]);

  // Touch Swipe Handlers for mobile view
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 45;

      if (diff > minSwipeDistance) {
        // Swiped left -> next slide
        dispatch(nextHeroSlide());
      } else if (diff < -minSwipeDistance) {
        // Swiped right -> prev slide
        dispatch(prevHeroSlide());
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsPaused(false), 2000);
  };

  if (loading && (!heroBanners || heroBanners.length === 0)) {
    return <HeroSliderSkeleton />;
  }

  if (!heroBanners || heroBanners.length === 0) return null;

  const currentBanner = heroBanners[activeHeroIndex] || heroBanners[0];

  return (
    <section
      className="relative overflow-hidden bg-stone-950 text-white min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Crossfade */}
      {heroBanners.map((banner, idx) => (
        <div
          key={banner.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === activeHeroIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          } transform transition-transform duration-7000`}
        >
          <img
            src={normalizeGoogleDriveImageUrl(banner.image)}
            alt={banner.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              const target = e.currentTarget;
              const fileId = extractGoogleDriveFileId(banner.image);
              if (fileId && !target.dataset.triedThumbnail) {
                target.dataset.triedThumbnail = "true";
                target.src = getGoogleDriveThumbnailUrl(banner.image, 1600);
                return;
              }
              target.src =
                idx % 2 === 0
                  ? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85"
                  : "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=85";
            }}
          />
          {/* Multi-layered luxury gradients for flawless text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>
      ))}

      {/* Decorative Atelier Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

      {/* Banner Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10 w-full">
        <div className="max-w-2xl lg:max-w-3xl space-y-6 animate-in fade-in duration-700">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <SparklesIcon className="size-4 text-orange-500 animate-pulse" />
            <span>{currentBanner.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {currentBanner.title.split("&").map((chunk, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-orange-500 italic font-serif"> & </span>}
                {chunk}
              </React.Fragment>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-stone-300 font-normal leading-relaxed max-w-2xl">
            {currentBanner.subtitle}
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              to={currentBanner.ctaLink}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-700/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <span>{currentBanner.ctaText}</span>
              <ArrowRightIcon className="size-4" />
            </Link>

            {currentBanner.secondaryCtaText && (
              <Link
                to={currentBanner.secondaryCtaLink || "/products"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm hover:border-white/50 transition cursor-pointer"
              >
                <span>{currentBanner.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Floating Highlights */}
        <div className="hidden xl:flex absolute right-8 bottom-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 gap-6 text-white text-xs">
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Quality</p>
            <p className="font-semibold mt-0.5">100% Export Quality Cotton</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Crafted In</p>
            <p className="font-semibold mt-0.5">Dhaka, Bangladesh</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Delivery</p>
            <p className="font-semibold mt-0.5">Cash on Delivery Across BD</p>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {heroBanners.length > 1 && (
        <>
          {/* Arrow Buttons - Hidden on Mobile, Visible on Desktop/Tablet (md+) */}
          <button
            type="button"
            onClick={() => dispatch(prevHeroSlide())}
            className="hidden md:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs border border-white/20 text-white items-center justify-center transition hover:scale-105 cursor-pointer shadow-lg"
            aria-label="Previous Banner"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => dispatch(nextHeroSlide())}
            className="hidden md:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs border border-white/20 text-white items-center justify-center transition hover:scale-105 cursor-pointer shadow-lg"
            aria-label="Next Banner"
          >
            <ChevronRightIcon className="size-5" />
          </button>


          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {heroBanners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => dispatch(setActiveHeroIndex(dotIdx))}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  dotIdx === activeHeroIndex
                    ? "w-8 h-2 bg-orange-600"
                    : "w-2 h-2 bg-white/50 hover:bg-white"
                }`}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
