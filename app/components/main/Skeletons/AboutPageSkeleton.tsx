import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const AboutPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-16 py-12 sm:py-16">
      {/* Hero Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-6 w-36 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-10 sm:h-14 w-11/12 rounded-xl" />
            <Skeleton className="h-10 sm:h-14 w-3/4 rounded-xl" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-4/5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Pillars Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-stone-50/80 dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 space-y-4 shadow-xs"
            >
              <Skeleton className="size-12 rounded-2xl" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Craft Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-9 sm:h-11 w-4/5 rounded-xl" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[1, 2, 3].map((stat) => (
                <div key={stat} className="space-y-1">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6">
            <Skeleton className="aspect-4/3 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPageSkeleton;
