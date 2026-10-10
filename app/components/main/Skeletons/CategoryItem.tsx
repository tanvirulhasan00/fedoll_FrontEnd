import { Skeleton } from "~/components/ui/skeleton";

export function SkeletonCategoryItem() {
  return (
    <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6">
      {/* Icon placeholder */}
      <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200">
        <Skeleton className="size-6 rounded-md" />
      </div>

      {/* Text placeholders */}
      <div className="flex-auto space-y-2">
        <Skeleton className="h-4 w-32" /> {/* name */}
        <Skeleton className="h-3 w-48" /> {/* description */}
      </div>
    </div>
  );
}
