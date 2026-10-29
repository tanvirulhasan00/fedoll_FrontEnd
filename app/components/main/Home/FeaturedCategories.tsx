import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
  isProductInCategory,
  findCategory,
  type ProductItem,
} from "~/firebase";
import { FeaturedCategoriesSkeleton } from "~/components/main/Skeletons";

export default function FeaturedCategories() {
  const { categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.products
  );
  const {
    products: homeProducts,
    loading: homeLoading,
  } = useAppSelector((state) => state.home);
  const { items: catalogProducts } = useAppSelector((state) => state.products);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Combine products from catalog & home state (deduplicated by product id)
  const allProducts = useMemo(() => {
    const map = new Map<string, ProductItem>();
    for (const p of homeProducts || []) {
      if (p.id) map.set(p.id, p);
    }
    for (const p of catalogProducts || []) {
      if (p.id) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [catalogProducts, homeProducts]);

  // Only display categories that actually have at least 1 product listed in DB
  const displayCategories = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    const result: Array<{
      id: string;
      name: string;
      tagline: string;
      image: string;
      itemCount: string;
      link: string;
      order: number;
    }> = [];

    const seenIds = new Set<string>();

    // 1. First, check root collections defined in categories collection
    // (categories without parentId, or whose parentId does not exist in categories)
    const rootCategories = (categories || []).filter((cat) => {
      if (!cat.name) return false;
      if (!cat.parentId) return true;
      const parentExists = categories.some((c) => c.id === cat.parentId);
      return !parentExists;
    });

    for (const cat of rootCategories) {
      if (seenIds.has(cat.id)) continue;

      const matching = allProducts.filter((p) =>
        isProductInCategory(p, cat, categories)
      );

      if (matching.length > 0) {
        seenIds.add(cat.id);
        const count = matching.length;
        const countLabel = `${count} ${count === 1 ? "Item" : "Items"}`;

        const rawImage =
          cat.image && cat.image.trim()
            ? cat.image
            : matching.find((p) => p.images && p.images.length > 0)?.images[0] ||
              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

        const tagline =
          cat.tagline && cat.tagline.trim()
            ? cat.tagline
            : `Explore everyday ${cat.name} curated for comfort and style`;

        result.push({
          id: cat.id,
          name: cat.name,
          tagline,
          image: rawImage,
          itemCount: countLabel,
          link: `/products?category=${encodeURIComponent(cat.slug || cat.id || cat.name)}`,
          order: cat.order ?? 999,
        });
      }
    }

    // 2. Also check if there are standalone subcategories that have direct products
    // but whose root ancestor wasn't added yet
    for (const cat of categories || []) {
      if (!cat.name || seenIds.has(cat.id)) continue;

      let currentParentId = cat.parentId;
      let hasAncestorInResult = false;
      while (currentParentId) {
        if (seenIds.has(currentParentId)) {
          hasAncestorInResult = true;
          break;
        }
        const parent = categories.find((c) => c.id === currentParentId);
        currentParentId = parent ? parent.parentId : null;
      }

      if (hasAncestorInResult) continue;

      const matching = allProducts.filter((p) =>
        isProductInCategory(p, cat, categories)
      );

      if (matching.length > 0) {
        seenIds.add(cat.id);
        const count = matching.length;
        const countLabel = `${count} ${count === 1 ? "Item" : "Items"}`;

        const rawImage =
          cat.image && cat.image.trim()
            ? cat.image
            : matching.find((p) => p.images && p.images.length > 0)?.images[0] ||
              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

        result.push({
          id: cat.id,
          name: cat.name,
          tagline:
            cat.tagline && cat.tagline.trim()
              ? cat.tagline
              : `Explore everyday ${cat.name} curated for comfort and style`,
          image: rawImage,
          itemCount: countLabel,
          link: `/products?category=${encodeURIComponent(cat.slug || cat.id || cat.name)}`,
          order: cat.order ?? 999,
        });
      }
    }

    // 3. Fallback for any standalone products whose category isn't in categories collection
    for (const p of allProducts) {
      const catName = p.category?.trim();
      if (!catName || catName.toLowerCase() === "uncategorized" || catName.toLowerCase() === "all") {
        continue;
      }

      const isCovered = result.some((r) => {
        const catObj = categories.find((c) => c.id === r.id);
        return isProductInCategory(p, catObj || r.name, categories);
      });

      if (!isCovered) {
        const matching = allProducts.filter(
          (prod) => (prod.category || "").trim().toLowerCase() === catName.toLowerCase()
        );
        const count = matching.length;
        const fakeId = `cat-${catName.toLowerCase().replace(/\s+/g, "-")}`;
        if (!seenIds.has(fakeId)) {
          seenIds.add(fakeId);
          result.push({
            id: fakeId,
            name: catName,
            tagline: `Explore everyday ${catName} curated for comfort and style`,
            image:
              matching.find((prod) => prod.images && prod.images.length > 0)?.images[0] ||
              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
            itemCount: `${count} ${count === 1 ? "Item" : "Items"}`,
            link: `/products?category=${encodeURIComponent(catName)}`,
            order: 999,
          });
        }
      }
    }

    // Sort by order, then by name
    result.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    return result;
  }, [allProducts, categories]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);

    if (typeof window !== "undefined" && window.innerWidth < 640) {
      const idx = Math.round(scrollLeft / (clientWidth || 1));
      setActiveMobileIndex(Math.max(0, Math.min(idx, displayCategories.length - 1)));
    }
  }, [displayCategories.length]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, displayCategories]);

  const scrollPrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 640;
    const scrollAmount = isMobile ? el.clientWidth : el.clientWidth * 0.75;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 640;
    const scrollAmount = isMobile ? el.clientWidth : el.clientWidth * 0.75;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollToCard = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const isDataLoading =
    (categoriesLoading || homeLoading) && allProducts.length === 0;

  if (isDataLoading) {
    return <FeaturedCategoriesSkeleton />;
  }

  const getCategoryLink = (cat: { id: string; name: string; link?: string }) => {
    if (cat.link && !cat.link.startsWith("/blogs")) {
      return cat.link;
    }
    return `/products?category=${encodeURIComponent(cat.name)}`;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500 mb-1.5">
            <Squares2X2Icon className="size-4" />
            Shop By Category
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Explore Our Collections
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-md mt-1.5">
            Discover premium clothing designed for Bangladeshi weather, everyday comfort, and long-lasting style.
          </p>
        </div>

        {/* Navigation Arrows */}
        {displayCategories.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              id="featured-categories-prev"
              onClick={scrollPrev}
              disabled={!canScrollLeft}
              aria-label="Previous categories"
              className={`size-9 sm:size-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
                canScrollLeft
                  ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeftIcon className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              id="featured-categories-next"
              onClick={scrollNext}
              disabled={!canScrollRight}
              aria-label="Next categories"
              className={`size-9 sm:size-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
                canScrollRight
                  ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRightIcon className="size-4 sm:size-5" />
            </button>
          </div>
        )}
      </div>

      {displayCategories.length === 0 ? (
        <div className="py-16 px-4 text-center text-gray-500 dark:text-neutral-400 bg-stone-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800">
          <Squares2X2Icon className="size-10 mx-auto text-gray-400 dark:text-neutral-500 mb-2.5" />
          <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200">
            No category found
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            There are currently no products assigned to any category. Categories with listed items will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Categories Slider */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
          >
            {displayCategories.map((cat, idx) => (
              <Link
                key={cat.id || idx}
                to={getCategoryLink(cat)}
                className="group relative shrink-0 snap-start rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-900 shadow-xs hover:shadow-xl transition-all duration-500 h-[300px] sm:h-[320px] lg:h-[350px] flex flex-col justify-end p-5 sm:p-5 border border-gray-200/80 dark:border-neutral-800 w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] cursor-pointer"
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
                  <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                    {cat.itemCount}
                  </span>
                </div>

                {/* Top Right Floating Arrow */}
                <div className="absolute top-4 right-4 size-8 sm:size-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-orange-700 group-hover:rotate-45 transition-all duration-300">
                  <ArrowUpRightIcon className="size-4" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 text-white space-y-1">
                  <h3 className="text-base sm:text-base lg:text-lg font-bold tracking-tight group-hover:text-orange-400 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile Dot Indicators */}
          {displayCategories.length > 1 && (
            <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
              {displayCategories.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToCard(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeMobileIndex
                      ? "w-6 bg-orange-600 shadow-xs"
                      : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
                  }`}
                  aria-label={`Go to category ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
