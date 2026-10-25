import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BanknotesIcon,
  MegaphoneIcon,
  PhotoIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { StoreGeneralSettings } from "~/firebase";
import {
  saveStoreSettings,
  extractGoogleDriveFileId,
  normalizeGoogleDriveImageUrl,
} from "~/firebase";
import { useAppDispatch } from "~/redux/hooks/hook";
import { setStoreSettings } from "~/redux/features/storeSettingsSlice";
import { Spinner } from "~/components/ui/spinner";

interface AdminSettingsTabProps {
  settings: StoreGeneralSettings;
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings: initialSettings,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<StoreGeneralSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [logoLightLoadError, setLogoLightLoadError] = useState(false);
  const [logoDarkLoadError, setLogoDarkLoadError] = useState(false);
  const [faviconLoadError, setFaviconLoadError] = useState(false);

  useEffect(() => {
    setForm(initialSettings);
  }, [initialSettings]);

  // Derived normalized URLs for Google Drive and standard links
  const normalizedLightLogo = normalizeGoogleDriveImageUrl(
    form.logoLightUrl || form.logoUrl
  );
  const lightLogoDriveId = extractGoogleDriveFileId(
    form.logoLightUrl || form.logoUrl
  );

  const normalizedDarkLogo = normalizeGoogleDriveImageUrl(
    form.logoDarkUrl || form.logoUrl
  );
  const darkLogoDriveId = extractGoogleDriveFileId(
    form.logoDarkUrl || form.logoUrl
  );

