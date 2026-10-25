import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  toggleWishlistAsync,
  setWishlist,
} from "~/redux/features/homeSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import {
  fetchProductByIdFromFirestore,
  saveUserWishlistToFirestore,
  type ProductItem,
} from "~/firebase";
import {
  HeartIcon,
  ShoppingBagIcon,
  TrashIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import StockAvailabilityBadge from "~/components/ui/StockAvailabilityBadge";

export const WishlistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { wishlistIds } = useAppSelector((state) => state.home);
  const { items: catalogProducts } = useAppSelector((state) => state.products);
  const { products: homeProducts } = useAppSelector((state) => state.home);
  const { items: cartItems } = useAppSelector((state) => state.cart);

  const [fetchedMissingProducts, setFetchedMissingProducts] = useState<
    ProductItem[]
  >([]);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">(
    "default"
  );
  const [addingAll, setAddingAll] = useState(false);

  // Combine products known in Redux
  const knownProductsMap = useMemo(() => {
    const map = new Map<string, ProductItem>();
    catalogProducts.forEach((p) => map.set(p.id, p));
    homeProducts.forEach((p) => map.set(p.id, p));
    fetchedMissingProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [catalogProducts, homeProducts, fetchedMissingProducts]);

  // Fetch any wishlisted product IDs that are not loaded in cache yet
  useEffect(() => {
    const missingIds = wishlistIds.filter((id) => !knownProductsMap.has(id));
    if (missingIds.length === 0) return;

    let isMounted = true;
    setLoadingMissing(true);

    Promise.all(missingIds.map((id) => fetchProductByIdFromFirestore(id)))
      .then((results) => {
        if (!isMounted) return;
        const valid = results.filter(
          (p): p is ProductItem => p !== null && p !== undefined
        );
        if (valid.length > 0) {
          setFetchedMissingProducts((prev) => {
            const combined = [...prev, ...valid];
            const unique = Array.from(
              new Map(combined.map((item) => [item.id, item])).values()
            );
            return unique;
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch wishlisted products:", err))
      .finally(() => {
        if (isMounted) setLoadingMissing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [wishlistIds, knownProductsMap]);

  // Resolve array of loved products in the exact order of wishlistIds
  const lovedProducts = useMemo(() => {
    return wishlistIds
      .map((id) => knownProductsMap.get(id))
      .filter((p): p is ProductItem => !!p);
  }, [wishlistIds, knownProductsMap]);

  // Extract unique categories among loved products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    lovedProducts.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    return ["All", ...Array.from(categories)];
  }, [lovedProducts]);

  // Filter and sort loved products
  const displayProducts = useMemo(() => {
    let result = [...lovedProducts];

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [lovedProducts, selectedCategory, sortBy]);

  // Total value of wishlist
  const totalValue = useMemo(() => {
    return lovedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [lovedProducts]);

  const handleRemove = (productId: string, productName: string) => {
    dispatch(toggleWishlistAsync({ productId, userId: user?.uid }));
    toast.info(`Removed "${productName}" from your wishlist`);
  };

  const handleAddToCart = (product: ProductItem) => {
    const isSoldOut = product.inStock === false || (product.stockCount !== undefined && product.stockCount <= 0);
    const availableStock = product.stockCount ?? (product.inStock ? 25 : 0);
    if (isSoldOut || availableStock <= 0) {
      toast.error(`${product.name} is currently sold out.`);
      return;
    }

    const existingInCart = cartItems.find((item) => item.id === product.id);
    const currentInCart = existingInCart ? existingInCart.quantity : 0;
    if (currentInCart + 1 > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. You already have all ${availableStock} in your bag!`
      );
      return;
    }

    const chosenColor = product.colors[0]?.name || "Standard";
    const chosenSize = product.sizes[0] || "M";
    const chosenImage = product.images[0] || "";

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: chosenImage,
        quantity: 1,
        size: chosenSize,
        color: chosenColor,
        category: product.category,
        maxStock: availableStock,
      })
    );

    toast.success(`Added ${product.name} to your shopping bag!`);
  };

  const handleAddAllToCart = () => {
    if (lovedProducts.length === 0) return;
    setAddingAll(true);

    const inStockItems = lovedProducts.filter(
      (p) => p.inStock !== false && (p.stockCount === undefined || p.stockCount > 0)
    );
    let addedCount = 0;
    inStockItems.forEach((p) => {
      const availableStock = p.stockCount ?? 25;
      const existingInCart = cartItems.find((item) => item.id === p.id);
      const currentInCart = existingInCart ? existingInCart.quantity : 0;
      if (currentInCart < availableStock) {
        dispatch(
          addToCart({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.images[0] || "",
            quantity: 1,
            size: p.sizes[0] || "M",
            color: p.colors[0]?.name || "Standard",
            category: p.category,
            maxStock: availableStock,
          })
        );
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} available item(s) to your shopping bag!`);
    } else {
      toast.warning("All available wishlisted items are already in your shopping bag at maximum stock limit.");
    }
    setTimeout(() => setAddingAll(false), 500);
  };

  const handleClearWishlist = async () => {
    if (lovedProducts.length === 0) return;
    dispatch(setWishlist([]));
    if (user?.uid) {
      await saveUserWishlistToFirestore(user.uid, []);
    }
    toast.info("Cleared all items from your wishlist");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <HeartSolidIcon className="size-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                My Loved Wishlist
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/60">
                {lovedProducts.length} {lovedProducts.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Your saved styles &amp; favorite apparel hand-picked from the SilkenDrift collection.
            </p>
          </div>

          {lovedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={addingAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <ShoppingBagIcon className="size-4" />
                <span>Move In-Stock to Bag</span>
              </button>

              <button
                type="button"
                onClick={handleClearWishlist}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
                title="Remove all items from wishlist"
              >
                <TrashIcon className="size-3.5 text-gray-400" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Strip */}
        {lovedProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-neutral-800 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-950/60 border border-stone-200/60 dark:border-neutral-800/80">
              <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-semibold uppercase tracking-wider block">
                Total Saved Value
              </span>
              <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5 block">
                ৳{totalValue.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-950/60 border border-stone-200/60 dark:border-neutral-800/80">
              <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-semibold uppercase tracking-wider block">
                In Stock &amp; Ready
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {lovedProducts.filter((p) => p.inStock !== false).length} Products
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-neutral-950/60 border border-stone-200/60 dark:border-neutral-800/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-semibold uppercase tracking-wider block">
                Cloud Sync Status
              </span>
              <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 mt-1 inline-flex items-center gap-1.5">
                <CheckCircleIcon className="size-4 text-emerald-500" />
                <span>Saved to Firestore DB</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Sort Toolbar (When multiple products exist) */}
      {lovedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200/80 dark:border-neutral-800 p-3 sm:px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FunnelIcon className="size-4 text-gray-400 shrink-0 hidden sm:block" />
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gray-900 dark:bg-orange-600 text-white shadow-xs"
                    : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label className="text-xs text-gray-500 dark:text-neutral-400 font-medium whitespace-nowrap">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "default" | "price-asc" | "price-desc")
              }
              className="text-xs font-semibold bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
            >
              <option value="default">Recently Loved</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {lovedProducts.length === 0 && !loadingMissing ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-10 sm:p-16 text-center space-y-6 shadow-sm">
          <div className="size-20 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 mx-auto flex items-center justify-center ring-8 ring-rose-50/50 dark:ring-rose-950/30">
            <HeartIcon className="size-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
              You haven't loved any products yet. Browse through our premium collections and tap the heart icon on items you adore to save them here.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              <SparklesIcon className="size-4" />
              <span>Explore Products</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Loved Products Grid */
        <div className="space-y-4">
          {loadingMissing && lovedProducts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Spinner className="size-8 text-orange-600 animate-spin" />
              <p className="text-xs text-gray-500">Loading loved styles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayProducts.map((product) => {
                const primaryImage = product.images[0] || "";
                const hasDiscount =
                  product.originalPrice && product.originalPrice > product.price;
                const discountPct = hasDiscount
                  ? Math.round(
                      ((product.originalPrice! - product.price) /
                        product.originalPrice!) *
                        100
                    )
                  : 0;
                const isSoldOut =
                  product.inStock === false ||
                  (product.stockCount !== undefined && product.stockCount <= 0);

                return (
                  <div
                    key={product.id}
                    className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                      <Link
                        to={`/products/${product.id}`}
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isSoldOut ? "opacity-85 grayscale-25" : ""
                          }`}
                        />
                      </Link>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
                        {isSoldOut ? (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md bg-neutral-900/90 text-white tracking-wider backdrop-blur-xs border border-white/20">
                            Sold Out
                          </span>
                        ) : product.badge ? (
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs ${
                              product.badge === "Sale"
                                ? "bg-rose-600 text-white"
                                : product.badge === "Best Seller"
                                ? "bg-stone-900 text-white"
                                : "bg-orange-700 text-white"
                            }`}
                          >
                            {product.badge}
                          </span>
                        ) : null}
                        {hasDiscount && !isSoldOut && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id, product.name)}
                        className="absolute top-3 right-3 size-8 rounded-full bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xs flex items-center justify-center text-rose-600 hover:scale-110 active:scale-90 transition shadow-sm cursor-pointer z-10"
                        title="Remove from Wishlist"
                      >
                        <HeartSolidIcon className="size-4" />
                      </button>

                      {/* In Stock Pill */}
                      <div className="absolute bottom-3 left-3 pointer-events-none">
                        <StockAvailabilityBadge
                          stockCount={product.stockCount}
                          inStock={product.inStock !== false}
                        />
                      </div>
                    </div>

                    {/* Product Details Card */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                            {product.category}
                          </span>

                          {product.rating && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-neutral-300">
                              <StarIcon className="size-3 text-amber-500" />
                              <span>{product.rating}</span>
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 hover:text-orange-600 dark:hover:text-orange-400 transition mt-1 block"
                        >
                          {product.name}
                        </Link>

                        {/* Colors & Sizes preview */}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                          {product.colors && product.colors.length > 0 && (
                            <span>{product.colors.length} colors</span>
                          )}
                          {product.colors && product.sizes && <span>•</span>}
                          {product.sizes && product.sizes.length > 0 && (
                            <span>Sizes: {product.sizes.join(", ")}</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-900 dark:text-white">
                              ৳{product.price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ৳{product.originalPrice?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {(() => {
                          const availableStock = product.stockCount ?? (product.inStock ? 25 : 0);
                          const existingInCart = cartItems.find((item) => item.id === product.id);
                          const currentInCart = existingInCart ? existingInCart.quantity : 0;
                          const isMaxStockReached = currentInCart >= availableStock;

                          return (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={isSoldOut || isMaxStockReached}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                                isSoldOut || isMaxStockReached
                                  ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-60"
                                  : "bg-orange-600 hover:bg-orange-700 active:scale-98 text-white cursor-pointer"
                              }`}
                              title={
                                isSoldOut
                                  ? "Sold Out"
                                  : isMaxStockReached
                                  ? `Only ${availableStock} in stock (already in bag)`
                                  : "Add to Bag"
                              }
                            >
                              <ShoppingBagIcon className="size-3.5" />
                              <span>{isSoldOut ? "Sold Out" : isMaxStockReached ? "Max in Bag" : "Add to Bag"}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistView;
