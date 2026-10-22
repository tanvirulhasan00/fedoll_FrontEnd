import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest } from "~/firebase";

interface SettleRefundModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    refundData: {
      refundMethod: "bKash" | "Nagad" | "Rocket" | "Bank Transfer" | "Store Credit";
      refundAccountDetails: string;
      refundAmount: number;
      refundTransactionId: string;
      refundProcessedAt: string;
      refundProofNote: string;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const SettleRefundModal: React.FC<SettleRefundModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState<"bKash" | "Nagad" | "Rocket" | "Bank Transfer" | "Store Credit">("bKash");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [trxId, setTrxId] = useState("");
  const [date, setDate] = useState("");
  const [proofNote, setProofNote] = useState("Disbursed directly via corporate gateway.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setMethod((ticket.refundMethod as any) || "bKash");
      setAccount(ticket.refundAccountDetails || ticket.customerPhone);
      setAmount(ticket.refundAmount ?? "");
      setTrxId(ticket.refundTransactionId || `BL${Date.now().toString().slice(-8)}`);
      setDate(new Date().toISOString().split("T")[0]);
      setProofNote(
        ticket.refundProofNote ||
          `Refund processed via ${ticket.refundMethod || "bKash"} merchant account.`
      );
    }
  }, [ticket]);

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;
    if (!account.trim()) {
      toast.error("Please provide the customer's account or bank details.");
      return;
    }
    if (amount === "" || Number(amount) <= 0) {
      toast.error("Please enter a valid refund amount in BDT (৳).");
      return;
    }
    if (!trxId.trim()) {
      toast.error("Please provide the Transaction ID (TrxID) or Bank Reference Number.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          refundMethod: method,
          refundAccountDetails: account.trim(),
          refundAmount: Number(amount),
          refundTransactionId: trxId.trim(),
          refundProcessedAt: date,
          refundProofNote: proofNote.trim(),
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
                    <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      <BanknotesIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Settle Monetary Refund
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

                {/* Customer Details */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Beneficiary: {ticket.customerName} ({ticket.customerPhone})
                    </span>
                    <span className="font-mono font-bold text-[10px] text-amber-700 dark:text-amber-400 uppercase">
                      Direct Refund Settlement
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-neutral-300">
                    Returned Item: <strong>{ticket.itemDetails}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Customer Return Reason: &quot;{ticket.reason}&quot;
                  </p>
                </div>

                {/* Form Controls */}
                <div className="space-y-4 text-xs">
                  {/* Gateway & Account */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Refund Payment Gateway *
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                      >
                        <option value="bKash">bKash Personal / Merchant</option>
                        <option value="Nagad">Nagad Corporate PGW</option>
                        <option value="Rocket">Rocket (DBBL)</option>
                        <option value="Bank Transfer">Bangladeshi Bank (EFT / NPSB)</option>
                        <option value="Store Credit">Store Credit (+5% VIP Bonus)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Account / Wallet Number *
                      </label>
                      <input
                        type="text"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        placeholder="017XXXXXXXX or Bank A/C details"
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Amount & TrxID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Disbursed Amount (৳ BDT) *
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 2450"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 font-bold text-sm text-amber-700 dark:text-amber-400"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Transaction ID (TrxID) / Bank Ref *
                      </label>
                      <input
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="e.g. BL9948210X"
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold uppercase"
                        required
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <CalendarDaysIcon className="size-4 text-amber-600" />
                      <span>Disbursement Settlement Date *</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                      required
                    />
                  </div>

                  {/* Proof Note */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Disbursement Remarks / Accounts Note
                    </label>
                    <textarea
                      rows={2}
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
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
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                      <span>Settle Refund &amp; Mark Resolved</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Settle & Send confirmation on WhatsApp"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" />
                      <span>Confirm &amp; WhatsApp</span>
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
