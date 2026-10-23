import React, { useMemo, useState } from "react";
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
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import QuickViewModal from "./QuickViewModal";
import StockAvailabilityBadge from "~/components/ui/StockAvailabilityBadge";
import type { ProductItem } from "~/firebase";
import { getVariantImages } from "~/firebase";

const TABS = [
  "All",
  "Outerwear",
  "Workwear",
  "Denim",
  "Knitwear",
  "Essentials",
];

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
    <div className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300">
      {/* Product Card Image Container */}
      <div className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
        <Link to={`/products/${product.id}`} className="block w-full h-full cursor-pointer">
          <img
            src={primaryImage}
            alt={`${product.name} - ${selectedColor}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isSoldOut ? "opacity-85 grayscale-25" : ""
            }`}
          />

          {/* Secondary Image on Hover if available */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              className={`absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isSoldOut ? "opacity-85 grayscale-25" : ""
              }`}
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
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-orange-700 dark:text-orange-500 uppercase tracking-wider text-[11px]">
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

          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          {/* Pricing in BDT */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-white">
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
            {product.colors.map((c) => {
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
                  className={`size-3.5 rounded-full border transition cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-orange-500/60 border-orange-600 scale-125 shadow-xs"
                      : "border-gray-300 dark:border-neutral-700 hover:scale-120"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (Hover or click to switch variant photo)`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductShowcase() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { products, activeProductTab, wishlistIds } = useAppSelector(
    (state) => state.home
  );

  const filteredProducts = useMemo(() => {
    if (activeProductTab === "All") return products;
    return products.filter((p) => p.category === activeProductTab);
  }, [products, activeProductTab]);

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
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 mb-2">
            <SparklesIcon className="size-4" />
            Everyday Quality Clothing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Featured Products
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 max-w-xl">
            Comfortable everyday clothing made with pure cotton, durable selvedge denim, and warm winter fabrics. Cash on delivery available across Bangladesh.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeProductTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => dispatch(setActiveProductTab(tab))}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-gray-900 dark:bg-orange-700 text-white shadow-sm"
                    : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {filteredProducts.map((product) => (
          <ShowcaseProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlistIds.includes(product.id)}
            onWishlist={handleWishlist}
            onQuickView={(p) => dispatch(setQuickViewProduct(p))}
          />
        ))}
      </div>

      {/* View All Products CTA Button */}
      <div className="mt-12 text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-stone-900 hover:bg-orange-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300"
        >
          <span>Explore All Products</span>
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal />
    </section>
  );
}
