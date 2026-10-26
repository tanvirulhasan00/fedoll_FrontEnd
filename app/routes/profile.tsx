import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchCustomerOrders,
  fetchOrderByTrackingOrNumber,
  cancelOrderInFirestore,
  type Order,
  isStaffRole,
  getRoleConfig,
} from "~/firebase";
import { addToCart } from "~/redux/features/cart/cartSlice";
import {
  UserCircleIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CreditCardIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  TagIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import { AuthModal } from "~/components/main/Auth/AuthModal";
import OrderTrackerView from "~/components/main/Profile/OrderTrackerView";
import ProfileSettings from "~/components/main/Profile/ProfileSettings";
import WishlistView from "~/components/main/Profile/WishlistView";
import OrderCancelRequestModal from "~/components/main/Profile/OrderCancelRequestModal";
import { OrderCardSkeleton, OrderTrackerSkeleton } from "~/components/main/Skeletons";

export function meta() {
  return [
    { title: "Customer Profile & Orders | SilkenDrift" },
    {
      name: "description",
      content:
        "Manage your SilkenDrift customer profile, view past orders, and track active courier shipments across Bangladesh.",
    },
  ];
}

type TabType = "orders" | "wishlist" | "track" | "settings";

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { wishlistIds } = useAppSelector((state) => state.home);

  // Tab State
  const initialTab = (searchParams.get("tab") as TabType) || "orders";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">(
    "login"
  );

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<
    "all" | "active" | "delivered" | "cancelled"
  >("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  // Tracking Tab State
  const [trackingInput, setTrackingInput] = useState(
    searchParams.get("tracking") || ""
  );
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["orders", "wishlist", "track", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const trackingParam = searchParams.get("tracking");
    if (trackingParam) {
      setTrackingInput(trackingParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  // Load customer orders from Firestore
  const loadOrders = async () => {
    if (!user?.uid) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const customerOrders = await fetchCustomerOrders(user.uid);
      setOrders(customerOrders);

      // If tracking param was provided or we have orders, set initial tracked order
      const trackingQuery = searchParams.get("tracking") || trackingInput;
      if (trackingQuery) {
        const found = customerOrders.find(
          (o) =>
            o.orderNumber.toUpperCase() === trackingQuery.toUpperCase() ||
            o.trackingNumber.toUpperCase() === trackingQuery.toUpperCase()
        );
        if (found) {
          setTrackedOrder(found);
        } else {
          handleSearchTracking(trackingQuery);
        }
      } else if (customerOrders.length > 0 && !trackedOrder) {
        setTrackedOrder(customerOrders[0]);
      }
    } catch (err) {
      console.warn("Failed to load customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadOrders();
    }
  }, [user?.uid]);

  // Handle tracking search
  const handleSearchTracking = async (queryParam?: string) => {
    const key = (queryParam || trackingInput).trim();
    if (!key) {
      toast.error("Please enter an Order ID or Courier Tracking Number.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const found = await fetchOrderByTrackingOrNumber(key);
      if (found) {
        // Enforce ownership: customer can only track their own order unless admin
        const isOwner =
          !found.userId ||
          found.userId === user?.uid ||
          (found.customerEmail && user?.email && found.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
          isStaffRole(user?.role);

        if (!isOwner) {
          setTrackingError(
            `No order matching "${key}" was found in your registered account. Please check your order confirmation details.`
          );
          return;
        }

        setTrackedOrder(found);
        setActiveTab("track");
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "track");
          next.set("tracking", key);
          return next;
        });
      } else {
        setTrackingError(
          `No order or shipment found matching "${key}". Please check your order confirmation code.`
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      setTrackingError(error.message || "Failed to search tracking records.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Cancel order modal opener (cancellation requires proper reason and admin review)
  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
  };

  // Reorder handler
  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      dispatch(addToCart(item));
    });
    toast.success(`Added ${order.items.length} items to your shopping bag!`);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (orderFilter === "active") {
      if (["delivered", "cancelled"].includes(order.orderStatus)) return false;
    } else if (orderFilter === "delivered") {
      if (order.orderStatus !== "delivered") return false;
    } else if (orderFilter === "cancelled") {
      if (order.orderStatus !== "cancelled") return false;
    }

    // Search query filter
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchOrderNo = order.orderNumber.toLowerCase().includes(q);
      const matchTracking = order.trackingNumber.toLowerCase().includes(q);
      const matchItem = order.items.some((it) =>
        it.name.toLowerCase().includes(q)
      );
      if (!matchOrderNo && !matchTracking && !matchItem) return false;
    }

    return true;
  });

  // Calculate customer metrics
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.orderStatus)
  ).length;
  const totalSpent = orders
    .filter((o) => o.orderStatus !== "cancelled")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const getStatusBadge = (status: Order["orderStatus"]) => {
    switch (status) {
      case "placed":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          text: "Order Placed",
        };
      case "confirmed":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          text: "Confirmed",
        };
      case "processing":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          text: "At Atelier",
        };
      case "shipped":
        return {
          bg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          text: "In Transit",
        };
      case "delivered":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          text: "Delivered",
        };
      case "cancelled":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          text: "Cancelled",
        };
      default:
        return {
          bg: "bg-stone-100 text-stone-700",
          text: status,
        };
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      <Topbar />
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-6"
          >
            <Link
              to="/"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              Customer Profile &amp; Orders
            </span>
          </nav>

          {/* Loading customer session check */}
          {authLoading ? (
            <div className="space-y-8 animate-pulse">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="size-20 rounded-full bg-stone-200/80 dark:bg-neutral-800/80 shrink-0" />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="h-6 w-48 bg-stone-200/80 dark:bg-neutral-800/80 rounded-md mx-auto sm:mx-0" />
                  <div className="h-4 w-32 bg-stone-200/80 dark:bg-neutral-800/80 rounded-md mx-auto sm:mx-0" />
                </div>
              </div>
              <div className="space-y-4">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            </div>
          ) : !isAuthenticated || !user ? (
            <div className="max-w-3xl mx-auto py-12">
              <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xl p-8 sm:p-12 text-center space-y-6">
                <div className="size-20 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center ring-8 ring-orange-50/50 dark:ring-orange-950/30">
                  <ShieldCheckIcon className="size-10" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
                    Role-Based Shopping System
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    Sign In to Your Customer Account
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                    At SilkenDrift, only registered customers can place orders and track
                    real-time courier delivery across all 64 districts in Bangladesh.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800">
                    <TruckIcon className="size-5 text-orange-600 mb-1.5" />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Live Courier Tracking
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                      Check real-time milestones with Steadfast &amp; Pathao Express.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800">
                    <ShoppingBagIcon className="size-5 text-orange-600 mb-1.5" />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Order History &amp; Receipts
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                      Review previous garments, sizes, colors, and total receipts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800">
                    <SparklesIcon className="size-5 text-orange-600 mb-1.5" />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      1-Click Reorder &amp; Saved Address
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                      Skip retyping your shipping info on every new seasonal drop.
                    </p>
                  </div>
                </div>

                {/* Auth CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthInitialTab("login");
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Log In to Customer Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthInitialTab("signup");
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
                  >
                    Register as New Customer
                  </button>
                </div>

                <div className="pt-2 text-xs text-gray-500 dark:text-neutral-400">
                  Live courier tracking is exclusively reserved for registered customer accounts. Sign in or register above to view your deliveries.
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED CUSTOMER DASHBOARD */
            <div className="space-y-8">
              {/* Profile Overview Banner */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Customer Profile info */}
                  <div className="flex items-center gap-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Customer"}
                        className="size-16 sm:size-20 rounded-2xl object-cover ring-4 ring-orange-100 dark:ring-orange-950/60 shadow-md"
                      />
                    ) : (
                      <div className="size-16 sm:size-20 rounded-2xl bg-orange-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                        {(user.displayName || user.email || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                          {user.displayName || "Valued Customer"}
                        </h1>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleConfig(user.role).badgeClass}`}>
                          <ShieldCheckIcon className="size-3.5" />
                          <span>
                            {getRoleConfig(user.role).label}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                        {user.email}
                      </p>

                      {user.phoneNumber && (
                        <p className="text-xs text-gray-600 dark:text-neutral-300">
                          Phone: <strong>{user.phoneNumber}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Metrics Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-neutral-800 pt-4 md:pt-0 md:pl-6 text-center">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                        Total Orders
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                        {totalOrdersCount}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                        In Transit
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
                        {activeOrdersCount}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                        Loved Items
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                        {wishlistIds.length}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                        Total Spent
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                        ৳{totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Navigation Tabs */}
                <div className="flex border-b border-gray-100 dark:border-neutral-800 mt-8 gap-4 sm:gap-8 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleTabChange("orders")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                      activeTab === "orders"
                        ? "border-orange-600 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <ShoppingBagIcon className="size-4" />
                    <span>My Orders</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[11px]">
                      {totalOrdersCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("wishlist")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                      activeTab === "wishlist"
                        ? "border-orange-600 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <HeartIcon className="size-4 text-rose-500" />
                    <span>My Wishlist</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold">
                      {wishlistIds.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("track")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                      activeTab === "track"
                        ? "border-orange-600 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <TruckIcon className="size-4" />
                    <span>Track Shipment</span>
                    {activeOrdersCount > 0 && (
                      <span className="size-2 rounded-full bg-orange-600 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange("settings")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                      activeTab === "settings"
                        ? "border-orange-600 text-orange-600 dark:text-orange-400"
                        : "border-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Cog6ToothIcon className="size-4" />
                    <span>Profile &amp; Addresses</span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENT: MY ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  {/* Filters & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
                    {/* Status Pill Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { key: "all", label: "All Orders" },
                        { key: "active", label: "Active & In Transit" },
                        { key: "delivered", label: "Delivered" },
                        { key: "cancelled", label: "Cancelled" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderFilter(tab.key as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            orderFilter === tab.key
                              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                              : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search box */}
                    <div className="relative min-w-[240px]">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search by Order # or item..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/60 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                      />
                    </div>
                  </div>

                  {/* Orders Cards List */}
                  {loadingOrders ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <OrderCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-8">
                      <div className="size-16 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-400 mx-auto flex items-center justify-center mb-4">
                        <ShoppingBagIcon className="size-8" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        No orders found
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
                        {orderSearchQuery
                          ? `No orders matching "${orderSearchQuery}". Try clearing search.`
                          : "You haven't placed any orders with this customer account yet."}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/products")}
                        className="mt-6 px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        Start Shopping Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Cancellation Policy Guideline Banner */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                        <ExclamationTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Cancellation Policy Notice: </span>
                          <span className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                            Orders can strictly only be cancelled <strong>before they are shipped</strong> (while in Placed, Confirmed, or Processing status). Once an order is <strong>Shipped</strong> and handed over to the courier partner, cancellation is closed.
                          </span>
                        </div>
                      </div>

                      {filteredOrders.map((order) => {
                        const badge = getStatusBadge(order.orderStatus);
                        const cancelReq = order.cancellationRequest;
                        const isCancelPending = cancelReq?.status === "pending";
                        const isCancelRejected = cancelReq?.status === "rejected";
                        const canRequestCancel =
                          ["placed", "confirmed", "processing"].includes(order.orderStatus) &&
                          !isCancelPending &&
                          order.orderStatus !== "cancelled";

                        return (
                          <div
                            key={order.id}
                            className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition p-6 space-y-5"
                          >
                            {/* Card Top Strip */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-neutral-800 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                                    #{order.orderNumber}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}
                                  >
                                    {badge.text}
                                  </span>
                                </div>
                                <p className="text-gray-500 dark:text-neutral-400 text-[11px]">
                                  Placed on{" "}
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackedOrder(order);
                                    setTrackingInput(order.orderNumber);
                                    handleTabChange("track");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                >
                                  <TruckIcon className="size-4" />
                                  <span>Track Package</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReorder(order)}
                                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-semibold text-xs transition cursor-pointer"
                                >
                                  Reorder
                                </button>

                                {isCancelPending ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                                    <ClockIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Cancel Pending Review</span>
                                  </div>
                                ) : isCancelRejected ? (
                                  <div
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-400 text-xs font-medium cursor-help"
                                    title={cancelReq?.adminNote || "Cancellation declined by atelier admin"}
                                  >
                                    <span className="text-rose-500 font-bold">✕</span>
                                    <span>Cancel Declined</span>
                                  </div>
                                ) : order.orderStatus === "shipped" ? (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-help"
                                    title="Orders cannot be cancelled once shipped. Cancellation was only permitted before shipping."
                                  >
                                    <ExclamationTriangleIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Cannot Cancel (Shipped)</span>
                                  </span>
                                ) : canRequestCancel ? (
                                  <div className="flex flex-col items-end">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCancelModal(order)}
                                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer"
                                    >
                                      Request Cancellation
                                    </button>
                                    <span className="text-[9px] text-gray-400 dark:text-neutral-500 mt-0.5">
                                      Cancel before shipped
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Shipped Cancellation Warning Note */}
                            {order.orderStatus === "shipped" && (
                              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                                <ExclamationTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-amber-800 dark:text-amber-300">Package Dispatched with Courier</p>
                                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                                    This order has already been shipped. Cancellation is strictly not possible after dispatch. If you need any assistance after receiving the package, you can request an exchange or return.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Cancellation Request Alert Banner */}
                            {isCancelPending && (
                              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                                <ClockIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Cancellation Request Under Review</p>
                                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                                    Reason: <span className="font-semibold">"{cancelReq?.reason}"</span>
                                    {cancelReq?.details ? ` • "${cancelReq.details}"` : ""}.
                                    Our atelier admin team will review whether packaging/dispatch has begun.
                                  </p>
                                </div>
                              </div>
                            )}

                            {isCancelRejected && cancelReq?.adminNote && (
                              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-neutral-800/60 border border-stone-200 dark:border-neutral-700 text-xs text-stone-700 dark:text-neutral-300 flex items-start gap-2.5">
                                <ExclamationTriangleIcon className="size-4 text-stone-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Cancellation Request Declined by Admin</p>
                                  <p className="text-[11px] text-stone-600 dark:text-neutral-400 mt-0.5">
                                    {cancelReq.adminNote}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Return & Exchange Request Banner / Action */}
                            {order.returnRequest ? (
                              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2.5">
                                    <ArrowPathIcon className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold flex items-center gap-2">
                                        <span>Return / Exchange Ticket #{order.returnRequest.ticketNumber}</span>
                                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                                          {order.returnRequest.status.replace(/_/g, " ")}
                                        </span>
                                      </p>
                                      <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 mt-0.5">
                                        Type: <span className="font-semibold capitalize">{order.returnRequest.type.replace(/_/g, " ")}</span> • Reason: &quot;{order.returnRequest.reason}&quot;
                                      </p>
                                    </div>
                                  </div>
                                  <Link
                                    to={`/returns-and-exchanges?tab=track&ticket=${order.returnRequest.ticketNumber}`}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-xs shrink-0 flex items-center gap-1"
                                  >
                                    <span>Track Live</span>
                                    <span>&rarr;</span>
                                  </Link>
                                </div>

                                {/* Dynamic Handover & Resolution Milestone info */}
                                {order.returnRequest.returnMethod === "hub_dropoff" && (
                                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-indigo-100 dark:border-neutral-800 flex items-start gap-2 text-[11px]">
                                    <BuildingStorefrontIcon className="size-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-gray-900 dark:text-white">
                                        Self Drop-Off Hub: {order.returnRequest.dropoffHubName || "SilkenDrift Flagship Atelier"}
                                      </span>
                                      {order.returnRequest.dropoffDeadline && (
                                        <span className="text-rose-600 font-semibold ml-1.5">
                                          (Drop off before {order.returnRequest.dropoffDeadline})
                                        </span>
                                      )}
                                      <p className="text-gray-500 text-[10px] mt-0.5">
                                        {order.returnRequest.dropoffHubAddress || "House 14, Road 7, Sector 3, Uttara, Dhaka"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {order.returnRequest.reverseCourier && (
                                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-indigo-100 dark:border-neutral-800 flex items-start gap-2 text-[11px]">
                                    <TruckIcon className="size-4 text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-gray-900 dark:text-white">
                                        Reverse Pickup: {order.returnRequest.reverseCourier}
                                      </span>
                                      {order.returnRequest.reverseTrackingNumber && (
                                        <span className="font-mono text-purple-700 dark:text-purple-300 font-bold ml-1.5">
                                          (Consignment #{order.returnRequest.reverseTrackingNumber})
                                        </span>
                                      )}
                                      {order.returnRequest.pickupDate && (
                                        <p className="text-gray-500 text-[10px] mt-0.5">
                                          Scheduled: {order.returnRequest.pickupDate} ({order.returnRequest.pickupTimeSlot || "Day slot"})
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {order.returnRequest.status === "resolved" && (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-[11px] text-emerald-900 dark:text-emerald-200">
                                    <CheckCircleIcon className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold">
                                        {order.returnRequest.replacementTrackingNumber
                                          ? `Replacement Dispatched via ${order.returnRequest.replacementCourier || "Courier"} (Tracking #${order.returnRequest.replacementTrackingNumber})`
                                          : order.returnRequest.refundAmount
                                          ? `Refund of ৳${order.returnRequest.refundAmount} Settled via ${order.returnRequest.refundMethod || "bKash"} (TrxID: ${order.returnRequest.refundTransactionId || "Processed"})`
                                          : "Ticket Successfully Resolved"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : ["delivered", "shipped"].includes(order.orderStatus) ? (
                              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 text-xs">
                                <span className="text-gray-600 dark:text-neutral-400">
                                  Need a different size or defect replacement?
                                </span>
                                <Link
                                  to={`/returns-and-exchanges?tab=request&order=${order.orderNumber}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition"
                                >
                                  <ArrowPathIcon className="size-3.5" />
                                  <span>Request Return / Exchange</span>
                                </Link>
                              </div>
                            ) : null}

                            {/* Items List */}
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3.5"
                                >
                                  <img
                                    src={
                                      item.image ||
                                      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=150&q=80"
                                    }
                                    alt={item.name}
                                    className="size-16 rounded-xl object-cover bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                      {item.name}
                                    </h4>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                                      <span>Qty: {item.quantity}</span>
                                      {item.size && (
                                        <span>• Size: {item.size}</span>
                                      )}
                                      {item.color && (
                                        <span>• Color: {item.color}</span>
                                      )}
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                                      ৳
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer Summary */}
                            <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500 dark:text-neutral-400">
                              <div className="flex flex-wrap items-center gap-3">
                                <span>
                                  Courier:{" "}
                                  {order.courierName &&
                                  order.courierName !== "Pending Assignment" &&
                                  order.courierName !== "Unassigned" ? (
                                    <strong className="text-gray-800 dark:text-neutral-200">
                                      {order.courierName}
                                    </strong>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                      Pending Assignment
                                    </span>
                                  )}
                                </span>
                                <span>•</span>
                                <span>
                                  Tracking:{" "}
                                  <strong className="text-orange-600 font-mono">
                                    {order.trackingNumber}
                                  </strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span>Grand Total:</span>
                                <span className="text-base font-black text-gray-900 dark:text-white">
                                  ৳{order.totalAmount.toLocaleString()}
                                </span>
                                <span className="uppercase text-[11px] font-bold text-stone-500">
                                  ({order.paymentMethod})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: TRACK SHIPMENT */}
              {activeTab === "track" && (
                <div className="space-y-6">
                  {/* Tracking Search Input Card */}
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm p-6 sm:p-8 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <TruckIcon className="size-5 text-orange-600" />
                        <span>Track Any Package by Order or Tracking ID</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Enter your SilkenDrift Order ID (e.g. FED-839201) or Courier
                        Tracking Code (e.g. TRK-BD82941092).
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSearchTracking();
                      }}
                      className="flex flex-col sm:flex-row gap-2 max-w-xl"
                    >
                      <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="e.g. FED-123456 or TRK-BD12345678"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={trackingLoading}
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {trackingLoading ? (
                          <Spinner className="size-4 text-white" />
                        ) : (
                          <span>Track Now</span>
                        )}
                      </button>
                    </form>

                    {/* Quick Pick From My Orders */}
                    {orders.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-400 text-[11px]">
                          Quick pick active orders:
                        </span>
                        {orders.slice(0, 4).map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              setTrackingInput(o.orderNumber);
                              setTrackedOrder(o);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                              trackedOrder?.id === o.id
                                ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800"
                                : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200"
                            }`}
                          >
                            #{o.orderNumber}
                          </button>
                        ))}
                      </div>
                    )}

                    {trackingError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                        {trackingError}
                      </div>
                    )}
                  </div>

                  {/* Render Live Tracking View */}
                  {trackingLoading && !trackedOrder ? (
                    <OrderTrackerSkeleton />
                  ) : trackedOrder ? (
                    <OrderTrackerView
                      order={trackedOrder}
                      onRefresh={loadOrders}
                      isRefreshing={loadingOrders}
                    />
                  ) : (
                    <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800">
                      <TruckIcon className="size-12 text-gray-300 dark:text-neutral-700 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        No shipment currently selected
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                        Select an order from above or type your Order Number to view
                        doorstep milestones.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: PROFILE & ADDRESSES */}
              {activeTab === "settings" && <ProfileSettings />}

              {/* TAB CONTENT: MY WISHLIST */}
              {activeTab === "wishlist" && <WishlistView />}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />

      {/* Customer Cancellation Request Modal */}
      <OrderCancelRequestModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        onSuccess={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          if (trackedOrder?.id === updated.id) setTrackedOrder(updated);
          setCancelModalOrder(null);
        }}
      />
    </div>
  );
}
