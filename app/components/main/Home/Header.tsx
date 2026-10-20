import { useEffect, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router";
import clsx from "clsx";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { logoutUser } from "~/redux/features/auth/authSlice";
import { logout } from "~/firebase";
import { AuthModal } from "../Auth/AuthModal";
import { UserMenu } from "../Auth/UserMenu";
import { openCart } from "~/redux/features/cart/cartSlice";
import CartDrawer from "../Cart/CartDrawer";
import ThemeToggle from "../Utilities/ThemeToggle";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Blogs", href: "/blogs" },
  { name: "About Us", href: "/about-us" },
  { name: "Contact Us", href: "/contact-us" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bounced, setBounced] = useState(false);
  const [hasBounced, setHasBounced] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const [isMounted, setIsMounted] = useState(false);

  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { totalQuantity } = useAppSelector((state) => state.cart);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isNavActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    if (href === "/products") {
      return location.pathname.startsWith("/product");
    }
    if (href === "/blogs") {
      return location.pathname.startsWith("/blog");
    }
    if (href === "/contact-us") {
      return location.pathname === "/contact-us" || location.pathname === "/contact";
    }
    return location.pathname === href;
  };

  const handleOpenAuth = (tab: "login" | "signup") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20 && !hasBounced) {
        setScrolled(true);
        setBounced(true);
        setHasBounced(true);

        setTimeout(() => {
          setBounced(false);
        }, 300);
      }

      if (window.scrollY <= 10) {
        setScrolled(false);
        setHasBounced(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasBounced]);

  return (
    <header
      className={clsx(
        "w-full p-0 px-4 md:px-10 sticky top-0 z-50 transition-all duration-300 text-black dark:text-white border-b border-transparent",
        scrolled
          ? "bg-white/95 dark:bg-neutral-900/95 shadow-md backdrop-blur-md dark:border-neutral-800"
          : "bg-white dark:bg-neutral-900 dark:border-neutral-800/60",
        bounced ? "-translate-y-[30px]" : "translate-y-0",
      )}
    >
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Fedoll</span>
            <img alt="Fedoll" src="/fedoll-logo.svg" className="h-8 w-auto dark:hidden" />
            <img
              alt="Fedoll"
              src="/fedoll-logo-dark.svg"
              className="h-8 w-auto hidden dark:block rounded-md"
            />
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => dispatch(openCart())}
            className="relative p-2 text-gray-700 dark:text-neutral-300 hover:text-orange-700 dark:hover:text-orange-400 transition cursor-pointer"
            title="Shopping Bag"
          >
            <ShoppingBagIcon className="size-6" />
            {totalQuantity > 0 && (
              <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-orange-700 text-[10px] font-bold text-white shadow-xs">
                {totalQuantity}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-900 dark:text-white"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  "relative py-1 text-sm/6 font-semibold transition-colors duration-200",
                  active
                    ? "text-orange-700 dark:text-orange-500 font-bold after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-orange-700 dark:after:bg-orange-500 after:rounded-full"
                    : "text-gray-800 dark:text-neutral-300 hover:text-orange-700 dark:hover:text-orange-400",
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Top-Right Auth Options (Desktop) */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => dispatch(openCart())}
            className="relative p-2 text-gray-700 dark:text-neutral-300 hover:text-orange-700 dark:hover:text-orange-400 transition cursor-pointer group"
            title="Shopping Bag"
          >
            <ShoppingBagIcon className="size-6 text-gray-800 dark:text-neutral-200 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition" />
            {isMounted && totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-orange-700 text-[11px] font-bold text-white shadow-xs animate-in zoom-in-75">
                {totalQuantity}
              </span>
            )}
          </button>

          {!isMounted ? (
            /* Visible skeleton pill while hydrating to prevent layout flash on SSR/reload */
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-100/80 dark:bg-neutral-800/80 px-2 py-1 h-8 animate-pulse" aria-hidden="true">
              <div className="size-6 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-3 w-14 rounded-full bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />
            </div>
          ) : isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : authLoading ? (
            /* Subtle placeholder while Firebase auth session verifies */
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-100/80 dark:bg-neutral-800/80 px-2 py-1 h-8 animate-pulse" aria-hidden="true">
              <div className="size-6 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <div className="h-3 w-14 rounded-full bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />
            </div>
          ) : (
            <div className="flex items-center gap-x-3">
              <button
                type="button"
                onClick={() => handleOpenAuth("login")}
                className="text-sm font-semibold text-gray-700 dark:text-neutral-200 hover:text-orange-700 dark:hover:text-orange-400 transition cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth("signup")}
                className="rounded-full bg-orange-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-orange-800 transition cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-neutral-900 text-black dark:text-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-100/10 dark:border-l dark:border-neutral-800">
          <div className="flex items-center justify-between px-4 md:px-10">
            <Link
              to="/"
              className="-m-1.5 p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Fedoll</span>
              <img alt="Fedoll" src="/fedoll-logo.svg" className="h-8 w-auto dark:hidden" />
              <img
                alt="Fedoll"
                src="/fedoll-logo-dark.svg"
                className="h-8 w-auto hidden dark:block rounded-md"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-900 dark:text-neutral-200 hover:text-orange-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-100 dark:divide-neutral-800">
              <div className="space-y-2 py-6">
                {NAV_ITEMS.map((item) => {
                  const active = isNavActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold transition-all",
                        active
                          ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border-l-4 border-orange-700 dark:border-orange-500 pl-4"
                          : "text-gray-900 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-orange-700 dark:hover:text-orange-400",
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <div className="pt-2">
                  <ThemeToggle showLabel className="w-full justify-center py-2.5 my-2" />
                </div>
              </div>

              {/* Mobile Auth Section */}
              <div className="py-6">
                {!isMounted || (authLoading && !user) ? (
                  <div className="py-4 flex items-center justify-center gap-3">
                    <div className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 rounded-md bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                      <div className="h-3 w-36 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                    </div>
                  </div>
                ) : isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-1">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          className="size-10 rounded-full object-cover ring-2 ring-orange-700/20"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-orange-700 text-sm font-bold text-white shadow-xs">
                          {(user.displayName || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.displayName || "My Account"}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                            {user.email}
                          </p>
                        )}
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          {user.role === "admin" ? "Store Admin" : "Registered Customer"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      >
                        Customer Profile
                      </Link>
                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      >
                        My Orders &amp; Receipts
                      </Link>
                      <Link
                        to="/track-order"
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      >
                        Track Courier Shipment
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="-mx-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                          <span>Admin Dashboard</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-orange-700 text-white">
                            Admin
                          </span>
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        try {
                          await logout();
                          dispatch(logoutUser());
                          toast.success("Signed out successfully.");
                        } catch (err: unknown) {
                          const error = err as Error;
                          toast.error(error.message || "Failed to sign out.");
                        }
                      }}
                      className="-mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    >
                      <ArrowRightStartOnRectangleIcon className="size-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleOpenAuth("login");
                      }}
                      className="-mx-3 block w-full rounded-lg px-3 py-2.5 text-center text-base font-semibold text-gray-900 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 transition"
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleOpenAuth("signup");
                      }}
                      className="-mx-3 block w-full rounded-lg px-3 py-2.5 text-center text-base font-semibold text-white bg-orange-700 hover:bg-orange-800 shadow-xs transition"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />
    </header>
  );
}
