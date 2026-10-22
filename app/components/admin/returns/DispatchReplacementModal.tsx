import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  TruckIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  TagIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest } from "~/firebase";
import { BANGLADESH_DISPATCH_COURIERS } from "./constants";

interface DispatchReplacementModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    dispatchData: {
      replacementCourier: string;
      replacementTrackingNumber: string;
      replacementItemDetails: string;
      replacementEstimatedDelivery: string;
      adminNotes: string;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const DispatchReplacementModal: React.FC<DispatchReplacementModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [courier, setCourier] = useState("Steadfast Courier");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [replacementItem, setReplacementItem] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState("24–48 hours (Dhaka Metro) / 48–72 hours (Nationwide)");
  const [notes, setNotes] = useState("Fresh replacement garment verified and dispatched via courier.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setCourier(ticket.replacementCourier || "Steadfast Courier");
      setTrackingNumber(
        ticket.replacementTrackingNumber ||
          `STF-OUT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
      );
      setReplacementItem(ticket.requestedReplacement || ticket.itemDetails);
      setDeliveryEstimate(
        ticket.zone === "inside_dhaka"
          ? "24–48 hours (Dhaka Metro Express)"
          : "48–72 hours (Nationwide 64 Districts)"
      );
      setNotes(ticket.adminNotes || "Fresh size replacement verified and dispatched from atelier.");
    }
  }, [ticket]);

  const handleGenerateTracking = () => {
    const selected = BANGLADESH_DISPATCH_COURIERS.find((c) => c.name === courier);
    const prefix = selected ? selected.defaultTrackingPrefix : "OUT";
    const newTrk = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    setTrackingNumber(newTrk);
    toast.success(`Generated Outbound Tracking: ${newTrk}`);
  };

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;
    if (!replacementItem.trim()) {
      toast.error("Please specify the replacement item details.");
      return;
    }
    if (!trackingNumber.trim()) {
      toast.error("Please provide an outbound consignment/tracking number.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          replacementCourier: courier,
          replacementTrackingNumber: trackingNumber.trim(),
          replacementItemDetails: replacementItem.trim(),
          replacementEstimatedDelivery: deliveryEstimate.trim(),
          adminNotes: notes.trim(),
        },
        openWhatsApp
      );
      onClose();
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      <TruckIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Dispatch Exchange Replacement Garment
                      </DialogTitle>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                {/* Recipient & Destination Preview */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Recipient: {ticket.customerName} ({ticket.customerPhone})
                    </span>
                    <span className="font-mono font-bold text-[10px] text-emerald-700 dark:text-emerald-400 uppercase">
                      Resolved / Exchange
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-neutral-300 flex items-start gap-1">
                    <MapPinIcon className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Deliver To: {ticket.pickupAddress}</span>
                  </p>
                </div>

                {/* Form Controls */}
                <div className="space-y-4 text-xs">
                  {/* Confirmed Replacement Item */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <TagIcon className="size-4 text-emerald-600" />
                      <span>Confirmed Replacement Garment &amp; Size *</span>
                    </label>
                    <input
                      type="text"
                      value={replacementItem}
                      onChange={(e) => setReplacementItem(e.target.value)}
                      placeholder="e.g. Raw Selvedge Denim, Size 34 (Dark Indigo)"
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold"
                      required
                    />
                  </div>

                  {/* Courier Partner Selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Outbound Courier Partner *
                    </label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                    >
                      {BANGLADESH_DISPATCH_COURIERS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} — ({c.note})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Outbound Consignment Tracking Number */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Outbound Consignment Tracking Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. STF-OUT-883192"
                        className="flex-1 p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateTracking}
                        className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 text-gray-800 dark:text-neutral-200 font-bold text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                        title="Auto-generate tracking ID"
                      >
                        <SparklesIcon className="size-4 text-emerald-600" />
                        <span>Auto-ID</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Timeline */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <CalendarDaysIcon className="size-4 text-emerald-600" />
                      <span>Estimated Delivery Timeline</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryEstimate}
                      onChange={(e) => setDeliveryEstimate(e.target.value)}
                      placeholder="24–48 hours (Dhaka Metro) / 48–72 hours (Nationwide)"
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                    />
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Tailor / Dispatch Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(false)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                      <span>Dispatch &amp; Mark Resolved</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Dispatch & Send tracking on WhatsApp"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" />
                      <span>Dispatch &amp; WhatsApp</span>
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
