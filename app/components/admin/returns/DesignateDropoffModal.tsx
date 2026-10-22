import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest, ReturnsExchangesData } from "~/firebase";
import { FEDOLL_DROP_OFF_HUBS } from "./constants";

interface DesignateDropoffModalProps {
  ticket: ReturnExchangeRequest | null;
  policy: ReturnsExchangesData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    dropoffData: {
      dropoffHubName: string;
      dropoffHubAddress: string;
      dropoffHubPhone: string;
      dropoffHubHours: string;
      dropoffDeadline: string;
      dropoffInstructions: string;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const DesignateDropoffModal: React.FC<DesignateDropoffModalProps> = ({
  ticket,
  policy,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedHubId, setSelectedHubId] = useState("uttara_flagship");
  const [hubName, setHubName] = useState("");
  const [hubAddress, setHubAddress] = useState("");
  const [hubPhone, setHubPhone] = useState("");
  const [hubHours, setHubHours] = useState("");
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      const defaultHub = FEDOLL_DROP_OFF_HUBS[0];
      setSelectedHubId(
        FEDOLL_DROP_OFF_HUBS.find((h) => h.name === ticket.dropoffHubName)?.id || "uttara_flagship"
      );
      setHubName(ticket.dropoffHubName || defaultHub.name);
      setHubAddress(ticket.dropoffHubAddress || defaultHub.address);
      setHubPhone(ticket.dropoffHubPhone || defaultHub.phone);
      setHubHours(ticket.dropoffHubHours || defaultHub.hours);

      // Default 5 days from today
      const fiveDaysLater = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
      setDeadline(ticket.dropoffDeadline || fiveDaysLater);
      setInstructions(
        ticket.dropoffInstructions ||
          `Please bring the item in the original Fedoll parcel bag with all woven tags attached. Present Return Ticket #${ticket.ticketNumber} at the concierge desk.`
      );
    }
  }, [ticket, policy]);

  const handleSelectHubPreset = (hubId: string) => {
    setSelectedHubId(hubId);
    if (hubId === "custom") {
      setHubName("Custom Drop-Off Point");
      setHubAddress("");
      setHubPhone(policy.supportHotline);
      setHubHours("Saturday – Thursday, 10:00 AM – 06:00 PM");
      return;
    }
    const found = FEDOLL_DROP_OFF_HUBS.find((h) => h.id === hubId);
    if (found) {
      setHubName(found.name);
      setHubAddress(found.address);
      setHubPhone(found.phone);
      setHubHours(found.hours);
    }
  };

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;
    if (!hubName.trim() || !hubAddress.trim()) {
      toast.error("Please provide both Hub Name and Address.");
      return;
    }
    if (!deadline) {
      toast.error("Please specify a drop-off deadline date.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          dropoffHubName: hubName.trim(),
          dropoffHubAddress: hubAddress.trim(),
          dropoffHubPhone: hubPhone.trim(),
          dropoffHubHours: hubHours.trim(),
          dropoffDeadline: deadline,
          dropoffInstructions: instructions.trim(),
        },
        openWhatsApp
      );
      onClose();
    } catch {
      // Error handled by parent
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
                    <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                      <BuildingStorefrontIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-sky-700 dark:text-sky-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Designate Customer Drop-Off Hub
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

                {/* Customer Info */}
                <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {ticket.customerName} ({ticket.customerPhone})
                    </span>
                    <span className="font-mono uppercase font-bold text-[10px] text-sky-700 dark:text-sky-400">
                      {ticket.zone === "inside_dhaka" ? "Dhaka Metro" : "Nationwide Customer"}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-neutral-300">
                    Item: <strong>{ticket.itemDetails}</strong> {ticket.requestedReplacement ? `• Target: ${ticket.requestedReplacement}` : ""}
                  </p>
                </div>

                {/* Form Controls */}
                <div className="space-y-4 text-xs">
                  {/* Select Hub Preset */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Select Drop-Off Location / Store *
                    </label>
                    <select
                      value={selectedHubId}
                      onChange={(e) => handleSelectHubPreset(e.target.value)}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                    >
                      {FEDOLL_DROP_OFF_HUBS.map((hub) => (
                        <option key={hub.id} value={hub.id}>
                          {hub.name} ({hub.city})
                        </option>
                      ))}
                      <option value="custom">Custom Drop-Off Hub / Branch...</option>
                    </select>
                  </div>

                  {/* Hub Name & Desk Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Hub Location Title *
                      </label>
                      <input
                        type="text"
                        value={hubName}
                        onChange={(e) => setHubName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <PhoneIcon className="size-3.5 text-sky-600" />
                        <span>Desk Contact Number</span>
                      </label>
                      <input
                        type="text"
                        value={hubPhone}
                        onChange={(e) => setHubPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <MapPinIcon className="size-4 text-sky-600" />
                      <span>Full Hub Address &amp; Directions *</span>
                    </label>
                    <textarea
                      rows={2}
                      value={hubAddress}
                      onChange={(e) => setHubAddress(e.target.value)}
                      placeholder="e.g. House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230"
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      required
                    />
                  </div>

                  {/* Hours & Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <ClockIcon className="size-3.5 text-sky-600" />
                        <span>Visiting Hours</span>
                      </label>
                      <input
                        type="text"
                        value={hubHours}
                        onChange={(e) => setHubHours(e.target.value)}
                        placeholder="Sat - Thu: 10:00 AM - 08:30 PM"
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <CalendarDaysIcon className="size-3.5 text-sky-600" />
                        <span>Drop-Off Deadline Date *</span>
                      </label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                        required
                      />
                    </div>
                  </div>

                  {/* Customer Instructions */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Customer Instructions (Sent via WhatsApp &amp; Track Page)
                    </label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
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
                      className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                      <span>Set Drop-Off Location</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Save & Send Hub Address via WhatsApp"
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
