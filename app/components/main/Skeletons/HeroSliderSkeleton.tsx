import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

export const HeroSliderSkeleton: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-stone-950 text-white min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center">
      {/* Decorative Atelier Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

      {/* Luxury Background Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-950/80 to-black/90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10 w-full">
        <div className="max-w-2xl lg:max-w-3xl space-y-6">
          {/* Badge Skeleton */}
          <Skeleton className="h-7 w-36 rounded-full bg-white/10 dark:bg-white/10" />

          {/* Headline Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 sm:h-14 lg:h-16 w-11/12 rounded-xl bg-white/10 dark:bg-white/10" />
            <Skeleton className="h-12 sm:h-14 lg:h-16 w-3/4 rounded-xl bg-white/10 dark:bg-white/10" />
          </div>

          {/* Subtitle Skeleton */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-5 w-full max-w-xl rounded-md bg-white/10 dark:bg-white/10" />
            <Skeleton className="h-5 w-4/5 max-w-lg rounded-md bg-white/10 dark:bg-white/10" />
          </div>

          {/* CTAs Skeleton */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Skeleton className="h-12 w-44 rounded-full bg-white/15 dark:bg-white/15" />
            <Skeleton className="h-12 w-36 rounded-full bg-white/10 dark:bg-white/10" />
          </div>
        </div>

        {/* Floating Atelier Badges Skeleton (Right Bottom) */}
        <div className="hidden xl:flex absolute right-8 bottom-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 gap-6">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 bg-white/15" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
          <div className="w-px bg-white/10" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 bg-white/15" />
            <Skeleton className="h-4 w-28 bg-white/10" />
          </div>
          <div className="w-px bg-white/10" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 bg-white/15" />
            <Skeleton className="h-4 w-36 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Nav dots skeleton */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        <Skeleton className="w-8 h-2 rounded-full bg-white/25" />
        <Skeleton className="w-2 h-2 rounded-full bg-white/15" />
        <Skeleton className="w-2 h-2 rounded-full bg-white/15" />
      </div>
    </section>
  );
};

export default HeroSliderSkeleton;
