import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const OrderTrackerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Tracking Header Card */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 dark:border-neutral-800 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>

          <div className="sm:text-right space-y-1">
            <Skeleton className="h-3.5 w-24 sm:ml-auto rounded-md" />
            <Skeleton className="h-7 w-32 sm:ml-auto rounded-md" />
          </div>
        </div>

        {/* Milestone Timeline Stepper */}
        <div className="py-4">
          <div className="hidden md:flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-stone-100 dark:bg-neutral-800 z-0" />
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center gap-2"
              >
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-2.5 w-14 rounded-md" />
              </div>
            ))}
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="md:hidden space-y-4 pl-4 border-l-2 border-stone-200 dark:border-neutral-800">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="space-y-1 pl-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Courier Partner & Telemetry Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 2-Column Info: Recipient & Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient Details */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>

        {/* Order Payment Summary */}
        <div className="rounded-3xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 flex justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackerSkeleton;
