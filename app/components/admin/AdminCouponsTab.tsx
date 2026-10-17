import React, { useState } from "react";
import {
  TagIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { CouponItem } from "~/firebase";
import { saveCouponToFirestore, deleteCouponFromFirestore } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminCouponsTabProps {
  coupons: CouponItem[];
  onRefresh: () => void;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({
  coupons,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [minSpend, setMinSpend] = useState(1500);
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("2026-12-31");
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setCode("");
    setDiscountPercent(15);
    setMinSpend(1500);
    setDescription("Seasonal promotional discount");
    setExpiresAt("2026-12-31");
    setActive(true);
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Coupon code is required.");
      return;
    }

    setIsSubmitting(true);
    const newCoupon: CouponItem = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discountPercent: Number(discountPercent),
      minSpend: Number(minSpend),
      description: description.trim(),
      active,
      usedCount: 0,
      expiresAt,
    };

    try {
      await saveCouponToFirestore(newCoupon);
      toast.success(`Coupon code "${cleanCode}" created!`);
      setModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (c: CouponItem) => {
    try {
      await saveCouponToFirestore({ ...c, active: !c.active });
      toast.success(`Coupon "${c.code}" ${!c.active ? "activated" : "deactivated"}.`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not toggle coupon status.");
    }
  };

  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    const confirmDelete = window.confirm(`Delete coupon "${couponCode}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCouponFromFirestore(id);
      toast.success(`Coupon "${couponCode}" deleted.`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete coupon.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <TagIcon className="size-6 text-orange-600" />
            <span>Discount Coupons &amp; Promotional Codes</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Create percentage discounts, set minimum cart spend thresholds, and manage seasonal campaigns.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
                <span className="font-mono text-base font-black text-orange-600 dark:text-orange-400 tracking-wider">
                  {c.code}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleActive(c)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                    c.active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-stone-200 text-stone-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {c.active ? "Active" : "Disabled"}
                </button>
              </div>

              <div className="pt-3 space-y-1.5 text-xs">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {c.discountPercent}% OFF
                </div>
                <p className="text-gray-500 dark:text-neutral-400 text-[11px]">
                  {c.description}
                </p>
                <div className="pt-2 text-[11px] text-gray-600 dark:text-neutral-300 space-y-0.5">
                  <p>Min. Spend: <strong>৳{c.minSpend.toLocaleString()}</strong></p>
                  <p>Expires: <strong className="font-mono">{c.expiresAt}</strong></p>
                  <p>Times Redeemed: <strong className="font-mono text-orange-600">{c.usedCount} times</strong></p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleDeleteCoupon(c.id, c.code)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      <Transition show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 font-sans" onClose={() => setModalOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
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
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      Create Discount Voucher
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCoupon} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">
                        Promo Voucher Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. EIDDROP20"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">
                          Discount Percent (%) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="90"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          Minimum Spend (৳)
                        </label>
                        <input
                          type="number"
                          required
                          value={minSpend}
                          onChange={(e) => setMinSpend(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Campaign Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="15% off during Eid celebrations"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting && <Spinner className="size-3.5 text-white" />}
                        <span>Save Promo Voucher</span>
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminCouponsTab;
