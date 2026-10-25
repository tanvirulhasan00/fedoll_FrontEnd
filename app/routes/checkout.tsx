import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/checkout";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { clearCart, openCart } from "~/redux/features/cart/cartSlice";
import { updateUserProfile, setUser } from "~/redux/features/auth/authSlice";
import {
  createOrderInFirestore,
  updateUserProfileInFirestore,
  fetchShippingSettings,
  fetchCouponsFromFirestore,
  loginWithEmail,
  registerWithEmail,
  signInWithGoogle,
  syncUserToFirestore,
  formatAuthError,
  type Order,
  type PaymentMethod,
  type ShippingSettings,
  type CouponItem,
  defaultShippingSettings,
} from "~/firebase";
import {
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
  ShoppingBagIcon,
  TagIcon,
  PrinterIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Secure Checkout & Courier Dispatch | SilkenDrift Atelier" },
    {
      name: "description",
      content:
        "Complete your handcrafted apparel order with nationwide express courier delivery and Cash on Delivery across all 64 districts in Bangladesh.",
    },
  ];
}

const BANGLADESH_DISTRICTS = [
  "Dhaka",
  "Gazipur",
  "Narayanganj",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Bogura",
  "Cox's Bazar",
  "Jessore",
  "Kushtia",
  "Tangail",
  "Dinajpur",
  "Feni",
  "Noakhali",
  "Brahmanbaria",
  "Pabna",
  "Jamalpur",
  "Faridpur",
  "Other District",
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { items, totalQuantity, totalAmount } = useAppSelector(
    (state) => state.cart
  );

  // Dynamic Shipping & Coupon Settings
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [cityThana, setCityThana] = useState("Uttara");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Inline Auth Form (for unauthenticated guests)
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authRememberMe, setAuthRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Order Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Check for remembered email from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const remembered = localStorage.getItem("fedoll_remembered_email");
      if (remembered) {
        setAuthEmail(remembered);
        setAuthRememberMe(true);
      }
    }
  }, []);

  // Load Shipping and Coupon settings from Firestore
  useEffect(() => {
    async function loadLogisticsData() {
      try {
        const [shipSettings, availableCoupons] = await Promise.all([
          fetchShippingSettings(),
          fetchCouponsFromFirestore(),
        ]);
        if (shipSettings) setShippingSettings(shipSettings);
        if (availableCoupons) setCoupons(availableCoupons);
      } catch (err) {
        console.warn("Error fetching checkout logistics:", err);
      }
    }
    loadLogisticsData();
  }, []);

  // Pre-fill fields when customer profile loads
  useEffect(() => {
    if (user) {
      if (user.displayName) setFullName(user.displayName);
      if (user.email) setEmailAddress(user.email);
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
      if (user.deliveryAddress) {
        if (user.deliveryAddress.street) setStreetAddress(user.deliveryAddress.street);
        if (user.deliveryAddress.district) setDistrict(user.deliveryAddress.district);
        if (user.deliveryAddress.city) setCityThana(user.deliveryAddress.city);
      }
    }
  }, [user]);

  // Calculations
  const isInsideDhaka = useMemo(() => {
    return district.toLowerCase().includes("dhaka") || cityThana.toLowerCase().includes("dhaka");
  }, [district, cityThana]);

  const baseDeliveryFee = useMemo(() => {
    return isInsideDhaka
      ? shippingSettings.standardInsideDhaka || 70
      : shippingSettings.standardOutsideDhaka || 130;
  }, [isInsideDhaka, shippingSettings]);

  // Coupon Discounts: Handles Free Delivery, Custom Delivery Discount (৳), Percentage Off, and Fixed Off
  const { orderDiscount, shippingDiscount, isCouponFreeDelivery } = useMemo(() => {
    if (!appliedCoupon) {
      return { orderDiscount: 0, shippingDiscount: 0, isCouponFreeDelivery: false };
    }

    if (appliedCoupon.discountType === "free_shipping") {
      return {
        orderDiscount: 0,
        shippingDiscount: baseDeliveryFee,
        isCouponFreeDelivery: true,
      };
    }

    if (appliedCoupon.discountType === "shipping_discount") {
      const discount = Math.min(baseDeliveryFee, appliedCoupon.discountAmount || 0);
      return {
        orderDiscount: 0,
        shippingDiscount: discount,
        isCouponFreeDelivery: discount >= baseDeliveryFee,
      };
    }

    if (appliedCoupon.discountType === "fixed_amount") {
      const discount = Math.min(totalAmount, appliedCoupon.discountAmount || 0);
      return {
        orderDiscount: discount,
        shippingDiscount: 0,
        isCouponFreeDelivery: false,
      };
    }

    // Default: percentage
    const percent = appliedCoupon.discountPercent || 0;
    const discount = Math.round((totalAmount * percent) / 100);
    return {
      orderDiscount: discount,
      shippingDiscount: 0,
      isCouponFreeDelivery: false,
    };
  }, [appliedCoupon, baseDeliveryFee, totalAmount]);

  const standardDeliveryFee = Math.max(0, baseDeliveryFee - shippingDiscount);
  const discountAmount = orderDiscount;

  const finalTotalAmount = Math.max(
    0,
    totalAmount - discountAmount + standardDeliveryFee
  );

  // Handle Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a voucher / promo code.");
      return;
    }

    setApplyingCoupon(true);
    setTimeout(() => {
      // 1. Check live Firestore coupons
      const match = coupons.find(
        (c) => c.code.toUpperCase() === cleanCode && c.active
      );

      if (match) {
        if (match.minSpend && totalAmount < match.minSpend) {
          toast.error(
            `Coupon "${cleanCode}" requires a minimum spend of ৳${match.minSpend.toLocaleString()}.`
          );
          setApplyingCoupon(false);
          return;
        }
        setAppliedCoupon(match);
        if (match.discountType === "free_shipping") {
          toast.success(`🎉 Voucher "${cleanCode}" applied! 100% Free Courier Delivery activated.`);
        } else if (match.discountType === "shipping_discount") {
          toast.success(`🎉 Voucher "${cleanCode}" applied! ৳${match.discountAmount} off delivery charges.`);
        } else if (match.discountType === "fixed_amount") {
          toast.success(`🎉 Voucher "${cleanCode}" applied! ৳${match.discountAmount} discount activated.`);
        } else {
          toast.success(`🎉 Voucher "${cleanCode}" applied! ${match.discountPercent}% discount activated.`);
        }
        setPromoCodeInput("");
        setApplyingCoupon(false);
        return;
      }

      // 2. Predefined fallback codes
      if (cleanCode === "FREEDELIVERY") {
        setAppliedCoupon({
          id: "coup-free-delivery",
          code: "FREEDELIVERY",
          discountType: "free_shipping",
          discountPercent: 0,
          discountAmount: 0,
          minSpend: 0,
          description: "100% Free Courier Delivery nationwide",
          active: true,
          usedCount: 0,
          expiresAt: "2026-12-31",
        });
        toast.success("🎉 FREEDELIVERY applied! 100% Free Courier Delivery activated.");
        setPromoCodeInput("");
      } else if (cleanCode === "SHIP50") {
        setAppliedCoupon({
          id: "coup-ship-50",
          code: "SHIP50",
          discountType: "shipping_discount",
          discountPercent: 0,
          discountAmount: 50,
          minSpend: 0,
          description: "৳50 off courier delivery charges",
          active: true,
          usedCount: 0,
          expiresAt: "2026-12-31",
        });
        toast.success("🎉 SHIP50 applied! ৳50 off delivery charges.");
        setPromoCodeInput("");
      } else if (cleanCode === "SILKENDRIFT2026") {
        setAppliedCoupon({
          id: "fedoll-2026",
          code: "SILKENDRIFT2026",
          discountType: "percentage",
          discountPercent: 15,
          discountAmount: 0,
          minSpend: 1500,
          description: "15% off seasonal discount",
          active: true,
          usedCount: 0,
          expiresAt: "2026-12-31",
        });
        toast.success("🎉 SILKENDRIFT2026 applied! 15% discount activated.");
        setPromoCodeInput("");
      } else if (cleanCode === "WELCOME10") {
        setAppliedCoupon({
          id: "welcome-10",
          code: "WELCOME10",
          discountType: "percentage",
          discountPercent: 10,
          discountAmount: 0,
          minSpend: 1000,
          description: "10% Welcome discount",
          active: true,
          usedCount: 0,
          expiresAt: "2026-12-31",
        });
        toast.success("🎉 WELCOME10 applied! 10% discount activated.");
        setPromoCodeInput("");
      } else {
        toast.error(`Invalid promo code "${cleanCode}". Try FREEDELIVERY, SHIP50, or SILKENDRIFT2026.`);
      }
      setApplyingCoupon(false);
    }, 300);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed.");
  };

  // Inline Sign-In Handler
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const userCredential = await loginWithEmail(
        authEmail.trim(),
        authPassword.trim(),
        authRememberMe
      );
      if (typeof window !== "undefined") {
        if (authRememberMe) {
          localStorage.setItem("fedoll_remembered_email", authEmail.trim());
        } else {
          localStorage.removeItem("fedoll_remembered_email");
        }
      }
      const profile = await syncUserToFirestore(userCredential.user);
      dispatch(
        setUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: profile.role,
          phoneNumber: profile.phoneNumber,
          deliveryAddress: profile.deliveryAddress,
        })
      );
      toast.success(`Welcome back, ${profile.displayName || profile.email}!`);
    } catch (err: unknown) {
      toast.error(formatAuthError(err) || "Failed to sign in.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Inline Sign-Up Handler
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
      toast.error("Please provide your name, email, and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const userCredential = await registerWithEmail(
        authEmail.trim(),
        authPassword.trim(),
        authName.trim()
      );
      const profile = await syncUserToFirestore(userCredential.user, {
        displayName: authName.trim(),
        phoneNumber: authPhone.trim() || undefined,
        role: "customer",
      });
      dispatch(
        setUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: profile.role,
          phoneNumber: profile.phoneNumber,
        })
      );
      toast.success(`🎉 Customer account created! Welcome, ${profile.displayName}.`);
    } catch (err: unknown) {
      toast.error(formatAuthError(err) || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Inline Google Sign-In Handler
  const handleInlineGoogle = async () => {
    setAuthLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      const profile = await syncUserToFirestore(userCredential.user, {
        role: "customer",
      });
      dispatch(
        setUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: profile.role,
          phoneNumber: profile.phoneNumber,
          deliveryAddress: profile.deliveryAddress,
        })
      );
      toast.success(`Signed in as ${profile.displayName}!`);
    } catch (err: unknown) {
      toast.error(formatAuthError(err) || "Google sign-in cancelled or failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Place Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict role check: registered customer required
    if (!isAuthenticated || !user) {
      toast.error("Role-Based Shopping: Please sign in or register as a customer to place your order.");
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    if (!fullName.trim()) {
      toast.error("Please enter the recipient full name.");
      return;
    }

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 11-digit mobile phone number for courier delivery.");
      return;
    }

    if (!streetAddress.trim()) {
      toast.error("Please enter the complete delivery street address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = await createOrderInFirestore({
        userId: user.uid,
        customerName: fullName.trim(),
        customerEmail: user.email || emailAddress.trim() || "",
        customerPhone: cleanPhone,
        shippingAddress: {
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          streetAddress: streetAddress.trim(),
          city: cityThana.trim() || district,
          district: district.trim(),
          notes: deliveryNotes.trim() || undefined,
        },
        items,
        totalQuantity,
        subtotal: totalAmount,
        discount: discountAmount,
        shippingFee: standardDeliveryFee,
        totalAmount: finalTotalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        notes: deliveryNotes.trim(),
      });

      // Save as default in customer profile if requested
      if (saveAsDefault && user.uid) {
        const addressData = {
          street: streetAddress.trim(),
          city: cityThana.trim() || district,
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

      setCompletedOrder(newOrder);
      dispatch(clearCart());
      toast.success(`🎉 Order #${newOrder.orderNumber} placed successfully!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-neutral-950 font-sans text-gray-900 dark:text-neutral-100 flex flex-col selection:bg-orange-500/20 selection:text-orange-900">
      <Topbar />
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Stepper Navigation */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-neutral-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
                <TruckIcon className="size-4" />
                <span>SilkenDrift Nationwide Atelier Logistics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {completedOrder ? "Order Receipt & Doorstep Dispatch" : "Dedicated Express Checkout"}
              </h1>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Bag</span>
              </span>
              <span className="text-gray-300 dark:text-neutral-700">──</span>
              <span
                className={`flex items-center gap-1.5 ${
                  completedOrder
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-orange-600 dark:text-orange-400 font-bold"
                }`}
              >
                <span className="size-5 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[10px] font-bold text-orange-600">
                  {completedOrder ? "✓" : "2"}
                </span>
                <span>Checkout</span>
              </span>
              <span className="text-gray-300 dark:text-neutral-700">──</span>
              <span
                className={`flex items-center gap-1.5 ${
                  completedOrder
                    ? "text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-400 dark:text-neutral-500"
                }`}
              >
                <span className="size-5 rounded-full bg-stone-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <span>Confirmed</span>
              </span>
            </div>
          </div>

          {/* ======================================================================
              STATE 1: ORDER CONFIRMED RECEIPT SCREEN
              ====================================================================== */}
          {completedOrder ? (
            <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xl p-6 sm:p-10 space-y-8">
              <div className="text-center space-y-4">
                <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30 animate-bounce">
                  <CheckCircleIcon className="size-12" />
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheckIcon className="size-4" /> Official Registered Customer Order Confirmed
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white pt-2">
                    Thank You, {completedOrder.customerName}!
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-lg mx-auto">
                    We’ve received your order at our Dhaka atelier. A confirmation copy has been sent to{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {completedOrder.customerEmail}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Order Info Badge Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 text-xs">
                <div>
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider block">
                    Order Number
                  </span>
                  <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                    {completedOrder.orderNumber}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider block">
                    Courier Consignment Tracking ID
                  </span>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="font-mono font-bold text-base text-orange-600 dark:text-orange-400">
                      {completedOrder.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyTracking(completedOrder.trackingNumber)}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      title="Copy tracking code"
                    >
                      <DocumentDuplicateIcon className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-neutral-800">
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider block">
                    Delivery Address
                  </span>
                  <p className="font-semibold text-gray-800 dark:text-neutral-200 mt-0.5">
                    {completedOrder.shippingAddress.streetAddress},{" "}
                    {completedOrder.shippingAddress.city},{" "}
                    {completedOrder.shippingAddress.district}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Phone: {completedOrder.shippingAddress.phoneNumber}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-neutral-800 sm:text-right">
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider block">
                    Estimated Doorstep Delivery
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                    {completedOrder.estimatedDeliveryDate}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    {completedOrder.courierName &&
                    completedOrder.courierName !== "Pending Assignment" &&
                    completedOrder.courierName !== "Unassigned" ? (
                      <span className="text-gray-600 dark:text-neutral-300">
                        Courier:{" "}
                        <strong className="text-gray-900 dark:text-white">
                          {completedOrder.courierName}
                        </strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Courier: Assigned after atelier packing
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Items Purchased List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Garments in this Package ({completedOrder.totalQuantity} items)
                </h3>
                <div className="divide-y divide-stone-100 dark:divide-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-800 p-2">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 gap-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-12 rounded-xl object-cover shrink-0 ring-1 ring-stone-200 dark:ring-neutral-700"
                          />
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            Size: {item.size || "Standard"} • Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">
                    ৳{completedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">-৳{completedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                  <span>
                    Delivery (
                    {completedOrder.shippingAddress.district
                      .toLowerCase()
                      .includes("dhaka") ||
                    completedOrder.shippingAddress.city
                      .toLowerCase()
                      .includes("dhaka")
                      ? "Inside Dhaka"
                      : "Outside Dhaka"}
                    )
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">
                    {completedOrder.shippingFee === 0 ? "FREE" : `৳${completedOrder.shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-neutral-800 flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                  <span>Total Amount Paid / COD</span>
                  <span className="text-lg text-orange-600 dark:text-orange-400 font-mono">
                    ৳{completedOrder.totalAmount.toLocaleString()} ({completedOrder.paymentMethod.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Cancellation Policy Advisory Warning */}
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <ExclamationTriangleIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      Order Cancellation Advisory
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-[10px] font-bold text-amber-900 dark:text-amber-200">
                      Must Cancel Before Shipped
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    You can cancel this order only while it is in <strong>Placed</strong>, <strong>Confirmed</strong>, or <strong>Processing</strong> status. Once your package reaches <strong>Shipped</strong> status and is handed over to the courier partner, cancellation is strictly closed. If you need to make changes or cancel, please do so promptly from your{" "}
                    <Link
                      to="/profile?tab=orders"
                      className="font-bold underline text-amber-950 dark:text-amber-100 hover:text-orange-600"
                    >
                      Customer Profile Orders
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  to={`/track-order?tracking=${completedOrder.orderNumber}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer text-center"
                >
                  <TruckIcon className="size-4" />
                  <span>Track Courier Live</span>
                </Link>

                <Link
                  to="/profile?tab=orders"
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold text-xs transition cursor-pointer text-center"
                >
                  <span>View in My Customer Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PrinterIcon className="size-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* ======================================================================
               STATE 2: EMPTY SHOPPING BAG GUARD
               ====================================================================== */
            <div className="max-w-lg mx-auto py-16 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-8 shadow-sm">
              <div className="size-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mx-auto">
                <ShoppingBagIcon className="size-8" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Before proceeding to checkout, choose your desired garments from our curated collections.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <span>Explore Garment Collections</span>
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          ) : (
            /* ======================================================================
               STATE 3: DEDICATED CHECKOUT MAIN FORM & ORDER SUMMARY
               ====================================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: CHECKOUT DETAILS & FORMS (7 COLS) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. ROLE-BASED ACCESS & ACCOUNT CARD */}
                {!isAuthenticated || !user ? (
                  <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <LockClosedIcon className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">
                          Registered Customer Account Required
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                          SilkenDrift operates a role-based shopping system. Only verified customer accounts can
                          place orders and receive express courier dispatch with doorstep tracking.
                        </p>
                      </div>
                    </div>

                    {/* Quick Google Sign-In */}
                    <button
                      type="button"
                      onClick={handleInlineGoogle}
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-700 text-xs font-bold text-gray-800 dark:text-neutral-200 transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <svg className="size-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>1-Click Continue with Google</span>
                    </button>

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-stone-200 dark:border-neutral-800 w-full" />
                      <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] text-gray-400 uppercase font-bold">
                        Or use email
                      </span>
                    </div>

                    {/* Inline Login / Register Tabs */}
                    <div className="space-y-4">
                      <div className="flex rounded-xl bg-stone-100 dark:bg-neutral-800 p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setAuthTab("login")}
                          className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            authTab === "login"
                              ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthTab("signup")}
                          className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            authTab === "signup"
                              ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          Register Customer Account
                        </button>
                      </div>

                      {authTab === "login" ? (
                        <form onSubmit={handleInlineLogin} className="space-y-3">
                          <input
                            type="email"
                            required
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                          />
                          <input
                            type="password"
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                          />
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                              <input
                                type="checkbox"
                                checked={authRememberMe}
                                onChange={(e) => setAuthRememberMe(e.target.checked)}
                                className="size-3.5 rounded border-stone-300 dark:border-neutral-700 text-orange-600 focus:ring-orange-500 dark:bg-neutral-800 transition cursor-pointer"
                              />
                              <span className="text-[11px] font-medium text-gray-600 dark:text-neutral-400 group-hover:text-gray-900 dark:group-hover:text-white transition">
                                Remember me
                              </span>
                            </label>
                          </div>
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Spinner className="size-4" /> : "Sign In & Continue"}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleInlineRegister} className="space-y-3">
                          <input
                            type="text"
                            required
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="email"
                              required
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="Email address"
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                            <input
                              type="tel"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              placeholder="Phone (e.g. 017...)"
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </div>
                          <input
                            type="password"
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Set Password"
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                          />
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Spinner className="size-4" /> : "Register & Continue"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Verified Customer Indicator Bar */
                  <div className="p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "C"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                            {user.displayName || "SilkenDrift Customer"}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                            Verified Customer
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400">
                          {user.email} • Saved address loaded
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <ShieldCheckIcon className="size-4" /> Ready to dispatch
                    </span>
                  </div>
                )}

                {/* 2. RECIPIENT & DELIVERY DETAILS FORM */}
                <form id="checkout-main-form" onSubmit={handlePlaceOrder} className="space-y-6">
                  {/* Delivery Address Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="size-5 text-orange-600" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          1. Recipient &amp; Delivery Address
                        </h3>
                      </div>
                      <span className="text-[11px] text-gray-400">64 Districts of Bangladesh</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                          Recipient Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Tanvirul Hasan"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                          Mobile Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g. 01712345678"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Street Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                        Street Address / House / Road / Apartment / Sector <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="House #12, Road #4, Sector #3, Uttara, Dhaka"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    {/* District & City/Thana */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                          District / Division <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                        >
                          {BANGLADESH_DISTRICTS.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist} {dist === "Dhaka" ? "(24-Hour Express)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                          City / Thana / Area
                        </label>
                        <input
                          type="text"
                          value={cityThana}
                          onChange={(e) => setCityThana(e.target.value)}
                          placeholder="e.g. Uttara / Dhanmondi / Agrabad"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>
                    </div>

                    {/* Delivery Instructions */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                        Delivery Rider Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="e.g. Call before arrival / Handover to building reception"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    {/* Save to Profile Checkbox */}
                    <label className="flex items-center gap-2 pt-2 text-xs text-gray-600 dark:text-neutral-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="size-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span>Save as default delivery address in my SilkenDrift profile</span>
                    </label>
                  </div>

                  {/* 2. DELIVERY & DISPATCH DETAILS */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="size-5 text-orange-600" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          2. Delivery &amp; Dispatch Details
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                        {isInsideDhaka ? "Inside Dhaka District" : "Outside Dhaka District"}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-800/40 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                              Standard Express Doorstep Delivery
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                              {isInsideDhaka ? "24–48 Hours" : "2–4 Business Days"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                            Destination: <span className="font-semibold text-gray-700 dark:text-neutral-200">{district}</span> ({isInsideDhaka ? "Dhaka Metropolitan Area" : "All 64 Districts in Bangladesh"})
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <span className="font-mono text-base font-extrabold text-orange-600 dark:text-orange-400">
                            {standardDeliveryFee === 0 ? "FREE DELIVERY" : `৳${standardDeliveryFee}`}
                          </span>
                          {isCouponFreeDelivery && (
                            <span className="text-[10px] text-emerald-600 block font-semibold">
                              Free delivery voucher applied
                            </span>
                          )}
                          {!isCouponFreeDelivery && shippingDiscount > 0 && (
                            <span className="text-[10px] text-cyan-600 block font-semibold">
                              -৳{shippingDiscount} delivery discount applied
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-200/60 dark:border-neutral-700/60 flex items-start gap-2.5 text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
                        <ShieldCheckIcon className="size-4 text-orange-600 shrink-0 mt-0.5" />
                        <p>
                          <strong>Admin-Assigned Courier Logistics:</strong> Our atelier fulfillment team will assign the most optimal courier partner (e.g. Steadfast Courier, Pathao Express, RedX) best suited for your delivery address upon order verification. You will receive live consignment tracking details via SMS.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. PAYMENT METHOD */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                      <div className="flex items-center gap-2">
                        <BanknotesIcon className="size-5 text-orange-600" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          3. Payment Method
                        </h3>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        100% Safe &amp; Secure
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cash on Delivery */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          paymentMethod === "cod"
                            ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                            : "border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs">Cash on Delivery</span>
                          <span className="size-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-snug">
                          Pay cash to rider after verifying your parcel.
                        </p>
                      </button>

                      {/* bKash / Nagad */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bkash")}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          paymentMethod === "bkash"
                            ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                            : "border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs">bKash / Nagad</span>
                          <span className="text-[10px] text-pink-600 font-extrabold">Instant</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-snug">
                          Instant digital payment with zero gateway fees.
                        </p>
                      </button>

                      {/* Credit/Debit Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          paymentMethod === "card"
                            ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 text-orange-950 dark:text-orange-200 ring-2 ring-orange-600/30"
                            : "border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs">Debit / Credit Card</span>
                          <CreditCardIcon className="size-4 text-blue-600" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-snug">
                          Visa, Mastercard, AMEX with 3D Secure OTP.
                        </p>
                      </button>
                    </div>

                    {/* bKash instructions if selected */}
                    {paymentMethod === "bkash" && (
                      <div className="p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 text-xs text-pink-950 dark:text-pink-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>bKash Merchant Payment Details:</span>
                        </div>
                        <p className="text-[11px] text-pink-900/80 dark:text-pink-300/80 leading-relaxed">
                          Merchant Account: <strong className="font-mono">01712-345678</strong> (SilkenDrift Apparel).
                          You can also choose to pay with bKash directly to the courier rider upon delivery.
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: STICKY ORDER SUMMARY & ITEMS (5 COLS) */}
              <div className="lg:col-span-5 sticky top-24 space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBagIcon className="size-4 text-orange-600" />
                      <span>Order Summary</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[11px] font-bold text-gray-700 dark:text-neutral-300">
                      {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Garment Items Mini-List */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 dark:divide-neutral-800 pr-1 space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="size-12 rounded-xl object-cover shrink-0 ring-1 ring-stone-200 dark:ring-neutral-700"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <span className="text-[11px] text-gray-400 block">
                              Size: {item.size || "Standard"} • Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white font-mono shrink-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Doorstep Courier Delivery Banner */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 flex items-center justify-between text-xs text-gray-700 dark:text-neutral-300">
                    <div className="flex items-center gap-2">
                      <TruckIcon className="size-4 text-orange-600 shrink-0" />
                      <span>Standard Doorstep Courier Delivery</span>
                    </div>
                    {isCouponFreeDelivery ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                        FREE DELIVERY
                      </span>
                    ) : shippingDiscount > 0 ? (
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-200/60 dark:border-cyan-800/40">
                        -৳{shippingDiscount} DELIVERY DISCOUNT
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                        {isInsideDhaka ? "৳70 Inside Dhaka" : "৳130 Outside Dhaka"}
                      </span>
                    )}
                  </div>

                  {/* Promo Code Form */}
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <TagIcon className="size-4 text-emerald-600" />
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">
                            {appliedCoupon.code} (
                            {appliedCoupon.discountType === "free_shipping"
                              ? "100% FREE DELIVERY"
                              : appliedCoupon.discountType === "shipping_discount"
                              ? `-৳${appliedCoupon.discountAmount} Delivery`
                              : appliedCoupon.discountType === "fixed_amount"
                              ? `-৳${appliedCoupon.discountAmount}`
                              : `-${appliedCoupon.discountPercent}%`}
                            )
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          id="checkout-promo-input"
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="Promo code (e.g. FREEDELIVERY or SILKENDRIFT2026)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-gray-900 dark:text-white uppercase font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-orange-600"
                        />
                        <button
                          id="checkout-apply-promo-btn"
                          type="submit"
                          disabled={applyingCoupon}
                          className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
                        >
                          {applyingCoupon ? <Spinner className="size-3.5" /> : "Apply"}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        ৳{totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Voucher Discount</span>
                        <span className="font-mono">-৳{discountAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                      <span>Delivery ({isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span>
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {standardDeliveryFee === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                        ) : shippingDiscount > 0 ? (
                          <>
                            <span className="line-through text-gray-400 mr-1.5 font-normal">
                              ৳{baseDeliveryFee}
                            </span>
                            <span>৳{standardDeliveryFee}</span>
                          </>
                        ) : (
                          `৳${standardDeliveryFee}`
                        )}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-stone-200 dark:border-neutral-800 flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                      <span>Total Amount Payable</span>
                      <span className="text-xl text-orange-600 dark:text-orange-400 font-mono">
                        ৳{finalTotalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Submit Order Button (triggers #checkout-main-form) */}
                  <button
                    type="submit"
                    form="checkout-main-form"
                    disabled={isSubmitting}
                    className="w-full py-4 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-black text-sm shadow-lg hover:shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="size-4 text-white animate-spin" />
                        <span>Securing Order &amp; Generating Tracking...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="size-5" />
                        <span>Confirm &amp; Place Order • ৳{finalTotalAmount.toLocaleString()}</span>
                      </>
                    )}
                  </button>

                  {/* Trust Guarantees */}
                  <div className="pt-4 border-t border-stone-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
                    <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-800/40">
                      <span className="block font-bold text-gray-800 dark:text-neutral-200">7-Day</span>
                      Size Exchange
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-800/40">
                      <span className="block font-bold text-gray-800 dark:text-neutral-200">COD</span>
                      Open Box Check
                    </div>
                    <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-800/40">
                      <span className="block font-bold text-gray-800 dark:text-neutral-200">256-Bit</span>
                      Encrypted
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
