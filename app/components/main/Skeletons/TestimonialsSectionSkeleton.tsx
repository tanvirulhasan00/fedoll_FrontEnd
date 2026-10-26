import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const TestimonialsSectionSkeleton: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-stone-50 dark:bg-neutral-900/60 border-y border-stone-200/80 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <Skeleton className="h-3.5 w-32 mx-auto rounded-full" />
          <Skeleton className="h-9 sm:h-10 w-80 sm:w-96 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-72 mx-auto rounded-md" />
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-neutral-800/80 border border-gray-200/90 dark:border-neutral-700/80 shadow-xs"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Skeleton key={s} className="size-4 rounded-xs" />
                  ))}
                </div>

                {/* Comment Lines */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-11/12 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              </div>

              {/* Author Row */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-700/60 flex items-center gap-3">
                <Skeleton className="size-11 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSectionSkeleton;
