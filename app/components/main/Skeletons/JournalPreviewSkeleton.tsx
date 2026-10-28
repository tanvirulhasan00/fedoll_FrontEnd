import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const JournalPreviewSkeleton: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-36 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-60 sm:w-80 rounded-xl" />
          <Skeleton className="h-3.5 w-72 max-w-full rounded-md" />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="size-8 sm:size-9 rounded-full" />
          <Skeleton className="size-8 sm:size-9 rounded-full" />
        </div>
      </div>

      {/* 4 Blog Cards in slider row */}
      <div className="flex gap-3 sm:gap-4 overflow-hidden pb-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 flex flex-col rounded-2xl border border-gray-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs"
          >
            {/* Image Skeleton */}
            <Skeleton className="h-36 sm:h-44 w-full rounded-none" />

            {/* Content Skeleton */}
            <div className="p-3.5 sm:p-4 space-y-3">
              <Skeleton className="h-3 w-28 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <Skeleton className="h-3 w-5/6 rounded-md hidden min-[480px]:block" />
              <div className="pt-2.5 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 sm:size-7 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default JournalPreviewSkeleton;
