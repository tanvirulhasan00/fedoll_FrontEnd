import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-md" />
        <span className="text-gray-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-4 w-16 rounded-md" />
        <span className="text-gray-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-4 w-20 rounded-md" />
        <span className="text-gray-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery Skeleton */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails Rail */}
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="size-16 sm:size-20 rounded-xl shrink-0"
              />
            ))}
          </div>

          {/* Main Photo Container */}
          <div className="relative aspect-4/5 w-full flex-1 rounded-3xl overflow-hidden bg-stone-100 dark:bg-neutral-800/60 flex items-center justify-center border border-gray-200/80 dark:border-neutral-800">
            <Skeleton className="w-20 h-20 rounded-full opacity-60" />

            {/* Badges on Image */}
            <div className="absolute top-4 left-4">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="absolute top-4 right-4">
              <Skeleton className="size-10 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Actions Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category & Stock Pill */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-11/12 rounded-xl" />
            <Skeleton className="h-8 sm:h-9 w-3/4 rounded-xl" />
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Skeleton key={s} className="size-4 rounded-xs" />
              ))}
            </div>
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>

          {/* Price Block */}
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="h-px bg-gray-200 dark:bg-neutral-800 my-4" />

          {/* Color Selector Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex items-center gap-2.5">
              {[1, 2, 3, 4].map((c) => (
                <Skeleton key={c} className="size-8 rounded-full" />
              ))}
            </div>
          </div>

          {/* Size Selector Skeleton */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((sz) => (
                <Skeleton key={sz} className="h-10 w-12 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Quantity & CTA Buttons Skeleton */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-28 rounded-2xl" />
              <Skeleton className="h-12 flex-1 rounded-2xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>

          {/* Trust Value Props Strip */}
          <div className="pt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((tp) => (
              <div
                key={tp}
                className="p-3 rounded-xl bg-stone-50 dark:bg-neutral-900 border border-stone-200/60 dark:border-neutral-800 flex items-center gap-2.5"
              >
                <Skeleton className="size-5 rounded-md shrink-0" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            ))}
          </div>

          {/* Accordion Placeholders */}
          <div className="pt-4 space-y-3">
            {[1, 2, 3].map((acc) => (
              <div
                key={acc}
                className="py-3.5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between"
              >
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="size-4 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="pt-16 border-t border-gray-200 dark:border-neutral-800 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-7 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
