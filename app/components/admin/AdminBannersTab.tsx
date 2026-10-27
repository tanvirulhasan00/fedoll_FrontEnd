import React, { useState } from "react";
import {
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TagIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import { useAppDispatch } from "~/redux/hooks/hook";
import {
  type SpotlightBanner,
  type SpotlightBadgeColor,
  type SpotlightThemeStyle,
  saveSpotlightBannerToFirestore,
  deleteSpotlightBannerFromFirestore,
  seedSpotlightBannersToFirestore,
  normalizeGoogleDriveImageUrl,
} from "~/firebase";
import {
  setSpotlightBanners as setReduxSpotlightBanners,
  addOrUpdateSpotlightBanner,
  removeSpotlightBanner,
} from "~/redux/features/homeSlice";

interface AdminBannersTabProps {
  banners: SpotlightBanner[];
  onRefresh: () => void;
}

const BADGE_COLOR_OPTIONS: { id: SpotlightBadgeColor; label: string; class: string }[] = [
  { id: "orange", label: "Orange Ember", class: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "amber", label: "Warm Amber", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "emerald", label: "Emerald Green", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "blue", label: "Midnight Blue", class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "rose", label: "Crimson Rose", class: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { id: "purple", label: "Royal Violet", class: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "stone", label: "Classic Stone", class: "bg-stone-500/20 text-stone-300 border-stone-500/30" },
];

const THEME_STYLE_OPTIONS: {
  id: SpotlightThemeStyle;
  label: string;
  previewBg: string;
  description: string;
}[] = [
  {
    id: "dark-stone",
    label: "Obsidian Stone",
    previewBg: "bg-stone-900 border-stone-800",
    description: "Deep obsidian black with subtle warm stone undertones (Default luxury).",
  },
  {
    id: "gradient-sunset",
    label: "Sunset Ember",
    previewBg: "bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950/80 border-orange-900/30",
    description: "Rich dark ember to obsidian gradient, perfect for seasonal flash drops.",
  },
  {
    id: "gradient-ocean",
    label: "Midnight Ocean",
    previewBg: "bg-gradient-to-br from-stone-950 via-slate-900 to-cyan-950/80 border-cyan-900/30",
    description: "Sophisticated navy-slate gradient with subtle cyan glows.",
  },
  {
    id: "gradient-emerald",
    label: "Emerald Heritage",
    previewBg: "bg-gradient-to-br from-stone-950 via-neutral-900 to-emerald-950/80 border-emerald-900/30",
    description: "Prestigious deep forest emerald gradient for sustainable & organic edits.",
  },
  {
    id: "gradient-royal",
    label: "Royal Indigo",
    previewBg: "bg-gradient-to-br from-stone-950 via-neutral-900 to-purple-950/80 border-purple-900/30",
    description: "Regal violet to obsidian contrast for luxury capsule debuts.",
  },
  {
    id: "clean-light",
    label: "Atelier Studio",
    previewBg: "bg-stone-50 text-stone-900 border-stone-200",
    description: "Frosted cream-white canvas with dark slate typography and high contrast.",
  },
];

const SAMPLE_IMAGE_PRESETS = [
  {
    label: "Selvedge Denim",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Wool Trench Coat",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Heavy Knitwear",
    url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Workwear Blazer",
    url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
  },
];

const LINK_PRESETS = [
  { label: "All Products", link: "/products" },
  { label: "Outerwear", link: "/products?category=Outerwear" },
  { label: "Denim", link: "/products?category=Denim" },
  { label: "Workwear", link: "/products?category=Workwear" },
  { label: "Knitwear", link: "/products?category=Knitwear" },
  { label: "Blogs & Stories", link: "/blogs" },
  { label: "About Atelier", link: "/about-us" },
];

export const AdminBannersTab: React.FC<AdminBannersTabProps> = ({
  banners,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();

  // Designer Modal State
  const [designerOpen, setDesignerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("15% OFF");
  const [badgeColor, setBadgeColor] = useState<SpotlightBadgeColor>("orange");
  const [themeStyle, setThemeStyle] = useState<SpotlightThemeStyle>("dark-stone");
  const [ctaText, setCtaText] = useState("Shop The Collection");
  const [ctaLink, setCtaLink] = useState("/products?category=Denim");
  const [secondaryCtaText, setSecondaryCtaText] = useState("");
  const [secondaryCtaLink, setSecondaryCtaLink] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState<number>(1);

  // Live Preview Mode in Designer (desktop vs mobile)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewCopied, setPreviewCopied] = useState(false);

  // Delete Confirmation Modal
  const [bannerToDelete, setBannerToDelete] = useState<SpotlightBanner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset defaults confirmation
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Open designer in Create mode
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("New Seasonal Campaign Drop");
    setTag("Limited Edition • Dhaka");
    setDescription(
      "Experience export-grade craftsmanship with pure cotton fabrics and precision stitching. Fast nationwide delivery with Cash on Delivery."
    );
    setDiscountCode("SPRING2026");
    setDiscountPercent("15% OFF");
    setBadgeColor("orange");
    setThemeStyle("dark-stone");
    setCtaText("Explore Collection");
    setCtaLink("/products");
    setSecondaryCtaText("Our Craft");
    setSecondaryCtaLink("/about-us");
    setImage(SAMPLE_IMAGE_PRESETS[0].url);
    setIsActive(true);
    setOrder((banners.length || 0) + 1);
    setDesignerOpen(true);
  };

  // Open designer in Edit mode
  const handleOpenEdit = (b: SpotlightBanner) => {
    setEditingId(b.id);
    setTitle(b.title || "");
    setTag(b.tag || "");
    setDescription(b.description || "");
    setDiscountCode(b.discountCode || "");
    setDiscountPercent(b.discountPercent || "15% OFF");
    setBadgeColor(b.badgeColor || "orange");
    setThemeStyle(b.themeStyle || "dark-stone");
    setCtaText(b.ctaText || "Shop The Collection");
    setCtaLink(b.ctaLink || "/products");
    setSecondaryCtaText(b.secondaryCtaText || "");
    setSecondaryCtaLink(b.secondaryCtaLink || "");
    setImage(b.image || "");
    setIsActive(b.isActive !== false);
    setOrder(typeof b.order === "number" ? b.order : 1);
    setDesignerOpen(true);
  };

  // Duplicate an existing banner
  const handleDuplicate = async (b: SpotlightBanner) => {
    const copy: SpotlightBanner = {
      ...b,
      id: `spotlight-${Date.now()}`,
      title: `${b.title} (Copy)`,
      order: (banners.length || 0) + 1,
      isActive: false, // inactive initially
    };
    try {
      await saveSpotlightBannerToFirestore(copy);
      dispatch(addOrUpdateSpotlightBanner(copy));
      toast.success(`Duplicated banner as "${copy.title}"`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to duplicate banner.");
    }
  };

  // Toggle active status directly from list
  const handleToggleActive = async (b: SpotlightBanner) => {
    const updated: SpotlightBanner = {
      ...b,
      isActive: !b.isActive,
    };
    try {
      await saveSpotlightBannerToFirestore(updated);
      dispatch(addOrUpdateSpotlightBanner(updated));
      toast.success(`Banner "${b.title}" is now ${updated.isActive ? "Active (Live on Storefront)" : "Paused"}`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to toggle status.");
    }
  };

  // Reorder banners (Move Up / Down)
  const handleMoveOrder = async (b: SpotlightBanner, direction: "up" | "down") => {
    const sorted = [...banners].sort((x, y) => (x.order ?? 999) - (y.order ?? 999));
    const currentIndex = sorted.findIndex((item) => item.id === b.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetBanner = sorted[targetIndex];
    const currentOrder = b.order ?? currentIndex + 1;
    const targetOrder = targetBanner.order ?? targetIndex + 1;

    try {
      await Promise.all([
        saveSpotlightBannerToFirestore({ ...b, order: targetOrder }),
        saveSpotlightBannerToFirestore({ ...targetBanner, order: currentOrder }),
      ]);
      toast.success("Banner slide sequence updated.");
      onRefresh();
    } catch {
      toast.error("Failed to reorder banners.");
    }
  };

  // Save banner in Designer
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Banner title is required.");
      return;
    }
    if (!image.trim()) {
      toast.error("Banner image URL is required.");
      return;
    }

    setIsSubmitting(true);
    const bannerPayload: SpotlightBanner = {
      id: editingId || `spotlight-${Date.now()}`,
      title: title.trim(),
      tag: tag.trim() || "Exclusive Campaign",
      description: description.trim(),
      discountCode: discountCode.trim().toUpperCase(),
      discountPercent: discountPercent.trim(),
      badgeColor,
      themeStyle,
      ctaText: ctaText.trim() || "Shop Now",
      ctaLink: ctaLink.trim() || "/products",
      secondaryCtaText: secondaryCtaText.trim() || undefined,
      secondaryCtaLink: secondaryCtaLink.trim() || undefined,
      image: image.trim(),
      isActive,
      order: Number(order) || 1,
    };

    try {
      await saveSpotlightBannerToFirestore(bannerPayload);
      dispatch(addOrUpdateSpotlightBanner(bannerPayload));
      toast.success(
        editingId
          ? `Campaign banner "${bannerPayload.title}" updated successfully!`
          : `New campaign banner "${bannerPayload.title}" created successfully!`
      );
      setDesignerOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpotlightBannerFromFirestore(bannerToDelete.id);
      dispatch(removeSpotlightBanner(bannerToDelete.id));
      toast.success(`Banner "${bannerToDelete.title}" deleted.`);
      setBannerToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete banner.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to default presets
  const handleResetDefaults = async () => {
    setIsResetting(true);
    try {
      await seedSpotlightBannersToFirestore(true);
      toast.success("Restored default campaign spotlight banners!");
      setResetConfirmOpen(false);
      onRefresh();
    } catch {
      toast.error("Failed to restore default banners.");
    } finally {
      setIsResetting(false);
    }
  };

  // Helper for Theme Styles in Preview
  const getThemeClasses = (style: SpotlightThemeStyle) => {
    switch (style) {
      case "gradient-sunset":
        return "bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950/90 text-white border-orange-900/40";
      case "gradient-ocean":
        return "bg-gradient-to-br from-stone-950 via-slate-900 to-cyan-950/90 text-white border-cyan-900/40";
      case "gradient-emerald":
        return "bg-gradient-to-br from-stone-950 via-neutral-900 to-emerald-950/90 text-white border-emerald-900/40";
      case "gradient-royal":
        return "bg-gradient-to-br from-stone-950 via-neutral-900 to-purple-950/90 text-white border-purple-900/40";
      case "clean-light":
        return "bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-white border-stone-300 dark:border-neutral-800";
      case "dark-stone":
      default:
        return "bg-stone-900 text-white border-stone-800";
    }
  };

  const getBadgeClass = (col: SpotlightBadgeColor) => {
    const found = BADGE_COLOR_OPTIONS.find((b) => b.id === col);
    return found ? found.class : "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  const activeCount = banners.filter((b) => b.isActive !== false).length;
  const promoCount = banners.filter((b) => Boolean(b.discountCode)).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-orange-950 text-white shadow-xl border border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3 border border-orange-500/30">
            <SparklesIcon className="size-4" />
            <span>Storefront Campaign Slider Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Campaign Spotlight Banners
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
            Design dynamic promotional slider banners for your homepage. Add promo codes with 1-click copying, custom color themes, high-res photography, and arrange sequence order.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong>{activeCount}</strong> Live Banners in Slider
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 font-medium">
              <TagIcon className="size-3.5 text-orange-400" />
              <strong>{promoCount}</strong> Active Voucher Codes
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 font-medium">
              Total <strong>{banners.length}</strong> Banners in Library
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-950/40 transition hover:scale-[1.02] cursor-pointer"
          >
            <PlusIcon className="size-5" />
            <span>Design New Banner</span>
          </button>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
            title="Restore curated default campaign banners"
          >
            <ArrowPathIcon className="size-4" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>

      {/* Banners List Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Slider Sequence &amp; Campaign Inventory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 font-normal">
                {banners.length} slides
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Active banners automatically cycle in the storefront slider according to their display sequence number.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold"
          >
            <PlusIcon className="size-4" />
            <span>+ Add Banner</span>
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="size-16 rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
              <SparklesIcon className="size-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No Campaign Banners Yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
                Create your first promotional spotlight banner with custom discount code and imagery, or restore our curated default templates.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
              >
                + Design Banner
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Restore Presets
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-neutral-800">
            {banners.map((b, idx) => {
              const active = b.isActive !== false;
              const theme = THEME_STYLE_OPTIONS.find((t) => t.id === b.themeStyle) || THEME_STYLE_OPTIONS[0];
              return (
                <div
                  key={b.id || idx}
                  className={`p-5 sm:p-6 transition-colors duration-150 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                    active ? "hover:bg-stone-50/80 dark:hover:bg-neutral-850/40" : "bg-stone-50/50 dark:bg-neutral-900/30 opacity-70"
                  }`}
                >
                  {/* Left: Sequence + Thumbnail + Info */}
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    {/* Order Controls */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(b, "up")}
                        disabled={idx === 0}
                        className={`size-7 rounded-lg flex items-center justify-center border transition ${
                          idx === 0
                            ? "opacity-30 border-stone-200 dark:border-neutral-800 cursor-not-allowed"
                            : "border-stone-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
                        }`}
                        title="Move slide up in sequence"
                      >
                        <ArrowUpIcon className="size-3.5" />
                      </button>
                      <span className="text-xs font-black font-mono text-gray-400">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(b, "down")}
                        disabled={idx === banners.length - 1}
                        className={`size-7 rounded-lg flex items-center justify-center border transition ${
                          idx === banners.length - 1
                            ? "opacity-30 border-stone-200 dark:border-neutral-800 cursor-not-allowed"
                            : "border-stone-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
                        }`}
                        title="Move slide down in sequence"
                      >
                        <ArrowDownIcon className="size-3.5" />
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative size-20 sm:size-24 rounded-2xl overflow-hidden shrink-0 border border-stone-200 dark:border-neutral-800 bg-stone-100 dark:bg-neutral-800 shadow-xs">
                      <img
                        src={normalizeGoogleDriveImageUrl(b.image)}
                        alt={b.title}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      {!active && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                          Paused
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeClass(
                            b.badgeColor || "orange"
                          )}`}
                        >
                          <SparklesIcon className="size-3" />
                          {b.tag || "Campaign"}
                        </span>

                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 font-medium">
                          Theme: {theme.label}
                        </span>

                        {b.discountCode && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40">
                            <TagIcon className="size-3" />
                            {b.discountCode}
                            {b.discountPercent && ` (${b.discountPercent})`}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {b.title}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-1 max-w-xl">
                        {b.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 dark:text-neutral-500">
                        <span>CTA: <strong className="text-gray-700 dark:text-neutral-300">{b.ctaText}</strong> &rarr; {b.ctaLink}</span>
                        {b.secondaryCtaText && (
                          <span>| 2nd CTA: <strong className="text-gray-700 dark:text-neutral-300">{b.secondaryCtaText}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(b)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                          : "bg-stone-100 dark:bg-neutral-800 text-stone-500 border-stone-200 dark:border-neutral-700 hover:bg-stone-200"
                      }`}
                      title={active ? "Slide is live. Click to pause." : "Slide is paused. Click to make live."}
                    >
                      <span className={`size-2 rounded-full ${active ? "bg-emerald-500" : "bg-stone-400"}`} />
                      <span>{active ? "Live" : "Paused"}</span>
                    </button>

                    {/* Edit / Redesign */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-gray-700 dark:text-neutral-200 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-bold border border-stone-200 dark:border-neutral-700 transition cursor-pointer"
                      title="Edit banner in designer"
                    >
                      <PencilSquareIcon className="size-4" />
                      <span>Edit</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(b)}
                      className="size-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="Duplicate banner"
                    >
                      <DocumentDuplicateIcon className="size-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setBannerToDelete(b)}
                      className="size-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Delete banner"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BANNER DESIGNER & STUDIO MODAL                           */}
      {/* ======================================================== */}
      <Transition appear show={designerOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDesignerOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 p-6 sm:p-8 text-left align-middle shadow-2xl transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800 pb-5">
                    <div>
                      <DialogTitle
                        as="h3"
                        className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"
                      >
                        <SparklesIcon className="size-6 text-orange-600" />
                        <span>{editingId ? "Redesign Campaign Banner" : "Design New Campaign Banner"}</span>
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                        Tailor headline, promotional voucher, theme palette, and preview the live storefront experience in real-time.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDesignerOpen(false)}
                      className="size-9 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBanner} className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* LEFT COLUMN: Controls & Settings (7 cols) */}
                      <div className="lg:col-span-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* 1. Basic Content */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                            <span>1. Headline &amp; Tagline</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Tag / Badge Label *
                              </label>
                              <input
                                type="text"
                                required
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                placeholder="e.g. Special Offer • Bangladesh"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Badge Color Accent
                              </label>
                              <select
                                value={badgeColor}
                                onChange={(e) => setBadgeColor(e.target.value as SpotlightBadgeColor)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                {BADGE_COLOR_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                              Banner Main Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g. Premium Selvedge Denim & Winter Coats"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                              Story / Description
                            </label>
                            <textarea
                              rows={3}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Provide details about the fabric, discounts, or seasonal campaign narrative..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>

                        {/* 2. Visual Theme Preset */}
                        <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-neutral-800">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            <span>2. Visual Canvas Style &amp; Theme</span>
                          </h4>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {THEME_STYLE_OPTIONS.map((style) => (
                              <button
                                type="button"
                                key={style.id}
                                onClick={() => setThemeStyle(style.id)}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                  themeStyle === style.id
                                    ? "border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20 dark:bg-orange-950/20"
                                    : "border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-700"
                                }`}
                              >
                                <div className={`h-8 w-full rounded-lg mb-2 border ${style.previewBg}`} />
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                  {style.label}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Promotional Voucher & Coupon */}
                        <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-neutral-800">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            <span>3. Promo Voucher &amp; Discount</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Discount Voucher Code
                              </label>
                              <div className="relative">
                                <TagIcon className="size-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                  type="text"
                                  value={discountCode}
                                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                  placeholder="e.g. SILKENDRIFT2026"
                                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-mono font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Discount Percentage / Label
                              </label>
                              <input
                                type="text"
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(e.target.value)}
                                placeholder="e.g. 15% OFF, BDT 500 OFF"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Action Buttons (CTAs) */}
                        <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-neutral-800">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            <span>4. Call-to-Action Buttons</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Primary Button Text *
                              </label>
                              <input
                                type="text"
                                required
                                value={ctaText}
                                onChange={(e) => setCtaText(e.target.value)}
                                placeholder="e.g. Shop The Collection"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Primary Button Link *
                              </label>
                              <input
                                type="text"
                                required
                                value={ctaLink}
                                onChange={(e) => setCtaLink(e.target.value)}
                                placeholder="e.g. /products?category=Denim"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>

                          {/* Quick Link Presets */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-gray-400">Quick Links:</span>
                            {LINK_PRESETS.map((p) => (
                              <button
                                type="button"
                                key={p.label}
                                onClick={() => setCtaLink(p.link)}
                                className="text-[11px] px-2 py-0.5 rounded-md border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 hover:border-orange-500 text-gray-600 dark:text-neutral-300 transition"
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Secondary Button Text (Optional)
                              </label>
                              <input
                                type="text"
                                value={secondaryCtaText}
                                onChange={(e) => setSecondaryCtaText(e.target.value)}
                                placeholder="e.g. Read Our Craft"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                                Secondary Button Link (Optional)
                              </label>
                              <input
                                type="text"
                                value={secondaryCtaLink}
                                onChange={(e) => setSecondaryCtaLink(e.target.value)}
                                placeholder="e.g. /about-us"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 5. Image & Photography */}
                        <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-neutral-800">
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            <span>5. Campaign Photography</span>
                          </h4>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                              Image URL (Google Drive, Unsplash, or Direct URL) *
                            </label>
                            <input
                              type="url"
                              required
                              value={image}
                              onChange={(e) => setImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... or Google Drive share link"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          {/* Sample Image Presets */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-gray-400">Quick Samples:</span>
                            {SAMPLE_IMAGE_PRESETS.map((s) => (
                              <button
                                type="button"
                                key={s.label}
                                onClick={() => setImage(s.url)}
                                className="text-[11px] px-2 py-0.5 rounded-md border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 hover:border-orange-500 text-gray-600 dark:text-neutral-300 transition"
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 6. Status and Order */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 dark:border-neutral-800">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                              Slide Sequence / Order
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={order}
                              onChange={(e) => setOrder(Number(e.target.value))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div className="flex items-center gap-3 pt-6">
                            <input
                              type="checkbox"
                              id="bannerActiveCheckbox"
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                              className="size-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                            <label
                              htmlFor="bannerActiveCheckbox"
                              className="text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
                            >
                              Active &amp; Live in Storefront Slider
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Interactive Live Preview (6 cols) */}
                      <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between pb-3">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <EyeIcon className="size-4 text-orange-600" />
                              <span>Live Storefront Preview</span>
                            </span>

                            <div className="flex items-center gap-1 bg-stone-100 dark:bg-neutral-800 p-1 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs">
                              <button
                                type="button"
                                onClick={() => setPreviewMode("desktop")}
                                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                                  previewMode === "desktop"
                                    ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-2xs"
                                    : "text-gray-500 hover:text-gray-900 dark:text-neutral-400"
                                }`}
                              >
                                <ComputerDesktopIcon className="size-3.5" />
                                <span>Desktop</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewMode("mobile")}
                                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                                  previewMode === "mobile"
                                    ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-2xs"
                                    : "text-gray-500 hover:text-gray-900 dark:text-neutral-400"
                                }`}
                              >
                                <DevicePhoneMobileIcon className="size-3.5" />
                                <span>Mobile</span>
                              </button>
                            </div>
                          </div>

                          {/* Live Rendered Card */}
                          <div
                            className={`transition-all duration-300 mx-auto ${
                              previewMode === "mobile" ? "max-w-[340px]" : "w-full"
                            }`}
                          >
                            <div
                              className={`rounded-3xl overflow-hidden border shadow-xl transition-all ${getThemeClasses(
                                themeStyle
                              )}`}
                            >
                              <div
                                className={`grid ${
                                  previewMode === "mobile"
                                    ? "grid-cols-1"
                                    : "grid-cols-1 lg:grid-cols-12 min-h-[360px]"
                                }`}
                              >
                                {/* Text Area */}
                                <div
                                  className={`${
                                    previewMode === "mobile" ? "p-5" : "lg:col-span-7 p-6 sm:p-8"
                                  } flex flex-col justify-between z-10 space-y-4`}
                                >
                                  <div className="space-y-3">
                                    <div
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeClass(
                                        badgeColor
                                      )}`}
                                    >
                                      <SparklesIcon className="size-3" />
                                      <span>{tag || "Campaign Tag"}</span>
                                    </div>

                                    <h2
                                      className={`font-black tracking-tight leading-tight ${
                                        previewMode === "mobile" ? "text-xl" : "text-2xl sm:text-3xl"
                                      }`}
                                    >
                                      {title || "Your Campaign Title Goes Here"}
                                    </h2>

                                    <p
                                      className={`text-xs leading-relaxed opacity-80 ${
                                        previewMode === "mobile" ? "line-clamp-2" : "line-clamp-3"
                                      }`}
                                    >
                                      {description ||
                                        "Detailed narrative about the premium fabrics, sustainable mills, and styling suggestions."}
                                    </p>

                                    {discountCode && (
                                      <div className="pt-1 flex items-center gap-2">
                                        <div
                                          onClick={() => {
                                            setPreviewCopied(true);
                                            setTimeout(() => setPreviewCopied(false), 2000);
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold tracking-wider text-orange-400 cursor-pointer transition"
                                          title="Test copy code"
                                        >
                                          <TagIcon className="size-3.5" />
                                          <span>CODE: {discountCode}</span>
                                          {discountPercent && (
                                            <span className="text-[10px] opacity-75 font-sans font-normal">
                                              ({discountPercent})
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] opacity-60">
                                          {previewCopied ? "Copied!" : "Click to test copy"}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Buttons in Preview */}
                                  <div className="pt-4 flex flex-wrap items-center gap-2.5">
                                    <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-orange-600 text-white font-bold text-xs shadow-md">
                                      <span>{ctaText || "Shop Now"}</span>
                                      <ArrowRightIcon className="size-3.5" />
                                    </span>

                                    {secondaryCtaText && (
                                      <span className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full border border-current text-xs font-semibold opacity-80">
                                        {secondaryCtaText}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Image Column */}
                                <div
                                  className={`${
                                    previewMode === "mobile" ? "h-44" : "lg:col-span-5 h-48 lg:h-auto"
                                  } relative overflow-hidden`}
                                >
                                  <img
                                    src={normalizeGoogleDriveImageUrl(image)}
                                    alt={title}
                                    className="w-full h-full object-cover object-center"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => setDesignerOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/30 transition disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <span>Saving to Storefront...</span>
                            ) : (
                              <>
                                <CheckCircleIcon className="size-4" />
                                <span>{editingId ? "Save Changes" : "Publish Banner to Slider"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL                                */}
      {/* ======================================================== */}
      <Transition appear show={Boolean(bannerToDelete)} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setBannerToDelete(null)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <div className="size-10 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                      <ExclamationTriangleIcon className="size-5" />
                    </div>
                    <DialogTitle as="h3" className="text-lg font-bold text-gray-900 dark:text-white">
                      Delete Campaign Banner?
                    </DialogTitle>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                    Are you sure you want to delete banner{" "}
                    <strong className="text-gray-900 dark:text-white">
                      "{bannerToDelete?.title}"
                    </strong>
                    ? This will permanently remove this slide from your storefront spotlight slider.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setBannerToDelete(null)}
                      className="px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Banner"}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ======================================================== */}
      {/* RESTORE DEFAULTS CONFIRMATION MODAL                      */}
      {/* ======================================================== */}
      <Transition appear show={resetConfirmOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setResetConfirmOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                    <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                      <ArrowPathIcon className="size-5" />
                    </div>
                    <DialogTitle as="h3" className="text-lg font-bold text-gray-900 dark:text-white">
                      Restore Preset Banners?
                    </DialogTitle>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                    This will restore our 3 curated factory default campaign banners (Denim Capsule, Winter Trench Drop, RMG Heritage Series) into your database.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      disabled={isResetting}
                      className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                    >
                      {isResetting ? "Restoring..." : "Restore Default Banners"}
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

export default AdminBannersTab;
