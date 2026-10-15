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
} from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { setQuickViewProduct } from "~/redux/features/homeSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import { toast } from "sonner";

export default function QuickViewModal() {
  const dispatch = useAppDispatch();
  const { quickViewProduct } = useAppSelector((state) => state.home);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Sync state when quickViewProduct changes
  React.useEffect(() => {
    if (quickViewProduct) {
      setSelectedSize(quickViewProduct.sizes[0] || "M");
      setSelectedColor(quickViewProduct.colors[0]?.name || "Standard");
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: quickViewProduct.id,
        name: quickViewProduct.name,
        price: quickViewProduct.price,
        image: quickViewProduct.images[0],
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: quickViewProduct.category,
      })
    );
    toast.success(`Added ${quickViewProduct.name} (${selectedSize}) to your bag!`);
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
              <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => dispatch(setQuickViewProduct(null))}
                  className="absolute right-4 top-4 z-20 size-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
                >
                  <XMarkIcon className="size-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
                  {/* Product Images Column */}
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-4/5 border border-gray-200">
                      <img
                        src={
                          quickViewProduct.images[activeImageIndex] ||
                          quickViewProduct.images[0]
                        }
                        alt={quickViewProduct.name}
                        className="w-full h-full object-cover"
                      />
                      {quickViewProduct.badge && (
                        <span className="absolute top-3 left-3 bg-orange-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          {quickViewProduct.badge}
                        </span>
                      )}
                    </div>

                    {/* Image Thumbnails */}
                    {quickViewProduct.images.length > 1 && (
                      <div className="flex gap-3">
                        {quickViewProduct.images.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveImageIndex(i)}
                            className={`size-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                              i === activeImageIndex
                                ? "border-orange-700 shadow-xs"
                                : "border-gray-200 hover:border-gray-400"
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
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                          {quickViewProduct.category}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1 leading-snug">
                          {quickViewProduct.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <StarIcon key={s} className="size-4 fill-current" />
                            ))}
                          </div>
                          <span className="font-bold text-gray-800">
                            {quickViewProduct.rating}
                          </span>
                          <span>•</span>
                          <span>{quickViewProduct.reviewCount} verified reviews</span>
                        </div>
                      </div>

                      {/* Pricing in BDT */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold text-gray-900">
                          ৳{quickViewProduct.price.toLocaleString()}
                        </span>
                        {quickViewProduct.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            ৳{quickViewProduct.originalPrice.toLocaleString()}
                          </span>
                        )}
                        {quickViewProduct.originalPrice && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            Save ৳
                            {(
                              quickViewProduct.originalPrice -
                              quickViewProduct.price
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        {quickViewProduct.description}
                      </p>

                      {/* Color Selector */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                          Color: <span className="font-normal text-gray-500">{selectedColor}</span>
                        </label>
                        <div className="flex gap-2.5">
                          {quickViewProduct.colors.map((c) => {
                            const isSelected = selectedColor === c.name;
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => setSelectedColor(c.name)}
                                className={`size-8 rounded-full border-2 flex items-center justify-center transition cursor-pointer ${
                                  isSelected
                                    ? "border-orange-700 ring-2 ring-orange-700/30"
                                    : "border-gray-300 hover:border-gray-500"
                                }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
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
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Size: <span className="font-normal text-gray-500">{selectedSize}</span>
                          </label>
                          <span className="text-[11px] text-orange-700 hover:underline cursor-pointer">
                            Size Guide
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedSize(s)}
                              className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                selectedSize === s
                                  ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-l-xl transition"
                          >
                            -
                          </button>
                          <span className="px-3 text-sm font-bold text-gray-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-r-xl transition"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="flex-1 py-3.5 px-6 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBagIcon className="size-4" />
                          <span>Add to Shopping Bag • ৳{(quickViewProduct.price * quantity).toLocaleString()}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-6 text-[11px] text-gray-500 pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheckIcon className="size-4 text-emerald-600" />
                          Cash on Delivery & bKash Available
                        </span>
                        <span>•</span>
                        <span>7-Day Easy Exchange in Bangladesh</span>
                      </div>

                      <div className="pt-2 text-center">
                        <Link
                          to={`/products/${quickViewProduct.id}`}
                          onClick={() => dispatch(setQuickViewProduct(null))}
                          className="text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline transition"
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
