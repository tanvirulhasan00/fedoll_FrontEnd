import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { setUser } from "~/redux/features/auth/authSlice";
import { setProductCategories } from "~/redux/features/productSlice";
import {
  fetchProductsFromFirestore,
  fetchCategoriesFromFirestore,
  fetchAllOrdersForAdmin,
  updateOrderStatusInFirestore,
  fetchShippingProviders,
  fetchShippingSettings,
  fetchAllCustomersFromFirestore,
  fetchCouponsFromFirestore,
  fetchStoreSettings,
  fetchContactMessagesFromFirestore,
  fetchAllNewsletterSubscribers,
  logout,
  type ProductItem,
  type ProductCategoryItem,
  type Order,
  type OrderStatus,
  type ShippingProvider,
  type ShippingSettings,
  type FirestoreUserProfile,
  type CouponItem,
  type StoreGeneralSettings,
  type ContactMessageRecord,
  type NewsletterSubscriber,
  defaultShippingSettings,
  defaultStoreSettings,
  fetchReturnExchangeRequests,
  fetchReturnsExchanges,
  type ReturnExchangeRequest,
  type ReturnsExchangesData,
  defaultReturnsExchanges,
  fetchBlogsFromFirestore,
  type BlogItem,
  normalizeRole,
  isStaffRole,
  isSuperAdmin,
  getRoleAllowedTabs,
  getRoleConfig,
  fetchSpotlightBannersFromFirestore,
  type SpotlightBanner,
} from "~/firebase";
import AdminSidebar, { type AdminTab } from "~/components/admin/AdminSidebar";
import AdminOverviewTab from "~/components/admin/AdminOverviewTab";
import AdminProductsTab from "~/components/admin/AdminProductsTab";
import AdminCategoriesTab from "~/components/admin/AdminCategoriesTab";
import AdminStockTab from "~/components/admin/AdminStockTab";
import AdminOrdersTab from "~/components/admin/AdminOrdersTab";
import AdminReturnsTab from "~/components/admin/AdminReturnsTab";
import AdminBlogsTab from "~/components/admin/AdminBlogsTab";
import AdminShippingTab from "~/components/admin/AdminShippingTab";
import AdminCustomersTab from "~/components/admin/AdminCustomersTab";
import AdminCouponsTab from "~/components/admin/AdminCouponsTab";
import AdminBannersTab from "~/components/admin/AdminBannersTab";
import AdminMessagesTab from "~/components/admin/AdminMessagesTab";
import AdminNewsletterTab from "~/components/admin/AdminNewsletterTab";
import AdminLegalTab from "~/components/admin/AdminLegalTab";
import AdminSettingsTab from "~/components/admin/AdminSettingsTab";
import { AdminDashboardSkeleton } from "~/components/main/Skeletons";
import { setStoreSettings as setReduxStoreSettings } from "~/redux/features/storeSettingsSlice";
import {
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import ThemeToggle from "~/components/main/Utilities/ThemeToggle";
import { AuthModal } from "~/components/main/Auth/AuthModal";

export function meta() {
  return [
    { title: "Admin Atelier Dashboard | SilkenDrift eCommerce" },
    {
      name: "description",
      content:
        "Full controlled admin dashboard for SilkenDrift: products, categories, orders, shipping providers, customer roles, legal policies, and store settings.",
    },
  ];
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const userRole = normalizeRole(user?.role);
  const isStaff = isStaffRole(userRole);
  const isAdmin = isSuperAdmin(userRole);
  const roleConfig = getRoleConfig(userRole);
  const allowedTabs = getRoleAllowedTabs(userRole);

  const validTabs: AdminTab[] = [
    "overview",
    "products",
    "categories",
    "inventory",
    "orders",
    "returns",
    "blogs",
    "shipping",
    "customers",
    "staff",
    "coupons",
    "banners",
    "messages",
    "newsletters",
    "legal",
    "settings",
  ];

  // Tab State
  const tabParam = (searchParams.get("tab") as AdminTab) || "overview";
  const [currentTab, setCurrentTab] = useState<AdminTab>(
    validTabs.includes(tabParam) ? tabParam : "overview"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal Triggers
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Datasets
  const [loadingData, setLoadingData] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [customers, setCustomers] = useState<FirestoreUserProfile[]>([]);
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [spotlightBanners, setSpotlightBanners] = useState<SpotlightBanner[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreGeneralSettings>(defaultStoreSettings);
  const [returnRequests, setReturnRequests] = useState<ReturnExchangeRequest[]>([]);
  const [returnsPolicy, setReturnsPolicy] = useState<ReturnsExchangesData>(defaultReturnsExchanges);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as AdminTab;
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  // Load all admin datasets
  const loadAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [
        fetchedOrders,
        fetchedProducts,
        fetchedCategories,
        fetchedCustomers,
        fetchedProviders,
        fetchedShipSettings,
        fetchedCoupons,
        fetchedSpotlightBanners,
        fetchedStoreSettings,
        fetchedMessages,
        fetchedSubscribers,
        fetchedReturnRequests,
        fetchedReturnsPolicy,
        fetchedBlogs,
      ] = await Promise.all([
        fetchAllOrdersForAdmin(),
        fetchProductsFromFirestore(),
        fetchCategoriesFromFirestore(),
        fetchAllCustomersFromFirestore(),
        fetchShippingProviders(),
        fetchShippingSettings(),
        fetchCouponsFromFirestore(),
        fetchSpotlightBannersFromFirestore(),
        fetchStoreSettings(),
        fetchContactMessagesFromFirestore(),
        fetchAllNewsletterSubscribers(),
        fetchReturnExchangeRequests(),
        fetchReturnsExchanges(),
        fetchBlogsFromFirestore(),
      ]);

      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      dispatch(setProductCategories(fetchedCategories));
      setCustomers(fetchedCustomers);
      setShippingProviders(fetchedProviders);
      setShippingSettings(fetchedShipSettings);
      setCoupons(fetchedCoupons);
      setSpotlightBanners(fetchedSpotlightBanners);
      setStoreSettings(fetchedStoreSettings);
      dispatch(setReduxStoreSettings(fetchedStoreSettings));
      setMessages(fetchedMessages);
      setSubscribers(fetchedSubscribers);
      setReturnRequests(fetchedReturnRequests);
      if (fetchedReturnsPolicy) setReturnsPolicy(fetchedReturnsPolicy);
      setBlogs(fetchedBlogs);
    } catch (err) {
      console.warn("Error loading admin datasets:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      loadAllAdminData();
    }
  }, [isStaff]);

  // Ensure current tab is permitted for the user's role
  useEffect(() => {
    if (user && isStaff && !allowedTabs.includes(currentTab)) {
      handleSelectTab(allowedTabs[0] || "overview");
    }
  }, [currentTab, user, isStaff, allowedTabs]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, status);
      toast.success(`Order status updated to "${status.toUpperCase()}".`);
      loadAllAdminData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update order status.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      dispatch(setUser(null));
      toast.success("Signed out from Admin Dashboard.");
      navigate("/");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sign out.");
    }
  };

  // Prevent flicker during initial authentication resolution
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 p-6 sm:p-10">
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      {/* ACCESS CONTROL GATE: If user is not authenticated or not staff */}
      {!isStaff ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-2xl p-8 sm:p-10 text-center space-y-6">
            {user ? (
              <>
                <div className="size-20 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center ring-8 ring-red-50 dark:ring-red-950/30">
                  <ShieldExclamationIcon className="size-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-bold uppercase tracking-wider">
                    Access Denied
                  </span>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    Staff Privileges Required
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    This portal is restricted to authorized store staff (Administrator, Operations Manager, Sales Representative). Retail customer accounts do not have permission to view or manage the dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Logged in as:</span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Account Role:</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 font-bold uppercase text-[10px]">
                      {user.role || "customer"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Dashboard Access:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400 text-[11px]">
                      Unauthorized
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Link
                    to="/"
                    className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    &larr; Return to Storefront
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-semibold text-xs transition cursor-pointer"
                  >
                    Sign Out / Switch Account
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="size-20 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center ring-8 ring-orange-50 dark:ring-orange-950/30">
                  <ShieldCheckIcon className="size-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
                    Restricted Admin Portal
                  </span>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    Administrator Login
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Please log in with an authorized administrator account to access store controls.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LockClosedIcon className="size-4" />
                    <span>Log In to Access Admin Dashboard</span>
                  </button>
                  <Link
                    to="/"
                    className="block text-xs font-semibold text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition pt-1"
                  >
                    &larr; Return to SilkenDrift Storefront
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* AUTHENTICATED ADMIN DASHBOARD LAYOUT */
        <div className="flex min-h-screen">
          {/* Desktop & Mobile Admin Sidebar */}
          <AdminSidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            user={user}
            onSignOut={handleSignOut}
            mobileMenuOpen={mobileMenuOpen}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
            unreadMessagesCount={messages.filter((m) => m.status === "new").length}
            subscribersCount={subscribers.filter((s) => s.status === "active").length}
            pendingReturnsCount={returnRequests.filter((r) => r.status === "pending").length}
            blogsCount={blogs.length}
            lowStockCount={products.filter((p) => (Number(p.stockCount) || 0) <= 5).length}
          />

          {/* Backdrop for mobile sidebar */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Main Workspace */}
          <div className="flex-1 md:pl-64 flex flex-col min-w-0">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 md:hidden"
                  aria-label="Open Admin Menu"
                >
                  <Bars3Icon className="size-6" />
                </button>

                <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white capitalize">
                  {currentTab === "overview"
                    ? "Overview Dashboard"
                    : currentTab === "products"
                    ? "Product Catalog"
                    : currentTab === "categories"
                    ? "Collections & Categories"
                    : currentTab === "inventory"
                    ? "Inventory & Stock Management"
                    : currentTab === "orders"
                    ? "Orders & Logistics"
                    : currentTab === "returns"
                    ? "Returns & Exchanges Management"
                    : currentTab === "blogs"
                    ? "Journal & Blog Articles"
                    : currentTab === "shipping"
                    ? "Shipping & Couriers"
                    : currentTab === "customers"
                    ? "Shoppers & Customer Accounts"
                    : currentTab === "staff"
                    ? userRole === "salesman"
                      ? "My Staff Account & Profile"
                      : "Staff & App Roles Management"
                    : currentTab === "coupons"
                    ? "Promo Codes & Discounts"
                    : currentTab === "messages"
                    ? "Customer Inquiries & Messages"
                    : currentTab === "newsletters"
                    ? "Newsletter Subscribers & VIP Club"
                    : currentTab === "legal"
                    ? "Legal Policies & Compliance"
                    : "Store Settings"}
                </h1>
                <span
                  className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${roleConfig.badgeClass}`}
                >
                  {roleConfig.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />

                <Link
                  to="/"
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition"
                  title="Preview Storefront"
                >
                  <span>Live Store</span>
                  <ArrowTopRightOnSquareIcon className="size-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={loadAllAdminData}
                  disabled={loadingData}
                  className="p-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Reload all admin datasets"
                >
                  <ArrowPathIcon
                    className={`size-4 ${loadingData ? "animate-spin text-orange-600" : ""}`}
                  />
                </button>
              </div>
            </header>

            {/* Dashboard Body Content */}
            <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
              {loadingData && products.length === 0 ? (
                <AdminDashboardSkeleton />
              ) : (
                <>
                  {currentTab === "overview" && (
                    <AdminOverviewTab
                      orders={orders}
                      products={products}
                      categories={categories}
                      customers={customers}
                      shippingProviders={shippingProviders}
                      messages={messages}
                      subscribers={subscribers}
                      onNavigateTab={handleSelectTab}
                      onOpenAddProduct={() => navigate("/admin/products/new")}
                      onOpenAddCategory={() => {
                        handleSelectTab("categories");
                        setIsAddCategoryOpen(true);
                      }}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                  )}

                  {currentTab === "products" && (
                    <AdminProductsTab
                      products={products}
                      categories={categories}
                      onRefresh={loadAllAdminData}
                      canManageProducts={userRole === "admin" || userRole === "manager"}
                    />
                  )}

                  {currentTab === "categories" && (
                    <AdminCategoriesTab
                      categories={categories}
                      products={products}
                      onRefresh={loadAllAdminData}
                      isAddModalOpen={isAddCategoryOpen}
                      onCloseAddModal={() => setIsAddCategoryOpen(false)}
                    />
                  )}

                  {currentTab === "inventory" && (
                    <AdminStockTab
                      products={products}
                      categories={categories}
                      orders={orders}
                      onRefresh={loadAllAdminData}
                      onNavigateTab={handleSelectTab}
                      adminName={user?.displayName || "Admin Atelier Desk"}
                    />
                  )}

                  {currentTab === "orders" && (
                    <AdminOrdersTab
                      orders={orders}
                      shippingProviders={shippingProviders}
                      storeSettings={storeSettings}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "returns" && (
                    <AdminReturnsTab
                      returnRequests={returnRequests}
                      policyData={returnsPolicy}
                      orders={orders}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "blogs" && (
                    <AdminBlogsTab
                      blogs={blogs}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "shipping" && (
                    <AdminShippingTab
                      shippingProviders={shippingProviders}
                      shippingSettings={shippingSettings}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {(currentTab === "customers" || currentTab === "staff") && (
                    <AdminCustomersTab
                      customers={customers}
                      onRefresh={loadAllAdminData}
                      currentAdminUid={user?.uid}
                      currentUserRole={userRole}
                      initialSubView={currentTab === "staff" ? "staff" : "customers"}
                      onSubViewChange={(sub) => handleSelectTab(sub)}
                    />
                  )}

                  {currentTab === "coupons" && (
                    <AdminCouponsTab
                      coupons={coupons}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "banners" && (
                    <AdminBannersTab
                      banners={spotlightBanners}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "messages" && (
                    <AdminMessagesTab
                      messages={messages}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "newsletters" && (
                    <AdminNewsletterTab
                      subscribers={subscribers}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "legal" && (
                    <AdminLegalTab />
                  )}

                  {currentTab === "settings" && (
                    <AdminSettingsTab
                      settings={storeSettings}
                      onRefresh={loadAllAdminData}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
      />
    </div>
  );
}
