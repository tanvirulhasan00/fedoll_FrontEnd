import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TruckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  BanknotesIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { clearCart, closeCart } from "~/redux/features/cart/cartSlice";
import { updateUserProfile } from "~/redux/features/auth/authSlice";
import {
  createOrderInFirestore,
  updateUserProfileInFirestore,
  type Order,
  type PaymentMethod,
} from "~/firebase";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import { AuthModal } from "../Auth/AuthModal";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  finalTotal: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  discountAmount,
  shippingCost,
  finalTotal,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { items, totalQuantity } = useAppSelector((state) => state.cart);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">("signup");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [district, setDistrict] = useState("Dhaka");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setFullName(user.displayName || "");
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
      if (user.deliveryAddress) {
        if (user.deliveryAddress.street) setStreetAddress(user.deliveryAddress.street);
        if (user.deliveryAddress.city) setCity(user.deliveryAddress.city);
        if (user.deliveryAddress.district) setDistrict(user.deliveryAddress.district);
      }
    }
  }, [user, isOpen]);

  const handleOpenAuth = (tab: "login" | "signup") => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict role check: Only registered customers can order
    if (!isAuthenticated || !user) {
      toast.error("Role-Based Shopping: Only registered customers can place an order.");
      handleOpenAuth("signup");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Please enter the recipient full name.");
      return;
    }

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid mobile phone number for courier delivery.");
      return;
    }

    if (!streetAddress.trim()) {
      toast.error("Please enter complete delivery street address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrderInFirestore({
        userId: user.uid,
        customerName: fullName.trim(),
        customerEmail: user.email || "",
        customerPhone: cleanPhone,
        shippingAddress: {
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          district: district.trim(),
          notes: deliveryNotes.trim() || undefined,
        },
        items,
        totalQuantity,
        subtotal,
        discount: discountAmount,
        shippingFee: shippingCost,
        totalAmount: finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        notes: deliveryNotes.trim(),
      });

      // Save as default in customer profile if requested
      if (saveAsDefault && user.uid) {
        const addressData = {
          street: streetAddress.trim(),
          city: city.trim(),
          district: district.trim(),
        };
        try {
          await updateUserProfileInFirestore(user.uid, {
            phoneNumber: cleanPhone,
            displayName: fullName.trim(),
            deliveryAddress: addressData,
          });
          dispatch(
            updateUserProfile({
              phoneNumber: cleanPhone,
              displayName: fullName.trim(),
              deliveryAddress: addressData,
            })
          );
        } catch (profileErr) {
          console.warn("Could not save address to profile:", profileErr);
        }
      }

      // Order created successfully!
      setCompletedOrder(order);
      dispatch(clearCart());
      toast.success(`🎉 Order #${order.orderNumber} successfully placed!`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Tracking number copied to clipboard!");
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setCompletedOrder(null);
    onClose();
  };

  return (
    <>
      <Transition show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 font-sans" onClose={handleModalClose}>
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

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 md:p-8 text-left align-middle shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-neutral-100">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                        <TruckIcon className="size-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          {completedOrder ? "Order Confirmed!" : "Checkout & Courier Dispatch"}
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {completedOrder
                            ? "Your items have been received at our Dhaka atelier."
                            : "Express delivery across all 64 districts in Bangladesh"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* SUCCESS STATE */}
                  {completedOrder ? (
                    <div className="py-6 space-y-6 text-center">
                      <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30 animate-bounce">
                        <CheckCircleIcon className="size-10" />
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                          <ShieldCheckIcon className="size-4" /> Registered Customer Order Confirmed
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white pt-2">
                          Thank You, {completedOrder.customerName}!
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
                          We’ve sent a confirmation to{" "}
                          <strong className="text-gray-900 dark:text-white">
                            {completedOrder.customerEmail}
                          </strong>
                          . Our team in Dhaka is preparing your package.
                        </p>
                      </div>

                      {/* Order Details Card */}
                      <div className="p-5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 text-left space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800">
                          <div>
                            <span className="text-gray-500 dark:text-neutral-400 text-[11px]">
                              Order Number:
                            </span>
                            <p className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                              {completedOrder.orderNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 dark:text-neutral-400 text-[11px]">
                              Courier Tracking Code:
                            </span>
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="font-bold text-sm text-orange-600 dark:text-orange-400 font-mono">
                                {completedOrder.trackingNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTracking(completedOrder.trackingNumber)}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200"
                                title="Copy tracking number"
                              >
                                <DocumentDuplicateIcon className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 dark:text-neutral-400 block text-[11px]">
                              Delivery Address:
                            </span>
                            <p className="font-semibold text-gray-800 dark:text-neutral-200">
                              {completedOrder.shippingAddress.streetAddress},{" "}
                              {completedOrder.shippingAddress.city},{" "}
                              {completedOrder.shippingAddress.district}
                            </p>
                            <p className="text-gray-500 dark:text-neutral-400">
                              Phone: {completedOrder.shippingAddress.phoneNumber}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-neutral-400 block text-[11px]">
                              Estimated Delivery:
                            </span>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {completedOrder.estimatedDeliveryDate}
                            </p>
                            <p className="text-gray-500 dark:text-neutral-400">
                              Via: {completedOrder.courierName}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-600 dark:text-neutral-400">
                            Total Paid / COD Amount:
                          </span>
                          <span className="font-bold text-base text-gray-900 dark:text-white">
                            ৳{completedOrder.totalAmount.toLocaleString()} ({completedOrder.paymentMethod.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleModalClose();
                            dispatch(closeCart());
                            navigate(`/profile?tab=orders&tracking=${completedOrder.orderNumber}`);
                          }}
                          className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          <span>Track Order in Profile</span>
                          <ArrowRightIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleModalClose();
                            dispatch(closeCart());
                            navigate("/products");
                          }}
                          className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 hover:bg-stone-50 dark:hover:bg-neutral-800 font-semibold text-xs cursor-pointer transition"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CHECKOUT FORM */
                    <div className="mt-4 space-y-6">
                      {/* ROLE-BASED ACCESS NOTICE */}
                      {!isAuthenticated || !user ? (
                        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center space-y-4">
                          <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                            <LockClosedIcon className="size-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">
                              Registered Customer Account Required
                            </h4>
                            <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80 max-w-md mx-auto leading-relaxed">
                              Fedoll operates a role-based shopping system. Only registered customers
                              can place orders and access express courier dispatch, live doorstep tracking,
                              and order warranties.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAuth("signup")}
                              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm cursor-pointer transition"
                            >
                              Create Customer Account
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAuth("login")}
                              className="px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold text-xs hover:bg-amber-100/50 cursor-pointer transition"
                            >
                              Log In to Existing Account
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Authenticated Customer Form */
                        <form onSubmit={handlePlaceOrder} className="space-y-6">
                          {/* Registered Customer Header Tag */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300">
                            <div className="flex items-center gap-2">
                              <ShieldCheckIcon className="size-4 text-emerald-600" />
                              <span>
                                Ordering as:{" "}
                                <strong className="font-bold">
                                  {user.displayName || user.email}
                                </strong>
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-[10px] font-bold uppercase tracking-wider">
                              {user.role || "Customer"} Role Verified
                            </span>
                          </div>

                          {/* Section 1: Delivery Details */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <MapPinIcon className="size-4 text-orange-600" />
                              <span>1. Delivery & Contact Details</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                  Recipient Full Name *
                                </label>
                                <div className="relative">
                                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                  <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Tanvirul Hasan"
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                  Mobile Phone Number *
                                </label>
                                <div className="relative">
                                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                  <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="e.g. 01712345678"
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                Street Address / House / Road / Apartment *
                              </label>
                              <input
                                type="text"
                                required
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                placeholder="House #12, Road #4, Sector #3, Uttara"
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                  District / City *
                                </label>
                                <select
                                  value={district}
                                  onChange={(e) => {
                                    setDistrict(e.target.value);
                                    setCity(e.target.value);
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                                >
                                  <option value="Dhaka">Dhaka (24-Hour Express)</option>
                                  <option value="Chattogram">Chattogram</option>
                                  <option value="Sylhet">Sylhet</option>
                                  <option value="Rajshahi">Rajshahi</option>
                                  <option value="Khulna">Khulna</option>
                                  <option value="Barishal">Barishal</option>
                                  <option value="Rangpur">Rangpur</option>
                                  <option value="Mymensingh">Mymensingh</option>
                                  <option value="Gazipur">Gazipur</option>
                                  <option value="Narayanganj">Narayanganj</option>
                                  <option value="Other District">Other of 64 Districts</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                                  Delivery Instructions (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={deliveryNotes}
                                  onChange={(e) => setDeliveryNotes(e.target.value)}
                                  placeholder="Call before arrival / Leave with concierge"
                                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2 pt-1 text-xs text-gray-600 dark:text-neutral-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveAsDefault}
                                onChange={(e) => setSaveAsDefault(e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span>Save this address in my Fedoll Customer Profile</span>
                            </label>
                          </div>

                          {/* Section 2: Payment Method */}
                          <div className="space-y-3.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <BanknotesIcon className="size-4 text-orange-600" />
                              <span>2. Payment Option</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {/* Cash on Delivery */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("cod")}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                  paymentMethod === "cod"
                                    ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                                    : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="font-bold text-xs">Cash on Delivery</span>
                                  <span className="size-2 rounded-full bg-emerald-500" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-tight">
                                  Pay cash to courier when receiving parcel.
                                </p>
                              </button>

                              {/* bKash / Nagad */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("bkash")}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                  paymentMethod === "bkash"
                                    ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                                    : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="font-bold text-xs">bKash / Nagad</span>
                                  <span className="text-[10px] text-pink-600 font-bold">Instant</span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-tight">
                                  Mobile banking instant online transfer.
                                </p>
                              </button>

                              {/* Card Payment */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("card")}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                  paymentMethod === "card"
                                    ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                                    : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="font-bold text-xs">Credit/Debit Card</span>
                                  <CreditCardIcon className="size-3.5 text-blue-600" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-tight">
                                  Visa, Mastercard, AMEX secure checkout.
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* Section 3: Summary & Place Order */}
                          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 space-y-2 text-xs">
                            <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                              <span>Subtotal ({totalQuantity} items)</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                ৳{subtotal.toLocaleString()}
                              </span>
                            </div>
                            {discountAmount > 0 && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Promo Discount</span>
                                <span>-৳{discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                              <span>Nationwide Courier Delivery</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {shippingCost === 0 ? "FREE" : `৳${shippingCost}`}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                              <span>Total Amount to Pay</span>
                              <span className="text-lg text-orange-600 dark:text-orange-400">
                                ৳{finalTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Submit Order Button */}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner className="size-4 text-white" />
                                <span>Securing Order & Generating Tracking...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheckIcon className="size-5" />
                                <span>
                                  Confirm Order • ৳{finalTotal.toLocaleString()}
                                </span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Auth Modal Trigger for unauthenticated guests */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />
    </>
  );
};

export default CheckoutModal;
