import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest } from "~/firebase";

interface RejectTicketModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    rejectionData: {
      reason: string;
      adminNotes: string;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const RejectTicketModal: React.FC<RejectTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("Return window of 7 calendar days has expired");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setReason("Return window of 7 calendar days has expired");
      setNotes("");
    }
  }, [ticket]);

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          reason,
          adminNotes: notes.trim()
            ? `Rejected: ${reason}. Remark: ${notes.trim()}`
            : `Rejected: ${reason}`,
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
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      <XCircleIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Decline Return / Exchange Request
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

                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 text-xs space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white">
                    Customer: {ticket.customerName} ({ticket.customerPhone})
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    Item: <strong>{ticket.itemDetails}</strong> • Customer reason: &quot;{ticket.reason}&quot;
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Primary Rejection Ground *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                    >
                      <option value="Return window of 7 calendar days has expired">
                        Return window of 7 calendar days has expired
                      </option>
                      <option value="Garment has been worn, washed, or altered">
                        Garment has been worn, washed, or altered
                      </option>
                      <option value="Original woven tags, barcode labels or security seals removed">
                        Original woven tags, barcode labels or security seals removed
                      </option>
                      <option value="Noticeable perfume, detergent fragrance, or cosmetic stains">
                        Noticeable perfume, detergent fragrance, or cosmetic stains
                      </option>
                      <option value="Item is non-returnable bespoke / custom monographed piece">
                        Item is non-returnable bespoke / custom monographed piece
                      </option>
                      <option value="Physical damage caused by mishandling rather than manufacturing flaw">
                        Physical damage caused by mishandling rather than manufacturing flaw
                      </option>
                      <option value="Other policy guideline exemption">
                        Other policy guideline exemption
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Additional Customer Explanation &amp; Internal Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add specific details to share with the customer..."
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                    />
                  </div>
                </div>

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
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <XCircleIcon className="size-4" />
                      )}
                      <span>Decline Request</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Decline & Send explanation via WhatsApp"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" />
                      <span>Decline &amp; WhatsApp</span>
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
