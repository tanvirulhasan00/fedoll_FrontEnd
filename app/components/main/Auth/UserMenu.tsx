import React, { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import { Link } from "react-router";
import {
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
  Cog6ToothIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { logout, isStaffRole, getRoleConfig } from "~/firebase";
import { useAppDispatch } from "~/redux/hooks/hook";
import { logoutUser, type AuthUser } from "~/redux/features/auth/authSlice";

export interface UserMenuProps {
  user: AuthUser;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const dispatch = useAppDispatch();

  const handleSignOut = async () => {
    try {
      await logout();
      dispatch(logoutUser());
      toast.success("Signed out successfully.");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sign out.");
    }
  };

  const displayName =
    user.displayName || user.email?.split("@")[0] || "My Account";
  const userInitial = displayName.charAt(0).toUpperCase();
  const isStaff = isStaffRole(user.role);
  const roleConfig = getRoleConfig(user.role);
  const roleDisplay = roleConfig.label;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="group flex items-center gap-2 rounded-full p-1 text-sm font-semibold text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white focus:outline-hidden transition cursor-pointer">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="size-8 rounded-full object-cover ring-2 ring-orange-700/20 group-hover:ring-orange-700 transition"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-orange-700 text-xs font-bold text-white shadow-xs">
            {userInitial}
          </div>
        )}
        <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-medium text-gray-800 dark:text-neutral-200">
          {displayName}
        </span>
        <ChevronDownIcon className="size-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-neutral-200 transition" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-neutral-900 p-2 shadow-xl ring-1 ring-black/5 dark:ring-neutral-800 focus:outline-hidden divide-y divide-gray-100 dark:divide-neutral-800">
          {/* User Info Header with Role Badge */}
          <div className="px-3 py-2.5 space-y-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            {user.email && (
              <p className="truncate text-xs text-gray-500 dark:text-neutral-400">{user.email}</p>
            )}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                <ShieldCheckIcon className="size-3" />
                {roleDisplay}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <Link
                  to="/profile"
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    focus
                      ? "bg-gray-100 dark:bg-neutral-800 text-orange-700 dark:text-orange-400"
                      : "text-gray-700 dark:text-neutral-300"
                  }`}
                >
                  <UserCircleIcon className="size-4 text-gray-500 dark:text-neutral-400" />
                  <span>Customer Profile</span>
                </Link>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <Link
                  to="/profile?tab=orders"
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    focus
                      ? "bg-gray-100 dark:bg-neutral-800 text-orange-700 dark:text-orange-400"
                      : "text-gray-700 dark:text-neutral-300"
                  }`}
                >
                  <ShoppingBagIcon className="size-4 text-gray-500 dark:text-neutral-400" />
                  <span>My Orders</span>
                </Link>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <Link
                  to="/track-order"
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    focus
                      ? "bg-gray-100 dark:bg-neutral-800 text-orange-700 dark:text-orange-400"
                      : "text-gray-700 dark:text-neutral-300"
                  }`}
                >
                  <TruckIcon className="size-4 text-gray-500 dark:text-neutral-400" />
                  <span>Track Courier Order</span>
                </Link>
              )}
            </MenuItem>

            <MenuItem>
              {({ focus }) => (
                <Link
                  to="/profile?tab=wishlist"
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    focus
                      ? "bg-gray-100 dark:bg-neutral-800 text-orange-700 dark:text-orange-400"
                      : "text-gray-700 dark:text-neutral-300"
                  }`}
                >
                  <HeartIcon className="size-4 text-rose-500" />
                  <span>My Loved Wishlist</span>
                </Link>
              )}
            </MenuItem>

            {isStaff && (
              <MenuItem>
                {({ focus }) => (
                  <Link
                    to="/admin"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      focus
                        ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                        : "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Cog6ToothIcon className="size-4 text-orange-600 dark:text-orange-400" />
                      <span>Atelier Dashboard</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-orange-700 text-white">
                      {roleConfig.shortLabel}
                    </span>
                  </Link>
                )}
              </MenuItem>
            )}
          </div>

          {/* Sign Out */}
          <div className="pt-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                    focus
                      ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  }`}
                >
                  <ArrowRightStartOnRectangleIcon className="size-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default UserMenu;
