import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router";
import type { Route } from "./+types/product-detail";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import QuickViewModal from "~/components/main/Home/QuickViewModal";
import { SizeGuideBox, SizeGuideModal } from "~/components/main/Product";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchProductById,
  fetchProducts,
  fetchProductCategories,
  clearCurrentProduct,
} from "~/redux/features/productSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import { toggleWishlistAsync } from "~/redux/features/homeSlice";
import {
  getVariantImages,
  getProductVariant,
  getCategoryAncestors,
  getCategoryDescendantNames,
} from "~/firebase";
import {
  ShoppingBagIcon,
  HeartIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathRoundedSquareIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  CheckIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Product Details | SilkenDrift Bangladesh" },
    {
      name: "description",
      content:
        "Handcrafted export-quality apparel from SilkenDrift Bangladesh. Premium fabrics, comfortable modern fits, and 7-day size exchange.",
    },
  ];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentProduct, loadingProduct, productError, items: allProducts, categories } =
    useAppSelector((state) => state.products);

  const { user } = useAppSelector((state) => state.auth);
  const { wishlistIds } = useAppSelector((state) => state.home);
  const { items: cartItems } = useAppSelector((state) => state.cart);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts());
    }
  }, [allProducts.length, dispatch]);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchProductCategories());
    }
  }, [categories.length, dispatch]);

  // Compute category ancestors for multi-level breadcrumbs
  const categoryAncestors = useMemo(() => {
    if (!currentProduct?.category) return [];
    return getCategoryAncestors(currentProduct.category, categories);
  }, [currentProduct?.category, categories]);

  // Set default size and color when product loads
  useEffect(() => {
    if (currentProduct) {
      setSelectedSize(currentProduct.sizes[0] || "M");
      setSelectedColor(currentProduct.colors[0]?.name || "Standard");
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [currentProduct]);

  // Dynamic variant photography based on selected color
  const activeImages = useMemo(() => {
    if (!currentProduct) return [];
    return getVariantImages(currentProduct, selectedColor);
  }, [currentProduct, selectedColor]);

  // Matching variant combination (Color × Size)
  const activeVariant = useMemo(() => {
    if (!currentProduct) return null;
    return getProductVariant(currentProduct, selectedColor, selectedSize);
  }, [currentProduct, selectedColor, selectedSize]);

  const displayPrice = activeVariant?.price ?? currentProduct?.price ?? 0;
  const displayOriginalPrice = activeVariant?.originalPrice ?? currentProduct?.originalPrice;
  const hasDiscount = Boolean(displayOriginalPrice && displayOriginalPrice > displayPrice);
  const discountPercent = hasDiscount
    ? Math.round(((displayOriginalPrice! - displayPrice) / displayOriginalPrice!) * 100)
    : 0;

  const isVariantInStock = activeVariant
    ? activeVariant.inStock && activeVariant.stockCount > 0
    : Boolean(currentProduct?.inStock && (currentProduct?.stockCount === undefined || currentProduct.stockCount > 0));
  const availableStock = activeVariant ? activeVariant.stockCount : (currentProduct?.stockCount ?? 25);
  const variantStockCount = availableStock;

  // Track existing quantity of this variant already inside the cart
  const existingCartItem = currentProduct
    ? cartItems.find(
        (item) =>
          String(item.id) === String(currentProduct.id) &&
          item.size === selectedSize &&
          item.color === selectedColor
      )
    : undefined;
  const currentInCart = existingCartItem ? existingCartItem.quantity : 0;

  // Cap selected quantity if stock decreases or variant changes
  useEffect(() => {
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(Math.max(1, availableStock));
    }
  }, [availableStock, quantity]);

  // Related products in the same hierarchy branch or category (called unconditionally before early returns)
  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    const rootOrParent = categoryAncestors[0]?.name || currentProduct.category;
    const branchNames = new Set(
      getCategoryDescendantNames(rootOrParent, categories).map((n) => n.trim().toLowerCase())
    );
    const candidates = allProducts.filter((p) => p.id !== currentProduct.id);
    const sameCat = candidates.filter(
      (p) => p.category?.trim().toLowerCase() === currentProduct.category?.trim().toLowerCase()
    );
    const sameBranch = candidates.filter(
      (p) =>
        p.category?.trim().toLowerCase() !== currentProduct.category?.trim().toLowerCase() &&
        branchNames.has((p.category || "").trim().toLowerCase())
    );
    return [...sameCat, ...sameBranch].slice(0, 4);
  }, [allProducts, currentProduct, categoryAncestors, categories]);

  if (loadingProduct || (!currentProduct && !productError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
        <Topbar />
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <Spinner className="size-10 text-orange-600 dark:text-orange-400 animate-spin" />
          <p className="text-sm font-semibold text-gray-600 dark:text-neutral-400">
            Loading garment details from Cloud Firestore...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (productError || !currentProduct) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
        <Topbar />
        <Header />
        <div className="flex-1 max-w-xl mx-auto px-4 py-24 text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500">
            <InformationCircleIcon className="size-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Garment Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            The product you are looking for may have sold out or is no longer available in our
            current collection.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Back to All Collections</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(currentProduct.id);

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectedImageIndex(0);
  };

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

  const handleDecrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
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

    const chosenImage = activeImages[selectedImageIndex] || activeImages[0] || currentProduct.images[0];
    dispatch(
      addToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        price: displayPrice,
        image: chosenImage,
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: currentProduct.category,
        maxStock: availableStock,
      })
    );
    toast.success(`Added ${quantity} × ${currentProduct.name} (${selectedColor} / ${selectedSize}) to your bag!`);
  };

  const handleBuyNow = () => {
    if (!isVariantInStock || availableStock <= 0) {
      toast.error(`Sorry, ${selectedColor} in size ${selectedSize} is currently out of stock. Save to Wishlist!`);
      return;
    }

    if (quantity > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. Cannot buy ${quantity}.`
      );
      setQuantity(Math.max(1, availableStock));
      return;
    }

    const chosenImage = activeImages[selectedImageIndex] || activeImages[0] || currentProduct.images[0];
    dispatch(
      addToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        price: displayPrice,
        image: chosenImage,
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: currentProduct.category,
        maxStock: availableStock,
      })
    );
    navigate("/checkout");
  };

  const handleWishlistToggle = () => {
    dispatch(toggleWishlistAsync({ productId: currentProduct.id, userId: user?.uid }));
    if (isWishlisted) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Navigation */}
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Breadcrumb Navigation with Hierarchy Support */}
        <div className="bg-stone-50 dark:bg-neutral-900/60 border-b border-stone-200/60 dark:border-neutral-800 py-3 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 overflow-x-auto scrollbar-none" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0">
                Home
              </Link>
              <span>/</span>
              <Link to="/products" className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0">
                Products
              </Link>
              {categoryAncestors.length > 0 ? (
                categoryAncestors.map((anc) => (
                  <React.Fragment key={anc.id}>
                    <span>/</span>
                    <Link
                      to={`/products?category=${encodeURIComponent(anc.name)}`}
                      className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0 font-medium"
                    >
                      {anc.name}
                    </Link>
                  </React.Fragment>
                ))
              ) : currentProduct.category ? (
                <>
                  <span>/</span>
                  <Link
                    to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                    className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0 font-medium"
                  >
                    {currentProduct.category}
                  </Link>
                </>
              ) : null}
              <span>/</span>
              <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs shrink-0">
                {currentProduct.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Product Showcase Section */}
        <section className="py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
              {/* Left Column: Image Gallery (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Main Large Image Display */}
                <div className="relative rounded-3xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-stone-200/80 dark:border-neutral-700 aspect-4/5 shadow-md">
                  <img
                    src={activeImages[selectedImageIndex] || activeImages[0] || currentProduct.images[0]}
                    alt={`${currentProduct.name} - ${selectedColor}`}
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Sold Out / Badge */}
                  {!isVariantInStock ? (
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                      <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md bg-neutral-900/90 text-white border border-neutral-700/80 backdrop-blur-xs">
                        Sold Out
                      </span>
                    </div>
                  ) : (
                    currentProduct.badge && (
                      <div className="absolute top-4 left-4 z-10 pointer-events-none">
                        <span
                          className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-full shadow-md ${
                            currentProduct.badge === "Sale"
                              ? "bg-rose-600 text-white"
                              : currentProduct.badge === "Best Seller"
                              ? "bg-stone-900 text-white"
                              : "bg-orange-600 dark:bg-orange-500 text-white"
                          }`}
                        >
                          {currentProduct.badge}
                        </span>
                      </div>
                    )
                  )}

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="absolute top-4 right-4 size-11 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs flex items-center justify-center text-gray-700 dark:text-neutral-200 hover:text-rose-600 hover:scale-110 transition shadow-md cursor-pointer z-10"
                    title="Save to wishlist"
                  >
                    {isWishlisted ? (
                      <HeartSolidIcon className="size-6 text-rose-600" />
                    ) : (
                      <HeartIcon className="size-6" />
                    )}
                  </button>

                  {/* Image Counter Pill */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-medium">
                    {selectedImageIndex + 1} / {activeImages.length}
                  </div>
                </div>

                {/* Thumbnails Row */}
                {activeImages.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {activeImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative size-20 sm:size-24 rounded-2xl overflow-hidden border-2 bg-stone-100 dark:bg-neutral-800 transition shrink-0 cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-orange-600 ring-2 ring-orange-500/20"
                            : "border-stone-200/80 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${currentProduct.name} ${selectedColor} view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Garment Information & Purchase Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 mb-2">
                    <Link
                      to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                      className="font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest hover:underline"
                    >
                      {currentProduct.category}
                    </Link>
                    {(activeVariant?.sku || currentProduct.sku) && (
                      <span className="font-mono text-gray-400 dark:text-neutral-500">
                        SKU: {activeVariant?.sku || currentProduct.sku}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                    {currentProduct.name}
                  </h1>

                  {/* Rating & Review Summary */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarSolidIcon key={i} className="size-4 text-amber-500 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {currentProduct.rating}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-neutral-500">
                      ({currentProduct.reviewCount} customer reviews)
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ৳{displayPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-base text-gray-400 dark:text-neutral-500 line-through">
                        ৳{displayOriginalPrice?.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1 rounded-full">
                        Save {discountPercent}%
                      </span>
                    </>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                  {currentProduct.description}
                </p>

                {/* Color Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Color:{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedColor}</span>
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Click color to switch gallery view
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {currentProduct.colors.map((color) => {
                      const isSelected = selectedColor.toLowerCase() === color.name.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorSelect(color.name)}
                          className={`group relative flex items-center gap-2 p-1.5 rounded-full border transition cursor-pointer ${
                            isSelected
                              ? "border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs"
                              : "border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500"
                          }`}
                          title={`${color.name} (${color.images?.length || 0} variant photos)`}
                        >
                          <span
                            className="size-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                            {color.name}
                          </span>
                          {color.images && color.images.length > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 mr-1">
                              {color.images.length}P
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Select Size:{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedSize}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(!sizeGuideOpen)}
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Size Guide &amp; Measurements</span>
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-normal">
                        ({sizeGuideOpen ? "Hide" : "Show"})
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {currentProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md"
                              : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 border border-stone-200/90 dark:border-neutral-700 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {/* Size Guide Accordion Helper (Clean, Non-Overlapping) */}
                  {sizeGuideOpen && (
                    <SizeGuideBox
                      category={currentProduct.category}
                      selectedSize={selectedSize}
                      onOpenModal={() => setSizeGuideModalOpen(true)}
                    />
                  )}
                </div>

                {/* Variant Inventory Stock Status */}
                <div className="pt-1">
                  {isVariantInStock ? (
                    variantStockCount <= 5 ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                        <span>Hurry! Only {variantStockCount} left in {selectedColor} ({selectedSize})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Stock Available</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                      <InformationCircleIcon className="size-4 text-rose-600 shrink-0" />
                      <span>Sold Out — {selectedColor} in size {selectedSize} is currently unavailable.</span>
                    </div>
                  )}
                </div>

                {/* Quantity and Add to Bag / Wishlist */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 shadow-2xs">
                      <button
                        type="button"
                        onClick={handleDecrementQuantity}
                        disabled={quantity <= 1 || !isVariantInStock}
                        className="px-3.5 py-3 text-gray-600 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-xl transition cursor-pointer"
                        title="Reduce quantity"
                      >
                        -
                      </button>
                      <span className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-white min-w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrementQuantity}
                        disabled={!isVariantInStock || quantity >= availableStock}
                        className="px-3.5 py-3 text-gray-600 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-r-xl transition cursor-pointer"
                        title={
                          quantity >= availableStock
                            ? `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock`
                            : "Add 1 more"
                        }
                      >
                        +
                      </button>
                    </div>

                    {/* Primary Add to Bag / Sold Out Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!isVariantInStock}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBagIcon className="size-5" />
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
                          : "border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200 hover:text-rose-600 hover:border-rose-300"
                      }`}
                      title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
                    >
                      {isWishlisted ? (
                        <HeartSolidIcon className="size-5 text-rose-600" />
                      ) : (
                        <HeartIcon className="size-5" />
                      )}
                    </button>
                  </div>

                  {/* Instant Buy It Now Button */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!isVariantInStock}
                    className="w-full py-3.5 px-6 rounded-xl border-2 border-orange-600 dark:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <BoltIcon className="size-4" />
                    <span>{isVariantInStock ? "Buy It Now" : "Sold Out"}</span>
                  </button>

                  {/* Max stock reached indicator */}
                  {isVariantInStock && quantity >= availableStock && availableStock > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span>Maximum stock reached: only {availableStock} item{availableStock === 1 ? "" : "s"} available in our studio.</span>
                    </div>
                  )}
                </div>

                {/* Stock & Delivery Promise */}
                {isVariantInStock ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>In Stock — Ready to Dispatch from Dhaka Studio</span>
                    </div>
                    <p className="text-emerald-800/90 dark:text-emerald-400/90 leading-relaxed text-[11px]">
                      Orders in Dhaka metropolitan area are delivered within 24 to 48 hours. Orders
                      across all other 63 districts arrive within 2 to 4 business days.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-neutral-900/90 border border-stone-200 dark:border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold">
                      <span className="size-2 rounded-full bg-rose-500" />
                      <span>Sold Out — Save to Wishlist to Reserve</span>
                    </div>
                    <p className="text-gray-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                      This garment size or color is currently out of stock. Add it to your saved wishlist above so you can easily purchase when our atelier produces a fresh batch.
                    </p>
                  </div>
                )}

                {/* SilkenDrift Customer Guarantees List */}
                <div className="border-t border-stone-200/80 dark:border-neutral-800 pt-4 space-y-2.5 text-xs text-gray-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2.5">
                    <TruckIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span>Cash on Delivery &amp; bKash / Nagad available in 64 districts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ArrowPathRoundedSquareIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    <Link
                      to="/returns-and-exchanges"
                      className="hover:underline hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      7-Day Easy Size &amp; Fit Exchange guarantee
                    </Link>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <BuildingStorefrontIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span>Try it on in person at our Banani / Gulshan studio in Dhaka</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Product Specifications Accordion */}
        <section className="py-12 bg-stone-50 dark:bg-neutral-900/60 border-y border-stone-200/60 dark:border-neutral-800 transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Garment Specifications &amp; Care
            </h2>

            <Accordion className="space-y-4">
              <AccordionItem className="rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 py-2">
                  Garment Details &amp; Craftsmanship
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed pt-2">
                  <ul className="space-y-2 list-disc list-inside">
                    {currentProduct.details?.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    )) || (
                      <>
                        <li>Export-standard double-needle reinforced stitching</li>
                        <li>Pre-shrunk fabric to prevent post-wash distortion</li>
                        <li>High grade custom anti-rust hardware</li>
                      </>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 py-2">
                  Fabric &amp; Material
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed pt-2">
                  <p>
                    <strong className="text-gray-900 dark:text-white">Material Composition:</strong>{" "}
                    {currentProduct.material || "100% Pure Combed Natural Cotton"}
                  </p>
                  <p className="mt-2">
                    <strong className="text-gray-900 dark:text-white">Fit Silhouette:</strong>{" "}
                    {currentProduct.fit || "Standard relaxed everyday fit designed for comfort"}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 py-2">
                  Washing &amp; Care Guidelines
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed pt-2">
                  <p>
                    {currentProduct.care ||
                      "Machine wash in cold water with similar colors. Do not bleach. Hang dry in shade to preserve fabric softness and color depth."}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 py-2">
                  Delivery &amp; Exchange Policy in Bangladesh
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed pt-2">
                  <p>
                    We deliver to all 64 districts in Bangladesh with reliable courier partners. If
                    you need a different size, simply reach out to our WhatsApp care team or initiate an
                    instant doorstep reverse pickup on our{" "}
                    <Link
                      to="/returns-and-exchanges"
                      className="text-orange-600 dark:text-orange-400 font-semibold underline underline-offset-2"
                    >
                      Returns &amp; Exchanges Desk
                    </Link>{" "}
                    within 7 days of receiving your package. We will dispatch the replacement promptly.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-white dark:bg-neutral-950 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                    Complete Your Outfit
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    More in {currentProduct.category}
                  </h3>
                </div>
                <Link
                  to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <span>View All {currentProduct.category}</span>
                  <ChevronRightIcon className="size-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-2xs hover:shadow-lg transition-all"
                  >
                    <div className="aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          {p.category}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition line-clamp-1 mt-0.5">
                          {p.name}
                        </h4>
                      </div>
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ৳{p.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold group-hover:underline">
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Global Quick View Modal */}
      <QuickViewModal />

      {/* Full Size Guide Modal */}
      {currentProduct && (
        <SizeGuideModal
          isOpen={sizeGuideModalOpen}
          onClose={() => setSizeGuideModalOpen(false)}
          category={currentProduct.category}
          selectedSize={selectedSize}
        />
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
