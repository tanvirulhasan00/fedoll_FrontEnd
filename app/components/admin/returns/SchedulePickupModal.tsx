import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  TruckIcon,
  CalendarDaysIcon,
  ClockIcon,
  BanknotesIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest, ReturnsExchangesData } from "~/firebase";
import { BANGLADESH_REVERSE_COURIERS, getReturnWhatsAppUrl } from "./constants";

interface SchedulePickupModalProps {
  ticket: ReturnExchangeRequest | null;
  policy: ReturnsExchangesData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    pickupData: {
      reverseCourier: string;
      reverseTrackingNumber: string;
      pickupDate: string;
      pickupTimeSlot: string;
      pickupFee: number;
      pickupFeeStatus: "pending_cod" | "paid_bkash" | "waived_defect";
      pickupInstructions: string;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const SchedulePickupModal: React.FC<SchedulePickupModalProps> = ({
  ticket,
  policy,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [courier, setCourier] = useState("Steadfast Courier Reverse Logistics");
  const [consignmentId, setConsignmentId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("Morning (10:00 AM - 02:00 PM)");
  const [fee, setFee] = useState<number>(60);
  const [feeStatus, setFeeStatus] = useState<"pending_cod" | "paid_bkash" | "waived_defect">("pending_cod");
  const [instructions, setInstructions] = useState(
    "Customer phone verified. Collect 1 sealed Fedoll parcel with tags intact."
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setCourier(ticket.reverseCourier || "Steadfast Courier Reverse Logistics");
      setConsignmentId(
        ticket.reverseTrackingNumber ||
          `STF-REV-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`
      );

      // Default tomorrow's date
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      setPickupDate(ticket.pickupDate || tomorrow);
      setPickupSlot(ticket.pickupTimeSlot || "Morning (10:00 AM - 02:00 PM)");

      const defaultFee =
        ticket.type === "defective_replacement"
          ? 0
          : ticket.zone === "inside_dhaka"
          ? policy.exchangeFeeInsideDhaka
          : policy.exchangeFeeOutsideDhaka;

      setFee(ticket.pickupFee ?? defaultFee);
      setFeeStatus(
        ticket.type === "defective_replacement"
          ? "waived_defect"
          : ticket.pickupFeeStatus || "pending_cod"
      );
      setInstructions(
        ticket.pickupInstructions ||
          "Customer phone verified. Hand over 1 sealed Fedoll garment parcel with barcode tags intact."
      );
    }
  }, [ticket, policy]);

  const handleGenerateId = () => {
    const selected = BANGLADESH_REVERSE_COURIERS.find((c) => c.name === courier);
    const prefix = selected ? selected.defaultTrackingPrefix : "REV";
    const newId = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    setConsignmentId(newId);
    toast.success(`Generated Consignment ID: ${newId}`);
  };

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;
    if (!consignmentId.trim()) {
      toast.error("Please provide a Reverse Consignment / Tracking ID.");
      return;
    }
    if (!pickupDate) {
      toast.error("Please select a scheduled pickup date.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          reverseCourier: courier,
          reverseTrackingNumber: consignmentId.trim(),
          pickupDate,
          pickupTimeSlot: pickupSlot,
          pickupFee: Number(fee) || 0,
          pickupFeeStatus: feeStatus,
          pickupInstructions: instructions.trim(),
        },
        openWhatsApp
      );
      onClose();
    } catch {
      // Error handled by parent toast
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
                    <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <TruckIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Schedule Doorstep Reverse Pickup
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

                {/* Customer Address Preview */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {ticket.customerName} ({ticket.customerPhone})
                    </span>
                    <span className="font-mono uppercase font-bold text-[10px] text-purple-700 dark:text-purple-400">
                      {ticket.zone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-neutral-300">
                    Pickup Address: <strong>{ticket.pickupAddress}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Garment: {ticket.itemDetails} {ticket.requestedReplacement ? `→ Swap to: ${ticket.requestedReplacement}` : ""}
                  </p>
                </div>

                {/* Form Controls */}
                <div className="space-y-4 text-xs">
                  {/* Courier Partner Selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Reverse Courier Partner *
                    </label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                    >
                      {BANGLADESH_REVERSE_COURIERS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} — ({c.note})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Consignment Number */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Reverse Consignment / Tracking Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={consignmentId}
                        onChange={(e) => setConsignmentId(e.target.value)}
                        placeholder="e.g. STF-REV-98214"
                        className="flex-1 p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateId}
                        className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 text-gray-800 dark:text-neutral-200 font-bold text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                        title="Auto-generate tracking ID"
                      >
                        <SparklesIcon className="size-4 text-purple-600" />
                        <span>Auto-ID</span>
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <CalendarDaysIcon className="size-4 text-purple-600" />
                        <span>Scheduled Pickup Date *</span>
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <ClockIcon className="size-4 text-purple-600" />
                        <span>Pickup Time Window</span>
                      </label>
                      <select
                        value={pickupSlot}
                        onChange={(e) => setPickupSlot(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 cursor-pointer"
                      >
                        <option value="Morning (10:00 AM - 02:00 PM)">Morning (10:00 AM - 02:00 PM)</option>
                        <option value="Afternoon (02:00 PM - 06:00 PM)">Afternoon (02:00 PM - 06:00 PM)</option>
                        <option value="Full Day (10:00 AM - 07:00 PM)">Full Day (10:00 AM - 07:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Logistics Fee & Settlement */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200/80 dark:border-neutral-700/80">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1">
                        <BanknotesIcon className="size-4 text-emerald-600" />
                        <span>Reverse Courier Fee (৳)</span>
                      </label>
                      <input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(Number(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Fee Payment Status
                      </label>
                      <select
                        value={feeStatus}
                        onChange={(e) => setFeeStatus(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                      >
                        <option value="pending_cod">COD — Customer pays rider (৳{fee})</option>
                        <option value="paid_bkash">Already Paid via bKash</option>
                        <option value="waived_defect">100% Waived (Defect Guarantee)</option>
                      </select>
                    </div>
                  </div>

                  {/* Rider Instructions */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Rider &amp; Hub Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Call customer before arrival. Check 1 polybag with original Fedoll barcode."
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
                      className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                      <span>Confirm Reverse Pickup</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Save & Notify customer on WhatsApp"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" />
                      <span>Save &amp; WhatsApp</span>
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
