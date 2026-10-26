import React from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import {
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
} from "~/firebase";
import { FeaturedCategoriesSkeleton } from "~/components/main/Skeletons";

export default function FeaturedCategories() {
  const { featuredCategories, loading } = useAppSelector((state) => state.home);

  if (loading && (!featuredCategories || featuredCategories.length === 0)) {
    return <FeaturedCategoriesSkeleton />;
  }

  if (!featuredCategories || featuredCategories.length === 0) return null;

  const getCategoryLink = (cat: { id: string; name: string; link?: string }) => {
    if (cat.link && !cat.link.startsWith("/blogs")) {
      return cat.link;
    }
    return `/products?category=${encodeURIComponent(cat.name)}`;
  };

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
            Shop By Category
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mt-2">
            Explore Our Collections
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-md">
          Discover premium, comfortable clothing designed for Bangladeshi weather,
          everyday comfort, and long-lasting style.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredCategories.map((cat) => (
          <Link
            key={cat.id}
            to={getCategoryLink(cat)}
            className="group relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-900 shadow-xs hover:shadow-xl transition-all duration-500 h-[380px] flex flex-col justify-end p-6 border border-gray-200/80 dark:border-neutral-800"
          >
            {/* Background Image with Zoom */}
            <img
              src={normalizeGoogleDriveImageUrl(cat.image)}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              onError={(e) => {
                const target = e.currentTarget;
                const fileId = extractGoogleDriveFileId(cat.image);
                if (fileId && !target.dataset.triedThumbnail) {
                  target.dataset.triedThumbnail = "true";
                  target.src = getGoogleDriveThumbnailUrl(cat.image, 1000);
                  return;
                }
                target.src =
                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
              }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Top pill badge */}
            <div className="absolute top-4 left-4">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                {cat.itemCount}
              </span>
            </div>

            {/* Top Right Floating Arrow */}
            <div className="absolute top-4 right-4 size-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-orange-700 group-hover:rotate-45 transition-all duration-300">
              <ArrowUpRightIcon className="size-4" />
            </div>

            {/* Card Content */}
            <div className="relative z-10 text-white space-y-1.5">
              <h3 className="text-xl font-bold tracking-tight group-hover:text-orange-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                {cat.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
