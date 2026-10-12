import { useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import * as Icons from "@heroicons/react/24/outline";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import clsx from "clsx";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { getAllCategory } from "~/redux/features/categorySlice";
import { logoutUser } from "~/redux/features/auth/authSlice";
import { logout } from "~/firebase";
import { AuthModal } from "../Auth/AuthModal";
import { UserMenu } from "../Auth/UserMenu";

import { FaShirt } from "react-icons/fa6";
import { PiPantsFill } from "react-icons/pi";
import { SkeletonCategoryItem } from "../Skeletons/CategoryItem";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bounced, setBounced] = useState(false);
  const [hasBounced, setHasBounced] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  const dispatch = useAppDispatch();
  const { loading, categoryData } = useAppSelector((state) => state.report);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleOpenAuth = (tab: "login" | "signup") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const token = "";

  const productCategory = [
    {
      id: 1,
      name: "Upper Outwear",
      description: "Get a better upper body outfit",
      link: "/upper-outwears",
      icon: FaShirt,
    },
    {
      id: 2,
      name: "Lower Outwear",
      description: "Get a better upper body outfit",
      link: "/lower-outwears",
      icon: PiPantsFill,
    },
  ];

  const getIcon = (name: string): React.ElementType => {
    return (
      (Icons as Record<string, React.ElementType>)[name] ||
      Icons.QuestionMarkCircleIcon
    );
  };

  useEffect(() => {
    dispatch(getAllCategory({ token }));
  }, [dispatch]);

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
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-900"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Link to="/" className="text-sm/6 font-semibold">
            Home
          </Link>

          {/* products */}
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold outline-0">
              Products
              <ChevronDownIcon
                aria-hidden="true"
                className="size-5 flex-none text-gray-500"
              />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-3xl bg-gray-200 outline-1 -outline-offset-1 outline-white/10 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
            >
              <div className="p-4 max-h-[12.5rem] overflow-auto">
                {!productCategory ? (
                  <SkeletonCategoryItem />
                ) : (
                  productCategory?.map((item) => {
                    return (
                      <div
                        key={item.name}
                        className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/40"
                      >
                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-700 group-hover:shadow-2xl">
                          <item.icon
                            aria-hidden="true"
                            className="size-6 text-gray-400 group-hover:text-white"
                          />
                        </div>
                        <div className="flex-auto">
                          <Link
                            to={item.link}
                            className="block font-semibold text-black"
                          >
                            {item.name}
                            <span className="absolute inset-0" />
                          </Link>
                          <p className="mt-1 text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </PopoverPanel>
          </Popover>

          <Link to="/blogs" className="text-sm/6 font-semibold ">
            Blogs
          </Link>
          <Link to="/about-us" className="text-sm/6 font-semibold ">
            About Us
          </Link>
          <Link to="/contact-us" className="text-sm/6 font-semibold">
            Contact Us
          </Link>
        </PopoverGroup>

        {/* Top-Right Auth Options (Desktop) */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
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
              <img alt="" src="/dkgloballogorb.png" className="h-8 w-auto" />
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
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-gray-50"
                >
                  Home
                </Link>

                {/* products */}
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold hover:bg-gray-50">
                    Products
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 flex-none group-data-open:rotate-180"
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 space-y-2">
                    {productCategory?.map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.link}
                        className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold hover:bg-gray-50"
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </DisclosurePanel>
                </Disclosure>
                <Link
                  to="/about-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-gray-50"
                >
                  About Us
                </Link>
                <Link
                  to="/contact-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-gray-50"
                >
                  Contact Us
                </Link>
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
    </header>
  );
}
