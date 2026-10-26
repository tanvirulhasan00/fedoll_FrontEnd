import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const LegalPolicySkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Policy Meta & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200/80 dark:border-neutral-800 gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Main Document Body */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-sm space-y-8">
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="space-y-4">
            {/* Section Heading */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <Skeleton className="h-6 w-64 max-w-full rounded-md" />
            </div>

            {/* Paragraph lines */}
            <div className="space-y-2.5 pl-11">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-11/12 rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>

            {/* Optional Callout / List */}
            {section % 2 === 0 && (
              <div className="ml-11 p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/60 dark:border-neutral-700/60 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalPolicySkeleton;
