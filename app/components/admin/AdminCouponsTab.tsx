import React, { useState } from "react";
import {
  TagIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  SparklesIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { CouponItem, CouponDiscountType } from "~/firebase";
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

  // Delete Coupon Modal State
  const [couponToDelete, setCouponToDelete] = useState<CouponItem | null>(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("free_shipping");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(50);
  const [minSpend, setMinSpend] = useState(2000);
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("2026-12-31");
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setCode("");
    setDiscountType("free_shipping");
    setDiscountPercent(15);
    setDiscountAmount(50);
    setMinSpend(2000);
    setDescription("Free courier delivery nationwide");
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
      discountType,
      discountPercent: discountType === "percentage" ? Number(discountPercent) : 0,
      discountAmount:
        discountType === "fixed_amount" || discountType === "shipping_discount"
          ? Number(discountAmount)
          : 0,
      minSpend: Number(minSpend) || 0,
      description: description.trim(),
      active,
      usedCount: 0,
      expiresAt,
    };

    try {
      await saveCouponToFirestore(newCoupon);
      toast.success(`Coupon code "${cleanCode}" created successfully!`);
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

  // Open Delete Coupon Modal
  const handleOpenDeleteCoupon = (coupon: CouponItem) => {
    setCouponToDelete(coupon);
  };

  // Confirm Delete Coupon from Modal Alert
  const handleConfirmDeleteCoupon = async () => {
    if (!couponToDelete) return;

    setIsDeletingCoupon(true);
    try {
      await deleteCouponFromFirestore(couponToDelete.id);
      toast.success(`Coupon "${couponToDelete.code}" deleted.`);
      setCouponToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete coupon.");
    } finally {
      setIsDeletingCoupon(false);
    }
  };

  const getCouponBadge = (c: CouponItem) => {
    switch (c.discountType) {
      case "free_shipping":
        return {
          label: "100% Free Delivery",
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        };
      case "shipping_discount":
        return {
          label: `৳${c.discountAmount || 0} Off Delivery`,
          color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
        };
      case "fixed_amount":
        return {
          label: `৳${c.discountAmount || 0} Flat Discount`,
          color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
        };
      default:
        return {
          label: `${c.discountPercent || 15}% Discount`,
          color: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <TagIcon className="size-6 text-orange-600" />
            <span>Discount Coupons &amp; Free Delivery Vouchers</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Create 100% Free Delivery vouchers, custom delivery discounts (৳ off courier fees), percentage discounts, and fixed vouchers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>New Voucher / Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((c) => {
          const badge = getCouponBadge(c);
          return (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-orange-600 dark:text-orange-400 tracking-wider">
                      {c.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

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
                  {c.discountType === "free_shipping" ? (
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <TruckIcon className="size-5 shrink-0" />
                      <span>FREE DELIVERY</span>
                    </div>
                  ) : c.discountType === "shipping_discount" ? (
                    <div className="text-xl font-black text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                      <TruckIcon className="size-5 shrink-0" />
                      <span>৳{c.discountAmount || 0} OFF DELIVERY</span>
                    </div>
                  ) : c.discountType === "fixed_amount" ? (
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                      ৳{c.discountAmount || 0} OFF
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                      {c.discountPercent || 15}% OFF
                    </div>
                  )}

                  <p className="text-gray-500 dark:text-neutral-400 text-[11px]">
                    {c.description}
                  </p>
                  <div className="pt-2 text-[11px] text-gray-600 dark:text-neutral-300 space-y-0.5">
                    <p>
                      Min. Spend:{" "}
                      <strong>
                        {c.minSpend > 0 ? `৳${c.minSpend.toLocaleString()}` : "No minimum spend"}
                      </strong>
                    </p>
                    <p>Expires: <strong className="font-mono">{c.expiresAt}</strong></p>
                    <p>Times Redeemed: <strong className="font-mono text-orange-600">{c.usedCount} times</strong></p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenDeleteCoupon(c)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
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
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <TagIcon className="size-5 text-orange-600" />
                      <span>Create Promotional Voucher</span>
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
                        placeholder="e.g. FREEDELIVERY or SHIP50"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    {/* Benefit Type Selector */}
                    <div>
                      <label className="block font-semibold mb-1">
                        Voucher Benefit Type *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("free_shipping");
                            if (!description || description.includes("discount")) {
                              setDescription("100% Free Courier Delivery nationwide");
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            discountType === "free_shipping"
                              ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold"
                              : "border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <TruckIcon className="size-4 text-emerald-600" />
                            <span>Free Delivery</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-normal mt-0.5">
                            100% waives courier fee
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("shipping_discount");
                            if (!description || description.includes("Free")) {
                              setDescription(`৳${discountAmount} off courier delivery fee`);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            discountType === "shipping_discount"
                              ? "border-cyan-600 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 font-bold"
                              : "border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <TruckIcon className="size-4 text-cyan-600" />
                            <span>Delivery Discount</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-normal mt-0.5">
                            Custom ৳ off delivery
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDiscountType("percentage")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            discountType === "percentage"
                              ? "border-orange-600 bg-orange-50/70 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 font-bold"
                              : "border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <TagIcon className="size-4 text-orange-600" />
                            <span>Percentage Off</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-normal mt-0.5">
                            % off order subtotal
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDiscountType("fixed_amount")}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            discountType === "fixed_amount"
                              ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold"
                              : "border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <BanknotesIcon className="size-4 text-indigo-600" />
                            <span>Fixed Amount</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-normal mt-0.5">
                            ৳ off order subtotal
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Value Input depending on discountType */}
                    {discountType === "free_shipping" && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircleIcon className="size-5 shrink-0 text-emerald-600" />
                        <span>This voucher completely waives the customer's delivery fee (৳0 delivery at checkout).</span>
                      </div>
                    )}

                    {discountType === "shipping_discount" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">
                            Delivery Discount (৳) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            placeholder="e.g. 50 or 70"
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-600 font-bold"
                          />
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Amount to deduct from courier fee.
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">
                            Minimum Order Spend (৳)
                          </label>
                          <input
                            type="number"
                            value={minSpend}
                            onChange={(e) => setMinSpend(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                          />
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            0 for no minimum spend.
                          </span>
                        </div>
                      </div>
                    )}

                    {discountType === "percentage" && (
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
                            value={minSpend}
                            onChange={(e) => setMinSpend(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {discountType === "fixed_amount" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">
                            Discount Amount (৳) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            placeholder="e.g. 200"
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">
                            Minimum Spend (৳)
                          </label>
                          <input
                            type="number"
                            value={minSpend}
                            onChange={(e) => setMinSpend(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {discountType === "free_shipping" && (
                      <div>
                        <label className="block font-semibold mb-1">
                          Minimum Order Spend (৳)
                        </label>
                        <input
                          type="number"
                          value={minSpend}
                          onChange={(e) => setMinSpend(Number(e.target.value))}
                          placeholder="e.g. 2000 (0 for no minimum)"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Set to 0 if free delivery should apply with no minimum cart amount.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold mb-1">
                        Campaign Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Free nationwide courier delivery on orders over ৳2,000"
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
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting && <Spinner className="size-3.5 text-white" />}
                        <span>Save Voucher</span>
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Coupon Confirmation Modal Alert */}
      <Transition appear show={!!couponToDelete} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => !isDeletingCoupon && setCouponToDelete(null)}
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
                          Delete Discount Voucher
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                          This action permanently removes this coupon code from Firestore.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isDeletingCoupon}
                      onClick={() => setCouponToDelete(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Coupon Preview Box */}
                  {couponToDelete && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TagIcon className="size-4 text-orange-600" />
                          <span className="font-mono text-sm font-black text-gray-900 dark:text-white">
                            {couponToDelete.code}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            couponToDelete.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-stone-200 text-stone-600 dark:bg-neutral-700 dark:text-neutral-400"
                          }`}
                        >
                          {couponToDelete.active ? "Active" : "Disabled"}
                        </span>
                      </div>
                      {couponToDelete.description && (
                        <p className="text-xs text-gray-600 dark:text-neutral-300">
                          {couponToDelete.description}
                        </p>
                      )}
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                        <span>Min Spend: {couponToDelete.minSpend > 0 ? `৳${couponToDelete.minSpend.toLocaleString()}` : "None"}</span>
                        <span>Redeemed: {couponToDelete.usedCount || 0} times</span>
                      </div>
                    </div>
                  )}

                  {/* Danger Notice */}
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                    Are you sure you want to permanently delete coupon{" "}
                    <strong className="font-bold">&quot;{couponToDelete?.code}&quot;</strong>? Customers will immediately lose the ability to apply this discount at checkout.
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isDeletingCoupon}
                      onClick={() => setCouponToDelete(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingCoupon}
                      onClick={handleConfirmDeleteCoupon}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingCoupon ? (
                        <>
                          <Spinner className="size-3.5 text-white" />
                          <span>Deleting Coupon...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="size-3.5" />
                          <span>Delete Coupon</span>
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
    </div>
  );
};

export default AdminCouponsTab;
