import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  setActiveProductTab,
  setQuickViewProduct,
  toggleWishlistAsync,
} from "~/redux/features/homeSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import {
  StarIcon,
  HeartIcon,
  EyeIcon,
  ShoppingBagIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import QuickViewModal from "./QuickViewModal";
import StockAvailabilityBadge from "~/components/ui/StockAvailabilityBadge";
import type { ProductItem } from "~/firebase";
import {
  getVariantImages,
  DEFAULT_CATEGORY_NAME,
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
  isProductInCategory,
  findCategory,
} from "~/firebase";
import { ProductCardSkeleton } from "~/components/main/Skeletons";

interface ShowcaseProductCardProps {
  product: ProductItem;
  isWishlisted: boolean;
  onWishlist: (e: React.MouseEvent, id: string) => void;
  onQuickView: (product: ProductItem) => void;
}

const ShowcaseProductCard: React.FC<ShowcaseProductCardProps> = ({
  product,
  isWishlisted,
  onWishlist,
  onQuickView,
}) => {
  const dispatch = useAppDispatch();
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || "");

  const activeVariantImages = useMemo(() => {
    return getVariantImages(product, selectedColor);
  }, [product, selectedColor]);

  const primaryImage = activeVariantImages[0] || product.images[0];
  const secondaryImage = activeVariantImages[1] || product.images[1];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isSoldOut = !product.inStock || (product.stockCount !== undefined && product.stockCount <= 0);
  const availableStock = product.stockCount ?? (product.inStock ? 25 : 0);

  const cartItems = useAppSelector((state) => state.cart.items);
  const existingInCart = cartItems.find(
    (item) =>
      item.id === product.id &&
      item.color === (selectedColor || product.colors[0]?.name || "Standard")
  );
  const currentInCart = existingInCart ? existingInCart.quantity : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut || availableStock <= 0) {
      toast.error(`${product.name} is currently sold out. Save it to your wishlist!`);
      return;
    }

    if (currentInCart + 1 > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. You already have all ${availableStock} in your bag!`
      );
      return;
    }

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: primaryImage,
        quantity: 1,
        size: product.sizes[0] || "M",
        color: selectedColor || product.colors[0]?.name || "Standard",
        category: product.category,
        maxStock: availableStock,
      })
    );
    toast.success(`Added ${product.name} (${selectedColor || "Standard"}) to your shopping bag!`);
  };

  return (
    <div className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 snap-start">
      {/* Product Card Image Container */}
      <div className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
        <Link to={`/products/${product.id}`} className="block w-full h-full cursor-pointer">
          <img
            src={normalizeGoogleDriveImageUrl(primaryImage)}
            alt={`${product.name} - ${selectedColor}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isSoldOut ? "opacity-85 grayscale-25" : ""
            }`}
            onError={(e) => {
              const target = e.currentTarget;
              const fileId = extractGoogleDriveFileId(primaryImage);
              if (fileId && !target.dataset.triedThumbnail) {
                target.dataset.triedThumbnail = "true";
                target.src = getGoogleDriveThumbnailUrl(primaryImage, 800);
                return;
              }
              target.src =
                "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
            }}
          />

          {/* Secondary Image on Hover if available */}
          {secondaryImage && (
            <img
              src={normalizeGoogleDriveImageUrl(secondaryImage)}
              alt={`${product.name} alternate view`}
              className={`absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isSoldOut ? "opacity-85 grayscale-25" : ""
              }`}
              onError={(e) => {
                const target = e.currentTarget;
                const fileId = extractGoogleDriveFileId(secondaryImage);
                if (fileId && !target.dataset.triedThumbnail) {
                  target.dataset.triedThumbnail = "true";
                  target.src = getGoogleDriveThumbnailUrl(secondaryImage, 800);
                }
              }}
            />
          )}
        </Link>

        {/* Badge (Sold Out, Sale, Best Seller, New) */}
        {isSoldOut ? (
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md bg-neutral-900/90 text-white tracking-wider backdrop-blur-xs border border-white/20">
              Sold Out
            </span>
          </div>
        ) : product.badge ? (
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs ${
                product.badge === "Sale"
                  ? "bg-rose-600 text-white"
                  : product.badge === "Best Seller"
                  ? "bg-stone-900 text-white"
                  : "bg-orange-700 text-white"
              }`}
            >
              {product.badge}
            </span>
          </div>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => onWishlist(e, product.id)}
          className={`absolute top-3 right-3 size-8 rounded-full backdrop-blur-xs flex items-center justify-center transition shadow-xs cursor-pointer z-10 ${
            isWishlisted
              ? "bg-white/95 dark:bg-neutral-800/95 text-rose-600 shadow-sm"
              : "bg-white/90 dark:bg-neutral-800/90 text-gray-700 dark:text-neutral-200 hover:text-rose-600 hover:scale-110"
          }`}
          title={isWishlisted ? "Saved in wishlist" : "Save to wishlist"}
        >
          {isWishlisted ? (
            <HeartSolidIcon className="size-4 text-rose-600" />
          ) : (
            <HeartIcon className="size-4" />
          )}
        </button>

        {/* Quick View Floating Action Bar */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xs text-gray-900 dark:text-neutral-100 text-xs font-bold hover:bg-white dark:hover:bg-neutral-700 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <EyeIcon className="size-4 text-gray-600 dark:text-neutral-300" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isSoldOut || currentInCart >= availableStock}
            className={`size-9 rounded-xl flex items-center justify-center shadow-md transition shrink-0 ${
              isSoldOut || currentInCart >= availableStock
                ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-60"
                : "bg-orange-700 hover:bg-orange-800 active:scale-95 text-white cursor-pointer"
            }`}
            title={
              isSoldOut
                ? "Sold Out"
                : currentInCart >= availableStock
                ? `Only ${availableStock} in stock (already in bag)`
                : `Quick Add (${selectedColor})`
            }
          >
            <ShoppingBagIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-orange-700 dark:text-orange-500 uppercase tracking-wider text-[11px] truncate max-w-[120px]">
              {product.category}
            </span>
            <StockAvailabilityBadge
              stockCount={product.stockCount}
              inStock={product.inStock}
            />
          </div>

          <Link
            to={`/products/${product.id}`}
            className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition line-clamp-1"
          >
            {product.name}
          </Link>

          <div className="flex items-center gap-1 mt-1">
            <StarSolidIcon className="size-3.5 text-amber-500 fill-current" />
            <span className="font-bold text-xs text-gray-700 dark:text-neutral-300">
              {product.rating}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500">({product.reviewCount})</span>
          </div>
        </div>

        <div className="pt-2.5 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-1">
          {/* Pricing in BDT */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              ৳{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ৳{product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>

          {/* Interactive Color Dots with Dynamic Variant Swapping */}
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c.name);
                  }}
                  onMouseEnter={() => setSelectedColor(c.name)}
                  className={`size-3 sm:size-3.5 rounded-full border transition cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-orange-500/60 border-orange-600 scale-125 shadow-xs"
                      : "border-gray-300 dark:border-neutral-700 hover:scale-120"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name}`}
                />
              );
            })}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-gray-400">+{product.colors.length - 4}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductShowcase() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    products,
    activeProductTab,
    wishlistIds,
    loading: homeLoading,
  } = useAppSelector((state) => state.home);
  const {
    categories,
    items: catalogProducts,
    loading: catalogLoading,
  } = useAppSelector((state) => state.products);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Single source of truth: prefer home products if populated, fallback to catalog products
  const displayProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    if (catalogProducts && catalogProducts.length > 0) return catalogProducts;
    return [];
  }, [products, catalogProducts]);

  const isDataLoading =
    (homeLoading || catalogLoading) && displayProducts.length === 0;

  // Dynamically compute category tabs ONLY from categories that actually have products listed
  const tabs = useMemo(() => {
    if (!displayProducts || displayProducts.length === 0) return [];

    const list = ["All"];
    const seen = new Set<string>(["all"]);

    // 1. From categories defined in Firestore that actually have products listed
    for (const cat of categories || []) {
      const name = cat.name?.trim();
      if (!name || seen.has(name.toLowerCase()) || name.toLowerCase() === "uncategorized") {
        continue;
      }
      const hasProducts = displayProducts.some((p) =>
        isProductInCategory(p, cat, categories)
      );
      if (hasProducts) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    }

    // 2. From direct products that have a category assigned not yet covered
    for (const p of displayProducts) {
      const name = p.category?.trim();
      if (
        name &&
        !seen.has(name.toLowerCase()) &&
        name.toLowerCase() !== "uncategorized"
      ) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    }

    return list;
  }, [categories, displayProducts]);

  const filteredProducts = useMemo(() => {
    let prods = displayProducts;
    if (activeProductTab !== "All") {
      const targetCat = findCategory(activeProductTab, categories);
      prods = displayProducts.filter((p) =>
        isProductInCategory(p, targetCat || activeProductTab, categories)
      );
    }
    // Prioritize products marked as isFeatured
    return [...prods].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [displayProducts, activeProductTab, categories]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);

    if (typeof window !== "undefined" && window.innerWidth < 640) {
      const idx = Math.round(scrollLeft / (clientWidth || 1));
      setActiveMobileIndex(Math.max(0, Math.min(idx, filteredProducts.length - 1)));
    }
  }, [filteredProducts.length]);

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
  }, [checkScroll, filteredProducts]);

  const handleTabSelect = (tab: string) => {
    dispatch(setActiveProductTab(tab));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

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

  const handleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistAsync({ productId: id, userId: user?.uid }));
    const isSaved = wishlistIds.includes(id);
    if (isSaved) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500 mb-1.5">
            <SparklesIcon className="size-4" />
            Everyday Quality Clothing
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Featured Products
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-xl">
            Comfortable everyday clothing made with pure cotton, durable selvedge denim, and warm winter fabrics. Cash on delivery available across Bangladesh.
          </p>
        </div>

        {/* Right Header: Dynamic Category Tabs + Slider Arrows */}
        {displayProducts.length > 0 && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3">
            {/* Dynamic Category Tabs */}
            {isDataLoading && tabs.length <= 1 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar animate-pulse">
                <div className="w-14 h-8 rounded-full bg-stone-200 dark:bg-neutral-800" />
                <div className="w-18 h-8 rounded-full bg-stone-100 dark:bg-neutral-800/60" />
                <div className="w-20 h-8 rounded-full bg-stone-100 dark:bg-neutral-800/60" />
              </div>
            ) : tabs.length > 1 ? (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full sm:max-w-md">
                {tabs.map((tab, tabIdx) => {
                  const isActive =
                    tab === "All"
                      ? !activeProductTab || activeProductTab === "All"
                      : activeProductTab.trim().toLowerCase() === tab.trim().toLowerCase();
                  return (
                    <button
                      key={`${tab}-${tabIdx}`}
                      type="button"
                      onClick={() => handleTabSelect(tab)}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-gray-900 dark:bg-orange-700 text-white shadow-xs"
                          : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Navigation Arrows */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  id="featured-products-prev"
                  onClick={scrollPrev}
                  disabled={!canScrollLeft}
                  aria-label="Previous products"
                  className={`size-8 sm:size-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    canScrollLeft
                      ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                      : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <button
                  type="button"
                  id="featured-products-next"
                  onClick={scrollNext}
                  disabled={!canScrollRight}
                  aria-label="Next products"
                  className={`size-8 sm:size-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    canScrollRight
                      ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-800 dark:text-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer shadow-xs active:scale-95"
                      : "bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products Slider */}
      {isDataLoading ? (
        <div className="flex gap-4 overflow-hidden pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-16 px-4 text-center text-gray-500 dark:text-neutral-400 bg-stone-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800">
          <SparklesIcon className="size-10 mx-auto text-gray-400 dark:text-neutral-500 mb-2.5" />
          <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200">
            No products found
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            There are currently no products available in the store. Products added to the database will appear here automatically.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 px-4 text-center text-gray-500 dark:text-neutral-400 bg-stone-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800">
          <SparklesIcon className="size-10 mx-auto text-gray-400 dark:text-neutral-500 mb-2.5" />
          <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200">
            No products found in this category
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Try choosing another category tab above to explore our collections.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 overscroll-x-contain"
          >
            {filteredProducts.map((product, idx) => (
              <ShowcaseProductCard
                key={product.id || idx}
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onWishlist={handleWishlist}
                onQuickView={(p) => dispatch(setQuickViewProduct(p))}
              />
            ))}
          </div>

          {/* Mobile Dot Indicators */}
          {filteredProducts.length > 1 && (
            <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
              {filteredProducts.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToCard(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeMobileIndex
                      ? "w-6 bg-orange-600 shadow-xs"
                      : "w-1.5 bg-stone-300 dark:bg-neutral-700 hover:bg-stone-400"
                  }`}
                  aria-label={`Go to product slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* View All Products CTA Button */}
      {displayProducts.length > 0 && (
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-stone-900 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            <span>Explore All Products</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal />
    </section>
  );
}
