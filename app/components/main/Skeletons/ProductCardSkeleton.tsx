import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs ${className}`}
    >
      {/* Product Image Skeleton */}
      <div className="relative aspect-4/5 w-full bg-stone-100 dark:bg-neutral-800/60 flex items-center justify-center overflow-hidden">
        <Skeleton className="w-12 h-12 rounded-full opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-3 rounded-full" />
          <Skeleton className="w-12 h-3 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="w-4/5 h-4 rounded-md" />
          <Skeleton className="w-1/2 h-4 rounded-md" />
        </div>

        {/* Stock Status Badge */}
        <Skeleton className="w-24 h-4 rounded-full" />

        {/* Price & Action */}
        <div className="pt-3 mt-auto border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="w-20 h-5 rounded-md" />
            <Skeleton className="w-14 h-3 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="size-3.5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
