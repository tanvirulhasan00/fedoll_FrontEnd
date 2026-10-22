import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ReturnExchangeRequest } from "~/firebase";

interface QualityInspectionModalProps {
  ticket: ReturnExchangeRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticket: ReturnExchangeRequest,
    inspectionData: {
      inspectionResult: "passed" | "failed_damaged" | "failed_tags_missing";
      inspectionNotes: string;
      inspectedBy: string;
      markStatus: "received_at_hub" | "rejected";
      restockToInventory?: boolean;
    },
    openWhatsApp?: boolean
  ) => Promise<void>;
}

export const QualityInspectionModal: React.FC<QualityInspectionModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [result, setResult] = useState<"passed" | "failed_damaged" | "failed_tags_missing">("passed");
  const [inspectorName, setInspectorName] = useState("Tanvir Hasan (Master Tailor)");
  const [notes, setNotes] = useState(
    "Garment condition audited. Original tags & barcode seals intact. Brand new unworn state."
  );

  // Quality Audit Checklist items
  const [tagsIntact, setTagsIntact] = useState(true);
  const [unworn, setUnworn] = useState(true);
  const [cleanNoOdor, setCleanNoOdor] = useState(true);
  const [originalBag, setOriginalBag] = useState(true);
  const [restockToInventory, setRestockToInventory] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setResult(
        ticket.inspectionResult && ticket.inspectionResult !== "pending"
          ? ticket.inspectionResult
          : "passed"
      );
      setInspectorName(ticket.inspectedBy || "Tanvir Hasan (Master Tailor)");
      setNotes(
        ticket.inspectionNotes ||
          "Garment condition audited at Uttara Atelier. Tags and security seals intact. Ready for resolution."
      );
      setTagsIntact(ticket.inspectionResult !== "failed_tags_missing");
      setUnworn(ticket.inspectionResult !== "failed_damaged");
      setCleanNoOdor(ticket.inspectionResult !== "failed_damaged");
      setRestockToInventory(true);
    }
  }, [ticket]);

  // Sync checklist with result
  const handleChecklistChange = (tag: boolean, worn: boolean, clean: boolean) => {
    setTagsIntact(tag);
    setUnworn(worn);
    setCleanNoOdor(clean);

    if (!tag) {
      setResult("failed_tags_missing");
      setNotes("Failed inspection: Original woven tags or security barcode label removed/missing.");
    } else if (!worn || !clean) {
      setResult("failed_damaged");
      setNotes("Failed inspection: Garment shows signs of wear, perfume fragrance, washing, or fabric staining.");
    } else {
      setResult("passed");
      setNotes("Passed atelier quality audit. Tags and security seals intact. Brand new unworn condition.");
    }
  };

  const handleSubmit = async (openWhatsApp = false) => {
    if (!ticket) return;

    setSubmitting(true);
    try {
      await onConfirm(
        ticket,
        {
          inspectionResult: result,
          inspectionNotes: notes.trim(),
          inspectedBy: inspectorName.trim(),
          markStatus: result === "passed" ? "received_at_hub" : "rejected",
          restockToInventory: result === "passed" ? restockToInventory : false,
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
                    <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      <ClipboardDocumentCheckIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-400">
                        {ticket.ticketNumber} • Order #{ticket.orderNumber}
                      </span>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Atelier Quality Inspection Audit
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

                {/* Returned Parcel Details */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Customer: {ticket.customerName} ({ticket.customerPhone})
                    </span>
                    <span className="font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-400 uppercase">
                      Action: {ticket.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-neutral-300">
                    Received Item: <strong>{ticket.itemDetails}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Customer Return Reason: &quot;{ticket.reason}&quot;
                  </p>
                </div>

                {/* Quality Checklist */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
                    Garment Inspection Physical Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tagsIntact}
                        onChange={(e) => handleChecklistChange(e.target.checked, unworn, cleanNoOdor)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                      />
                      <span>Original Tags &amp; Barcode Intact</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unworn}
                        onChange={(e) => handleChecklistChange(tagsIntact, e.target.checked, cleanNoOdor)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                      />
                      <span>Unworn &amp; Unwashed Condition</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanNoOdor}
                        onChange={(e) => handleChecklistChange(tagsIntact, unworn, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                      />
                      <span>No Perfume / Powder Scents / Stains</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={originalBag}
                        onChange={(e) => setOriginalBag(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                      />
                      <span>Original Packaging / Dust Bag Included</span>
                    </label>
                  </div>
                </div>

                {/* Audit Verdict */}
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Inspection Audit Verdict *
                    </label>
                    <select
                      value={result}
                      onChange={(e) => setResult(e.target.value as any)}
                      className={`w-full p-3 rounded-xl border font-bold cursor-pointer ${
                        result === "passed"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                      }`}
                    >
                      <option value="passed">PASSED — Brand New Condition (Proceed to Dispatch / Refund)</option>
                      <option value="failed_damaged">FAILED — Damaged / Worn / Washed / Odor (Reject Request)</option>
                      <option value="failed_tags_missing">FAILED — Original Tags Missing or Seal Broken (Reject Request)</option>
                    </select>
                  </div>

                  {result === "passed" && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restockToInventory}
                          onChange={(e) => setRestockToInventory(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 size-4 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                            Automatically restock pristine item back to live inventory (+1 unit)
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                            Updates product stock quantity and records an unalterable return restock entry in the inventory ledger.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Inspector Staff Name
                    </label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-neutral-300">
                      Audit Notes &amp; Fabric Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                    />
                  </div>
                </div>

                {/* Footer */}
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
                      className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                        result === "passed"
                          ? "bg-indigo-600 hover:bg-indigo-700 active:scale-98"
                          : "bg-red-600 hover:bg-red-700 active:scale-98"
                      }`}
                    >
                      {submitting ? (
                        <Spinner className="size-4 text-white animate-spin" />
                      ) : (
                        <CheckIcon className="size-4" />
                      )}
                      <span>
                        {result === "passed" ? "Confirm Audit (Mark at Hub)" : "Reject Return Request"}
                      </span>
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
