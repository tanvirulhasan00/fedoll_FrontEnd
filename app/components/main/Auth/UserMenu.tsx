import React, { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import {
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { logout } from "~/firebase";
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

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="group flex items-center gap-2 rounded-full p-1 text-sm font-semibold text-gray-700 hover:text-black focus:outline-hidden transition">
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
        <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-medium text-gray-800">
          {displayName}
        </span>
        <ChevronDownIcon className="size-4 text-gray-400 group-hover:text-gray-700 transition" />
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
        <MenuItems className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-hidden">
          {/* User Info Header */}
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-gray-900">
              {displayName}
            </p>
            {user.email && (
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            )}
          </div>

          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <div
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 ${
                    focus ? "bg-gray-50 text-orange-700" : ""
                  }`}
                >
                  <ShieldCheckIcon className="size-4 text-green-600" />
                  <span>Verified Account</span>
                </div>
              )}
            </MenuItem>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    focus
                      ? "bg-red-50 text-red-700"
                      : "text-red-600 hover:bg-red-50"
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
