import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  fetchReviewsByProductId,
  fetchAllReviewsForAdmin,
  subscribeToAllReviewsForAdmin,
  updateReviewStatusInFirestore,
  deleteReviewFromFirestore,
  replyToReviewInFirestore,
  type ProductReview,
} from "~/firebase/reviews";
import {
  StarIcon as StarSolidIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeSlashIcon,
  TrashIcon,
  ChatBubbleLeftEllipsisIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import { CameraIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";

interface AdminReviewsTabProps {
  adminName?: string;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({
  adminName = "SilkenDrift Atelier",
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "pending" | "hidden"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Photo Lightbox State
  const [adminLightboxImage, setAdminLightboxImage] = useState<string | null>(null);

  // Reply Modal State
  const [replyingReview, setReplyingReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Delete Confirm Modal State
  const [deletingReview, setDeletingReview] = useState<ProductReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to real-time reviews from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllReviewsForAdmin(
      (liveReviews) => {
        setReviews(liveReviews);
        setLoading(false);
      },
      (error) => {
        console.warn("Could not subscribe to reviews in admin:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchAllReviewsForAdmin();
      setReviews(data);
      toast.success("Customer reviews reloaded from database!");
    } catch {
      toast.error("Failed to refresh reviews.");
    } finally {
      setLoading(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (
    review: ProductReview,
    newStatus: "published" | "pending" | "hidden"
  ) => {
    try {
      await updateReviewStatusInFirestore(review.id, newStatus, review.productId);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
      );
      toast.success(`Review status changed to "${newStatus}"`);
    } catch {
      toast.error("Failed to update review status.");
    }
  };

  // Reply Submit Handler
  const handleSendReply = async () => {
    if (!replyingReview) return;
    if (!replyText.trim()) {
      toast.error("Please enter a response message.");
      return;
    }

    setReplySubmitting(true);
    try {
      await replyToReviewInFirestore(replyingReview.id, replyText, adminName);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === replyingReview.id
            ? {
                ...r,
                adminReply: {
                  text: replyText.trim(),
                  repliedAt: new Date().toISOString(),
                  repliedBy: adminName,
                },
              }
            : r
        )
      );
      toast.success("Official store reply saved & published!");
      setReplyingReview(null);
      setReplyText("");
    } catch {
      toast.error("Failed to save response.");
    } finally {
      setReplySubmitting(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      await deleteReviewFromFirestore(deletingReview.id, deletingReview.productId);
      setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      toast.success("Review permanently deleted.");
      setDeletingReview(null);
    } catch {
      toast.error("Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = reviews.length;
    const published = reviews.filter((r) => r.status === "published" || !r.status).length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const hidden = reviews.filter((r) => r.status === "hidden").length;

    const avgRating =
      published > 0
        ? (
            reviews
              .filter((r) => r.status === "published" || !r.status)
              .reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / published
          ).toFixed(1)
        : "5.0";

    return { total, published, pending, hidden, avgRating };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Status filter
      if (statusFilter !== "all") {
        const itemStatus = r.status || "published";
        if (itemStatus !== statusFilter) return false;
      }

      // Rating filter
      if (ratingFilter !== "all") {
        if (String(r.rating) !== ratingFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.userName || "").toLowerCase().includes(q);
        const matchEmail = (r.userEmail || "").toLowerCase().includes(q);
        const matchProduct = (r.productName || "").toLowerCase().includes(q);
        const matchComment = (r.comment || "").toLowerCase().includes(q);
        const matchTitle = (r.title || "").toLowerCase().includes(q);
        return matchName || matchEmail || matchProduct || matchComment || matchTitle;
      }

      return true;
    });
  }, [reviews, statusFilter, ratingFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Customer Ratings &amp; Reviews</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
              Live Database
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Monitor, moderate, and reply to real product reviews submitted by storefront shoppers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm font-semibold text-gray-700 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-700 transition cursor-pointer shadow-xs"
        >
          <ArrowPathIcon className={`size-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            Total Reviews
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
            All submitted customer feedback
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            Average Store Rating
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 flex items-center gap-1.5">
            <span>{metrics.avgRating}</span>
            <StarSolidIcon className="size-6 text-amber-400" />
          </div>
          <div className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
            Across {metrics.published} published reviews
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Published Live
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.published}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
            Visible on product detail pages
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending / Hidden
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {metrics.pending + metrics.hidden}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
            {metrics.pending} pending, {metrics.hidden} hidden
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, product, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-stone-100 dark:bg-neutral-800 p-1 text-xs">
            {(["all", "published", "pending", "hidden"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
                    : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Rating Dropdown */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Spinner className="size-8 mx-auto text-orange-600" />
          <p className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
            Syncing customer reviews with Firestore...
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-gray-200 dark:border-neutral-800 space-y-3">
          <ChatBubbleLeftEllipsisIcon className="size-10 mx-auto text-gray-300 dark:text-neutral-600" />
          <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200">
            No Customer Reviews Found
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all" || ratingFilter !== "all"
              ? "No reviews match the selected filter criteria. Try clearing your search filters."
              : "Customers have not yet submitted any reviews. Submitted reviews from the product detail page will automatically appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isPublished = rev.status === "published" || !rev.status;
            const isPending = rev.status === "pending";
            const isHidden = rev.status === "hidden";

            return (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 shadow-2xs space-y-3 hover:border-gray-300 dark:hover:border-neutral-700 transition min-w-0 overflow-hidden"
              >
                {/* Top Row: Customer & Product Info + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
                    {/* User Initials Avatar */}
                    <div className="size-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-full">
                          {rev.userName || "Customer"}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
                            <ShieldCheckIcon className="size-2.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400 truncate max-w-full">
                        {rev.userEmail || "No email"} •{" "}
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recently"}
                      </div>
                    </div>
                  </div>

                  {/* Status & Product Tag */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isPublished
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
                          : isPending
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                          : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700"
                      }`}
                    >
                      {rev.status || "Published"}
                    </span>

                    {/* Linked Product Button */}
                    <Link
                      to={`/products/${rev.productId}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline px-2 py-0.5 rounded-md bg-orange-50/60 dark:bg-orange-950/30 truncate max-w-[200px]"
                      title={rev.productName || `Product #${rev.productId}`}
                    >
                      {rev.productName || `Product #${rev.productId}`} ↗
                    </Link>
                  </div>
                </div>

                {/* Rating Stars & Review Content */}
                <div className="space-y-1.5 pl-0 sm:pl-10.5 min-w-0 overflow-hidden w-full">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <StarSolidIcon
                        key={i}
                        className={`size-3.5 ${
                          i < (Number(rev.rating) || 5)
                            ? "text-amber-400"
                            : "text-gray-200 dark:text-neutral-700"
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-gray-700 dark:text-neutral-300 ml-1">
                      {rev.rating}.0 / 5.0
                    </span>
                  </div>

                  {rev.title && (
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white pt-0.5 break-words [overflow-wrap:anywhere]">
                      {rev.title}
                    </h4>
                  )}

                  <p className="text-xs text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                    {rev.comment}
                  </p>

                  {/* Customer Attached Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="pt-1.5 min-w-0">
                      <div className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                        <PhotoIcon className="size-3 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span>Customer Attached Photos ({rev.images.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rev.images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setAdminLightboxImage(imgUrl)}
                            className="relative size-11 sm:size-12 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 hover:border-orange-500 transition-all cursor-pointer group shrink-0 shadow-2xs hover:shadow-xs"
                            title="Click to inspect photo in high resolution"
                          >
                            <img
                              src={imgUrl}
                              alt="Customer review photo"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Admin Reply */}
                {rev.adminReply && (
                  <div className="ml-0 sm:ml-10.5 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 space-y-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-xs min-w-0">
                      <span className="font-bold text-orange-700 dark:text-orange-400 truncate">
                        {rev.adminReply.repliedBy || "SilkenDrift Atelier"} (Official Reply)
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {rev.adminReply.repliedAt
                          ? new Date(rev.adminReply.repliedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {rev.adminReply.text}
                    </p>
                  </div>
                )}

                {/* Action Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    {/* Status Toggle Buttons */}
                    {!isPublished ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev, "published")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <CheckIcon className="size-3.5" />
                        <span>Publish Review</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev, "hidden")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
                      >
                        <EyeSlashIcon className="size-3.5" />
                        <span>Hide Review</span>
                      </button>
                    )}

                    {/* Reply Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingReview(rev);
                        setReplyText(rev.adminReply?.text || "");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-semibold transition cursor-pointer"
                    >
                      <ChatBubbleLeftEllipsisIcon className="size-3.5" />
                      <span>{rev.adminReply ? "Edit Reply" : "Post Reply"}</span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeletingReview(rev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer"
                  >
                    <TrashIcon className="size-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Reply to {replyingReview.userName}'s Review
              </h3>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-neutral-800/60 text-xs text-gray-600 dark:text-neutral-300 space-y-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                "{replyingReview.title || "Review"}" ({replyingReview.rating} Stars)
              </div>
              <p className="line-clamp-3 italic">"{replyingReview.comment}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                Official Response Message
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a courteous response thanking the customer or addressing their feedback..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={replySubmitting || !replyText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {replySubmitting ? <Spinner className="size-3.5" /> : null}
                <span>Publish Response</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="size-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Delete Customer Review?
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Are you sure you want to delete this review by{" "}
                <span className="font-semibold text-gray-800 dark:text-neutral-200">
                  {deletingReview.userName}
                </span>
                ? This action cannot be undone and will recalculate the product rating.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <Spinner className="size-3.5" /> : null}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN PHOTO LIGHTBOX PREVIEW MODAL                             */}
      {/* ============================================================== */}
      {adminLightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setAdminLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAdminLightboxImage(null)}
              aria-label="Close photo preview"
              className="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-xs"
            >
              <XMarkIcon className="size-6" />
            </button>
            <img
              src={adminLightboxImage}
              alt="Customer review photo"
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
            <div className="w-full py-2.5 px-4 bg-neutral-950/80 text-center text-xs text-neutral-300 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <CameraIcon className="size-4 text-orange-400" />
                <span>Customer Uploaded Photo Review</span>
              </span>
              <button
                type="button"
                onClick={() => setAdminLightboxImage(null)}
                className="text-orange-400 hover:underline font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsTab;

