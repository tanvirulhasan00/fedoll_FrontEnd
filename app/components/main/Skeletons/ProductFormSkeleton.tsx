import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const ProductFormSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-neutral-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <span className="text-stone-300 dark:text-neutral-700">/</span>
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-8 w-64 rounded-xl" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info Card */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-4">
              <Skeleton className="h-6 w-40 rounded-md mb-2" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-4">
              <Skeleton className="h-6 w-44 rounded-md mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Variants Matrix */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-4">
              <Skeleton className="h-6 w-36 rounded-md mb-2" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-12 rounded-xl" />
                ))}
              </div>
              <div className="space-y-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-700/60">
                    <Skeleton className="size-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <div className="flex-1" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className="space-y-6">
            {/* Media Gallery Card */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-4">
              <Skeleton className="h-6 w-32 rounded-md mb-2" />
              <Skeleton className="aspect-4/3 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>

            {/* Publishing Status Card */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-4">
              <Skeleton className="h-6 w-28 rounded-md mb-2" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormSkeleton;