  const normalizedFavicon = normalizeGoogleDriveImageUrl(form.faviconUrl);
  const faviconDriveId = extractGoogleDriveFileId(form.faviconUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const sanitized: StoreGeneralSettings = {
        ...form,
        logoLightUrl: form.logoLightUrl?.trim() || "",
        logoDarkUrl: form.logoDarkUrl?.trim() || "",
        logoUrl: form.logoLightUrl?.trim() || form.logoDarkUrl?.trim() || "",
        faviconUrl: form.faviconUrl?.trim() || "",
      };
      await saveStoreSettings(sanitized);
      dispatch(setStoreSettings(sanitized));
      toast.success("Store configuration & brand assets saved successfully!");
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
          General business metadata, visual brand assets (light/dark logos &amp; favicon), contact lines, currency, and storefront ribbons.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-8 text-xs"
      >
        {/* ==================================================================== */}
        {/* Brand Assets: Light Logo, Dark Logo, and Favicon with Google Drive Support */}
        {/* ==================================================================== */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                <PhotoIcon className="size-4 text-orange-600" />
                <span>Brand Identity: Logos &amp; Favicon</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                Configure your storefront logos (light &amp; dark mode) and browser tab favicon. Google Drive share links are fully supported.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-full text-[10px] font-semibold text-amber-800 dark:text-amber-300 w-fit">
              <SparklesIcon className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Google Drive Share Link Ready</span>
            </div>
          </div>

          {/* Google Drive Sharing Tip Banner */}
          <div className="p-4 bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 rounded-2xl flex items-start gap-3">
            <div className="size-7 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
              <GlobeAltIcon className="size-4" />
            </div>
            <div className="space-y-1 text-gray-600 dark:text-neutral-300 leading-relaxed">
              <p className="font-bold text-gray-900 dark:text-white text-xs">
                How to use Google Drive share links:
              </p>
              <p className="text-[11px]">
                In Google Drive, right-click your image &rarr; select <span className="font-semibold text-gray-800 dark:text-neutral-200">Share</span> &rarr; change General access to <span className="font-semibold text-orange-600 dark:text-orange-400">&ldquo;Anyone with the link&rdquo; (Viewer)</span> &rarr; click <span className="font-semibold text-gray-800 dark:text-neutral-200">Copy link</span> and paste below. The system automatically converts it into a high-speed CDN image!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Field 1: Store Logo URL (Light Mode) */}
            <div className="space-y-3 p-5 bg-stone-50/70 dark:bg-neutral-800/40 rounded-2xl border border-stone-200/70 dark:border-neutral-700/60">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-gray-900 dark:text-white text-xs">
                    1. Store Logo URL (Light Mode)
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                    Shown in the main navigation on white/light backgrounds.
                  </p>
                </div>
                {form.logoLightUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, logoLightUrl: "" });
                      setLogoLightLoadError(false);
                    }}
                    className="text-[10px] text-gray-500 hover:text-red-500 transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={form.logoLightUrl || ""}
                  onChange={(e) => {
                    setForm({ ...form, logoLightUrl: e.target.value });
                    setLogoLightLoadError(false);
                  }}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 font-mono text-[11px]"
                />
              </div>

              {/* Google Drive Status Notification */}
              {lightLogoDriveId && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircleIcon className="size-4 shrink-0" />
                  <span>Google Drive link detected (File ID: {lightLogoDriveId.slice(0, 8)}...)</span>
                </div>
              )}

              {/* Light Logo Preview */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                  <span>Light Mode Live Preview</span>
                  {normalizedLightLogo && (
                    <a
                      href={normalizedLightLogo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline text-[10px]"
                    >
                      <span>Open image in new tab</span>
                      <ArrowTopRightOnSquareIcon className="size-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[110px] shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-2 tracking-wider">
                    Light Surface Preview
                  </span>
                  <img
                    src={normalizedLightLogo || "/silkendrift-logo.svg"}
                    alt="Store logo preview (light)"
                    className="h-12 sm:h-14 max-h-16 w-auto max-w-full object-contain"
                    onLoad={() => setLogoLightLoadError(false)}
                    onError={() => setLogoLightLoadError(true)}
                  />
                </div>

                {logoLightLoadError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-start gap-2 text-[10px]">
                    <ExclamationTriangleIcon className="size-4 shrink-0 mt-0.5" />
                    <span>
                      Could not load light logo preview. If this is a Google Drive link, please ensure General Access is set to <strong>&ldquo;Anyone with the link&rdquo;</strong> in Google Drive sharing settings.
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                  Rendered on daytime headers and bright surfaces.
                </p>
              </div>
            </div>

            {/* Field 2: Store Logo URL (Dark Mode & Footer) */}
            <div className="space-y-3 p-5 bg-stone-50/70 dark:bg-neutral-800/40 rounded-2xl border border-stone-200/70 dark:border-neutral-700/60">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-gray-900 dark:text-white text-xs">
                    2. Store Logo URL (Dark Mode &amp; Footer)
                  </label>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                    Shown in dark mode navigation and the dark footer.
                  </p>
                </div>
                {form.logoDarkUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, logoDarkUrl: "" });
                      setLogoDarkLoadError(false);
                    }}
                    className="text-[10px] text-gray-500 hover:text-red-500 transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={form.logoDarkUrl || ""}
                  onChange={(e) => {
                    setForm({ ...form, logoDarkUrl: e.target.value });
                    setLogoDarkLoadError(false);
                  }}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 font-mono text-[11px]"
                />
              </div>

              {/* Google Drive Status Notification */}
              {darkLogoDriveId && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircleIcon className="size-4 shrink-0" />
                  <span>Google Drive link detected (File ID: {darkLogoDriveId.slice(0, 8)}...)</span>
                </div>
              )}

              {/* Dark Logo Preview */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                  <span>Dark Mode &amp; Footer Live Preview</span>
                  {normalizedDarkLogo && (
                    <a
                      href={normalizedDarkLogo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline text-[10px]"
                    >
                      <span>Open image in new tab</span>
                      <ArrowTopRightOnSquareIcon className="size-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 bg-[#0c0e12] border border-neutral-800 rounded-2xl flex flex-col items-center justify-center min-h-[110px] shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 mb-2 tracking-wider">
                    Dark Surface &amp; Footer Preview
                  </span>
                  <img
                    src={normalizedDarkLogo || "/silkendrift-logo-dark.svg"}
                    alt="Store logo preview (dark)"
                    className="h-12 sm:h-14 max-h-16 w-auto max-w-full object-contain"
                    onLoad={() => setLogoDarkLoadError(false)}
                    onError={() => setLogoDarkLoadError(true)}
                  />
                </div>

                {logoDarkLoadError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-start gap-2 text-[10px]">
                    <ExclamationTriangleIcon className="size-4 shrink-0 mt-0.5" />
                    <span>
                      Could not load dark logo preview. If this is a Google Drive link, please ensure General Access is set to <strong>&ldquo;Anyone with the link&rdquo;</strong> in Google Drive sharing settings.
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                  Rendered on dark mode navigation and the dark storefront footer.
                </p>
              </div>
            </div>
          </div>

          {/* Field 3: Store Favicon URL */}
          <div className="space-y-3 p-5 bg-stone-50/70 dark:bg-neutral-800/40 rounded-2xl border border-stone-200/70 dark:border-neutral-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block font-bold text-gray-900 dark:text-white text-xs">
                  3. Store Favicon URL (Browser Tab Icon)
                </label>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                  Small square icon displayed on browser tabs, bookmarks, and mobile home screen shortcuts.
                </p>
              </div>
              {form.faviconUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, faviconUrl: "" });
                    setFaviconLoadError(false);
                  }}
                  className="text-[10px] text-gray-500 hover:text-red-500 transition cursor-pointer w-fit"
                >
                  Reset to Default Favicon
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.faviconUrl || ""}
                  onChange={(e) => {
                    setForm({ ...form, faviconUrl: e.target.value });
                    setFaviconLoadError(false);
                  }}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 font-mono text-[11px]"
                />

                {faviconDriveId && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircleIcon className="size-4 shrink-0" />
                    <span>Google Drive link detected (File ID: {faviconDriveId.slice(0, 8)}...)</span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                  Recommended: 32x32px, 64x64px, or square PNG/ICO with transparent background.
                </p>
              </div>

              {/* Favicon Browser Tab Simulation Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                  <span>Browser Tab Simulation Preview</span>
                  {normalizedFavicon && (
                    <a
                      href={normalizedFavicon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline text-[10px]"
                    >
                      <span>Open icon in new tab</span>
                      <ArrowTopRightOnSquareIcon className="size-3" />
                    </a>
                  )}
                </div>

                {/* Simulated browser window & tab */}
                <div className="bg-stone-200/90 dark:bg-neutral-950 p-2 rounded-xl border border-stone-300 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 px-1 py-0.5">
                    <span className="size-2 rounded-full bg-red-400 inline-block" />
                    <span className="size-2 rounded-full bg-amber-400 inline-block" />
                    <span className="size-2 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-850 rounded-t-lg border-t border-x border-stone-300 dark:border-neutral-700 max-w-xs shadow-xs">
                    <img
                      src={normalizedFavicon || "/favicon.ico"}
                      alt="Favicon preview"
                      className="size-4 rounded-xs object-contain shrink-0"
                      onLoad={() => setFaviconLoadError(false)}
                      onError={() => setFaviconLoadError(true)}
                    />
                    <span className="truncate text-[11px] font-medium text-gray-800 dark:text-neutral-200">
                      {form.storeName || "SilkenDrift"} | Official Store
                    </span>
                    <span className="text-gray-400 text-[10px] ml-auto">&times;</span>
                  </div>
                </div>

                {faviconLoadError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-start gap-2 text-[10px]">
                    <ExclamationTriangleIcon className="size-4 shrink-0 mt-0.5" />
                    <span>
                      Could not load favicon preview. If using Google Drive, check that file access is set to <strong>&ldquo;Anyone with the link&rdquo;</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Brand Profile Information */}
        {/* ==================================================================== */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
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

        {/* ==================================================================== */}
        {/* Currency & Financials */}
        {/* ==================================================================== */}
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

        {/* ==================================================================== */}
        {/* Storefront Announcement Strip */}
        {/* ==================================================================== */}
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
                placeholder="Flash Winter Drop: Use voucher FREEDELIVERY for free delivery!"
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
