import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import React, { useMemo, useState, useEffect } from "react";
import { useAppSelector } from "~/redux/hooks/hook";
import { Link } from "react-router";
import NewsLetter from "./Newsletter";
import { normalizeGoogleDriveImageUrl, extractGoogleDriveFileId } from "~/firebase";
import BrandLogo, { NavbarLogoSkeleton } from "~/components/ui/BrandLogo";

const TRUST_PILLARS = [
  {
    icon: TruckIcon,
    title: "Fast Nationwide Delivery",
    description: "Reliable Cash on Delivery across all 64 districts in Bangladesh.",
  },
  {
    icon: ShieldCheckIcon,
    title: "100% Export Grade Quality",
    description: "OEKO-TEX® certified cotton and precision high-durability stitching.",
  },
  {
    icon: ArrowPathIcon,
    title: "Hassle-Free 7-Day Exchange",
    description: "Easy doorstep exchanges if the fit or size isn't right for you.",
  },
  {
    icon: ChatBubbleBottomCenterTextIcon,
    title: "Dedicated Friendly Support",
    description: "Direct assistance via WhatsApp, phone, and email 6 days a week.",
  },
];

const SHOP_LINKS = [
  { name: "All Products", href: "/products" },
  { name: "Heavyweight Outerwear", href: "/products?category=Outerwear" },
  { name: "Classic Workwear", href: "/products?category=Workwear" },
  { name: "Signature Denim", href: "/products?category=Denim" },
  { name: "Premium T-Shirts", href: "/products?category=T-Shirt" },
  { name: "Winter 2026 Drops", href: "/products" },
];

const COMPANY_LINKS = [
  { name: "About Our Story", href: "/about-us" },
  { name: "Our Craft & Factory", href: "/about-us" },
  { name: "Fashion Journal & Blogs", href: "/blogs" },
  { name: "Sustainability & Ethics", href: "/about-us" },
  { name: "Wholesale & Bulk Orders", href: "/contact-us" },
  { name: "Careers at SilkenDrift", href: "/about-us" },
];

const SUPPORT_LINKS = [
  { name: "Customer Profile & Orders", href: "/profile" },
  { name: "Order Tracking", href: "/track-order" },
  { name: "Contact Customer Care", href: "/contact-us" },
  { name: "Shipping & Delivery Info", href: "/contact-us" },
  { name: "Returns & Exchanges", href: "/returns-and-exchanges" },
  { name: "Size Guide & Fit Advice", href: "/size-guide" },
  { name: "Help & FAQs", href: "/contact-us" },
];

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    icon: FaFacebookF,
    href: "https://facebook.com",
    hoverColor: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
  },
  {
    name: "Instagram",
    icon: FaInstagram,
    href: "https://instagram.com",
    hoverColor: "hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:border-pink-500",
  },
  {
    name: "X (Twitter)",
    icon: FaXTwitter,
    href: "https://twitter.com",
    hoverColor: "hover:bg-black hover:text-white hover:border-neutral-700",
  },
  {
    name: "LinkedIn",
    icon: FaLinkedinIn,
    href: "https://linkedin.com",
    hoverColor: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
  },
  {
    name: "YouTube",
    icon: FaYoutube,
    href: "https://youtube.com",
    hoverColor: "hover:bg-[#CD201F] hover:text-white hover:border-[#CD201F]",
  },
];

