import React, { useEffect } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  nextHeroSlide,
  prevHeroSlide,
  setActiveHeroIndex,
} from "~/redux/features/homeSlice";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function HeroSlider() {
  const dispatch = useAppDispatch();
  const { heroBanners, activeHeroIndex } = useAppSelector(
    (state) => state.home
  );

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      dispatch(nextHeroSlide());
    }, 6500);
    return () => clearInterval(interval);
  }, [dispatch, heroBanners.length]);

  if (!heroBanners || heroBanners.length === 0) return null;

  const currentBanner = heroBanners[activeHeroIndex] || heroBanners[0];

  return (
    <section className="relative overflow-hidden bg-stone-950 text-white min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center">
      {/* Background Images with Crossfade */}
      {heroBanners.map((banner, idx) => (
        <div
          key={banner.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === activeHeroIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
          } transform transition-transform duration-7000`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover object-center"
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
                to={currentBanner.secondaryCtaLink || "/blogs"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm hover:border-white/50 transition cursor-pointer"
              >
                <span>{currentBanner.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Floating Spec Highlights */}
        <div className="hidden xl:flex absolute right-8 bottom-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 gap-6 text-white text-xs">
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Fabric</p>
            <p className="font-semibold mt-0.5">Italian Double-Faced Twill</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Provenance</p>
            <p className="font-semibold mt-0.5">Biella & Okayama Mills</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Eco Standard</p>
            <p className="font-semibold mt-0.5">Zero-Waste Certified</p>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {heroBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => dispatch(prevHeroSlide())}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center transition hover:scale-105 cursor-pointer"
            aria-label="Previous Banner"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => dispatch(nextHeroSlide())}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center transition hover:scale-105 cursor-pointer"
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
