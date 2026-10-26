import React from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  PhoneIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest } from "~/firebase";

interface DeleteReturnTicketModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticket: ReturnExchangeRequest) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteReturnTicketModal: React.FC<DeleteReturnTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!ticket) return null;

  const handleConfirm = async () => {
    if (!ticket || isDeleting) return;
    await onConfirm(ticket);
  };

  const isRefund = ticket.type === "refund";

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-sans"
        onClose={() => !isDeleting && onClose()}
      >
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
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 space-y-5 text-gray-900 dark:text-white">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50 dark:ring-rose-950/20">
                      <ExclamationTriangleIcon className="size-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                        Delete Return Ticket
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        This action permanently deletes this return ticket from Firestore.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={onClose}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                {/* Ticket Details Preview Box */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-gray-900 dark:text-white">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-neutral-400">
                        Order #{ticket.orderNumber}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isRefund
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {isRefund ? (
                        <>
                          <BanknotesIcon className="size-3" />
                          <span>Refund</span>
                        </>
                      ) : (
                        <>
                          <ArrowPathRoundedSquareIcon className="size-3" />
                          <span>Exchange</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-neutral-300">
                      <ShoppingBagIcon className="size-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold truncate">{ticket.itemDetails}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-400">
                      <PhoneIcon className="size-3.5 text-gray-400 shrink-0" />
                      <span>{ticket.customerName} ({ticket.customerPhone})</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 dark:border-neutral-700/60 text-[11px] text-gray-500 dark:text-neutral-400">
                    <span>Reason: </span>
                    <span className="italic text-gray-700 dark:text-neutral-300">&quot;{ticket.reason}&quot;</span>
                  </div>

                  {ticket.refundAmount ? (
                    <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      <span>Refund Value:</span>
                      <span>৳{ticket.refundAmount.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                {/* Warning Alert */}
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                  Are you sure you want to permanently delete ticket{" "}
                  <strong className="font-bold">{ticket.ticketNumber}</strong>? Once deleted, all reverse courier consignments, inspection notes, and refund records for this request cannot be recovered.
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirm}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner className="size-3.5 text-white" />
                        <span>Deleting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="size-3.5" />
                        <span>Delete Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteReturnTicketModal;
