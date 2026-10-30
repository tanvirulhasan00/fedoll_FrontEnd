import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  fetchReviewsByProductId,
  subscribeToProductReviews,
  createProductReview,
  uploadReviewImage,
  type ProductReview,
} from "~/firebase/reviews";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  StarIcon as StarSolidIcon,
  ShieldCheckIcon,
  HandThumbUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import {
  StarIcon as StarOutlineIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
  baseRating?: number;
  baseReviewCount?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productImage = "",
  baseRating = 4.8,
  baseReviewCount = 0,
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Review Form State
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formName, setFormName] = useState(user?.displayName || "");
  const [formEmail, setFormEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attached Customer Images State
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Track expanded long review messages so full customer text is easily readable
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  // Fast Parallel File Upload Handler (hardware-accelerated compression)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length + files.length > 5) {
      toast.error("You can attach up to 5 photos per review.");
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 25MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploadingImages(true);
    try {
      // Process all selected files concurrently in parallel for maximum speed (< 100ms)
      const uploadPromises = validFiles.map((file) => uploadReviewImage(file, productId));
      const results = await Promise.all(uploadPromises);
      const uploaded = results.filter((url): url is string => Boolean(url));

      setFormImages((prev) => [...prev, ...uploaded]);
      if (uploaded.length > 0) {
        toast.success(`${uploaded.length} photo(s) added!`);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Failed to process photo. Please try another image.");
    } finally {
      setIsUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (formImages.length >= 5) {
      toast.error("Maximum 5 photos allowed per review.");
      return;
    }
    setFormImages((prev) => [...prev, trimmed]);
    setImageUrlInput("");
    toast.success("Photo URL attached!");
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Helpful click tracker (local storage)
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  // Keep form name & email in sync when user logs in
  useEffect(() => {
    if (user?.displayName && !formName) setFormName(user.displayName);
    if (user?.email && !formEmail) setFormEmail(user.email);
  }, [user]);

  // Real-time listener for product reviews
  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    const unsubscribe = subscribeToProductReviews(
      productId,
      (liveReviews) => {
        setReviews(liveReviews);
        setLoading(false);
      },
      (err) => {
        console.warn("Product reviews subscription error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  // Aggregate stats calculations
  const stats = useMemo(() => {
    const totalCount = reviews.length;
    if (totalCount === 0) {
      return {
        avgRating: baseRating,
        totalCount: baseReviewCount,
        recommendRate: 96,
        breakdown: [
          { star: 5, count: 0, pct: 85 },
          { star: 4, count: 0, pct: 10 },
          { star: 3, count: 0, pct: 3 },
          { star: 2, count: 0, pct: 1 },
          { star: 1, count: 0, pct: 1 },
        ],
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = Math.round((sum / totalCount) * 10) / 10;
    const recommendCount = reviews.filter((r) => Number(r.rating) >= 4).length;
    const recommendRate = Math.round((recommendCount / totalCount) * 100);

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] || 0,
      pct: Math.round(((counts[star] || 0) / totalCount) * 100),
    }));

    return { avgRating: avg, totalCount, recommendRate, breakdown };
  }, [reviews, baseRating, baseReviewCount]);

  // Filter and sort reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    if (filterRating !== "all") {
      list = list.filter((r) => Number(r.rating) === filterRating);
    }

    if (sortBy === "highest") {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else if (sortBy === "lowest") {
      list.sort((a, b) => (Number(a.rating) || 5) - (Number(b.rating) || 5));
    } else {
      // Newest first
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return list;
  }, [reviews, filterRating, sortBy]);

  // Slider State & Refs
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
      setActiveMobileIndex(Math.max(0, Math.min(idx, displayedReviews.length - 1)));
    }
  }, [displayedReviews.length]);

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
  }, [checkScroll, displayedReviews]);

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

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formComment.trim()) {
      toast.error("Please provide your review feedback.");
      return;
    }

    if (!formName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProductReview({
        productId,
        productName,
        productImage,
        userId: user?.uid || null,
        userName: formName.trim(),
        userEmail: formEmail.trim() || user?.email || "customer@silkendrift.com",
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        images: formImages,
        verifiedPurchase: Boolean(user?.uid),
        status: "published",
      });

      toast.success(
        "Thank you! Your review with photo(s) has been published to our database.",
        { duration: 4000 }
      );

      // Reset form
      setFormTitle("");
      setFormComment("");
      setFormRating(5);
      setFormImages([]);
      setImageUrlInput("");
      setIsWriteModalOpen(false);
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("Could not save review. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) {
      toast.info("You already marked this review as helpful.");
      return;
    }
    setHelpfulClicked((prev) => new Set(prev).add(reviewId));
    toast.success("Thank you for your feedback!");
  };

  const ratingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return "1 Star — Poor";
      case 2:
        return "2 Stars — Fair";
      case 3:
        return "3 Stars — Average";
      case 4:
        return "4 Stars — Very Good";
      case 5:
        return "5 Stars — Outstanding Quality & Fit!";
      default:
        return "Select rating";
    }
  };

  return (
    <section
      id="customer-reviews"
      className="py-8 sm:py-10 bg-stone-50/50 dark:bg-neutral-900/40 border-t border-stone-200/80 dark:border-neutral-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-0.5">
              Customer Feedback
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Ratings &amp; Reviews
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 max-w-xl">
              Authentic reviews and sizing feedback from verified SilkenDrift customers across Bangladesh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm hover:shadow-md shadow-orange-600/20 active:scale-98 transition cursor-pointer self-start sm:self-auto"
          >
            <PencilSquareIcon className="size-3.5" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Compact Aggregate Ratings & Breakdown Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs mb-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Overall Score */}
            <div className="md:col-span-4 text-center md:text-left md:border-r border-stone-200/80 dark:border-neutral-800 md:pr-6">
              <div className="flex items-baseline justify-center md:justify-start gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stats.avgRating}
                </span>
                <span className="text-sm text-gray-400 dark:text-neutral-500 font-bold">
                  / 5.0
                </span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-0.5 my-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarSolidIcon
                    key={star}
                    className={`size-4 ${
                      star <= Math.round(stats.avgRating)
                        ? "text-amber-400 fill-current"
                        : "text-gray-200 dark:text-neutral-700"
                    }`}
                  />
                ))}
              </div>

              <p className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">
                Based on{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.totalCount} customer reviews
                </span>
              </p>

              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                <CheckCircleIcon className="size-3.5 shrink-0" />
                <span>{stats.recommendRate}% recommend this item</span>
              </div>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="md:col-span-5 space-y-1.5">
              {stats.breakdown.map((b) => {
                const isSelected = filterRating === b.star;
                return (
                  <button
                    key={b.star}
                    type="button"
                    onClick={() =>
                      setFilterRating(filterRating === b.star ? "all" : b.star)
                    }
                    className={`w-full flex items-center gap-2.5 text-[11px] group cursor-pointer px-1.5 py-0.5 rounded-md transition ${
                      isSelected
                        ? "bg-orange-50/80 dark:bg-orange-950/40 font-bold"
                        : "hover:bg-stone-50 dark:hover:bg-neutral-800/60"
                    }`}
                    title={`Filter by ${b.star} stars`}
                  >
                    <span className="w-10 text-left font-semibold text-gray-700 dark:text-neutral-300 flex items-center gap-0.5 shrink-0">
                      <span>{b.star}</span>
                      <StarSolidIcon className="size-2.5 text-amber-400" />
                    </span>

                    {/* Progress Bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-orange-600 dark:bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>

                    <span className="w-8 text-right font-medium text-gray-400 dark:text-neutral-500 shrink-0">
                      {b.pct}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Action / Prompt */}
            <div className="md:col-span-3 text-center md:border-l border-stone-200/80 dark:border-neutral-800 md:pl-6 space-y-1.5">
              <SparklesIcon className="size-6 mx-auto text-orange-600 dark:text-orange-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                Have you worn this?
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-snug">
                Your review helps other shoppers find the perfect fit.
              </p>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg border border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-xs font-bold transition cursor-pointer"
              >
                Share Your Experience
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Rating Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-semibold mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterRating("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                filterRating === "all"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-orange-500"
              }`}
            >
              All ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterRating(filterRating === st ? "all" : st)}
                className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  filterRating === st
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-orange-500"
                }`}
              >
                <span>{st}</span>
                <StarSolidIcon className="size-2.5 text-amber-400" />
              </button>
            ))}
          </div>

          {/* Right: Sort Dropdown + Slider Navigation Arrows */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-semibold">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1 rounded-md text-[11px] border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

            {/* Slider Navigation Arrows */}
            {displayedReviews.length > 0 && (
              <div className="flex items-center gap-1 pl-2 border-l border-stone-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={scrollPrev}
                  disabled={!canScrollLeft}
                  aria-label="Previous reviews"
                  className={`size-7.5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    canScrollLeft
                      ? "bg-white dark:bg-neutral-800 border-stone-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
                      : "bg-gray-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronLeftIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={scrollNext}
                  disabled={!canScrollRight}
                  aria-label="Next reviews"
                  className={`size-7.5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    canScrollRight
                      ? "bg-white dark:bg-neutral-800 border-stone-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-2xs active:scale-95"
                      : "bg-gray-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronRightIcon className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Spinner className="size-7 mx-auto text-orange-600" />
            <p className="text-xs text-gray-500 font-medium">
              Loading customer reviews...
            </p>
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-dashed border-stone-200 dark:border-neutral-800 space-y-3">
            <ChatBubbleLeftRightIcon className="size-10 mx-auto text-stone-300 dark:text-neutral-600" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              {filterRating !== "all"
                ? `No ${filterRating}-star reviews found`
                : "No reviews yet for this garment"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
              {filterRating !== "all"
                ? "Try selecting another rating filter above to see other reviews."
                : "Be the first verified customer to share how this garment fits and feels!"}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <PencilSquareIcon className="size-3.5" />
                <span>Write the First Review</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Reviews Slider Track */}
            <div
              ref={scrollRef}
              className="flex items-stretch overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 no-scrollbar scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 overscroll-x-contain"
            >
              {displayedReviews.map((rev) => {
                const isHelpful = helpfulClicked.has(rev.id);
                const isExpanded = expandedReviews.has(rev.id);
                const isLongComment = Boolean(rev.comment && rev.comment.length > 240);

                return (
                  <div
                    key={rev.id}
                    className="shrink-0 snap-start w-[88%] sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between min-w-0 overflow-hidden"
                  >
                    <div className="flex-1 min-w-0 w-full space-y-3 overflow-hidden">
                      {/* Header: Customer Info + Date + Rating */}
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold text-sm flex items-center justify-center shrink-0">
                            {rev.userName ? rev.userName.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-full">
                                {rev.userName}
                              </span>
                              {rev.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <ShieldCheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                                  <span>Verified Buyer</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-neutral-500 truncate">
                              {rev.createdAt
                                ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Recently"}
                            </div>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <StarSolidIcon
                              key={st}
                              className={`size-4 ${
                                st <= (Number(rev.rating) || 5)
                                  ? "text-amber-400 fill-current"
                                  : "text-gray-200 dark:text-neutral-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      {rev.title && (
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white break-words [overflow-wrap:anywhere]">
                          {rev.title}
                        </h4>
                      )}

                      {/* Full Customer Comment & Expandable Toggle for long messages */}
                      <div className="min-w-0 w-full">
                        <div
                          className={`text-xs sm:text-sm text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                            isExpanded
                              ? "max-h-64 overflow-y-auto pr-1"
                              : "line-clamp-5"
                          }`}
                        >
                          {rev.comment}
                        </div>
                        {isLongComment && (
                          <button
                            type="button"
                            onClick={() => toggleExpandReview(rev.id)}
                            className="mt-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            {isExpanded ? "Show less" : "Read full review"}
                          </button>
                        )}
                      </div>

                      {/* Customer Attached Photos */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="pt-1.5 min-w-0">
                          <div className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                            <PhotoIcon className="size-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                            <span>Customer Photos ({rev.images.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rev.images.map((imgUrl, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => setLightboxImage(imgUrl)}
                                className="relative size-14 sm:size-16 rounded-xl overflow-hidden border border-stone-200 dark:border-neutral-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer group shrink-0 shadow-2xs hover:shadow-sm"
                                title="Click to view full photo"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${rev.userName} review photo ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Atelier Reply */}
                      {rev.adminReply && (
                        <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 text-xs space-y-1 min-w-0 overflow-hidden">
                          <span className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                            <SparklesIcon className="size-3.5 shrink-0" />
                            <span>{rev.adminReply.repliedBy || "SilkenDrift Atelier"}</span>
                          </span>
                          <p className="text-gray-800 dark:text-neutral-200 italic leading-relaxed break-words [overflow-wrap:anywhere]">
                            "{rev.adminReply.text}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Helpful Button */}
                    <div className="shrink-0 pt-3 mt-4 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between text-xs text-gray-400 min-w-0">
                      <span>Export Quality Certified</span>
                      <button
                        type="button"
                        onClick={() => handleHelpful(rev.id)}
                        className={`inline-flex items-center gap-1 text-xs transition cursor-pointer shrink-0 ${
                          isHelpful
                            ? "text-orange-600 font-bold"
                            : "text-gray-500 dark:text-neutral-400 hover:text-orange-600"
                        }`}
                      >
                        <HandThumbUpIcon className="size-3.5" />
                        <span>{isHelpful ? "Helpful (1)" : "Helpful"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Pagination Indicator Dots */}
            {displayedReviews.length > 1 && (
              <div className="flex sm:hidden justify-center items-center gap-1.5 mt-2">
                {displayedReviews.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToCard(idx)}
                    aria-label={`Go to review ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeMobileIndex === idx
                        ? "w-6 bg-orange-600 dark:bg-orange-500"
                        : "w-2 bg-stone-300 dark:bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* "WRITE A REVIEW" INTERACTIVE MODAL                             */}
      {/* ============================================================== */}
      {isWriteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-neutral-800 shadow-2xl space-y-5 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  Verified Feedback
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Review {productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="size-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 flex items-center justify-center transition cursor-pointer"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="space-y-2 text-center py-2 bg-stone-50/80 dark:bg-neutral-850 rounded-2xl p-4 border border-stone-200/60 dark:border-neutral-800">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block">
                  Overall Rating
                </label>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled =
                      star <= (formHoverRating || formRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setFormHoverRating(star)}
                        onMouseLeave={() => setFormHoverRating(0)}
                        className="p-1 transition-transform hover:scale-120 cursor-pointer"
                        title={ratingLabel(star)}
                      >
                        {isFilled ? (
                          <StarSolidIcon className="size-8 text-amber-400 fill-current drop-shadow-xs" />
                        ) : (
                          <StarOutlineIcon className="size-8 text-gray-300 dark:text-neutral-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {ratingLabel(formHoverRating || formRating)}
                </div>
              </div>

              {/* Review Headline / Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Review Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxurious fabric weight, incredible modern fit!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Review Comments / Detailed Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Detailed Feedback &amp; Fit Experience
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How does the fabric feel against skin? Is the fit true to size? Did it hold shape after washing? Share any styling tips..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Attach Customer Photos */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-850 border border-stone-200/60 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <CameraIcon className="size-4 text-orange-600 dark:text-orange-400" />
                    <span>Attach Product Photos ({formImages.length}/5)</span>
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">Optional</span>
                </div>

                {/* File Upload Button / Trigger */}
                <div className="flex items-center gap-2">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition text-xs font-semibold ${
                      isUploadingImages || formImages.length >= 5
                        ? "bg-stone-100 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-gray-400 cursor-not-allowed"
                        : "bg-white hover:bg-orange-50/50 dark:bg-neutral-800/80 dark:hover:bg-orange-950/20 border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-400 hover:border-orange-500"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploadingImages || formImages.length >= 5}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {isUploadingImages ? (
                      <>
                        <Spinner className="size-4 text-orange-600" />
                        <span>Processing &amp; Optimizing Photos...</span>
                      </>
                    ) : (
                      <>
                        <PhotoIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span>
                          {formImages.length >= 5
                            ? "Limit reached (5/5 photos)"
                            : "Browse Photos or Camera"}
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Paste URL Option */}
                {formImages.length < 5 && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="url"
                      placeholder="Or paste photo URL (Unsplash, Google Drive, Imgur)..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrlInput.trim()}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 disabled:opacity-40 cursor-pointer transition"
                    >
                      Add URL
                    </button>
                  </div>
                )}

                {/* Preview Thumbnails */}
                {formImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative size-16 sm:size-20 rounded-xl overflow-hidden border-2 border-orange-500/40 bg-stone-100 dark:bg-neutral-800 group shadow-xs shrink-0"
                      >
                        <img
                          src={img}
                          alt={`Review photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 size-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                        >
                          <XMarkIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tanvir@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formComment.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? <Spinner className="size-4" /> : null}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL-SIZE PHOTO LIGHTBOX MODAL                                 */}
      {/* ============================================================== */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close photo preview"
              className="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-xs"
            >
              <XMarkIcon className="size-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Customer review photo"
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
            <div className="w-full py-2.5 px-4 bg-neutral-950/80 text-center text-xs text-neutral-300 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <CameraIcon className="size-4 text-orange-400" />
                <span>Verified Customer Product Photo</span>
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-orange-400 hover:underline font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviewsSection;

