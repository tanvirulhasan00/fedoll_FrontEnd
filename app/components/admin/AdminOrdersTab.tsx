import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  TruckIcon,
  PrinterIcon,
  XMarkIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { Order, OrderStatus } from "~/firebase";
import { updateOrderStatusInFirestore, deleteOrderInFirestore } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminOrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | OrderStatus>("all");

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>("placed");
  const [paymentDraft, setPaymentDraft] = useState<"pending" | "paid">("pending");
  const [courierDraft, setCourierDraft] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [statusNoteDraft, setStatusNoteDraft] = useState("");

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setStatusDraft(order.orderStatus);
    setPaymentDraft(order.paymentStatus);
    setCourierDraft(order.courierName);
    setTrackingDraft(order.trackingNumber);
    setStatusNoteDraft("");
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      const updated = await updateOrderStatusInFirestore(selectedOrder.id, statusDraft, {
        paymentStatus: paymentDraft,
        courierName: courierDraft.trim(),
        trackingNumber: trackingDraft.trim(),
        note: statusNoteDraft.trim() || undefined,
      });

      toast.success(`Order #${selectedOrder.orderNumber} updated to "${statusDraft.toUpperCase()}"!`);
      if (updated) setSelectedOrder(updated);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update order.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    const confirmDelete = window.confirm(`Delete Order #${orderNumber}? This will remove it permanently.`);
    if (!confirmDelete) return;

    try {
      await deleteOrderInFirestore(id);
      toast.success(`Order #${orderNumber} deleted.`);
      if (selectedOrder?.id === id) setSelectedOrder(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete order.");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== "all" && o.orderStatus !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = o.orderNumber.toLowerCase().includes(q);
      const matchTrack = o.trackingNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      if (!matchNo && !matchTrack && !matchCustomer && !matchEmail && !matchPhone) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "placed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
      case "confirmed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
      case "processing":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
      case "shipped":
        return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "cancelled":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Orders &amp; Courier Dispatch Control
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Process incoming orders, assign logistics partners, advance milestones, and generate customer receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer"
        >
          <ArrowPathIcon className="size-4" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Toolbar & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: "All" },
            { key: "placed", label: "Placed" },
            { key: "confirmed", label: "Confirmed" },
            { key: "processing", label: "Processing" },
            { key: "shipped", label: "Shipped" },
            { key: "delivered", label: "Delivered" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === tab.key
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                  : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, customer, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
            <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Placed Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Courier &amp; Tracking</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No orders matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      #{o.orderNumber}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                        {o.customerName}
                      </div>
                      <span className="text-[11px] text-gray-400 truncate block max-w-[140px]">
                        {o.customerPhone}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-800 dark:text-neutral-200 block text-[11px]">
                        {o.courierName}
                      </span>
                      <span className="font-mono text-orange-600 dark:text-orange-400 text-[10px]">
                        {o.trackingNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      ৳{o.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="uppercase font-semibold block text-[11px]">
                        {o.paymentMethod}
                      </span>
                      <span
                        className={`text-[10px] font-bold capitalize ${
                          o.paymentStatus === "paid"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                          o.orderStatus
                        )}`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(o)}
                          className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <EyeIcon className="size-3.5" />
                          <span>Manage</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete order"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Management & Invoice Detail Modal */}
      <Transition show={!!selectedOrder} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 font-sans" onClose={handleCloseDetail}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white">
                  {selectedOrder && (
                    <div className="space-y-6">
                      {/* Modal Top Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white font-mono">
                              Order #{selectedOrder.orderNumber}
                            </DialogTitle>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(
                                selectedOrder.orderStatus
                              )}`}
                            >
                              {selectedOrder.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                            Customer: {selectedOrder.customerName} ({selectedOrder.customerEmail})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-50 transition cursor-pointer"
                            title="Print Invoice / Packing Slip"
                          >
                            <PrinterIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseDetail}
                            className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            <XMarkIcon className="size-5" />
                          </button>
                        </div>
                      </div>

                      {/* Recipient & Courier Logistics Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                            Shipping Destination:
                          </span>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {selectedOrder.shippingAddress.fullName}
                          </p>
                          <p className="text-gray-600 dark:text-neutral-300">
                            {selectedOrder.shippingAddress.streetAddress}
                          </p>
                          <p className="text-gray-600 dark:text-neutral-300">
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.district}
                          </p>
                          <p className="text-gray-500 font-mono mt-1">
                            Phone: {selectedOrder.shippingAddress.phoneNumber}
                          </p>
                          {selectedOrder.shippingAddress.notes && (
                            <p className="text-orange-600 dark:text-orange-400 italic text-[11px] mt-1">
                              Note: {selectedOrder.shippingAddress.notes}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                            Assigned Courier Logistics:
                          </span>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {selectedOrder.courierName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                              {selectedOrder.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedOrder.trackingNumber, "Tracking Code")}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <DocumentDuplicateIcon className="size-3.5" />
                            </button>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-1">
                            Estimated: {selectedOrder.estimatedDeliveryDate}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Ordered Garments ({selectedOrder.items.length})
                        </h4>
                        <div className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80"}
                                  alt={item.name}
                                  className="size-12 rounded-lg object-cover bg-stone-100"
                                />
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {item.name}
                                  </p>
                                  <span className="text-[11px] text-gray-400">
                                    Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""}{" "}
                                    {item.color ? `• Color: ${item.color}` : ""}
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white font-mono">
                                ৳{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Summary Totals */}
                        <div className="p-3 bg-stone-50 dark:bg-neutral-950 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between text-gray-500">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-gray-800 dark:text-neutral-200">
                              ৳{selectedOrder.subtotal.toLocaleString()}
                            </span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Promo Discount:</span>
                              <span>-৳{selectedOrder.discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-500">
                            <span>Courier Delivery Fee:</span>
                            <span>{selectedOrder.shippingFee === 0 ? "FREE" : `৳${selectedOrder.shippingFee}`}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-between font-bold text-sm text-gray-900 dark:text-white">
                            <span>Grand Total Amount:</span>
                            <span className="text-orange-600 dark:text-orange-400">
                              ৳{selectedOrder.totalAmount.toLocaleString()} ({selectedOrder.paymentMethod.toUpperCase()})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Update Form */}
                      <form onSubmit={handleUpdateStatus} className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-3 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-orange-900 dark:text-orange-300">
                          <ShieldCheckIcon className="size-4" />
                          <span>Admin Status &amp; Dispatch Updater</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">
                              Update Order Status:
                            </label>
                            <select
                              value={statusDraft}
                              onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-orange-300 dark:border-neutral-700 rounded-xl font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="placed">Placed</option>
                              <option value="confirmed">Confirmed &amp; Approved</option>
                              <option value="processing">Processing at Atelier</option>
                              <option value="shipped">Dispatched with Courier (Shipped)</option>
                              <option value="delivered">Delivered to Customer</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Payment Status:
                            </label>
                            <select
                              value={paymentDraft}
                              onChange={(e) => setPaymentDraft(e.target.value as any)}
                              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-orange-300 dark:border-neutral-700 rounded-xl font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="pending">Pending (COD on arrival)</option>
                              <option value="paid">Paid (bKash / Card Verified)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">
                              Assigned Courier Name:
                            </label>
                            <input
                              type="text"
                              value={courierDraft}
                              onChange={(e) => setCourierDraft(e.target.value)}
                              placeholder="Steadfast Courier / Pathao Express"
                              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-orange-300 dark:border-neutral-700 rounded-xl focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">
                              Tracking Code:
                            </label>
                            <input
                              type="text"
                              value={trackingDraft}
                              onChange={(e) => setTrackingDraft(e.target.value)}
                              placeholder="TRK-BDXXXXXXX"
                              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-orange-300 dark:border-neutral-700 rounded-xl font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {isUpdating && <Spinner className="size-3.5 text-white" />}
                            <span>Save Status &amp; Push Milestone Updates</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminOrdersTab;
