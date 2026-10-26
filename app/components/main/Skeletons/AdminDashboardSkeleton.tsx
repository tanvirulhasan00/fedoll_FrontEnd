import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-11 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-3.5 w-36 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Orders Table Skeleton */}
        <div className="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-neutral-800">
            <div className="space-y-1">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-60 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 py-2 border-b border-stone-100 dark:border-neutral-800">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-3.5 w-12 ml-auto rounded-md" />
          </div>

          {/* 5 Table Row Skeletons */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="grid grid-cols-5 gap-4 py-2 items-center"
              >
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-14 ml-auto rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Status & Alerts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/60 dark:border-neutral-700/60 flex items-center gap-3"
                >
                  <Skeleton className="size-8 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-44 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-4/5 rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
