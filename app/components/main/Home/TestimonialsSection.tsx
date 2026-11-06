import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import { StarIcon as StarSolid, CheckBadgeIcon } from "@heroicons/react/24/solid";
import {
  StarIcon as StarOutline,
  ChatBubbleBottomCenterTextIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  TruckIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { TestimonialsSectionSkeleton } from "~/components/main/Skeletons";
import {
  subscribeToPublishedReviews,
  fetchPublishedReviews,
  type ProductReview,
} from "~/firebase";

const formatDate = (isoString?: string): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

export default function TestimonialsSection() {
  const { publishedReviews: reduxReviews, loading: reduxLoading } =
    useAppSelector((state) => state.home);

  const [realReviews, setRealReviews] = useState<ProductReview[]>(reduxReviews || []);
  const [loading, setLoading] = useState(
    (!reduxReviews || reduxReviews.length === 0) && reduxLoading
  );
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Subscribe to live Firestore customer reviews in real time
  useEffect(() => {
    let isMounted = true;

    // Fast initial local/cached fetch
    fetchPublishedReviews(12).then((initialList) => {
      if (isMounted && initialList && initialList.length > 0) {
        setRealReviews(initialList);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToPublishedReviews(
      (liveReviews) => {
        if (!isMounted) return;
        setRealReviews(liveReviews);
        setLoading(false);
      },
      12,
      () => {
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync with reduxReviews if updated by home loader
  useEffect(() => {
    if (reduxReviews && reduxReviews.length > 0 && realReviews.length === 0) {
      setRealReviews(reduxReviews);
      setLoading(false);
    }
  }, [reduxReviews]);

  const activeReviews = realReviews.length > 0 ? realReviews : (reduxReviews || []);

  // Smooth scroll to a specific card when clicking dot indicator
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

  // Update active indicator dot as user swipes horizontally
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

  // Loading Skeleton State
  if (loading && activeReviews.length === 0) {
    return <TestimonialsSectionSkeleton />;
  }

  // =========================================================================
  // EMPTY STATE: If no customer reviews are in the database yet
  // =========================================================================
  if (activeReviews.length === 0) {
    return (
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-stone-50/80 dark:bg-neutral-900/60 border-y border-stone-200/80 dark:border-neutral-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500">
              Customer Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mt-1.5 sm:mt-2">
              Loved by Customers Across Bangladesh
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
              Verified feedback and real experiences from people wearing SilkenDrift garments.
            </p>
          </div>

          {/* Premium Empty State Showcase Card */}
          <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs text-center space-y-6">
            <div className="mx-auto size-16 sm:size-20 rounded-3xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs">
              <ChatBubbleBottomCenterTextIcon className="size-8 sm:size-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 text-[11px] font-bold">
                <SparklesIcon className="size-3.5 text-orange-600 dark:text-orange-400" />
                <span>Be the First to Review</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                No Customer Reviews Yet
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                Every SilkenDrift garment is tailored with certified export-grade cotton and precision high-durability stitching. If you have recently received your order, we would love to hear your feedback!
              </p>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <ShoppingBagIcon className="size-4" />
                <span>Explore Our Collection</span>
              </Link>
              <Link
                to="/track-order"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-stone-300 dark:border-neutral-700 text-stone-700 dark:text-neutral-200 hover:bg-stone-100 dark:hover:bg-neutral-800 font-semibold text-xs transition cursor-pointer"
              >
                <span>Track Order &amp; Leave a Review</span>
              </Link>
            </div>

            {/* Trust Assurance Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-gray-100 dark:border-neutral-800 text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-900/60 border border-stone-200/50 dark:border-neutral-800">
                <CheckBadgeIcon className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    100% Verified
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Reviews from verified customers who placed real orders.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-900/60 border border-stone-200/50 dark:border-neutral-800">
                <ShieldCheckIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Export Grade
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    OEKO-TEX® certified durable cotton and precision fits.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-900/60 border border-stone-200/50 dark:border-neutral-800">
                <TruckIcon className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    7-Day Exchange
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Hassle-free doorstep exchanges across all 64 districts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // POPULATED STATE: Real Customer Reviews from Cloud Firestore
  // =========================================================================
  return (
    <section className="py-10 sm:py-16 md:py-20 lg:py-24 bg-stone-50/70 dark:bg-neutral-900/60 border-y border-stone-200/80 dark:border-neutral-800 transition-colors duration-200">
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
            Real reviews from verified shoppers wearing SilkenDrift clothes in Dhaka, Chittagong, Sylhet, and all across the country.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: Touch-friendly horizontal swipe slider (< 768px)             */}
        {/* ========================================================================= */}
        <div className="md:hidden">
          <div
            ref={mobileScrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 px-1 py-1 scroll-smooth no-scrollbar touch-pan-x touch-pan-y"
          >
            {activeReviews.map((review, idx) => {
              const initials = (review.userName || "Verified Customer")
                .trim()
                .slice(0, 1)
                .toUpperCase();
              const dateLabel = formatDate(review.createdAt);

              return (
                <div
                  key={review.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className="w-[84vw] max-w-[320px] shrink-0 snap-center flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/90 dark:border-neutral-800 shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Star Rating & Counter */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) =>
                          i < Math.round(review.rating || 5) ? (
                            <StarSolid key={i} className="size-3.5 fill-current" />
                          ) : (
                            <StarOutline key={i} className="size-3.5 text-stone-300 dark:text-neutral-600" />
                          )
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                        {idx + 1}/{activeReviews.length}
                      </span>
                    </div>

                    {/* Title & Comment */}
                    <div className="space-y-1.5">
                      {review.title && (
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-gray-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed italic line-clamp-4">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    </div>

                    {/* Customer Photo Thumbnails (if uploaded) */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                        {review.images.slice(0, 3).map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setLightboxImage(imgUrl)}
                            className="size-11 rounded-lg overflow-hidden border border-stone-200 dark:border-neutral-700 shrink-0 hover:opacity-90 transition cursor-pointer"
                          >
                            <img
                              src={imgUrl}
                              alt="Customer review upload"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reviewer Details & Reviewed Product */}
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-orange-500/20 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {review.userName || "Verified Buyer"}
                          </h4>
                          {review.verifiedPurchase && (
                            <CheckBadgeIcon
                              className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                              title="Verified Buyer"
                            />
                          )}
                        </div>
                        {review.productName ? (
                          <Link
                            to={`/product/${review.productId || ""}`}
                            className="text-[10px] text-orange-600 dark:text-orange-400 truncate block hover:underline"
                            title={review.productName}
                          >
                            {review.productName}
                          </Link>
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-neutral-500 block">Verified Purchase</span>
                        )}
                      </div>
                    </div>

                    {dateLabel && (
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono shrink-0">
                        {dateLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Dot Indicators */}
          {activeReviews.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {activeReviews.map((_, idx) => (
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
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activeReviews.map((review) => {
            const initials = (review.userName || "Verified Customer")
              .trim()
              .slice(0, 1)
              .toUpperCase();
            const dateLabel = formatDate(review.createdAt);

            return (
              <div
                key={review.id}
                className="flex flex-col justify-between p-6 lg:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-gray-200/90 dark:border-neutral-800 shadow-xs hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-3.5">
                  {/* Rating Stars & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) =>
                        i < Math.round(review.rating || 5) ? (
                          <StarSolid key={i} className="size-4 fill-current" />
                        ) : (
                          <StarOutline key={i} className="size-4 text-stone-300 dark:text-neutral-600" />
                        )
                      )}
                    </div>
                    {dateLabel && (
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">
                        {dateLabel}
                      </span>
                    )}
                  </div>

                  {/* Title & Comment */}
                  <div className="space-y-1.5">
                    {review.title && (
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-gray-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed italic line-clamp-5">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  {/* Customer Photo Uploads */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {review.images.slice(0, 3).map((imgUrl, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => setLightboxImage(imgUrl)}
                          className="size-12 rounded-xl overflow-hidden border border-stone-200 dark:border-neutral-700 shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-xs"
                          title="Click to view customer photo"
                        >
                          <img
                            src={imgUrl}
                            alt="Customer upload"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Admin Reply Note if Available */}
                  {review.adminReply && (
                    <div className="mt-3 p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-[11px] text-gray-700 dark:text-neutral-300">
                      <p className="font-bold text-orange-800 dark:text-orange-400 mb-0.5">
                        {review.adminReply.repliedBy || "SilkenDrift Atelier"}:
                      </p>
                      <p className="italic">&ldquo;{review.adminReply.text}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Reviewer Details & Reviewed Product */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0 ring-2 ring-orange-500/20 shadow-xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {review.userName || "Verified Buyer"}
                        </h4>
                        {review.verifiedPurchase && (
                          <CheckBadgeIcon
                            className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                            title="Verified Buyer"
                          />
                        )}
                      </div>
                      {review.productName ? (
                        <Link
                          to={`/product/${review.productId || ""}`}
                          className="text-[11px] text-orange-600 dark:text-orange-400 truncate block hover:underline font-medium"
                          title={review.productName}
                        >
                          {review.productName}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-neutral-500 block">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-neutral-900 p-2 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 size-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close photo preview"
            >
              <XMarkIcon className="size-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Customer product review full-size preview"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
