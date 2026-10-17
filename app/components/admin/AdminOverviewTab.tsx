import React from "react";
import {
  BanknotesIcon,
  ShoppingBagIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Order, OrderStatus } from "~/firebase";
import type { ProductItem, ProductCategoryItem } from "~/firebase";
import type { FirestoreUserProfile } from "~/firebase";
import type { ShippingProvider } from "~/firebase";
import type { AdminTab } from "./AdminSidebar";

interface AdminOverviewTabProps {
  orders: Order[];
  products: ProductItem[];
  categories: ProductCategoryItem[];
  customers: FirestoreUserProfile[];
  shippingProviders: ShippingProvider[];
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  orders,
  products,
  categories,
  customers,
  shippingProviders,
  onNavigateTab,
  onOpenAddProduct,
  onOpenAddCategory,
  onUpdateOrderStatus,
}) => {
  // Financial computations
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter((o) =>
    ["placed", "confirmed", "processing"].includes(o.orderStatus)
  );
  const shippedOrders = orders.filter((o) => o.orderStatus === "shipped");
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");
  const outOfStockCount = products.filter((p) => !p.inStock || (p.stockCount !== undefined && p.stockCount <= 0)).length;

  const activeCouriersCount = shippingProviders.filter((p) => p.active).length;

  const kpis = [
    {
      label: "Total Gross Revenue",
      value: `৳${totalRevenue.toLocaleString()}`,
      change: "+18.4% this month",
      icon: BanknotesIcon,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Customer Orders",
      value: orders.length,
      subValue: `${pendingOrders.length} pending / in-prep`,
      icon: ClipboardDocumentCheckIcon,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    {
      label: "Garment Catalog",
      value: products.length,
      subValue: outOfStockCount > 0 ? `${outOfStockCount} low/out of stock` : "All items in stock",
      icon: ShoppingBagIcon,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    },
    {
      label: "Registered Customers",
      value: customers.length > 0 ? customers.length : 1,
      subValue: "Role-based accounts",
      icon: UsersIcon,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-orange-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold mb-2 border border-orange-500/30">
            <ArrowTrendingUpIcon className="size-3.5" />
            <span>Store Command Center</span>
          </span>
          <h1 className="text-2xl font-black text-white">
            Atelier Executive Overview
          </h1>
          <p className="text-xs text-stone-300 mt-1 max-w-xl">
            Real-time control over products, orders, courier shipping providers, customer roles, and store configurations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>New Product</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs border border-stone-700 transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  {kpi.label}
                </span>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="size-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {kpi.value}
                </span>
                <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
                  {kpi.change || kpi.subValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logistics & Operational Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-neutral-400">
            <span>COURIER PROVIDERS</span>
            <button
              type="button"
              onClick={() => onNavigateTab("shipping")}
              className="text-orange-600 hover:underline text-[11px]"
            >
              Manage &rarr;
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {activeCouriersCount} Active Providers
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Steadfast, Pathao &amp; RedX integrated for nationwide delivery.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-neutral-400">
            <span>IN TRANSIT</span>
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="text-orange-600 hover:underline text-[11px]"
            >
              Track Orders &rarr;
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-orange-600 dark:text-orange-400">
              {shippedOrders.length} Shipments on Road
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {deliveredOrders.length} successfully delivered this period.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-neutral-400">
            <span>PRODUCT CATEGORIES</span>
            <button
              type="button"
              onClick={() => onNavigateTab("categories")}
              className="text-orange-600 hover:underline text-[11px]"
            >
              View All &rarr;
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {categories.length} Collections
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Outerwear, Workwear, Denim, Knitwear &amp; Essentials.
          </p>
        </div>
      </div>

      {/* Recent Orders Live Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Live orders submitted by registered customers with courier assignments
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
          >
            View All ({orders.length}) &rarr;
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
              <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total (BDT)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                        {order.customerName}
                      </div>
                      <span className="text-[11px] text-gray-400 truncate block max-w-[140px]">
                        {order.customerPhone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.totalQuantity} pcs ({order.items.length} garments)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      ৳{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.orderStatus === "delivered"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : order.orderStatus === "shipped"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                            : order.orderStatus === "cancelled"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus: OrderStatus =
                              order.orderStatus === "placed"
                                ? "confirmed"
                                : order.orderStatus === "confirmed"
                                ? "processing"
                                : order.orderStatus === "processing"
                                ? "shipped"
                                : "delivered";
                            onUpdateOrderStatus(order.id, nextStatus);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-bold hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition cursor-pointer"
                        >
                          Advance &rarr;
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverviewTab;
