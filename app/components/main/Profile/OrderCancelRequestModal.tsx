import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { Order } from "~/firebase";
import { requestOrderCancellationInFirestore } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface OrderCancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: (updatedOrder: Order) => void;
}

const CANCELLATION_REASONS = [
  "Ordered wrong size or color variation",
  "Incorrect delivery address or contact number",
  "Found an alternative product / Changed my mind",
  "Placed duplicate order by mistake",
  "Delivery timeframe does not match my schedule",
  "Payment method or billing preference change",
  "Other reason (please provide details below)",
];

export const OrderCancelRequestModal: React.FC<OrderCancelRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [reasonDetails, setReasonDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error("Please select a reason for cancellation.");
      return;
    }

    if (reasonDetails.trim().length < 8) {
      toast.error("Please provide a brief explanation (at least 8 characters) for our atelier team.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await requestOrderCancellationInFirestore(
        order.id,
        selectedReason,
        reasonDetails.trim()
      );

      toast.success(
        `Cancellation request for #${order.orderNumber} submitted. Our atelier admin team will review it promptly.`
      );
      if (updated) {
        onSuccess(updated);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to submit cancellation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isSubmitting ? () => {} : onClose}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 text-left shadow-2xl transition-all sm:my-8 w-full sm:max-w-lg p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <ExclamationTriangleIcon className="size-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
                        Request Order Cancellation
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        Order <span className="font-mono font-bold text-gray-800 dark:text-white">#{order.orderNumber}</span> • {order.items.length} garments • ৳{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                {/* Important Policy Note */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Admin Review Process</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-800/90 dark:text-amber-300/80">
                    Orders cannot be cancelled automatically once placed. Our atelier team will review your cancellation request. If your order is already packed or handed over to our courier partner ({order.courierName}), our team may contact you or decline cancellation.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Select Primary Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                    >
                      {CANCELLATION_REASONS.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Detailed Reason / Note for Atelier Admin <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reasonDetails}
                      onChange={(e) => setReasonDetails(e.target.value)}
                      placeholder="Please explain why you need to cancel this order (e.g. need size M instead of L, ordered duplicate by mistake, etc.)..."
                      className="w-full p-3.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 resize-none text-xs"
                      required
                    />
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
                      Min. 8 characters. A clear reason helps our admin process your request promptly.
                    </p>
                  </div>

                  {/* Summary of Items */}
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Order Items
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 dark:text-neutral-300 truncate max-w-[240px]">
                            {it.name} <span className="text-gray-400">(x{it.quantity})</span>
                          </span>
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">
                            ৳{(it.price * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-200 font-bold transition cursor-pointer"
                    >
                      Keep Order
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner className="size-4" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Cancel Request</span>
                      )}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default OrderCancelRequestModal;
