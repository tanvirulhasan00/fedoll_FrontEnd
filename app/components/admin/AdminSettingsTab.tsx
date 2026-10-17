import React, { useState } from "react";
import {
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BanknotesIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { StoreGeneralSettings } from "~/firebase";
import { saveStoreSettings } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminSettingsTabProps {
  settings: StoreGeneralSettings;
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings: initialSettings,
  onRefresh,
}) => {
  const [form, setForm] = useState<StoreGeneralSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStoreSettings(form);
      toast.success("Store configuration saved successfully!");
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not save store settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Cog6ToothIcon className="size-6 text-orange-600" />
          <span>Store Settings &amp; Brand Profile</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
          General business metadata, support contact lines, currency, tax rates, and storefront announcements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6 text-xs">
        {/* Brand Information */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <BuildingStorefrontIcon className="size-4 text-orange-600" />
            <span>Store Profile &amp; Atelier Info</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Storefront Name *
              </label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Brand Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Customer Support Email *
              </label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Support Phone / WhatsApp Line *
              </label>
              <input
                type="text"
                required
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Atelier / Headquarters Address
              </label>
              <input
                type="text"
                value={form.headquartersAddress}
                onChange={(e) => setForm({ ...form, headquartersAddress: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financials */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <h3 className="font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <BanknotesIcon className="size-4 text-orange-600" />
            <span>Currency &amp; Invoicing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Primary Currency
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Order Number Prefix
              </label>
              <input
                type="text"
                value={form.orderPrefix}
                onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Storefront Announcement Strip */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <h3 className="font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <MegaphoneIcon className="size-4 text-orange-600" />
            <span>Top Announcement Ribbon</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                Announcement Message
              </label>
              <input
                type="text"
                value={form.announcementNotice}
                onChange={(e) => setForm({ ...form, announcementNotice: e.target.value })}
                placeholder="Free delivery nationwide on orders above ৳2500"
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.announcementActive}
                onChange={(e) => setForm({ ...form, announcementActive: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Display announcement ribbon across website header</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving && <Spinner className="size-3.5 text-white" />}
            <span>Save Store Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsTab;
