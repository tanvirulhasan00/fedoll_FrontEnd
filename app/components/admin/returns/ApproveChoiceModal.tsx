import React from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { ReturnExchangeRequest } from "~/firebase";

interface ApproveChoiceModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPickup: (ticket: ReturnExchangeRequest) => void;
  onSelectDropoff: (ticket: ReturnExchangeRequest) => void;
  onQuickApprove: (ticket: ReturnExchangeRequest) => void;
}

export const ApproveChoiceModal: React.FC<ApproveChoiceModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSelectPickup,
  onSelectDropoff,
  onQuickApprove,
}) => {
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
                  <div>
                    <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                      {ticket.ticketNumber} • Order #{ticket.orderNumber}
                    </span>
                    <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                      Approve Return &amp; Select Handover Method
                    </DialogTitle>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 border border-stone-200/80 dark:border-neutral-700/80 text-xs">
                  <p className="text-gray-700 dark:text-neutral-300">
                    <strong className="text-gray-900 dark:text-white">{ticket.customerName}</strong> ({ticket.customerPhone})
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Item: <strong>{ticket.itemDetails}</strong> • Reason: &quot;{ticket.reason}&quot;
                  </p>
                  <p className="text-gray-500 mt-0.5 text-[11px]">
                    Customer Address: {ticket.pickupAddress}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
                    Choose how the customer will return the garment to Fedoll:
                  </span>

                  {/* Option 1: Doorstep Reverse Courier Pickup */}
                  <button
                    type="button"
                    onClick={() => onSelectPickup(ticket)}
                    className="w-full p-4 rounded-2xl border-2 border-stone-200 dark:border-neutral-700 hover:border-purple-600 dark:hover:border-purple-500 bg-white dark:bg-neutral-900 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0 group-hover:scale-105 transition">
                        <TruckIcon className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            Doorstep Reverse Courier Pickup (হোম পিকআপ)
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 uppercase">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                          Dispatch a Steadfast Courier or Pathao rider to collect the return package directly from customer&apos;s home/office anywhere in Bangladesh.
                        </p>
                        <div className="text-[11px] font-mono text-purple-700 dark:text-purple-400 pt-0.5">
                          Zone: {ticket.zone === "inside_dhaka" ? "Inside Dhaka (৳60 / Free Defect)" : "Outside Dhaka (৳120 / Free Defect)"}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Customer Drop-off at Hub */}
                  <button
                    type="button"
                    onClick={() => onSelectDropoff(ticket)}
                    className="w-full p-4 rounded-2xl border-2 border-stone-200 dark:border-neutral-700 hover:border-sky-600 dark:hover:border-sky-500 bg-white dark:bg-neutral-900 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shrink-0 group-hover:scale-105 transition">
                        <BuildingStorefrontIcon className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                            Designate Customer Drop-Off Hub (ড্রপ-অফ)
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 uppercase">
                            Dhaka &amp; Outlets
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                          Tell customer to drop off the parcel at our Uttara Flagship Atelier Hub, Banani Concierge Desk, Dhanmondi Point, or nearest courier hub.
                        </p>
                        <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400 pt-0.5">
                          Includes address, visiting hours, deadline, and WhatsApp instructions.
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Quick Approve without scheduling now */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => onQuickApprove(ticket)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Quick Approve Only (Decide Pickup/Drop-off Later)
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
