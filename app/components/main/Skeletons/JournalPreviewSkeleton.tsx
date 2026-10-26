import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import BlogCardSkeleton from "./BlogCardSkeleton";

export const JournalPreviewSkeleton: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-9 sm:h-10 w-72 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>

        <Skeleton className="h-5 w-32 rounded-md" />
      </div>

      {/* 3 Blog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
};

export default JournalPreviewSkeleton;
