import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import BlogCardSkeleton from "./BlogCardSkeleton";

export const BlogDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-md" />
        <span className="text-gray-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-4 w-16 rounded-md" />
        <span className="text-gray-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-4 w-40 rounded-md" />
      </div>

      {/* Header Area */}
      <header className="space-y-4">
        {/* Category Pill */}
        <Skeleton className="h-6 w-28 rounded-full" />

        {/* Title */}
        <div className="space-y-3">
          <Skeleton className="h-10 sm:h-12 w-11/12 rounded-xl" />
          <Skeleton className="h-10 sm:h-12 w-3/4 rounded-xl" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-5 w-full rounded-md" />
          <Skeleton className="h-5 w-4/5 rounded-md" />
        </div>

        {/* Author & Metadata Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-y border-stone-200/80 dark:border-neutral-800 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </header>

      {/* Cover Image Placeholder */}
      <div className="relative h-72 sm:h-96 md:h-[440px] w-full rounded-3xl overflow-hidden bg-stone-100 dark:bg-neutral-800 flex items-center justify-center border border-gray-200/80 dark:border-neutral-800">
        <Skeleton className="w-16 h-16 rounded-full opacity-60" />
      </div>

      {/* Article Body Content */}
      <div className="space-y-6 pt-4">
        {/* Paragraph 1 */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-11/12 rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>

        {/* Section Heading */}
        <Skeleton className="h-7 w-64 rounded-lg mt-6" />

        {/* Paragraph 2 */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>

        {/* Blockquote Placeholder */}
        <div className="my-8 pl-6 border-l-4 border-stone-300 dark:border-neutral-700 p-6 rounded-r-2xl bg-stone-50 dark:bg-neutral-900/60 space-y-2">
          <Skeleton className="h-5 w-11/12 rounded-md" />
          <Skeleton className="h-5 w-3/4 rounded-md" />
        </div>

        {/* Paragraph 3 */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
      </div>

      {/* Related Articles Skeleton */}
      <div className="pt-16 border-t border-gray-200 dark:border-neutral-800 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-7 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailSkeleton;
