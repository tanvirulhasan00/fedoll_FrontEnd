import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

interface OrderCardSkeletonProps {
  className?: string;
}

export const OrderCardSkeleton: React.FC<OrderCardSkeletonProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Top Header: Order Number, Date, Status Badge, Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-neutral-800 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>

        <div className="sm:text-right space-y-1">
          <Skeleton className="h-3 w-16 sm:ml-auto rounded-md" />
          <Skeleton className="h-6 w-24 sm:ml-auto rounded-md" />
        </div>
      </div>

      {/* Items Preview */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3.5">
            <Skeleton className="size-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-48 max-w-full rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-4 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>

      {/* Courier & Delivery Bar */}
      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md shrink-0" />
          <Skeleton className="h-3.5 w-44 rounded-md" />
        </div>
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-36 rounded-md" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default OrderCardSkeleton;
