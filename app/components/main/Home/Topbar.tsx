import React, { useEffect } from "react";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
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
  const { loading, data } = useAppSelector((state) => state.companyInfo);
  const token = "";
  const id = 1;

  useEffect(() => {
    dispatch(getCompanyInfo({ token, id }));
  }, [dispatch]);

  return (
    <div className="w-full bg-orange-700 text-gray-100 text-xs sm:text-sm ">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-2 gap-2 text-center sm:text-left">
        {/* Contact Info */}
        <div className="sm:h-[1rem] flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <span className="font-semibold">
            {data?.result?.name ?? "Fedoll"}
          </span>
          <Separator orientation="vertical" className="hidden sm:block" />
          <Link
            to={`mailto:${data?.result?.email}`}
            className="group flex items-center gap-1 hover:underline transition"
          >
            <EnvelopeIcon className="h-4 w-4 text-gray-100 transition group-hover:text-red-500" />
            {loading || !data?.result ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              data?.result?.email
            )}
          </Link>
          {/* {data?.result?.phoneNumber && (
            <Link
              to={`tel:${data?.result?.phoneNumber}`}
              className="flex items-center gap-1 hover:underline transition"
            >
              <PhoneIcon className="h-4 w-4 text-gray-100 transition group-hover:text-green-500" />
              {data?.result?.phoneNumber}
            </Link>
          )} */}
        </div>

        {/* Social Media Links */}
        <div className="sm:h-[1rem] flex items-center justify-center gap-4 mt-2 sm:mt-0">
          <Link
            to={data?.result?.facebookLink ?? "https://facebook.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition"
          >
            <FaFacebookF />
          </Link>
          <Separator orientation="vertical" className="hidden sm:block" />
          <Link
            to={data?.result?.twitterLink ?? "https://twitter.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-400 transition"
          >
            <FaTwitter />
          </Link>
          <Separator orientation="vertical" className="hidden sm:block" />
          <Link
            to={data?.result?.linkedInLink ?? "https://linkedin.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition"
          >
            <FaLinkedinIn />
          </Link>
          <Separator orientation="vertical" className="hidden sm:block" />
          <Link
            to={data?.result?.instagramLink ?? "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition"
          >
            <FaInstagram />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
