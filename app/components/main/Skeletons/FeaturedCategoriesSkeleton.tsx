import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const FeaturedCategoriesSkeleton: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-56 sm:w-80 rounded-xl" />
          <Skeleton className="h-3.5 w-72 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Skeleton className="size-9 sm:size-10 rounded-full" />
          <Skeleton className="size-9 sm:size-10 rounded-full" />
        </div>
      </div>

      {/* Slider of 4 categories */}
      <div className="flex gap-3 sm:gap-4 overflow-hidden pb-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 h-[300px] sm:h-[320px] lg:h-[350px] flex flex-col justify-between p-5 shadow-xs"
          >
            {/* Top pill & arrow */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="size-7 sm:size-8 rounded-full" />
            </div>

            {/* Bottom titles */}
            <div className="space-y-2 pt-12">
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCategoriesSkeleton;
