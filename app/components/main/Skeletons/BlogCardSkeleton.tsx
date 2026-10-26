import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

interface BlogCardSkeletonProps {
  className?: string;
}

export const BlogCardSkeleton: React.FC<BlogCardSkeletonProps> = ({
  className = "",
}) => {
  return (
    <article
      className={`flex flex-col rounded-2xl border border-gray-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs ${className}`}
    >
      {/* Cover Image Placeholder */}
      <div className="relative h-52 bg-stone-100 dark:bg-neutral-800/70 flex items-center justify-center overflow-hidden">
        <Skeleton className="w-10 h-10 rounded-full opacity-60" />
        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Metadata Row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>

          {/* Title (2 lines) */}
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-5/6 rounded-md" />
            <Skeleton className="h-5 w-3/5 rounded-md" />
          </div>

          {/* Excerpt (2 lines) */}
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
          </div>
        </div>

        {/* Author Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-7 rounded-full shrink-0" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <Skeleton className="h-3 w-12 rounded-md" />
        </div>
      </div>
    </article>
  );
};

export default BlogCardSkeleton;
