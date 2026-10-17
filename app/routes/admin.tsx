import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { setUser, updateUserProfile } from "~/redux/features/auth/authSlice";
import {
  fetchProductsFromFirestore,
  fetchCategoriesFromFirestore,
  fetchAllOrdersForAdmin,
  updateOrderStatusInFirestore,
  fetchShippingProviders,
  fetchShippingSettings,
  fetchAllCustomersFromFirestore,
  updateCustomerRoleInFirestore,
  fetchCouponsFromFirestore,
  fetchStoreSettings,
  fetchContactMessagesFromFirestore,
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
  defaultShippingSettings,
  defaultStoreSettings,
} from "~/firebase";
import AdminSidebar, { type AdminTab } from "~/components/admin/AdminSidebar";
import AdminOverviewTab from "~/components/admin/AdminOverviewTab";
import AdminProductsTab from "~/components/admin/AdminProductsTab";
import AdminCategoriesTab from "~/components/admin/AdminCategoriesTab";
import AdminOrdersTab from "~/components/admin/AdminOrdersTab";
import AdminShippingTab from "~/components/admin/AdminShippingTab";
import AdminCustomersTab from "~/components/admin/AdminCustomersTab";
import AdminCouponsTab from "~/components/admin/AdminCouponsTab";
import AdminMessagesTab from "~/components/admin/AdminMessagesTab";
import AdminSettingsTab from "~/components/admin/AdminSettingsTab";
import {
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import ThemeToggle from "~/components/main/Utilities/ThemeToggle";
import { AuthModal } from "~/components/main/Auth/AuthModal";

export function meta() {
  return [
    { title: "Admin Atelier Dashboard | Fedoll eCommerce" },
    {
      name: "description",
      content:
        "Full controlled admin dashboard for Fedoll: products, categories, orders, shipping providers, customer roles, and store settings.",
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

  const validTabs: AdminTab[] = [
    "overview",
    "products",
    "categories",
    "orders",
    "shipping",
    "customers",
    "coupons",
    "messages",
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
  const [grantingAdmin, setGrantingAdmin] = useState(false);

  // Datasets
  const [loadingData, setLoadingData] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [customers, setCustomers] = useState<FirestoreUserProfile[]>([]);
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreGeneralSettings>(defaultStoreSettings);

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
        fetchedStoreSettings,
        fetchedMessages,
      ] = await Promise.all([
        fetchAllOrdersForAdmin(),
        fetchProductsFromFirestore(),
        fetchCategoriesFromFirestore(),
        fetchAllCustomersFromFirestore(),
        fetchShippingProviders(),
        fetchShippingSettings(),
        fetchCouponsFromFirestore(),
        fetchStoreSettings(),
        fetchContactMessagesFromFirestore(),
      ]);

      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setCustomers(fetchedCustomers);
      setShippingProviders(fetchedProviders);
      setShippingSettings(fetchedShipSettings);
      setCoupons(fetchedCoupons);
      setStoreSettings(fetchedStoreSettings);
      setMessages(fetchedMessages);
    } catch (err) {
      console.warn("Error loading admin datasets:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

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

  const handleGrantAdminAccess = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setGrantingAdmin(true);
    try {
      await updateCustomerRoleInFirestore(user.uid, "admin");
      dispatch(updateUserProfile({ role: "admin" }));
      toast.success(`🎉 Administrator privileges activated for ${user.displayName || user.email}!`);
      await loadAllAdminData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not grant admin access.");
    } finally {
      setGrantingAdmin(false);
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

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      {/* ACCESS CONTROL GATE: If user is not authenticated or not an admin */}
      {!isAdmin ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-2xl p-8 sm:p-10 text-center space-y-6">
            <div className="size-20 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center ring-8 ring-orange-50 dark:ring-orange-950/30">
              <ShieldCheckIcon className="size-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
                Restricted Admin Access
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                Fedoll Atelier Admin Portal
              </h1>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Full-controlled administration to manage product catalogs, collections, customer orders, shipping providers (Steadfast, Pathao), customer roles, and store configurations.
              </p>
            </div>

            {/* If logged in as customer, give 1-click admin promotion button */}
            {user ? (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Logged in as:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Current Role:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold uppercase text-[10px]">
                    {user.role || "customer"}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={grantingAdmin}
                    onClick={handleGrantAdminAccess}
                    className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {grantingAdmin ? (
                      <Spinner className="size-4 text-white" />
                    ) : (
                      <>
                        <SparklesIcon className="size-4" />
                        <span>Activate Full Administrator Privileges</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    Clicking unlocks full administrative control over all products, orders, and couriers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LockClosedIcon className="size-4" />
                  <span>Log In to Access Admin Dashboard</span>
                </button>
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/"
                className="text-xs font-semibold text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
              >
                &larr; Return to Fedoll Storefront
              </Link>
            </div>
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
                    : currentTab === "orders"
                    ? "Orders & Logistics"
                    : currentTab === "shipping"
                    ? "Shipping & Couriers"
                    : currentTab === "customers"
                    ? "Customer Accounts"
                    : currentTab === "coupons"
                    ? "Promo Codes & Discounts"
                    : currentTab === "messages"
                    ? "Customer Inquiries & Messages"
                    : "Store Settings"}
                </h1>
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
                <div className="py-32 text-center space-y-3">
                  <Spinner className="size-8 text-orange-600 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">
                    Loading Fedoll Atelier management records...
                  </p>
                </div>
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
                      onNavigateTab={handleSelectTab}
                      onOpenAddProduct={() => setIsAddProductOpen(true)}
                      onOpenAddCategory={() => setIsAddCategoryOpen(true)}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                  )}

                  {currentTab === "products" && (
                    <AdminProductsTab
                      products={products}
                      categories={categories}
                      onRefresh={loadAllAdminData}
                      isAddModalOpen={isAddProductOpen}
                      onCloseAddModal={() => setIsAddProductOpen(false)}
                    />
                  )}

                  {currentTab === "categories" && (
                    <AdminCategoriesTab
                      categories={categories}
                      onRefresh={loadAllAdminData}
                      isAddModalOpen={isAddCategoryOpen}
                      onCloseAddModal={() => setIsAddCategoryOpen(false)}
                    />
                  )}

                  {currentTab === "orders" && (
                    <AdminOrdersTab
                      orders={orders}
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

                  {currentTab === "customers" && (
                    <AdminCustomersTab
                      customers={customers}
                      onRefresh={loadAllAdminData}
                      currentAdminUid={user?.uid}
                    />
                  )}

                  {currentTab === "coupons" && (
                    <AdminCouponsTab
                      coupons={coupons}
                      onRefresh={loadAllAdminData}
                    />
                  )}

                  {currentTab === "messages" && (
                    <AdminMessagesTab
                      messages={messages}
                      onRefresh={loadAllAdminData}
                    />
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
