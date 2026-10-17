import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import {
  fetchOrderByTrackingOrNumber,
  fetchCustomerOrders,
  type Order,
} from "~/firebase";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  TruckIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "~/components/ui/spinner";
import OrderTrackerView from "~/components/main/Profile/OrderTrackerView";
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Track Courier Order | Fedoll" },
    {
      name: "description",
      content:
        "Track your Fedoll apparel parcel live with Steadfast and Pathao express courier across Bangladesh.",
    },
  ];
}

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("tracking") || searchParams.get("order") || ""
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Search function
  const handleSearch = async (queryToSearch?: string) => {
    const code = (queryToSearch || searchQuery).trim().toUpperCase();
    if (!code) {
      toast.error("Please enter your Order Number or Tracking ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const found = await fetchOrderByTrackingOrNumber(code);
      if (found) {
        setOrder(found);
        setSearchParams({ tracking: code });
      } else {
        setError(
          `No shipment found matching "${code}". Please double-check your Order Number (e.g. FED-123456) or Courier Tracking Code.`
        );
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to search courier database.");
    } finally {
      setLoading(false);
    }
  };

  // If user is authenticated, load their recent orders for 1-click tracking
  useEffect(() => {
    if (user?.uid) {
      fetchCustomerOrders(user.uid)
        .then((orders) => {
          setRecentOrders(orders);
          // If no search query yet and user has active orders, track the latest one
          if (!searchQuery && orders.length > 0) {
            setSearchQuery(orders[0].orderNumber);
            setOrder(orders[0]);
          }
        })
        .catch(console.warn);
    }
  }, [user?.uid]);

  // Handle URL tracking param on mount
  useEffect(() => {
    const trackingFromUrl =
      searchParams.get("tracking") || searchParams.get("order");
    if (trackingFromUrl) {
      setSearchQuery(trackingFromUrl);
      handleSearch(trackingFromUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      <Topbar />
      <Header />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
              <TruckIcon className="size-4" />
              <span>Doorstep Delivery Network (Bangladesh)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
              Track Your Courier Order
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
              Real-time milestone updates from our Dhaka atelier to your doorstep.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-md p-6 sm:p-8 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Order # (e.g. FED-849201) or Tracking (e.g. TRK-BD749182)"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Spinner className="size-4 text-white" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <TruckIcon className="size-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Pick recent user orders */}
            {isAuthenticated && recentOrders.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400 text-[11px]">
                  Your recent orders:
                </span>
                {recentOrders.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(o.orderNumber);
                      setOrder(o);
                      setSearchParams({ tracking: o.orderNumber });
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      order?.id === o.id
                        ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800"
                        : "bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-stone-200"
                    }`}
                  >
                    #{o.orderNumber}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <QuestionMarkCircleIcon className="size-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Results: Order Tracker View */}
          {order && (
            <div className="space-y-4">
              <OrderTrackerView
                order={order}
                onRefresh={() => handleSearch(order.orderNumber)}
                isRefreshing={loading}
              />

              {isAuthenticated && (
                <div className="text-center pt-2">
                  <Link
                    to="/profile?tab=orders"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <span>View all your past orders in Customer Profile</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Help & Support Info Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 text-xs space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-emerald-600" />
              <span>Fedoll Courier &amp; Role-Based Shopping Policy</span>
            </h4>
            <p className="text-gray-500 dark:text-neutral-400 leading-relaxed text-[11px]">
              Orders in Dhaka metropolitan area are delivered within 24 to 48 hours. Orders across
              all other 63 districts arrive within 2 to 4 business days via Steadfast Courier and Pathao Express.
              Only verified registered customers can place orders and modify delivery addresses.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
