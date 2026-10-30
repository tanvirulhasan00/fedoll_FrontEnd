import React, { useState, useRef, useCallback } from "react";
import { useAppSelector } from "~/redux/hooks/hook";
import { StarIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";
import { TestimonialsSectionSkeleton } from "~/components/main/Skeletons";

export default function TestimonialsSection() {
  const { testimonials, loading } = useAppSelector((state) => state.home);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Smooth scroll to a specific card when clicking dot without affecting window scroll
  const scrollToCard = useCallback((index: number) => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const target = cardRefs.current[index];
    if (target) {
      isScrollingProgrammatically.current = true;
      const cardRect = target.getBoundingClientRect();
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
      }, 400);
    }
    setActiveMobileIndex(index);
  }, []);

  // Update active indicator dot as user swipes
  const handleScroll = () => {
    if (isScrollingProgrammatically.current) return;
    const container = mobileScrollRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerCenter = scrollLeft + container.offsetWidth / 2;
    let closestIdx = 0;
    let minDiff = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const diff = Math.abs(cardCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeMobileIndex) {
      setActiveMobileIndex(closestIdx);
    }
  };

  if (loading && (!testimonials || testimonials.length === 0)) {
    return <TestimonialsSectionSkeleton />;
  }

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-10 sm:py-16 md:py-20 lg:py-24 bg-stone-50 dark:bg-neutral-900/60 border-y border-stone-200/80 dark:border-neutral-800 transition-colors duration-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500">
            Customer Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mt-1.5 sm:mt-2">
            Loved by Customers Across Bangladesh
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
            Real reviews from people wearing SilkenDrift clothes in Dhaka, Chittagong,
            Sylhet, and all across Bangladesh.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: Horizontal Touch Card Slider with Peek Cards (< 768px)       */}
        {/* ========================================================================= */}
        <div className="md:hidden">
          <div
            ref={mobileScrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 px-1 py-1 scroll-smooth no-scrollbar overscroll-x-contain"
          >
            {testimonials.map((test, idx) => (
              <div
                key={test.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="w-[84vw] max-w-[320px] shrink-0 snap-center flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-gray-200/90 dark:border-neutral-700/80 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Star Rating & Counter */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-500">
                      {[...Array(test.rating)].map((_, i) => (
                        <StarIcon key={i} className="size-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-neutral-700/60 px-1.5 py-0.5 rounded">
                      {idx + 1}/{testimonials.length}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed italic line-clamp-4">
                    "{test.comment}"
                  </p>
                </div>

                {/* Reviewer Details */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-neutral-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={test.avatar}
                      alt={test.name}
                      className="size-9 rounded-full object-cover ring-2 ring-orange-600/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[130px]">
                          {test.name}
                        </h4>
                        <CheckBadgeIcon
                          className="size-3.5 text-emerald-600 shrink-0"
                          title="Verified Buyer"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        {test.role} • {test.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Dot Indicators */}
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToCard(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeMobileIndex
                      ? "w-5 bg-orange-500 shadow-xs"
                      : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
                  }`}
                  aria-label={`Go to review ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW: Clean 3-Column Responsive Grid (>= 768px)                   */}
        {/* ========================================================================= */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((test) => (
            <div
              key={test.id}
              className="flex flex-col justify-between p-6 lg:p-8 rounded-3xl bg-white dark:bg-neutral-800/80 border border-gray-200/90 dark:border-neutral-700/80 shadow-xs hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex gap-1 text-amber-500">
                  {[...Array(test.rating)].map((_, i) => (
                    <StarIcon key={i} className="size-4 fill-current" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 dark:text-neutral-300 text-sm leading-relaxed italic">
                  "{test.comment}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="size-11 rounded-full object-cover ring-2 ring-orange-600/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {test.name}
                      </h4>
                      <CheckBadgeIcon
                        className="size-4 text-emerald-600"
                        title="Verified Buyer"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {test.role} • {test.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

