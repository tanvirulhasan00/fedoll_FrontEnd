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
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import NewsLetter from "./Newsletter";

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
  { name: "Careers at Fedoll", href: "/about-us" },
];

const SUPPORT_LINKS = [
  { name: "Customer Profile & Orders", href: "/profile" },
  { name: "Order Tracking", href: "/track-order" },
  { name: "Contact Customer Care", href: "/contact-us" },
  { name: "Shipping & Delivery Info", href: "/contact-us" },
  { name: "Returns & Exchanges", href: "/contact-us" },
  { name: "Size Guide & Fit Advice", href: "/contact-us" },
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
  return (
    <footer className="relative bg-[#0c0e12] text-neutral-300 border-t border-neutral-800/80 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-orange-600/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-amber-600/5 blur-[100px]"
      />

      {/* Top Pre-Footer Newsletter Area */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
        <NewsLetter />
      </div>

      {/* Trust Pillars Feature Strip */}
      <div className="relative border-y border-neutral-800/80 bg-neutral-900/40 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{pillar.title}</h4>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
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
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand & Direct Contact Info (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block group">
                <img
                  src="/fedoll-logo-dark.svg"
                  alt="Fedoll - Export Quality Clothes"
                  className="h-10 w-auto rounded-md shadow-xs transition-opacity group-hover:opacity-90"
                />
              </Link>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-sm">
                Export Quality Clothes. Crafted with Pride in Bangladesh. Empowering modern
                wardrobes with certified sustainable cotton, precision tailoring, and timeless
                silhouettes.
              </p>

              {/* Contact Snippets */}
              <div className="mt-6 space-y-3 text-xs text-neutral-400">
                <div className="flex items-start gap-2.5">
                  <MapPinIcon className="size-4 shrink-0 text-orange-500 mt-0.5" />
                  <span>House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <EnvelopeIcon className="size-4 shrink-0 text-orange-500" />
                  <a
                    href="mailto:support@fedoll.com"
                    className="hover:text-orange-400 transition-colors"
                  >
                    support@fedoll.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon className="size-4 shrink-0 text-orange-500" />
                  <a
                    href="tel:+8801700000000"
                    className="hover:text-orange-400 transition-colors"
                  >
                    +880 1700-000000 / +880 2-9876543
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <ClockIcon className="size-4 shrink-0 text-orange-500" />
                  <span>Mon – Sat: 9:00 AM – 8:00 PM BST</span>
                </div>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Follow Our Journey
              </p>
              <div className="flex items-center gap-2.5">
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
                      className={`flex size-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${social.hoverColor}`}
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Links Columns (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-3">
            {/* Column 1: Shop Collections */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Collections
              </h3>
              <ul className="mt-4 space-y-3">
                {SHOP_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-neutral-400 hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Our Company */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h3>
              <ul className="mt-4 space-y-3">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-neutral-400 hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Customer Care
              </h3>
              <ul className="mt-4 space-y-3">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-neutral-400 hover:text-orange-400 transition-colors duration-200 inline-block py-0.5 hover:translate-x-1 transition-transform"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Export Certification Badge Card */}
              <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckBadgeIcon className="size-4 shrink-0" />
                  <span>Verified RMG Exporter</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400 leading-normal">
                  Certified ethical labor & 100% compliant sustainable textile mills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Banner */}
        <div className="mt-14 pt-8 border-t border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Accepted Payments:</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Cash on Delivery (COD)
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-pink-900/40 bg-pink-950/30 px-2.5 py-1 text-xs font-bold text-pink-400">
              bKash
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-orange-900/40 bg-orange-950/30 px-2.5 py-1 text-xs font-bold text-orange-400">
              Nagad
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-900/40 bg-blue-950/30 px-2.5 py-1 text-xs font-bold text-blue-400">
              VISA
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-900/40 bg-amber-950/30 px-2.5 py-1 text-xs font-bold text-amber-400">
              Mastercard
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-400">
              🔒 256-Bit SSL Secured
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <Link to="/contact-us" className="hover:text-orange-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-neutral-700">•</span>
            <Link to="/contact-us" className="hover:text-orange-400 transition-colors">
              Terms of Service
            </Link>
            <span className="text-neutral-700">•</span>
            <Link to="/contact-us" className="hover:text-orange-400 transition-colors">
              Security & Compliance
            </Link>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-neutral-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} <strong className="text-white">Fedoll International Ltd.</strong> All rights reserved.
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <span>Crafted with pride in</span>
            <span className="font-semibold text-emerald-400">Bangladesh 🇧🇩</span>
            <span>for global wardrobes.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
