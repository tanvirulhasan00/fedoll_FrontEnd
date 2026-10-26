import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const ContactPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* 4 Contact Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 space-y-3 shadow-xs"
          >
            <Skeleton className="size-10 rounded-2xl" />
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Form Skeleton */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 space-y-6 shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>

          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>

        {/* Right Column: Studio Hours & FAQs Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-50 dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>
          </div>

          {/* FAQs Accordion Skeleton */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 space-y-4 shadow-sm">
            <Skeleton className="h-6 w-44 rounded-md" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((faq) => (
                <div
                  key={faq}
                  className="py-3 border-b border-stone-100 dark:border-neutral-800 flex items-center justify-between"
                >
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="size-4 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPageSkeleton;
