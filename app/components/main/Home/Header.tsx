import { useEffect, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
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

  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { totalQuantity } = useAppSelector((state) => state.cart);

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
        "w-full p-0 px-4 md:px-10 sticky top-0 z-50 transition-all duration-500 text-black",
        scrolled ? "bg-white shadow-lg" : "bg-white",
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
            <img alt="" src="/fedoll-logo.svg" className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => dispatch(openCart())}
            className="relative p-2 text-gray-700 hover:text-orange-700 transition cursor-pointer"
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
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-900"
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
                    ? "text-orange-700 font-bold after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-orange-700 after:rounded-full"
                    : "text-gray-800 hover:text-orange-700",
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Top-Right Auth Options (Desktop) */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-5">
          <button
            type="button"
            onClick={() => dispatch(openCart())}
            className="relative p-2 text-gray-700 hover:text-orange-700 transition cursor-pointer group"
            title="Shopping Bag"
          >
            <ShoppingBagIcon className="size-6 text-gray-800 group-hover:text-orange-700 transition" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-orange-700 text-[11px] font-bold text-white shadow-xs animate-in zoom-in-75">
                {totalQuantity}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-x-3">
              <button
                type="button"
                onClick={() => handleOpenAuth("login")}
                className="text-sm font-semibold text-gray-700 hover:text-orange-700 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white text-black p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-100/10">
          <div className="flex items-center justify-between px-4 md:px-10">
            <Link
              to="/"
              className="-m-1.5 p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Fedoll</span>
              <img alt="" src="/fedoll-logo.svg" className="h-8 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-900"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-100">
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
                          ? "bg-orange-50 text-orange-700 font-bold border-l-4 border-orange-700 pl-4"
                          : "text-gray-900 hover:bg-gray-50 hover:text-orange-700",
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Auth Section */}
              <div className="py-6">
                {isAuthenticated && user ? (
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
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.displayName || "My Account"}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
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
                      className="-mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold text-red-600 hover:bg-red-50 transition"
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
                      className="-mx-3 block w-full rounded-lg px-3 py-2.5 text-center text-base font-semibold text-gray-900 hover:bg-gray-50 border border-gray-200 transition"
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
