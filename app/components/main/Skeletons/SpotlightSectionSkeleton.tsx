import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const SpotlightSectionSkeleton: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Text Content Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-full bg-white/10" />

              <div className="space-y-2">
                <Skeleton className="h-9 sm:h-12 w-4/5 rounded-xl bg-white/10" />
                <Skeleton className="h-9 sm:h-12 w-3/5 rounded-xl bg-white/10" />
              </div>

              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-4 w-full max-w-lg rounded-md bg-white/10" />
                <Skeleton className="h-4 w-4/5 max-w-md rounded-md bg-white/10" />
              </div>

              {/* Coupon Tag Skeleton */}
              <div className="pt-2 flex items-center gap-3">
                <Skeleton className="h-9 w-48 rounded-xl bg-white/10" />
                <Skeleton className="h-4 w-28 rounded-md bg-white/10" />
              </div>
            </div>

            <div className="pt-8">
              <Skeleton className="h-12 w-48 rounded-full bg-white/15" />
            </div>
          </div>

          {/* Image Column */}
          <div className="lg:col-span-5 relative h-64 lg:h-auto bg-stone-800/80 flex items-center justify-center">
            <Skeleton className="w-16 h-16 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightSectionSkeleton;