const Footer = () => {
  const { categories } = useAppSelector((state) => state.products);
  const { settings, loading: settingsLoading, initialized: settingsInitialized } =
    useAppSelector((state) => state.storeSettings);
  const [logoLightError, setLogoLightError] = useState(false);
  const [logoDarkError, setLogoDarkError] = useState(false);

  // Accordion state for compact mobile view
  const [openMobileSections, setOpenMobileSections] = useState<Record<string, boolean>>({
    collections: true,
    company: false,
    support: false,
  });

  const toggleMobileSection = (key: string) => {
    setOpenMobileSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    setLogoLightError(false);
    setLogoDarkError(false);
  }, [settings?.logoLightUrl, settings?.logoDarkUrl, settings?.logoUrl]);

  const customLogoLightUrl = normalizeGoogleDriveImageUrl(
    settings?.logoLightUrl || settings?.logoUrl
  );
  const customLogoDarkUrl = normalizeGoogleDriveImageUrl(
    settings?.logoDarkUrl || settings?.logoUrl
  );
  const hasCustomLogoLight = Boolean(customLogoLightUrl && !logoLightError);
  const hasCustomLogoDark = Boolean(customLogoDarkUrl && !logoDarkError);

  const dynamicShopLinks = useMemo(() => {
    const links = [{ name: "All Products", href: "/products" }];
    if (categories && categories.length > 0) {
      const valid = categories.filter(
        (c) => c.name.trim().toLowerCase() !== "uncategorized"
      );
      valid.slice(0, 5).forEach((c) => {
        links.push({
          name: c.name,
          href: `/products?category=${encodeURIComponent(c.name)}`,
        });
      });
    } else {
      links.push(...SHOP_LINKS.slice(1));
    }
    return links;
  }, [categories]);

  return (
    <footer className="relative bg-stone-100/70 dark:bg-[#0c0e12] text-gray-600 dark:text-neutral-300 border-t border-stone-200/80 dark:border-neutral-800/80 overflow-hidden transition-colors duration-200">
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-orange-500/5 dark:bg-orange-600/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-amber-500/5 dark:bg-amber-600/5 blur-[100px]"
      />

      {/* Top Pre-Footer Newsletter Area */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-16 pb-3 sm:pb-8">
        <NewsLetter />
      </div>

      {/* Trust Pillars Feature Strip (Compact 2x2 grid on mobile, 4-col on desktop) */}
      <div className="relative border-y border-stone-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-8 lg:grid-cols-4">
            {TRUST_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-stone-50/70 dark:bg-neutral-800/30 sm:bg-transparent border border-stone-200/60 dark:border-neutral-800/60 sm:border-0"
                >
                  <div className="flex size-8 sm:size-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-500/20">
                    <Icon className="size-4 sm:size-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                      {pillar.title}
                    </h4>
                    <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-neutral-400 leading-normal line-clamp-2 sm:line-clamp-none">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Navigation & Brand Section */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand & Direct Contact Info (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block group">
                {settingsLoading || !settingsInitialized ? (
                  <NavbarLogoSkeleton className="h-12 sm:h-14" />
                ) : (
                  <>
                    {hasCustomLogoLight ? (
                      <img
                        src={customLogoLightUrl!}
                        alt={
                          settings?.storeName
                            ? `${settings.storeName} - Export Quality Clothes`
                            : "SilkenDrift - Export Quality Clothes"
                        }
                        className="h-12 sm:h-14 max-h-16 w-auto max-w-[280px] object-contain rounded-md transition-opacity group-hover:opacity-90 dark:hidden"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fileId = extractGoogleDriveFileId(
                            settings?.logoLightUrl || settings?.logoUrl
                          );
                          if (fileId && !target.dataset.triedFallback) {
                            target.dataset.triedFallback = "true";
                            target.src = `https://lh3.googleusercontent.com/d/${fileId}`;
                          } else {
                            setLogoLightError(true);
                          }
                        }}
                      />
                    ) : (
                      <div className="dark:hidden">
                        <BrandLogo variant="light" className="h-12 sm:h-14 w-auto" />
                      </div>
                    )}

                    {hasCustomLogoDark ? (
                      <img
                        src={customLogoDarkUrl!}
                        alt={
                          settings?.storeName
                            ? `${settings.storeName} - Export Quality Clothes`
                            : "SilkenDrift - Export Quality Clothes"
                        }
                        className="h-12 sm:h-14 max-h-16 w-auto max-w-[280px] object-contain rounded-md transition-opacity group-hover:opacity-90 hidden dark:block"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fileId = extractGoogleDriveFileId(
                            settings?.logoDarkUrl || settings?.logoUrl
                          );
                          if (fileId && !target.dataset.triedFallback) {
                            target.dataset.triedFallback = "true";
                            target.src = `https://lh3.googleusercontent.com/d/${fileId}`;
                          } else {
                            setLogoDarkError(true);
                          }
                        }}
                      />
                    ) : (
                      <div className="hidden dark:block">
                        <BrandLogo variant="dark" className="h-12 sm:h-14 w-auto" />
                      </div>
                    )}
                  </>
                )}
              </Link>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 dark:text-neutral-400 leading-relaxed max-w-sm">
                {settings?.tagline ||
                  "Export Quality Clothes. Crafted with Pride in Bangladesh. Empowering modern wardrobes with certified sustainable cotton, precision tailoring, and timeless silhouettes."}
              </p>

              {/* Contact Snippets */}
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-xs text-gray-600 dark:text-neutral-400">
                <div className="flex items-start gap-2.5">
                  <MapPinIcon className="size-4 shrink-0 text-orange-600 dark:text-orange-500 mt-0.5" />
                  <span>
                    {settings?.headquartersAddress ||
                      "House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <EnvelopeIcon className="size-4 shrink-0 text-orange-600 dark:text-orange-500" />
                  <a
                    href={`mailto:${settings?.contactEmail || "support@silkendrift.com"}`}
                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {settings?.contactEmail || "support@silkendrift.com"}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon className="size-4 shrink-0 text-orange-600 dark:text-orange-500" />
                  <a
                    href={`tel:${settings?.contactPhone || "+8801700000000"}`}
                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {settings?.contactPhone || "+880 1700-000000 / +880 2-9876543"}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <ClockIcon className="size-4 shrink-0 text-orange-600 dark:text-orange-500" />
                  <span>
                    {settings?.supportHours || "Mon – Sat: 9:00 AM – 8:00 PM BST"}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-5 sm:mt-8">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400 mb-2 sm:mb-3">
                Follow Our Journey
              </p>
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.name}
                      aria-label={social.name}
                      className={`flex size-8 sm:size-9 items-center justify-center rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-orange-300 dark:hover:border-neutral-700 ${social.hoverColor}`}
                    >
                      <Icon className="size-3.5 sm:size-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Links Columns (8 cols) */}
          <div className="lg:col-span-8">
            {/* Mobile Accordion Navigation (< sm screen): eliminates empty 2-col voids */}
            <div className="sm:hidden space-y-1 border-t border-stone-200/80 dark:border-neutral-800/80 pt-2">
              {/* Accordion 1: Collections */}
              <div className="border-b border-stone-200/80 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("collections")}
                  className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white cursor-pointer"
                  aria-expanded={openMobileSections.collections}
                >
                  <span className="flex items-center gap-2">
                    <span>Collections</span>
                    <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.2 text-[10px] font-bold text-orange-700 dark:text-orange-400">
                      {dynamicShopLinks.length}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`size-4 text-gray-400 dark:text-neutral-500 transition-transform duration-200 ${
                      openMobileSections.collections ? "rotate-180 text-orange-600 dark:text-orange-400" : ""
                    }`}
                  />
                </button>
                {openMobileSections.collections && (
                  <ul className="pb-3 pl-1 space-y-2 animate-in fade-in duration-150">
                    {dynamicShopLinks.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-xs text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors inline-block py-0.5"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Accordion 2: Company */}
              <div className="border-b border-stone-200/80 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("company")}
                  className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white cursor-pointer"
                  aria-expanded={openMobileSections.company}
                >
                  <span className="flex items-center gap-2">
                    <span>Company</span>
                    <span className="rounded-full bg-stone-100 dark:bg-neutral-800 px-1.5 py-0.2 text-[10px] font-bold text-gray-600 dark:text-neutral-400">
                      {COMPANY_LINKS.length}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`size-4 text-gray-400 dark:text-neutral-500 transition-transform duration-200 ${
                      openMobileSections.company ? "rotate-180 text-orange-600 dark:text-orange-400" : ""
                    }`}
                  />
                </button>
                {openMobileSections.company && (
                  <ul className="pb-3 pl-1 space-y-2 animate-in fade-in duration-150">
                    {COMPANY_LINKS.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-xs text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors inline-block py-0.5"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Accordion 3: Customer Care */}
              <div className="border-b border-stone-200/80 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("support")}
                  className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white cursor-pointer"
                  aria-expanded={openMobileSections.support}
                >
                  <span className="flex items-center gap-2">
                    <span>Customer Care</span>
                    <span className="rounded-full bg-stone-100 dark:bg-neutral-800 px-1.5 py-0.2 text-[10px] font-bold text-gray-600 dark:text-neutral-400">
                      {SUPPORT_LINKS.length}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`size-4 text-gray-400 dark:text-neutral-500 transition-transform duration-200 ${
                      openMobileSections.support ? "rotate-180 text-orange-600 dark:text-orange-400" : ""
                    }`}
                  />
                </button>
                {openMobileSections.support && (
                  <ul className="pb-3 pl-1 space-y-2 animate-in fade-in duration-150">
                    {SUPPORT_LINKS.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-xs text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors inline-block py-0.5"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Export Certification Badge Card on Mobile (Full width, balanced) */}
              <div className="pt-3">
                <div className="rounded-xl border border-stone-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-3 backdrop-blur-xs shadow-xs dark:shadow-none">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckBadgeIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified RMG Exporter</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400 leading-normal">
                    Certified ethical labor & 100% compliant sustainable textile mills in Bangladesh.
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links (>= sm screen) */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-8">
              {/* Column 1: Shop Collections */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                  Collections
                </h3>
                <ul className="mt-4 space-y-3">
                  {dynamicShopLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Our Company */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                  Company
                </h3>
                <ul className="mt-4 space-y-3">
                  {COMPANY_LINKS.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Customer Care */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                  Customer Care
                </h3>
                <ul className="mt-4 space-y-3">
                  {SUPPORT_LINKS.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-gray-600 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Export Certification Badge Card */}
                <div className="mt-6 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-3.5 backdrop-blur-xs shadow-xs dark:shadow-none">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckBadgeIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified RMG Exporter</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400 leading-normal">
                    Certified ethical labor & 100% compliant sustainable textile mills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Banner */}
        <div className="mt-6 sm:mt-14 pt-5 sm:pt-8 border-t border-stone-200/80 dark:border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-3 text-xs text-gray-500 dark:text-neutral-400">
            <span className="font-semibold text-gray-900 dark:text-neutral-300 text-[11px] sm:text-xs">
              Accepted Payments:
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-neutral-800 bg-emerald-50 dark:bg-neutral-900 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Cash on Delivery (COD)
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-pink-700 dark:text-pink-400">
              bKash
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-orange-700 dark:text-orange-400">
              Nagad
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-400">
              VISA
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400">
              Mastercard
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600 dark:text-neutral-400 shadow-2xs dark:shadow-none">
              🔒 256-Bit SSL Secured
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 sm:gap-6 text-[11px] sm:text-xs text-gray-500 dark:text-neutral-400">
            <Link to="/privacy-policy" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-stone-300 dark:text-neutral-700">•</span>
            <Link to="/terms-of-service" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Terms of Service
            </Link>
            <span className="text-stone-300 dark:text-neutral-700">•</span>
            <Link to="/security" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Security &amp; Compliance
            </Link>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-stone-200/80 dark:border-neutral-800/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-gray-500 dark:text-neutral-400 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} <strong className="text-gray-900 dark:text-white">SilkenDrift International Ltd.</strong> All rights reserved.
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <span>Crafted with pride in</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Bangladesh 🇧🇩</span>
            <span>for global wardrobes.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
