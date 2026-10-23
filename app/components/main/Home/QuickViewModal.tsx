import React, { useState } from "react";
import { Link } from "react-router";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  StarIcon,
  ShoppingBagIcon,
  CheckIcon,
  ShieldCheckIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { setQuickViewProduct, toggleWishlistAsync } from "~/redux/features/homeSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import { toast } from "sonner";
import { getVariantImages, getProductVariant } from "~/firebase";

export default function QuickViewModal() {
  const dispatch = useAppDispatch();
  const { quickViewProduct, wishlistIds } = useAppSelector((state) => state.home);
  const { user } = useAppSelector((state) => state.auth);
  const { items: cartItems } = useAppSelector((state) => state.cart);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const isWishlisted = Boolean(quickViewProduct && wishlistIds.includes(quickViewProduct.id));

  const handleWishlistToggle = () => {
    if (!quickViewProduct) return;
    dispatch(toggleWishlistAsync({ productId: quickViewProduct.id, userId: user?.uid }));
    if (isWishlisted) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  // Sync state when quickViewProduct changes
  React.useEffect(() => {
    if (quickViewProduct) {
      setSelectedSize(quickViewProduct.sizes[0] || "M");
      setSelectedColor(quickViewProduct.colors[0]?.name || "Standard");
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [quickViewProduct]);

  // Dynamic variant imagery based on selected color
  const activeImages = React.useMemo(() => {
    return getVariantImages(quickViewProduct, selectedColor);
  }, [quickViewProduct, selectedColor]);

  const activeVariant = React.useMemo(() => {
    return getProductVariant(quickViewProduct, selectedColor, selectedSize);
  }, [quickViewProduct, selectedColor, selectedSize]);

  const isVariantInStock = activeVariant
    ? activeVariant.inStock && activeVariant.stockCount > 0
    : Boolean(quickViewProduct?.inStock && (quickViewProduct?.stockCount === undefined || quickViewProduct.stockCount > 0));
  const availableStock = activeVariant ? activeVariant.stockCount : (quickViewProduct?.stockCount ?? 25);
  const variantStockCount = availableStock;

  // Track existing quantity of this variant already inside the cart
  const existingCartItem = cartItems.find(
    (item) =>
      String(item.id) === String(quickViewProduct?.id) &&
      item.size === selectedSize &&
      item.color === selectedColor
  );
  const currentInCart = existingCartItem ? existingCartItem.quantity : 0;

  // Cap selected quantity if stock decreases or variant changes
  React.useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(Math.max(1, availableStock));
    }
  }, [availableStock, quantity]);

  const displayPrice = activeVariant?.price ?? quickViewProduct?.price ?? 0;

  if (!quickViewProduct) return null;

  const handleIncrementQuantity = () => {
    if (!isVariantInStock || availableStock <= 0) {
      toast.error(`Sorry, this variant is currently sold out.`);
      return;
    }
    if (quantity >= availableStock) {
      toast.warning(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. You cannot add more.`
      );
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!isVariantInStock || availableStock <= 0) {
      toast.error(`Sorry, ${selectedColor} in size ${selectedSize} is currently out of stock.`);
      return;
    }

    if (quantity > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. Cannot add ${quantity}.`
      );
      setQuantity(Math.max(1, availableStock));
      return;
    }

    if (currentInCart + quantity > availableStock) {
      const remainingAllowed = Math.max(0, availableStock - currentInCart);
      if (remainingAllowed === 0) {
        toast.error(
          `Only ${availableStock} item${availableStock === 1 ? "" : "s"} in stock. You already have all ${availableStock} in your shopping bag!`
        );
      } else {
        toast.error(
          `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. You already have ${currentInCart} in your bag, so you can only add ${remainingAllowed} more.`
        );
      }
      return;
    }

    const chosenImage = activeImages[activeImageIndex] || activeImages[0] || quickViewProduct.images[0];
    dispatch(
      addToCart({
        id: quickViewProduct.id,
        name: quickViewProduct.name,
        price: displayPrice,
        image: chosenImage,
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: quickViewProduct.category,
        maxStock: availableStock,
      })
    );
    toast.success(`Added ${quickViewProduct.name} (${selectedColor} / ${selectedSize}) to your bag!`);
    dispatch(setQuickViewProduct(null));
  };

  return (
    <Transition show={Boolean(quickViewProduct)} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-sans"
        onClose={() => dispatch(setQuickViewProduct(null))}
      >
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100 dark:border-neutral-800">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => dispatch(setQuickViewProduct(null))}
                  className="absolute right-4 top-4 z-20 size-9 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                >
                  <XMarkIcon className="size-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
                  {/* Product Images Column */}
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-neutral-800 aspect-4/5 border border-gray-200 dark:border-neutral-700">
                      <img
                        src={
                          activeImages[activeImageIndex] ||
                          activeImages[0] ||
                          quickViewProduct.images[0]
                        }
                        alt={`${quickViewProduct.name} - ${selectedColor}`}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      {!isVariantInStock ? (
                        <span className="absolute top-3 left-3 bg-neutral-900/90 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-xs border border-white/20">
                          Sold Out
                        </span>
                      ) : quickViewProduct.badge ? (
                        <span className="absolute top-3 left-3 bg-orange-600 dark:bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          {quickViewProduct.badge}
                        </span>
                      ) : null}
                    </div>

                    {/* Image Thumbnails */}
                    {activeImages.length > 1 && (
                      <div className="flex gap-3">
                        {activeImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveImageIndex(i)}
                            className={`size-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                              i === activeImageIndex
                                ? "border-orange-600 shadow-xs"
                                : "border-gray-200 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500"
                            }`}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details Column */}
                  <div className="flex flex-col justify-between">
                    <div className="space-y-5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          {quickViewProduct.category}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 leading-snug">
                          {quickViewProduct.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-neutral-400">
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <StarIcon key={s} className="size-4 fill-current" />
                            ))}
                          </div>
                          <span className="font-bold text-gray-800 dark:text-neutral-200">
                            {quickViewProduct.rating}
                          </span>
                          <span>•</span>
                          <span>{quickViewProduct.reviewCount} verified reviews</span>
                        </div>
                      </div>

                      {/* Pricing in BDT */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          ৳{displayPrice.toLocaleString()}
                        </span>
                        {quickViewProduct.originalPrice && (
                          <span className="text-lg text-gray-400 dark:text-neutral-500 line-through">
                            ৳{quickViewProduct.originalPrice.toLocaleString()}
                          </span>
                        )}
                        {quickViewProduct.originalPrice && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                            Save ৳
                            {(
                              quickViewProduct.originalPrice -
                              displayPrice
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                        {quickViewProduct.description}
                      </p>

                      {/* Color Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300">
                            Color: <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedColor}</span>
                          </label>
                          <span className="text-[10px] text-gray-400">Switches photos</span>
                        </div>
                        <div className="flex gap-2.5">
                          {quickViewProduct.colors.map((c) => {
                            const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => {
                                  setSelectedColor(c.name);
                                  setActiveImageIndex(0);
                                }}
                                className={`size-8 rounded-full border-2 flex items-center justify-center transition cursor-pointer ${
                                  isSelected
                                    ? "border-orange-600 ring-2 ring-orange-500/30 shadow-xs"
                                    : "border-gray-300 dark:border-neutral-600 hover:border-gray-500 dark:hover:border-neutral-400"
                                }`}
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name} (${c.images?.length || 0} photos)`}
                              >
                                {isSelected && (
                                  <CheckIcon
                                    className={`size-4 ${
                                      c.hex === "#f4f4f5" || c.hex === "#fafaf9" || c.hex === "#d6cfc7"
                                        ? "text-black"
                                        : "text-white"
                                    }`}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Size Selector */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300">
                            Size: <span className="font-normal text-gray-500 dark:text-neutral-400">{selectedSize}</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedSize(s)}
                              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                selectedSize === s
                                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-xs"
                                  : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 border-gray-200 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Variant Inventory Stock Status */}
                      <div className="pt-1">
                        {isVariantInStock ? (
                          variantStockCount <= 5 ? (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                              <span>Hurry! Only {variantStockCount} left in stock - order soon!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                              <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Stock Available</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                            <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{selectedColor} in size {selectedSize} is currently out of stock.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1 || !isVariantInStock}
                            className="px-3.5 py-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-xl transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 text-sm font-bold text-gray-900 dark:text-white min-w-8 text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={handleIncrementQuantity}
                            disabled={!isVariantInStock || quantity >= availableStock}
                            className="px-3.5 py-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-r-xl transition cursor-pointer"
                            title={
                              quantity >= availableStock
                                ? `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock`
                                : "Increase quantity"
                            }
                          >
                            +
                          </button>
                        </div>

                        {/* Add to Bag / Sold Out Button */}
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={!isVariantInStock}
                          className="flex-1 py-3.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBagIcon className="size-4" />
                          <span>
                            {isVariantInStock
                              ? `Add to Shopping Bag • ৳${(displayPrice * quantity).toLocaleString()}`
                              : "Sold Out"}
                          </span>
                        </button>

                        {/* Dedicated Wishlist Button */}
                        <button
                          type="button"
                          onClick={handleWishlistToggle}
                          className={`size-12 rounded-xl border flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0 ${
                            isWishlisted
                              ? "border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 shadow-xs"
                              : "border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:text-rose-600 hover:border-rose-300"
                          }`}
                          title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
                        >
                          {isWishlisted ? (
                            <HeartSolidIcon className="size-5 text-rose-600" />
                          ) : (
                            <HeartOutlineIcon className="size-5" />
                          )}
                        </button>
                      </div>

                      {/* Max stock reached indicator */}
                      {isVariantInStock && quantity >= availableStock && availableStock > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span>Maximum stock reached: only {availableStock} item{availableStock === 1 ? "" : "s"} available.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-6 text-[11px] text-gray-500 dark:text-neutral-400 pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                          Cash on Delivery & bKash Available
                        </span>
                        <span>•</span>
                        <span>7-Day Easy Exchange in Bangladesh</span>
                      </div>

                      <div className="pt-2 text-center">
                        <Link
                          to={`/products/${quickViewProduct.id}`}
                          onClick={() => dispatch(setQuickViewProduct(null))}
                          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition"
                        >
                          View Full Product Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
