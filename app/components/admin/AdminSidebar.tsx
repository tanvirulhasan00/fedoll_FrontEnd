import React, { useState } from "react";
import { Link } from "react-router";
import {
  ChartBarIcon,
  ShoppingBagIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  UsersIcon,
  TagIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeOpenIcon,
  ScaleIcon,
  ArrowPathRoundedSquareIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import type { AuthUser } from "~/redux/features/auth/authSlice";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  normalizeGoogleDriveImageUrl,
  getRoleAllowedTabs,
  getRoleConfig,
  type AdminTab,
} from "~/firebase";

export type { AdminTab };

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  user: AuthUser | null;
  onSignOut: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  unreadMessagesCount?: number;
  subscribersCount?: number;
  pendingReturnsCount?: number;
  blogsCount?: number;
  lowStockCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onSignOut,
  mobileMenuOpen,
  onCloseMobileMenu,
  unreadMessagesCount = 0,
  subscribersCount = 0,
  pendingReturnsCount = 0,
  blogsCount = 0,
  lowStockCount = 0,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "overview", label: "Dashboard Overview", icon: ChartBarIcon },
    { id: "products", label: "Product Catalog", icon: ShoppingBagIcon },
    { id: "categories", label: "Categories", icon: RectangleStackIcon },
    {
      id: "inventory",
      label: "Inventory & Stock",
      icon: ArchiveBoxIcon,
      badge: lowStockCount > 0 ? `${lowStockCount} Alert` : "Live",
    },
    { id: "orders", label: "Orders & Shipments", icon: ClipboardDocumentListIcon },
    {
      id: "returns",
      label: "Returns & Exchanges",
      icon: ArrowPathRoundedSquareIcon,
      badge: pendingReturnsCount > 0 ? `${pendingReturnsCount} New` : undefined,
    },
    {
      id: "blogs",
      label: "Journal & Blogs",
      icon: BookOpenIcon,
      badge: blogsCount > 0 ? `${blogsCount}` : undefined,
    },
    { id: "shipping", label: "Shipping & Couriers", icon: TruckIcon, badge: "Logistics" },
    { id: "customers", label: "Shoppers & Customers", icon: UsersIcon },
    { id: "staff", label: "Staff & App Users", icon: ShieldCheckIcon, badge: "Roles" },
    { id: "coupons", label: "Coupons & Discounts", icon: TagIcon },
    {
      id: "messages",
      label: "Customer Inquiries",
      icon: ChatBubbleLeftRightIcon,
      badge: unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : undefined,
    },
    {
      id: "newsletters",
      label: "Newsletter Subscribers",
      icon: EnvelopeOpenIcon,
      badge: subscribersCount > 0 ? `${subscribersCount}` : undefined,
    },
    {
      id: "legal",
      label: "Legal & Policies",
      icon: ScaleIcon,
      badge: "Live",
    },
    { id: "settings", label: "Store Settings", icon: Cog6ToothIcon },
  ];

  const roleConfig = getRoleConfig(user?.role);
  const allowedTabs = getRoleAllowedTabs(user?.role);
  const visibleNavItems = navItems.filter((item) => allowedTabs.includes(item.id));

  const { settings } = useAppSelector((state) => state.storeSettings);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const customLogoUrl = normalizeGoogleDriveImageUrl(
    settings?.logoDarkUrl || settings?.logoLightUrl || settings?.logoUrl
  );
  const hasCustomLogo = Boolean(customLogoUrl && !logoLoadError);

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 dark:bg-neutral-950 text-stone-200 flex flex-col border-r border-stone-800 transition-transform duration-300 md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800/80 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {hasCustomLogo ? (
            <img
              src={customLogoUrl!}
              alt={settings?.storeName || "SilkenDrift"}
              className="size-11 rounded-xl object-contain bg-white/10 p-1.5 border border-stone-700/80 shadow-md"
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <div className="size-11 rounded-xl flex items-center justify-center bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-sans font-black text-lg shadow-md border border-stone-700/80 shrink-0">
              S
            </div>
          )}
          <div>
            <span className="font-bold text-base text-white tracking-wide">
              {settings?.storeName || "SilkenDrift"}
            </span>
            <span className="block text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
              {roleConfig.shortLabel} Atelier
            </span>
          </div>
        </Link>

        <span className="px-2 py-0.5 rounded-full bg-orange-950/80 text-[10px] text-orange-400 font-mono border border-orange-800/60 font-bold">
          v2.0
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Atelier Control
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? "bg-orange-600 text-white shadow-sm font-bold"
                  : "text-stone-300 hover:bg-stone-800/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`size-4.5 ${isActive ? "text-white" : "text-stone-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive
                      ? "bg-orange-700 text-white"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Storefront Link
        </div>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800/70 hover:text-white transition"
        >
          <div className="flex items-center gap-3">
            <ArrowTopRightOnSquareIcon className="size-4.5 text-stone-400" />
            <span>Open Live Website</span>
          </div>
          <span className="text-[10px] text-stone-400">New Tab</span>
        </Link>
      </nav>

      {/* Admin User Footer Card */}
      <div className="p-4 border-t border-stone-800/80 bg-stone-950/60 space-y-3">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Admin"
              className="size-9 rounded-xl object-cover ring-2 ring-orange-500/30"
            />
          ) : (
            <div className="size-9 rounded-xl bg-orange-600/30 border border-orange-500/40 text-orange-400 font-bold flex items-center justify-center text-xs">
              {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="truncate flex-1">
            <p className="text-xs font-bold text-white truncate">
              {user?.displayName || "Admin User"}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-400">
              <ShieldCheckIcon className="size-3" />
              <span>{roleConfig.label}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 text-rose-400 text-xs font-semibold transition cursor-pointer"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" />
          <span>Exit Dashboard</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
