import React, { useState } from "react";
import { Link } from "react-router";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PlusIcon,
  MinusIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  closeCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from "~/redux/features/cart/cartSlice";
import { toast } from "sonner";

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const { items, totalQuantity, totalAmount, isCartOpen } = useAppSelector(
    (state) => state.cart
  );

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  // Free shipping threshold in BDT
  const freeShippingThreshold = 2500;
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - totalAmount
  );
  const shippingProgress = Math.min(
    100,
    (totalAmount / freeShippingThreshold) * 100
  );

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "FEDOLL2026") {
      setDiscountPercent(15);
      toast.success("Promo code applied! 15% discount activated.");
    } else if (promoCode.trim().toUpperCase() === "WELCOME10") {
      setDiscountPercent(10);
      toast.success("Welcome discount applied! 10% off.");
    } else {
      toast.error("Invalid discount code. Try FEDOLL2026");
    }
  };

  const discountAmount = Math.round((totalAmount * discountPercent) / 100);
  const shippingCost = remainingForFreeShipping === 0 ? 0 : 70;
  const finalTotal = Math.max(0, totalAmount - discountAmount + shippingCost);

  return (
    <Transition show={isCartOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-sans"
        onClose={() => dispatch(closeCart())}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={React.Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBagIcon className="size-6 text-orange-700" />
                      <DialogTitle className="text-lg font-bold text-gray-900">
                        Shopping Bag ({totalQuantity})
                      </DialogTitle>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch(closeCart())}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Free Shipping Progress Indicator (in BDT) */}
                  <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200/80">
                    <div className="flex items-center justify-between text-xs text-gray-700 mb-1.5 font-medium">
                      <span>
                        {remainingForFreeShipping === 0 ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <SparklesIcon className="size-3.5" /> Free Courier Delivery in Bangladesh unlocked!
                          </span>
                        ) : (
                          <>
                            Add{" "}
                            <strong className="text-orange-700">
                              ৳{remainingForFreeShipping.toLocaleString()}
                            </strong>{" "}
                            more for Free Delivery
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {Math.round(shippingProgress)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-700 rounded-full transition-all duration-500"
                        style={{ width: `${shippingProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                      <div className="py-20 text-center">
                        <div className="size-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-4">
                          <ShoppingBagIcon className="size-8" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900">
                          Your shopping bag is empty
                        </h4>
                        <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
                          Check out our new jackets, selvedge denim jeans, and comfortable office wear.
                        </p>
                        <button
                          type="button"
                          onClick={() => dispatch(closeCart())}
                          className="mt-6 px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-black transition cursor-pointer"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    ) : (
                      items.map((item, index) => (
                        <div
                          key={`${item.id}-${item.size}-${item.color}-${index}`}
                          className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                        >
                          <div className="size-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-gray-200">
                            <img
                              src={
                                item.image ||
                                "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=200&q=80"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                                  {item.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(removeFromCart(item.id))
                                  }
                                  className="text-gray-400 hover:text-rose-600 transition"
                                  title="Remove item"
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                              </div>

                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                {item.size && (
                                  <span>
                                    Size: <strong>{item.size}</strong>
                                  </span>
                                )}
                                {item.color && (
                                  <span>
                                    Color: <strong>{item.color}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-gray-200 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(
                                      updateQuantity({
                                        id: item.id,
                                        quantity: item.quantity - 1,
                                      })
                                    )
                                  }
                                  className="size-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition"
                                >
                                  <MinusIcon className="size-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(
                                      updateQuantity({
                                        id: item.id,
                                        quantity: item.quantity + 1,
                                      })
                                    )
                                  }
                                  className="size-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition"
                                >
                                  <PlusIcon className="size-3" />
                                </button>
                              </div>

                              <span className="text-sm font-bold text-gray-900">
                                ৳{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Drawer Footer & Checkout */}
                  {items.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-stone-50/60 space-y-4">
                      {/* Promo Code Input */}
                      <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <div className="relative flex-1">
                          <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Discount code (FEDOLL2026)"
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-orange-600"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Apply
                        </button>
                      </form>

                      {/* Financial Totals in BDT */}
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold text-gray-900">
                            ৳{totalAmount.toLocaleString()}
                          </span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Discount ({discountPercent}%)</span>
                            <span>-৳{discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Courier Delivery (Bangladesh)</span>
                          <span className="font-semibold text-gray-900">
                            {remainingForFreeShipping === 0 ? "FREE" : "৳70 (Dhaka) / ৳130"}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                          <span>Total to Pay</span>
                          <span className="text-base text-orange-700">
                            ৳{finalTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Checkout Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            toast.success("Proceeding to Cash on Delivery / bKash checkout!");
                            dispatch(closeCart());
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Order with Cash on Delivery / bKash</span>
                          <ArrowRightIcon className="size-4" />
                        </button>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                          <span className="flex items-center gap-1">
                            <ShieldCheckIcon className="size-3.5 text-emerald-600" />
                            Cash on Delivery & bKash Supported
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(clearCart());
                              toast.info("Cart cleared.");
                            }}
                            className="text-gray-400 hover:text-gray-700 underline"
                          >
                            Clear Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
