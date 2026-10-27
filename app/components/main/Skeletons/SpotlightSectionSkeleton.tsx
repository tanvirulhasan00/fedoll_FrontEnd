import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const SpotlightSectionSkeleton: React.FC = () => {
  return (
    <section className="py-5 sm:py-8 lg:py-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Mobile Skeleton: Compact Cards */}
      <div className="md:hidden">
        <div className="flex gap-3 px-1 py-1 overflow-hidden">
          <div className="w-[86vw] max-w-[340px] shrink-0 rounded-2xl h-[250px] bg-stone-900 border border-stone-800 p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-12 rounded-md bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-4/5 rounded bg-white/10" />
              <Skeleton className="h-3.5 w-full rounded bg-white/10" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-7 w-24 rounded-lg bg-white/10" />
                <Skeleton className="h-7 w-20 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
          <div className="w-[86vw] max-w-[340px] shrink-0 rounded-2xl h-[250px] bg-stone-900 border border-stone-800 p-4 opacity-50 hidden sm:flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Skeleton: Compact Banner */}
      <div className="hidden md:block relative rounded-2xl lg:rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 shadow-xl">
        <div className="grid grid-cols-12 min-h-[340px] lg:min-h-[370px]">
          {/* Text Content Column */}
          <div className="col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 rounded-full bg-white/10" />

              <div className="space-y-2">
                <Skeleton className="h-8 lg:h-10 w-4/5 rounded-xl bg-white/10" />
                <Skeleton className="h-8 lg:h-10 w-3/5 rounded-xl bg-white/10" />
              </div>

              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full max-w-md rounded-md bg-white/10" />
                <Skeleton className="h-3.5 w-4/5 max-w-sm rounded-md bg-white/10" />
              </div>

              {/* Coupon Tag Skeleton */}
              <div className="pt-1 flex items-center gap-3">
                <Skeleton className="h-8 w-40 rounded-xl bg-white/10" />
                <Skeleton className="h-3.5 w-24 rounded-md bg-white/10" />
              </div>
            </div>

            <div className="pt-3">
              <Skeleton className="h-10 w-40 rounded-full bg-white/15" />
            </div>
          </div>

          {/* Image Column */}
          <div className="col-span-5 relative h-full min-h-[280px] bg-stone-800/80 flex items-center justify-center">
            <Skeleton className="w-14 h-14 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightSectionSkeleton;

