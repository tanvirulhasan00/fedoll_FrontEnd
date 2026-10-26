import React, { useEffect, useState } from "react";
import { EnvelopeIcon, PhoneIcon, TruckIcon } from "@heroicons/react/24/outline";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { getCompanyInfo } from "~/redux/features/companyInfoSlice";
import { Link } from "react-router";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

const Topbar = () => {
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const { data } = useAppSelector((state) => state.companyInfo);
  const { settings, loading: settingsLoading, initialized: settingsInitialized } =
    useAppSelector((state) => state.storeSettings);
  const token = "";
  const id = 1;

  useEffect(() => {
    setIsMounted(true);
    dispatch(getCompanyInfo({ token, id }));
  }, [dispatch]);

  const isDataLoading = !isMounted || settingsLoading || !settingsInitialized;
  const storeEmail = settings?.contactEmail || data?.result?.email || "support@silkendrift.com";
  const storeName = settings?.storeName || data?.result?.name || "SilkenDrift";

  return (
    <div className="w-full bg-orange-700 dark:bg-neutral-950 dark:border-b dark:border-neutral-800 text-gray-100 dark:text-neutral-300 text-xs sm:text-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-2 gap-2 text-center sm:text-left">
        {/* Contact Info & Store Brand */}
        <div className="sm:h-[1rem] flex flex-wrap items-center justify-center sm:justify-start gap-3">
          {isDataLoading ? (
            <Skeleton className="h-3.5 w-24 bg-white/30 dark:bg-neutral-800 rounded-md" />
          ) : (
            <span className="font-bold tracking-tight">
              {storeName}
            </span>
          )}

          <Separator orientation="vertical" className="hidden sm:block" />

          {isDataLoading ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full bg-white/30 dark:bg-neutral-800" />
              <Skeleton className="h-3.5 w-36 bg-white/30 dark:bg-neutral-800 rounded-md" />
            </div>
          ) : (
            <Link
              to={`mailto:${storeEmail}`}
              className="group flex items-center gap-1.5 hover:underline transition"
            >
              <EnvelopeIcon className="size-3.5 text-orange-200 dark:text-orange-400 transition group-hover:scale-110" />
              <span>{storeEmail}</span>
            </Link>
          )}

          <Separator orientation="vertical" className="hidden sm:block" />

          {isDataLoading ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full bg-white/30 dark:bg-neutral-800" />
              <Skeleton className="h-3.5 w-20 bg-white/30 dark:bg-neutral-800 rounded-md" />
            </div>
          ) : (
            <Link
              to="/track-order"
              className="flex items-center gap-1.5 text-xs font-semibold hover:text-white hover:underline transition"
            >
              <TruckIcon className="size-3.5 text-orange-200 dark:text-orange-400" />
              <span>Track Order</span>
            </Link>
          )}

          {!isDataLoading && settings?.contactPhone && (
            <>
              <Separator orientation="vertical" className="hidden sm:block" />
              <Link
                to={`tel:${settings.contactPhone}`}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold hover:text-white hover:underline transition"
              >
                <PhoneIcon className="size-3.5 text-orange-200 dark:text-orange-400" />
                <span>{settings.contactPhone}</span>
              </Link>
            </>
          )}
        </div>

        {/* Central Announcement Ribbon */}
        {isDataLoading ? (
          <div className="hidden lg:flex items-center gap-2">
            <Skeleton className="size-3.5 rounded-full bg-white/30 dark:bg-neutral-800" />
            <Skeleton className="h-3.5 w-60 bg-white/30 dark:bg-neutral-800 rounded-md" />
          </div>
        ) : settings?.announcementActive && settings?.announcementNotice ? (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-amber-200 dark:text-orange-400">
            <span className="text-[13px]">📢</span>
            <span>{settings.announcementNotice}</span>
          </div>
        ) : null}

        {/* Social Media Links */}
        <div className="sm:h-[1rem] flex items-center justify-center gap-4 mt-2 sm:mt-0">
          {isDataLoading ? (
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="size-4 rounded-full bg-white/30 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <>
              <Link
                to={data?.result?.facebookLink ?? "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-300 transition"
                title="Facebook"
              >
                <FaFacebookF />
              </Link>
              <Separator orientation="vertical" className="hidden sm:block" />
              <Link
                to={data?.result?.twitterLink ?? "https://twitter.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-300 transition"
                title="Twitter"
              >
                <FaTwitter />
              </Link>
              <Separator orientation="vertical" className="hidden sm:block" />
              <Link
                to={data?.result?.linkedInLink ?? "https://linkedin.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition"
                title="LinkedIn"
              >
                <FaLinkedinIn />
              </Link>
              <Separator orientation="vertical" className="hidden sm:block" />
              <Link
                to={data?.result?.instagramLink ?? "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-300 transition"
                title="Instagram"
              >
                <FaInstagram />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
