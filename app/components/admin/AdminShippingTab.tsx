import React, { useState } from "react";
import {
  TruckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MapPinIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { ShippingProvider, ShippingSettings } from "~/firebase";
import {
  saveShippingProvider,
  deleteShippingProvider,
  saveShippingSettings,
} from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminShippingTabProps {
  shippingProviders: ShippingProvider[];
  shippingSettings: ShippingSettings;
  onRefresh: () => void;
}

export const AdminShippingTab: React.FC<AdminShippingTabProps> = ({
  shippingProviders,
  shippingSettings,
  onRefresh,
}) => {
  // Settings Form State
  const [settings, setSettings] = useState<ShippingSettings>(shippingSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Provider Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Provider Modal State
  const [providerToDelete, setProviderToDelete] = useState<ShippingProvider | null>(null);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);

  // Provider Form Fields
  const [name, setName] = useState("");
  const [insideDhakaRate, setInsideDhakaRate] = useState(70);
  const [subDhakaRate, setSubDhakaRate] = useState(100);
  const [outsideDhakaRate, setOutsideDhakaRate] = useState(130);
  const [deliveryTimeInside, setDeliveryTimeInside] = useState("24-48 Hours");
  const [deliveryTimeOutside, setDeliveryTimeOutside] = useState("2-4 Days");
  const [trackingUrlPattern, setTrackingUrlPattern] = useState("");
  const [hotline, setHotline] = useState("");
  const [pickupHub, setPickupHub] = useState("");
  const [active, setActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setName("");
    setInsideDhakaRate(70);
    setSubDhakaRate(100);
    setOutsideDhakaRate(130);
    setDeliveryTimeInside("24-48 Hours");
    setDeliveryTimeOutside("2-4 Days");
    setTrackingUrlPattern("https://courier.com.bd/tracking/{tracking}");
    setHotline("+880 9678-000000");
    setPickupHub("Dhaka Central Hub");
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: ShippingProvider) => {
    setEditingProvider(p);
    setName(p.name);
    setInsideDhakaRate(p.insideDhakaRate);
    setSubDhakaRate(p.subDhakaRate);
    setOutsideDhakaRate(p.outsideDhakaRate);
    setDeliveryTimeInside(p.deliveryTimeInside);
    setDeliveryTimeOutside(p.deliveryTimeOutside);
    setTrackingUrlPattern(p.trackingUrlPattern);
    setHotline(p.hotline);
    setPickupHub(p.pickupHub);
    setActive(p.active);
    setModalOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Courier name is required.");
      return;
    }

    setIsSubmitting(true);
    const id = editingProvider ? editingProvider.id : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newProvider: ShippingProvider = {
      id,
      name: name.trim(),
      slug: id,
      insideDhakaRate: Number(insideDhakaRate),
      subDhakaRate: Number(subDhakaRate),
      outsideDhakaRate: Number(outsideDhakaRate),
      deliveryTimeInside: deliveryTimeInside.trim(),
      deliveryTimeOutside: deliveryTimeOutside.trim(),
      trackingUrlPattern: trackingUrlPattern.trim(),
      hotline: hotline.trim(),
      pickupHub: pickupHub.trim(),
      active,
      cashOnDeliveryFeePercent: 0,
    };

    try {
      await saveShippingProvider(newProvider);
      toast.success(`Shipping provider "${newProvider.name}" saved!`);
      setModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save shipping provider.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Provider Modal
  const handleOpenDeleteProvider = (provider: ShippingProvider) => {
    setProviderToDelete(provider);
  };

  // Confirm Delete Provider from Modal Alert
  const handleConfirmDeleteProvider = async () => {
    if (!providerToDelete) return;

    setIsDeletingProvider(true);
    try {
      await deleteShippingProvider(providerToDelete.id);
      toast.success(`Shipping provider "${providerToDelete.name}" deleted.`);
      setProviderToDelete(null);
      if (editingProvider?.id === providerToDelete.id) {
        setEditingProvider(null);
        setModalOpen(false);
      }
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete shipping provider.");
    } finally {
      setIsDeletingProvider(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveShippingSettings(settings);
      toast.success("Store shipping rules and rates updated successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not save shipping settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: SHIPPING PROVIDERS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <TruckIcon className="size-6 text-orange-600" />
              <span>Courier &amp; Shipping Providers</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Configure active courier services (Steadfast, Pathao, RedX) for doorstep delivery across Bangladesh.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Add Courier Provider</span>
          </button>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shippingProviders.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                      <TruckIcon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        {p.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID: {p.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-stone-200 text-stone-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {p.active ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-950">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Inside Dhaka
                    </span>
                    <strong className="text-gray-900 dark:text-white font-mono">
                      ৳{p.insideDhakaRate}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-950">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Sub-Dhaka
                    </span>
                    <strong className="text-gray-900 dark:text-white font-mono">
                      ৳{p.subDhakaRate}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-neutral-950">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      All Districts
                    </span>
                    <strong className="text-gray-900 dark:text-white font-mono">
                      ৳{p.outsideDhakaRate}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-neutral-400">
                  <p className="flex items-center gap-1 text-[11px]">
                    <span className="font-semibold text-gray-700 dark:text-neutral-300">Transit:</span>{" "}
                    {p.deliveryTimeInside} (Dhaka) / {p.deliveryTimeOutside} (Outside)
                  </p>
                  <p className="flex items-center gap-1 text-[11px] truncate">
                    <span className="font-semibold text-gray-700 dark:text-neutral-300">Hotline:</span>{" "}
                    {p.hotline} • Hub: {p.pickupHub}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-300 transition cursor-pointer"
                >
                  Edit Provider
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeleteProvider(p)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: STOREWIDE SHIPPING RULES & RATES */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-5">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Nationwide Delivery Rules &amp; Shipping Rates
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Configure default delivery fees across Bangladesh. Automatic cart free delivery is disabled — create custom Free Delivery or ৳ off vouchers in the Coupons tab.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <TruckIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Free Delivery Policy:</span>
            <p className="text-amber-800 dark:text-amber-300">
              Automatic spend-threshold free delivery is turned off. You now have full control in the{" "}
              <strong className="underline">Coupons</strong> tab to create 100% Free Delivery codes (e.g. <span className="font-mono font-bold">FREEDELIVERY</span>) or custom delivery fee discounts (e.g. <span className="font-mono font-bold">SHIP50</span>) with any minimum spend requirements.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                Default Inside Dhaka Fee (BDT ৳)
              </label>
              <input
                type="number"
                value={settings.standardInsideDhaka}
                onChange={(e) =>
                  setSettings({ ...settings, standardInsideDhaka: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                Default Outside Dhaka Fee (BDT ৳)
              </label>
              <input
                type="number"
                value={settings.standardOutsideDhaka}
                onChange={(e) =>
                  setSettings({ ...settings, standardOutsideDhaka: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                Default Courier Service
              </label>
              <select
                value={settings.defaultProviderId}
                onChange={(e) => setSettings({ ...settings, defaultProviderId: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {shippingProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                Customer Delivery Notice
              </label>
              <input
                type="text"
                value={settings.deliveryNotice || ""}
                onChange={(e) => setSettings({ ...settings, deliveryNotice: e.target.value })}
                placeholder="Dispatched within 24-48 hours across Bangladesh"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-3">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={settings.allowCashOnDelivery}
                onChange={(e) => setSettings({ ...settings, allowCashOnDelivery: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Enable Nationwide Cash on Delivery (COD)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={settings.allowBkash}
                onChange={(e) => setSettings({ ...settings, allowBkash: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Enable Instant bKash / Nagad Mobile Banking</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {savingSettings && <Spinner className="size-3.5 text-white" />}
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add / Edit Shipping Provider Modal */}
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
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      {editingProvider ? `Edit ${editingProvider.name}` : "Add Courier Partner"}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProvider} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">
                        Courier Provider Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Steadfast Courier"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">
                          Inside Dhaka (৳)
                        </label>
                        <input
                          type="number"
                          value={insideDhakaRate}
                          onChange={(e) => setInsideDhakaRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Sub-Dhaka (৳)
                        </label>
                        <input
                          type="number"
                          value={subDhakaRate}
                          onChange={(e) => setSubDhakaRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Outside Dhaka (৳)
                        </label>
                        <input
                          type="number"
                          value={outsideDhakaRate}
                          onChange={(e) => setOutsideDhakaRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">
                          Transit (Inside Dhaka)
                        </label>
                        <input
                          type="text"
                          value={deliveryTimeInside}
                          onChange={(e) => setDeliveryTimeInside(e.target.value)}
                          placeholder="24-48 Hours"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Transit (Outside Dhaka)
                        </label>
                        <input
                          type="text"
                          value={deliveryTimeOutside}
                          onChange={(e) => setDeliveryTimeOutside(e.target.value)}
                          placeholder="2-4 Days"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">
                        Tracking URL Pattern
                      </label>
                      <input
                        type="text"
                        value={trackingUrlPattern}
                        onChange={(e) => setTrackingUrlPattern(e.target.value)}
                        placeholder="https://courier.com/track/{tracking}"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">
                          Courier Hotline
                        </label>
                        <input
                          type="text"
                          value={hotline}
                          onChange={(e) => setHotline(e.target.value)}
                          placeholder="+880 9678-000000"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Pickup Dispatch Hub
                        </label>
                        <input
                          type="text"
                          value={pickupHub}
                          onChange={(e) => setPickupHub(e.target.value)}
                          placeholder="Uttara Hub, Dhaka"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="providerActive"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="providerActive" className="font-semibold cursor-pointer">
                        Provider Active for Customer Checkout
                      </label>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-neutral-800">
                      {editingProvider ? (
                        <button
                          type="button"
                          onClick={() => {
                            const target = editingProvider;
                            setModalOpen(false);
                            handleOpenDeleteProvider(target);
                          }}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Delete provider"
                        >
                          <TrashIcon className="size-4" />
                          <span>Delete Provider</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setModalOpen(false)}
                          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer hover:bg-stone-50 dark:hover:bg-neutral-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSubmitting && <Spinner className="size-3.5 text-white" />}
                          <span>Save Courier Provider</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Provider Confirmation Modal Alert */}
      <Transition appear show={!!providerToDelete} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => !isDeletingProvider && setProviderToDelete(null)}
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
                          Delete Shipping Provider
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                          This action permanently removes this courier partner from Firestore.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isDeletingProvider}
                      onClick={() => setProviderToDelete(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  {/* Provider Preview */}
                  {providerToDelete && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="size-4 text-orange-600" />
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {providerToDelete.name}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            providerToDelete.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-stone-200 text-stone-600 dark:bg-neutral-700 dark:text-neutral-400"
                          }`}
                        >
                          {providerToDelete.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-3">
                        <span>Inside Dhaka: ৳{providerToDelete.insideDhakaRate}</span>
                        <span>•</span>
                        <span>ETA: {providerToDelete.deliveryTimeInside}</span>
                      </div>
                      {providerToDelete.pickupHub && (
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                          Pickup Hub: {providerToDelete.pickupHub}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Danger Notice */}
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                    Are you sure you want to remove shipping provider{" "}
                    <strong className="font-bold">&quot;{providerToDelete?.name}&quot;</strong>? This courier will no longer be available for dispatching customer shipments or reverse returns.
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isDeletingProvider}
                      onClick={() => setProviderToDelete(null)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingProvider}
                      onClick={handleConfirmDeleteProvider}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingProvider ? (
                        <>
                          <Spinner className="size-3.5 text-white" />
                          <span>Deleting Provider...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="size-3.5" />
                          <span>Delete Provider</span>
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

export default AdminShippingTab;
