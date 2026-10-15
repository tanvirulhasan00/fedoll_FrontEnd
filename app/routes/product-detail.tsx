import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/product-detail";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import QuickViewModal from "~/components/main/Home/QuickViewModal";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchProductById,
  fetchProducts,
  clearCurrentProduct,
} from "~/redux/features/productSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import { toggleWishlist } from "~/redux/features/homeSlice";
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
    { title: "Product Details | Fedoll Bangladesh" },
    {
      name: "description",
      content:
        "Handcrafted export-quality apparel from Fedoll Bangladesh. Premium fabrics, comfortable modern fits, and 7-day size exchange.",
    },
  ];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const { currentProduct, loadingProduct, productError, items: allProducts } =
    useAppSelector((state) => state.products);

  const { wishlistIds } = useAppSelector((state) => state.home);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

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

  // Set default size and color when product loads
  useEffect(() => {
    if (currentProduct) {
      setSelectedSize(currentProduct.sizes[0] || "M");
      setSelectedColor(currentProduct.colors[0]?.name || "Standard");
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [currentProduct]);

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Topbar />
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <Spinner className="size-10 text-orange-700 animate-spin" />
          <p className="text-sm font-semibold text-gray-600">
            Loading garment details from Cloud Firestore...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (productError || !currentProduct) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Topbar />
        <Header />
        <div className="flex-1 max-w-xl mx-auto px-4 py-24 text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-gray-400">
            <InformationCircleIcon className="size-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Garment Not Found
          </h2>
          <p className="text-sm text-gray-500">
            The product you are looking for may have sold out or is no longer available in our
            current collection.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold shadow-xs transition"
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
  const hasDiscount =
    currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((currentProduct.originalPrice! - currentProduct.price) /
          currentProduct.originalPrice!) *
          100
      )
    : 0;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images[0],
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: currentProduct.category,
      })
    );
    toast.success(`Added ${currentProduct.name} (${selectedSize}) to your bag!`);
  };

  const handleWishlistToggle = () => {
    dispatch(toggleWishlist(currentProduct.id));
    if (isWishlisted) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  // Related products in the same category
  const relatedProducts = allProducts
    .filter(
      (p) => p.category === currentProduct.category && p.id !== currentProduct.id
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-stone-50 border-b border-stone-200/60 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-orange-700 transition">
                Home
              </Link>
              <span>/</span>
              <Link to="/products" className="hover:text-orange-700 transition">
                Products
              </Link>
              <span>/</span>
              <Link
                to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                className="hover:text-orange-700 transition"
              >
                {currentProduct.category}
              </Link>
              <span>/</span>
              <span className="font-medium text-gray-900 truncate max-w-xs">
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
                <div className="relative rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 aspect-4/5 shadow-md">
                  <img
                    src={currentProduct.images[selectedImageIndex] || currentProduct.images[0]}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Badge */}
                  {currentProduct.badge && (
                    <div className="absolute top-4 left-4">
                      <span
                        className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-full shadow-md ${
                          currentProduct.badge === "Sale"
                            ? "bg-rose-600 text-white"
                            : currentProduct.badge === "Best Seller"
                            ? "bg-stone-900 text-white"
                            : "bg-orange-700 text-white"
                        }`}
                      >
                        {currentProduct.badge}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="absolute top-4 right-4 size-11 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-rose-600 hover:scale-110 transition shadow-md cursor-pointer z-10"
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
                    {selectedImageIndex + 1} / {currentProduct.images.length}
                  </div>
                </div>

                {/* Thumbnails Row */}
                {currentProduct.images.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {currentProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative size-20 sm:size-24 rounded-2xl overflow-hidden border-2 bg-stone-100 transition shrink-0 cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-orange-700 ring-2 ring-orange-700/20"
                            : "border-stone-200/80 hover:border-gray-400 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${currentProduct.name} view ${idx + 1}`}
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
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <Link
                      to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                      className="font-bold text-orange-700 uppercase tracking-widest hover:underline"
                    >
                      {currentProduct.category}
                    </Link>
                    {currentProduct.sku && (
                      <span className="font-mono text-gray-400">SKU: {currentProduct.sku}</span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                    {currentProduct.name}
                  </h1>

                  {/* Rating & Review Summary */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarSolidIcon key={i} className="size-4 text-amber-500 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {currentProduct.rating}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({currentProduct.reviewCount} customer reviews)
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ৳{currentProduct.price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-base text-gray-400 line-through">
                        ৳{currentProduct.originalPrice?.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                        Save {discountPercent}%
                      </span>
                    </>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentProduct.description}
                </p>

                {/* Color Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">
                      Color:{" "}
                      <span className="font-normal text-orange-700">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentProduct.colors.map((color) => {
                      const isSelected = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`group relative flex items-center gap-2 p-1.5 rounded-full border transition cursor-pointer ${
                            isSelected
                              ? "border-orange-700 ring-2 ring-orange-700/20 bg-orange-50/50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          title={color.name}
                        >
                          <span
                            className="size-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-xs font-medium text-gray-700 pr-2">
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">
                      Select Size:{" "}
                      <span className="font-normal text-orange-700">{selectedSize}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(!sizeGuideOpen)}
                      className="text-xs font-semibold text-orange-700 hover:underline cursor-pointer"
                    >
                      Size Guide &amp; Measurements
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
                              ? "bg-stone-900 text-white shadow-md"
                              : "bg-white text-gray-800 border border-stone-200/90 hover:border-orange-500 hover:text-orange-700"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {/* Size Guide Accordion Helper */}
                  {sizeGuideOpen && (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 animate-in fade-in-50 duration-200">
                      <p className="font-bold text-gray-900">
                        Bangladesh Fit &amp; Measurements (Inches):
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center border-t border-stone-200/60 pt-2 font-mono">
                        <div>
                          <span className="block text-gray-400">Size</span>
                          <span className="font-bold">S / 38</span>
                          <span className="font-bold">M / 40</span>
                          <span className="font-bold">L / 42</span>
                          <span className="font-bold">XL / 44</span>
                        </div>
                        <div>
                          <span className="block text-gray-400">Chest</span>
                          <span>39.5&quot;</span>
                          <span>41.5&quot;</span>
                          <span>43.5&quot;</span>
                          <span>45.5&quot;</span>
                        </div>
                        <div>
                          <span className="block text-gray-400">Shoulder</span>
                          <span>17.5&quot;</span>
                          <span>18.2&quot;</span>
                          <span>19.0&quot;</span>
                          <span>19.8&quot;</span>
                        </div>
                        <div>
                          <span className="block text-gray-400">Length</span>
                          <span>28.0&quot;</span>
                          <span>29.0&quot;</span>
                          <span>30.0&quot;</span>
                          <span>30.5&quot;</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 pt-1">
                        Unsure about your size? We offer a 7-day hassle-free size exchange anywhere
                        in Bangladesh.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity and Add to Bag */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-3.5 py-3 text-gray-600 hover:bg-stone-50 disabled:opacity-30 rounded-l-xl transition cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-3 text-xs font-bold text-gray-900 min-w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-3 text-gray-600 hover:bg-stone-50 rounded-r-xl transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Primary Add to Bag Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBagIcon className="size-5" />
                      <span>
                        Add to Shopping Bag • ৳{(currentProduct.price * quantity).toLocaleString()}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Stock & Delivery Promise */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock — Ready to Dispatch from Dhaka Studio</span>
                  </div>
                  <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                    Orders in Dhaka metropolitan area are delivered within 24 to 48 hours. Orders
                    across all other 63 districts arrive within 2 to 4 business days.
                  </p>
                </div>

                {/* Fedoll Customer Guarantees List */}
                <div className="border-t border-stone-200/80 pt-4 space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <TruckIcon className="size-4 text-orange-700 shrink-0" />
                    <span>Cash on Delivery &amp; bKash / Nagad available in 64 districts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ArrowPathRoundedSquareIcon className="size-4 text-orange-700 shrink-0" />
                    <span>7-Day Easy Size &amp; Fit Exchange guarantee</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <BuildingStorefrontIcon className="size-4 text-orange-700 shrink-0" />
                    <span>Try it on in person at our Banani / Gulshan studio in Dhaka</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Product Specifications Accordion */}
        <section className="py-12 bg-stone-50 border-y border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
              Garment Specifications &amp; Care
            </h2>

            <Accordion className="space-y-4">
              <AccordionItem className="rounded-2xl border border-stone-200/80 bg-white p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 hover:text-orange-700 py-2">
                  Garment Details &amp; Craftsmanship
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pt-2">
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

              <AccordionItem className="rounded-2xl border border-stone-200/80 bg-white p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 hover:text-orange-700 py-2">
                  Fabric &amp; Material
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pt-2">
                  <p>
                    <strong className="text-gray-900">Material Composition:</strong>{" "}
                    {currentProduct.material || "100% Pure Combed Natural Cotton"}
                  </p>
                  <p className="mt-2">
                    <strong className="text-gray-900">Fit Silhouette:</strong>{" "}
                    {currentProduct.fit || "Standard relaxed everyday fit designed for comfort"}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="rounded-2xl border border-stone-200/80 bg-white p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 hover:text-orange-700 py-2">
                  Washing &amp; Care Guidelines
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pt-2">
                  <p>
                    {currentProduct.care ||
                      "Machine wash in cold water with similar colors. Do not bleach. Hang dry in shade to preserve fabric softness and color depth."}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="rounded-2xl border border-stone-200/80 bg-white p-3 sm:p-4">
                <AccordionTrigger className="text-base font-bold text-gray-900 hover:text-orange-700 py-2">
                  Delivery &amp; Exchange Policy in Bangladesh
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 leading-relaxed pt-2">
                  <p>
                    We deliver to all 64 districts in Bangladesh with reliable courier partners. If
                    you need a different size, simply reach out to our WhatsApp care team within 7
                    days of receiving your package. We will dispatch the replacement promptly.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
                    Complete Your Outfit
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                    More in {currentProduct.category}
                  </h3>
                </div>
                <Link
                  to={`/products?category=${encodeURIComponent(currentProduct.category)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
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
                    className="group flex flex-col rounded-2xl bg-white border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-lg transition-all"
                  >
                    <div className="aspect-4/5 overflow-hidden bg-stone-100">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                          {p.category}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition line-clamp-1 mt-0.5">
                          {p.name}
                        </h4>
                      </div>
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-sm font-bold text-gray-900">
                          ৳{p.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-orange-700 font-semibold group-hover:underline">
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

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
