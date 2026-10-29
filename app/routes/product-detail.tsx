import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import type { Route } from "./+types/product-detail";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import QuickViewModal from "~/components/main/Home/QuickViewModal";
import { SizeGuideModal, ProductReviewsSection } from "~/components/main/Product";
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
  isProductInCategory,
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
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
  InformationCircleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  XMarkIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { Ruler } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailSkeleton } from "~/components/main/Skeletons";

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

  const {
    currentProduct,
    loadingProduct,
    productError,
    items: allProducts,
    categories,
  } = useAppSelector((state) => state.products);

  const { products: homeProducts } = useAppSelector((state) => state.home);
  const { user } = useAppSelector((state) => state.auth);
  const { wishlistIds } = useAppSelector((state) => state.home);
  const { items: cartItems } = useAppSelector((state) => state.cart);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);

  // Middle tabbed section state
  const [activeTab, setActiveTab] = useState<
    "details" | "materials" | "size-fit" | "shipping"
  >("details");

  // Full-screen Image Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Thumbnail rail scroll ref
  const thumbnailsContainerRef = useRef<HTMLDivElement | null>(null);

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
    const target = currentProduct?.categoryId || currentProduct?.category;
    if (!target) return [];
    return getCategoryAncestors(target, categories);
  }, [currentProduct?.categoryId, currentProduct?.category, categories]);

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
    const imgs = getVariantImages(currentProduct, selectedColor);
    return imgs.length > 0 ? imgs : currentProduct.images || [];
  }, [currentProduct, selectedColor]);

  // Matching variant combination (Color × Size)
  const activeVariant = useMemo(() => {
    if (!currentProduct) return null;
    return getProductVariant(currentProduct, selectedColor, selectedSize);
  }, [currentProduct, selectedColor, selectedSize]);

  const displayPrice = activeVariant?.price ?? currentProduct?.price ?? 0;
  const displayOriginalPrice =
    activeVariant?.originalPrice ?? currentProduct?.originalPrice;
  const hasDiscount = Boolean(
    displayOriginalPrice && displayOriginalPrice > displayPrice
  );
  const discountPercent = hasDiscount
    ? Math.round(
        ((displayOriginalPrice! - displayPrice) / displayOriginalPrice!) * 100
      )
    : 0;

  const isVariantInStock = activeVariant
    ? activeVariant.inStock && activeVariant.stockCount > 0
    : Boolean(
        currentProduct?.inStock &&
          (currentProduct?.stockCount === undefined ||
            currentProduct.stockCount > 0)
      );
  const availableStock = activeVariant
    ? activeVariant.stockCount
    : currentProduct?.stockCount ?? 25;
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

  // Related products: prioritizes same category -> same branch -> any other products in store
  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    const pool =
      allProducts && allProducts.length > 0
        ? allProducts
        : homeProducts && homeProducts.length > 0
        ? homeProducts
        : [];
    const candidates = pool.filter(
      (p) => String(p.id) !== String(currentProduct.id)
    );
    if (candidates.length === 0) return [];

    // Exact same category match (prefers categoryId to eliminate cross-parent ambiguity)
    const sameCat = candidates.filter((p) => {
      if (currentProduct.categoryId && p.categoryId) {
        return p.categoryId === currentProduct.categoryId;
      }
      return (
        (p.category || "").trim().toLowerCase() ===
        (currentProduct.category || "").trim().toLowerCase()
      );
    });

    // Same root collection branch (e.g., Summer tree vs Denim tree)
    const rootAncestor =
      categoryAncestors[0] ||
      (currentProduct.categoryId || currentProduct.category);
    const sameBranch = candidates.filter(
      (p) =>
        !sameCat.some((c) => c.id === p.id) &&
        rootAncestor &&
        isProductInCategory(p, rootAncestor, categories)
    );

    // Other store products as fallback
    const otherProducts = candidates.filter(
      (p) =>
        !sameCat.some((c) => c.id === p.id) &&
        !sameBranch.some((b) => b.id === p.id)
    );

    const combined = [...sameCat, ...sameBranch, ...otherProducts];
    return combined.slice(0, 4);
  }, [allProducts, homeProducts, currentProduct, categoryAncestors, categories]);

  // Detail showcase image (for the middle right section)
  const detailPhotoImage = useMemo(() => {
    if (!currentProduct) return "";
    if (activeImages.length > 1) return activeImages[1];
    if (currentProduct.images && currentProduct.images.length > 1) {
      return currentProduct.images[1];
    }
    return activeImages[0] || currentProduct.images?.[0] || "";
  }, [activeImages, currentProduct]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === 0 ? activeImages.length - 1 : prev - 1
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === activeImages.length - 1 ? 0 : prev + 1
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, activeImages.length]);

  if (loadingProduct || (!currentProduct && !productError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
        <Topbar />
        <Header />
        <main className="flex-1">
          <ProductDetailSkeleton />
        </main>
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
      toast.error(
        `Sorry, ${selectedColor} in size ${selectedSize} is currently out of stock.`
      );
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

    const chosenImage =
      activeImages[selectedImageIndex] ||
      activeImages[0] ||
      currentProduct.images[0];
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
    toast.success(
      `Added ${quantity} × ${currentProduct.name} (${selectedColor} / ${selectedSize}) to your bag!`
    );
  };

  const handleBuyNow = () => {
    if (!isVariantInStock || availableStock <= 0) {
      toast.error(
        `Sorry, ${selectedColor} in size ${selectedSize} is currently out of stock.`
      );
      return;
    }

    if (quantity > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. Cannot buy ${quantity}.`
      );
      setQuantity(Math.max(1, availableStock));
      return;
    }

    const chosenImage =
      activeImages[selectedImageIndex] ||
      activeImages[0] ||
      currentProduct.images[0];
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
    dispatch(
      toggleWishlistAsync({ productId: currentProduct.id, userId: user?.uid })
    );
    if (isWishlisted) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  const scrollThumbnailsDown = () => {
    if (activeImages.length <= 1) return;
    const nextIdx = (selectedImageIndex + 1) % activeImages.length;
    setSelectedImageIndex(nextIdx);
    if (thumbnailsContainerRef.current) {
      thumbnailsContainerRef.current.scrollBy({ top: 90, behavior: "smooth" });
    }
  };

  const scrollThumbnailsUp = () => {
    if (activeImages.length <= 1) return;
    const prevIdx =
      selectedImageIndex === 0 ? activeImages.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIdx);
    if (thumbnailsContainerRef.current) {
      thumbnailsContainerRef.current.scrollBy({ top: -90, behavior: "smooth" });
    }
  };

  const currentMainImage =
    activeImages[selectedImageIndex] ||
    activeImages[0] ||
    currentProduct.images[0];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Navigation Layer */}
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Subtle Minimalist Breadcrumb Navigation */}
        <div className="bg-stone-50/80 dark:bg-neutral-900/50 border-b border-stone-200/60 dark:border-neutral-800/80 py-3 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 overflow-x-auto scrollbar-none"
              aria-label="Breadcrumb"
            >
              <Link
                to="/"
                className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0"
              >
                Home
              </Link>
              <span>/</span>
              <Link
                to="/products"
                className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0"
              >
                Shop
              </Link>
              {categoryAncestors.length > 0 ? (
                categoryAncestors.map((anc) => (
                  <React.Fragment key={anc.id}>
                    <span>/</span>
                    <Link
                      to={`/products?category=${encodeURIComponent(anc.slug || anc.id)}`}
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
                    to={`/products?category=${encodeURIComponent(
                      currentProduct.categoryId || currentProduct.category
                    )}`}
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

        {/* ============================================================== */}
        {/* TOP SECTION: PRODUCT SHOWCASE (PIC LAYOUT + PROJECT ORANGE)    */}
        {/* ============================================================== */}
        <section className="py-8 sm:py-12 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
              {/* -------------------------------------------------------- */}
              {/* LEFT COLUMN: GALLERY (VERTICAL THUMBNAILS + MAIN IMAGE)  */}
              {/* -------------------------------------------------------- */}
              <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 lg:gap-5 items-start">
                {/* Vertical Thumbnails Rail (Desktop md:) / Horizontal (Mobile) */}
                {activeImages.length > 1 && (
                  <div className="w-full md:w-20 lg:w-24 shrink-0 flex md:flex-col items-center gap-3">
                    {/* Up Arrow (Desktop md:) */}
                    <button
                      type="button"
                      onClick={scrollThumbnailsUp}
                      aria-label="Previous image"
                      className="hidden md:flex size-7 rounded-full bg-stone-100 hover:bg-orange-600 hover:text-white dark:bg-neutral-850 dark:hover:bg-orange-600 dark:hover:text-white text-stone-700 dark:text-neutral-300 items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronUpIcon className="size-4" />
                    </button>

                    {/* Scrollable Thumbnails List */}
                    <div
                      ref={thumbnailsContainerRef}
                      className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] lg:max-h-[560px] pb-2 md:pb-0 scrollbar-none w-full"
                    >
                      {activeImages.map((img, idx) => {
                        const isSelected = selectedImageIndex === idx;
                        const normalizedImg = normalizeGoogleDriveImageUrl(img);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            aria-label={`View photo ${idx + 1}`}
                            className={`relative size-18 md:size-20 lg:size-24 rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer bg-stone-100 dark:bg-neutral-800 ${
                              isSelected
                                ? "border-orange-600 ring-2 ring-orange-500/25 scale-[1.02]"
                                : "border-stone-200 dark:border-neutral-800 hover:border-orange-400 dark:hover:border-orange-500/60 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={normalizedImg}
                              alt={`${currentProduct.name} thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fileId = extractGoogleDriveFileId(img);
                                if (fileId && !target.dataset.triedThumbnail) {
                                  target.dataset.triedThumbnail = "true";
                                  target.src = getGoogleDriveThumbnailUrl(img, 200);
                                  return;
                                }
                                target.src =
                                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=300&q=80";
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Down Arrow */}
                    <button
                      type="button"
                      onClick={scrollThumbnailsDown}
                      aria-label="Next image"
                      className="size-8 md:size-7 rounded-full bg-stone-100 hover:bg-orange-600 hover:text-white dark:bg-neutral-850 dark:hover:bg-orange-600 dark:hover:text-white text-stone-700 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronDownIcon className="size-4" />
                    </button>
                  </div>
                )}

                {/* Main Large Product Photo */}
                <div className="flex-1 w-full relative rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-neutral-850 aspect-4/5 shadow-xs border border-stone-200/80 dark:border-neutral-800">
                  <img
                    src={normalizeGoogleDriveImageUrl(currentMainImage)}
                    alt={`${currentProduct.name} - ${selectedColor}`}
                    className="w-full h-full object-cover transition-all duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fileId = extractGoogleDriveFileId(currentMainImage);
                      if (fileId && !target.dataset.triedThumbnail) {
                        target.dataset.triedThumbnail = "true";
                        target.src = getGoogleDriveThumbnailUrl(currentMainImage, 1200);
                        return;
                      }
                      target.src =
                        "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />

                  {/* Sold Out Overlay Badge */}
                  {!isVariantInStock && (
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-stone-900/90 text-white backdrop-blur-xs shadow-sm">
                        Sold Out
                      </span>
                    </div>
                  )}

                  {/* Floating Zoom / Inspect Button (Bottom-Right corner) */}
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(selectedImageIndex);
                      setLightboxOpen(true);
                    }}
                    aria-label="Zoom image"
                    className="absolute bottom-4 right-4 size-10 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border border-stone-200/80 dark:border-neutral-700 shadow-md flex items-center justify-center text-stone-800 dark:text-neutral-200 hover:text-white hover:bg-orange-600 hover:border-orange-600 dark:hover:bg-orange-600 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-10"
                    title="Click to view full image"
                  >
                    <MagnifyingGlassesIcon className="size-4.5" />
                  </button>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* RIGHT COLUMN: PRODUCT INFO & ACTIONS                     */}
              {/* -------------------------------------------------------- */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. Tag / Badge (Orange styled tag) */}
                <div>
                  <span className="inline-block px-3 py-1 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/40 text-xs font-bold uppercase tracking-wider">
                    {currentProduct.badge || currentProduct.category || "New Arrival"}
                  </span>
                </div>

                {/* 2. Product Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                    {currentProduct.name}
                  </h1>

                  {/* 3. Rating & Reviews Row */}
                  <a
                    href="#customer-reviews"
                    className="mt-2.5 inline-flex items-center gap-2 group cursor-pointer hover:opacity-90 transition"
                  >
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarSolidIcon
                          key={i}
                          className="size-4 text-amber-500 fill-current"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {currentProduct.rating || 4.8}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-orange-600 transition underline underline-offset-2">
                      ({currentProduct.reviewCount || 128} customer reviews)
                    </span>
                  </a>
                </div>

                {/* 4. Price Row with Original Strikethrough & Orange Discount Pill */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    ৳{displayPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg sm:text-xl text-stone-400 dark:text-neutral-500 line-through font-normal">
                        ৳{displayOriginalPrice?.toLocaleString()}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md bg-orange-600 text-white shadow-xs shadow-orange-600/20">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* 5. Short Description */}
                <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-300 leading-relaxed max-w-xl">
                  {currentProduct.description ||
                    "Premium heavyweight export-grade fabric with an oversized fit for ultimate comfort and modern street style."}
                </p>

                {/* 6. Color Selector (Circles + Dynamic Orange Highlighted Name) */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Color:{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {selectedColor}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentProduct.colors.map((color) => {
                      const isSelected =
                        selectedColor.toLowerCase() === color.name.toLowerCase();
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorSelect(color.name)}
                          aria-label={`Select color ${color.name}`}
                          className={`size-8 sm:size-9 rounded-full transition-all duration-200 cursor-pointer relative flex items-center justify-center ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-orange-600 dark:ring-orange-500 dark:ring-offset-neutral-950 scale-105"
                              : "hover:scale-105 border border-black/10 dark:border-white/10 opacity-85 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 7. Size Selector (Orange Active Buttons + Size Guide Link) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Size:{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {selectedSize}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      <Ruler className="size-3.5" />
                      <span>Size Guide</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {currentProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-12 h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/25"
                              : "bg-white dark:bg-neutral-900 text-stone-800 dark:text-neutral-200 border border-stone-200 dark:border-neutral-800 hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Low Stock / Sold Out Indicator */}
                {!isVariantInStock ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                    <InformationCircleIcon className="size-4 shrink-0 text-rose-600" />
                    <span>
                      Sold Out — {selectedColor} in size {selectedSize} is currently unavailable.
                    </span>
                  </div>
                ) : variantStockCount <= 5 ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                    <span>
                      Only {variantStockCount} left in {selectedColor} ({selectedSize})
                    </span>
                  </div>
                ) : null}

                {/* 8. Action Row: Quantity Stepper + Project Orange Add to Cart + Wishlist + Buy It Now */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-stone-200 dark:border-neutral-800 rounded-xl bg-stone-50/60 dark:bg-neutral-900/60 h-13 px-1">
                      <button
                        type="button"
                        onClick={handleDecrementQuantity}
                        disabled={quantity <= 1 || !isVariantInStock}
                        className="size-9 flex items-center justify-center text-stone-600 dark:text-neutral-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-neutral-800 dark:hover:text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Reduce quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrementQuantity}
                        disabled={!isVariantInStock || quantity >= availableStock}
                        className="size-9 flex items-center justify-center text-stone-600 dark:text-neutral-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-neutral-800 dark:hover:text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Primary Add to Cart Button (Orange Theme) */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!isVariantInStock}
                      className="flex-1 h-13 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg shadow-orange-600/20 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ShoppingBagIcon className="size-5 shrink-0" />
                      <span>{isVariantInStock ? "Add to Cart" : "Sold Out"}</span>
                    </button>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={handleWishlistToggle}
                      className={`size-13 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                        isWishlisted
                          ? "border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 shadow-xs"
                          : "border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-700 dark:text-neutral-300 hover:text-rose-600 hover:border-rose-300 dark:hover:border-neutral-700 shadow-xs"
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
                    className="w-full h-12 sm:h-13 px-6 rounded-xl border-2 border-orange-600 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white text-orange-600 dark:text-orange-400 font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-99 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <BoltIcon className="size-4.5" />
                    <span>{isVariantInStock ? "Buy It Now" : "Sold Out"}</span>
                  </button>
                </div>

                {/* 9. Trust Badges Strip (3 Columns with Orange Icons) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200/80 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                      <TruckIcon className="size-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        Free Shipping
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                        On orders over ৳1,500
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                      <ArrowPathRoundedSquareIcon className="size-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        Easy Returns
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                        7-day size exchange
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                      <ShieldCheckIcon className="size-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        Secure Payment
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                        100% secure checkout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MIDDLE SECTION: TABS & SHOWCASE DETAIL PHOTO (2-COLUMN SPLIT) */}
        {/* ============================================================== */}
        <section className="py-12 sm:py-16 border-t border-stone-200/80 dark:border-neutral-800 bg-stone-50/40 dark:bg-neutral-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Left Column: Tabbed Content (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Tab Navigation with Orange Underline Indicator */}
                <div className="flex items-center gap-6 sm:gap-8 border-b border-stone-200 dark:border-neutral-800 overflow-x-auto scrollbar-none">
                  {[
                    { id: "details", label: "Details" },
                    { id: "materials", label: "Materials" },
                    { id: "size-fit", label: "Size & Fit" },
                    { id: "shipping", label: "Shipping & Returns" },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`pb-3.5 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors relative cursor-pointer ${
                          isActive
                            ? "text-orange-600 dark:text-orange-400 font-bold"
                            : "text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400"
                        }`}
                      >
                        {tab.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Panels */}
                <div className="pt-2">
                  {activeTab === "details" && (
                    <div className="space-y-6">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-300 leading-relaxed">
                        {currentProduct.description ||
                          "Crafted from high-quality heavyweight cotton, this hoodie delivers unmatched comfort and durability. The oversized fit and minimal design make it a versatile staple for any wardrobe."}
                      </p>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-neutral-200">
                          <ShoppingBagIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>{currentProduct.fit || "Oversized relaxed fit"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-neutral-200">
                          <SparklesIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>{currentProduct.material || "Soft & heavyweight fabric"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-neutral-200">
                          <CheckIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>Adjustable drawstring hood with premium metal aglets</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-neutral-200">
                          <CheckIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>Ribbed stretch cuffs and hem for long-lasting fit</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-neutral-200">
                          <BuildingStorefrontIcon className="size-4.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>Unisex contemporary style tailored for versatile layering</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "materials" && (
                    <div className="space-y-4">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-gray-900 dark:text-white">
                          Fabric Composition:
                        </strong>{" "}
                        {currentProduct.material ||
                          "100% Pure Combed Organic Cotton, 380 GSM Heavyweight Fleece with ultra-soft brushed interior."}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-gray-900 dark:text-white">
                          Care Instructions:
                        </strong>{" "}
                        {currentProduct.care ||
                          "Machine wash cold with like colors inside out. Do not bleach. Tumble dry on low heat or hang dry in the shade to preserve fabric softness and rich dye depth."}
                      </p>
                    </div>
                  )}

                  {activeTab === "size-fit" && (
                    <div className="space-y-4">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-300 leading-relaxed">
                        <strong className="text-gray-900 dark:text-white">
                          Fit Silhouette:
                        </strong>{" "}
                        {currentProduct.fit ||
                          "Designed for an oversized, boxy modern drape. For a more standard fitted look, we recommend sizing down."}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSizeGuideModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/50 text-xs font-bold transition cursor-pointer"
                        >
                          <Ruler className="size-4" />
                          <span>Open Full Size Chart &amp; Measurements</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "shipping" && (
                    <div className="space-y-4 text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                      <p>
                        <strong className="text-gray-900 dark:text-white">
                          Dhaka Delivery:
                        </strong>{" "}
                        Dispatched within 24 to 48 hours via fast express courier.
                      </p>
                      <p>
                        <strong className="text-gray-900 dark:text-white">
                          Nationwide Delivery (63 Districts):
                        </strong>{" "}
                        Delivered within 2 to 4 business days directly to your doorstep.
                      </p>
                      <p>
                        <strong className="text-gray-900 dark:text-white">
                          7-Day Size Exchange:
                        </strong>{" "}
                        If the size does not fit, initiate an easy exchange on our{" "}
                        <Link
                          to="/returns-and-exchanges"
                          className="text-orange-600 dark:text-orange-400 font-semibold underline"
                        >
                          Returns &amp; Exchanges Desk
                        </Link>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Close-up Detail Photograph (5 Cols) */}
              <div className="lg:col-span-5">
                <div
                  onClick={() => {
                    setLightboxIndex(
                      activeImages.length > 1 ? 1 : selectedImageIndex
                    );
                    setLightboxOpen(true);
                  }}
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-neutral-850 border border-stone-200/80 dark:border-neutral-800 aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  title="Click to view full detail"
                >
                  <img
                    src={normalizeGoogleDriveImageUrl(detailPhotoImage)}
                    alt={`${currentProduct.name} fabric close-up`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fileId = extractGoogleDriveFileId(detailPhotoImage);
                      if (fileId && !target.dataset.triedThumbnail) {
                        target.dataset.triedThumbnail = "true";
                        target.src = getGoogleDriveThumbnailUrl(
                          detailPhotoImage,
                          800
                        );
                        return;
                      }
                      target.src =
                        "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-orange-600 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors">
                    <MagnifyingGlassesIcon className="size-3.5" />
                    <span>Fabric &amp; Detail Close-up</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CUSTOMER REVIEWS & RATINGS SECTION                              */}
        {/* ============================================================== */}
        <ProductReviewsSection
          productId={currentProduct.id}
          productName={currentProduct.name}
          productImage={currentMainImage}
          baseRating={currentProduct.rating || 4.8}
          baseReviewCount={currentProduct.reviewCount || 0}
        />

        {/* ============================================================== */}
        {/* BOTTOM SECTION: "YOU MAY ALSO LIKE"                            */}
        {/* ============================================================== */}
        <section className="py-12 sm:py-16 bg-white dark:bg-neutral-950 border-t border-stone-200/80 dark:border-neutral-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-1">
                  Recommended For You
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  You May Also Like
                </h3>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(
                  currentProduct.categoryId || currentProduct.category
                )}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline group transition"
              >
                <span>View All</span>
                <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Related Products Grid or Fallback */}
            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((p) => {
                  const isPWishlisted = wishlistIds.includes(p.id);
                  const pImage = normalizeGoogleDriveImageUrl(
                    p.images?.[0] || ""
                  );
                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-800/50 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300"
                    >
                      {/* Product Photo */}
                      <Link
                        to={`/products/${p.id}`}
                        className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800 block cursor-pointer"
                      >
                        <img
                          src={pImage}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fileId = extractGoogleDriveFileId(p.images?.[0]);
                            if (fileId && !target.dataset.triedThumbnail) {
                              target.dataset.triedThumbnail = "true";
                              target.src = getGoogleDriveThumbnailUrl(
                                p.images?.[0],
                                800
                              );
                              return;
                            }
                            target.src =
                              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      </Link>

                      {/* Info & Price & Wishlist */}
                      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
                            {p.category}
                          </span>
                          <Link
                            to={`/products/${p.id}`}
                            className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition line-clamp-1"
                          >
                            {p.name}
                          </Link>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                            ৳{p.price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              dispatch(
                                toggleWishlistAsync({
                                  productId: p.id,
                                  userId: user?.uid,
                                })
                              );
                            }}
                            className={`size-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                              isPWishlisted
                                ? "text-rose-600"
                                : "text-stone-400 hover:text-rose-600"
                            }`}
                            title="Save to wishlist"
                          >
                            {isPWishlisted ? (
                              <HeartSolidIcon className="size-4.5 text-rose-600" />
                            ) : (
                              <HeartIcon className="size-4.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-4 text-center rounded-2xl bg-stone-50/70 dark:bg-neutral-900/50 border border-dashed border-stone-200 dark:border-neutral-800">
                <SparklesIcon className="size-8 mx-auto text-orange-500 mb-2" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Discover More Collections
                </h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                  Explore our complete range of export-quality garments and seasonal styles.
                </p>
                <div className="mt-4">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <span>Browse All Collections</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* INTERACTIVE FULL-SCREEN LIGHTBOX MODAL                         */}
      {/* ============================================================== */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close modal"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 size-11 rounded-full bg-white/10 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer z-10"
          >
            <XMarkIcon className="size-6" />
          </button>

          {/* Previous Arrow */}
          {activeImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === 0 ? activeImages.length - 1 : prev - 1
                );
              }}
              aria-label="Previous image"
              className="absolute left-4 sm:left-6 size-11 rounded-full bg-white/10 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer z-10"
            >
              <ChevronLeftIcon className="size-6" />
            </button>
          )}

          {/* Main Large Lightbox Image */}
          <div
            className="max-w-4xl max-h-[85vh] relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={normalizeGoogleDriveImageUrl(
                activeImages[lightboxIndex] || currentMainImage
              )}
              alt={`${currentProduct.name} view ${lightboxIndex + 1}`}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            {/* Image Counter */}
            <div className="absolute bottom-4 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-semibold">
              {lightboxIndex + 1} / {activeImages.length}
            </div>
          </div>

          {/* Next Arrow */}
          {activeImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === activeImages.length - 1 ? 0 : prev + 1
                );
              }}
              aria-label="Next image"
              className="absolute right-4 sm:right-6 size-11 rounded-full bg-white/10 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer z-10"
            >
              <ChevronRightIcon className="size-6" />
            </button>
          )}
        </div>
      )}

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

function MagnifyingGlassesIcon(props: React.ComponentProps<"svg">) {
  return <MagnifyingGlassIcon {...props} />;
}
