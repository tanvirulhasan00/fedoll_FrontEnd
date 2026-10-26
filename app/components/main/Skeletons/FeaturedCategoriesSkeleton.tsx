import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const FeaturedCategoriesSkeleton: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          <Skeleton className="h-9 sm:h-10 w-64 sm:w-80 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          <Skeleton className="h-4 w-60 max-w-full rounded-md" />
        </div>
      </div>

      {/* Grid of 4 categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 h-[380px] flex flex-col justify-between p-6 shadow-xs"
          >
            {/* Top pill & arrow */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
            </div>

            {/* Bottom titles */}
            <div className="space-y-2 pt-12">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCategoriesSkeleton;
