import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  ClockIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
} from "~/firebase";
import { JournalPreviewSkeleton } from "~/components/main/Skeletons";

export default function JournalPreviewSection() {
  const { blogs, loading } = useAppSelector((state) => state.blogs);
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
      setActiveMobileIndex(Math.max(0, Math.min(idx, blogs.length - 1)));
    }
  }, [blogs.length]);

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
  }, [checkScroll, blogs]);

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

  if (loading && (!blogs || blogs.length === 0)) {
    return <JournalPreviewSkeleton />;
  }

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500 mb-1.5">
            <BookOpenIcon className="size-4" />
            Style & Care Guides
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            SilkenDrift Style Journal
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-md">
            Helpful tips on styling, caring for clothes in Bangladeshi weather, and picking everyday wardrobe essentials.
          </p>
        </div>

        {/* Right Header: Link to all guides + Slider Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto shrink-0">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-500 hover:text-orange-800 dark:hover:text-orange-400 transition"
          >
            <span>Read All Guides</span>
            <ArrowRightIcon className="size-3.5 sm:size-4" />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="journal-prev"
              onClick={scrollPrev}
              disabled={!canScrollLeft}
              aria-label="Previous stories"
              className={`size-8 sm:size-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                canScrollLeft
                  ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              id="journal-next"
              onClick={scrollNext}
              disabled={!canScrollRight}
              aria-label="Next stories"
              className={`size-8 sm:size-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                canScrollRight
                  ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Journal Stories Slider */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
      >
        {blogs.map((blog, idx) => (
          <article
            key={blog.id || idx}
            className="group flex flex-col rounded-2xl border border-gray-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 snap-start"
          >
            {/* Image */}
            <div className="relative h-44 sm:h-44 overflow-hidden bg-stone-100 dark:bg-neutral-800">
              <img
                src={normalizeGoogleDriveImageUrl(blog.coverImage)}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fileId = extractGoogleDriveFileId(blog.coverImage);
                  if (fileId && !target.dataset.triedThumbnail) {
                    target.dataset.triedThumbnail = "true";
                    target.src = getGoogleDriveThumbnailUrl(blog.coverImage, 800);
                    return;
                  }
                  target.src =
                    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs text-gray-900 dark:text-neutral-100 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                {blog.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {blog.readTime}
                  </span>
                  <span>•</span>
                  <span className="truncate">{blog.publishedAt}</span>
                </div>

                <Link to={`/blogs/${blog.id}`}>
                  <h3 className="text-sm sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                </Link>

                <p className="mt-1.5 text-xs text-gray-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="size-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-gray-800 dark:text-neutral-200 truncate max-w-[100px]">
                    {blog.author.name}
                  </span>
                </div>

                <Link
                  to={`/blogs/${blog.id}`}
                  className="text-xs font-semibold text-orange-700 dark:text-orange-500 group-hover:translate-x-0.5 transition"
                >
                  Read &rarr;
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Mobile Dot Indicators */}
      {blogs.length > 1 && (
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
          {blogs.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCard(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeMobileIndex
                  ? "w-6 bg-orange-600 shadow-xs"
                  : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
              }`}
              aria-label={`Go to story slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
