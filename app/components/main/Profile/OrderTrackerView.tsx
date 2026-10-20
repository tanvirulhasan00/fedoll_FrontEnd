import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { Order, OrderTrackingTimelineStep } from "~/firebase";
import OrderCancelRequestModal from "./OrderCancelRequestModal";

export interface OrderTrackerViewProps {
  order: Order;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({
  order: initialOrder,
  onRefresh,
  isRefreshing = false,
}) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

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
          text: "Confirmed & Approved",
        };
      case "processing":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          text: "Tailoring & Quality Check",
        };
      case "shipped":
        return {
          bg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          text: "Out for Courier Delivery",
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

  const badge = getStatusBadge(order.orderStatus);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-gray-500 dark:text-neutral-400">
              Order #{order.orderNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
            >
              {badge.text}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            Live Package Tracking
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Estimated Delivery Date:{" "}
            <strong className="text-gray-900 dark:text-white">
              {order.estimatedDeliveryDate}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["placed", "confirmed", "processing"].includes(order.orderStatus) &&
            !order.cancellationRequest && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition cursor-pointer"
              >
                <span>Request Cancellation</span>
              </button>
            )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 transition cursor-pointer"
              title="Refresh tracking status"
            >
              <ArrowPathIcon
                className={`size-4 ${isRefreshing ? "animate-spin text-orange-600" : ""}`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => copyToClipboard(order.trackingNumber, "Tracking code")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-xs font-semibold text-gray-800 dark:text-neutral-200 transition cursor-pointer font-mono"
          >
            <span>{order.trackingNumber}</span>
            <DocumentDuplicateIcon className="size-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Cancellation Request Alert Banner if Active */}
      {order.cancellationRequest?.status === "pending" && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Cancellation Request Pending Admin Review</span>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            You submitted a cancellation request for reason: <strong>"{order.cancellationRequest.reason}"</strong>
            {order.cancellationRequest.details ? ` ("${order.cancellationRequest.details}")` : ""}.
            Our atelier admin team will review whether packaging or courier handover has begun.
          </p>
        </div>
      )}

      {order.cancellationRequest?.status === "rejected" && (
        <div className="p-4 rounded-2xl bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-xs text-stone-700 dark:text-neutral-300 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <ExclamationTriangleIcon className="size-4 shrink-0 text-stone-500" />
            <span>Cancellation Request Declined by Admin</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-neutral-400 leading-relaxed">
            {order.cancellationRequest.adminNote ||
              "Your cancellation request was reviewed and declined. Dispatch and delivery are proceeding."}
          </p>
        </div>
      )}

      {/* Courier & Dispatch Partner Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-950/60 border border-stone-200/60 dark:border-neutral-800 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0">
            <TruckIcon className="size-5" />
          </div>
          <div>
            <span className="text-gray-500 dark:text-neutral-400 block text-[11px]">
              Assigned Logistics Partner:
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {order.courierName &&
              order.courierName !== "Pending Assignment" &&
              order.courierName !== "Unassigned" ? (
                order.courierName
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending Atelier Assignment
                </span>
              )}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Nationwide 64 Districts Express Delivery
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <MapPinIcon className="size-5" />
          </div>
          <div>
            <span className="text-gray-500 dark:text-neutral-400 block text-[11px]">
              Destination Address:
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-gray-600 dark:text-neutral-300 text-[11px] line-clamp-1">
              {order.shippingAddress.streetAddress}, {order.shippingAddress.city}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <span className="text-gray-500 dark:text-neutral-400 block text-[11px]">
              Payment & Security:
            </span>
            <p className="font-bold text-gray-900 dark:text-white uppercase">
              {order.paymentMethod} • ৳{order.totalAmount.toLocaleString()}
            </p>
            <span className="text-[11px] text-gray-500 dark:text-neutral-400 capitalize">
              Status: {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Tracking Milestones Timeline */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
          Tracking Journey & Milestones
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-neutral-800">
          {order.trackingTimeline.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = step.isCurrent;

            return (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Milestone Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 size-5 sm:size-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-neutral-900 transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-orange-600 text-white animate-pulse"
                      : "bg-stone-200 dark:bg-neutral-800 text-stone-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="size-3.5 sm:size-4" />
                  ) : (
                    <span className="size-2 rounded-full bg-white dark:bg-neutral-900" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4
                      className={`text-sm font-bold ${
                        isCompleted || isCurrent
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-neutral-500"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
                      {step.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-neutral-400">
                    {step.description}
                  </p>

                  {step.location && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-500 pt-0.5">
                      <MapPinIcon className="size-3 text-orange-500" />
                      <span>{step.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Package Contents Preview */}
      <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
          Package Contents ({order.items.length} items)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800"
            >
              <img
                src={
                  item.image ||
                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=150&q=80"
                }
                alt={item.name}
                className="size-14 rounded-lg object-cover bg-stone-200 dark:bg-neutral-800 shrink-0"
              />
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                  Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""}{" "}
                  {item.color ? `• Color: ${item.color}` : ""}
                </p>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Returns & Exchanges Banner for Delivered / Active Orders */}
        <div className="mt-5 pt-4 border-t border-stone-200/60 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/70 dark:bg-neutral-900/60 p-4 rounded-xl">
          <div className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-neutral-300">
            <ShieldCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Need a Size Exchange or Return?</p>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                7-day doorstep size replacement across all 64 districts in Bangladesh.
              </p>
            </div>
          </div>
          <Link
            to={`/returns-and-exchanges?order=${encodeURIComponent(order.orderNumber)}&tab=request`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
          >
            <ArrowPathIcon className="size-3.5" />
            <span>Exchange / Return Item</span>
          </Link>
        </div>
      </div>

      {/* Cancellation Request Modal */}
      <OrderCancelRequestModal
        isOpen={isCancelModalOpen}
        order={order}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={(updated) => {
          setOrder(updated);
          setIsCancelModalOpen(false);
          onRefresh?.();
        }}
      />
    </div>
  );
};

export default OrderTrackerView;
