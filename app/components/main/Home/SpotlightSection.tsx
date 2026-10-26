import React, { useState } from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  SparklesIcon,
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { SpotlightSectionSkeleton } from "~/components/main/Skeletons";

export default function SpotlightSection() {
  const { spotlightBanner, loading } = useAppSelector((state) => state.home);
  const [copied, setCopied] = useState(false);

  if (loading && !spotlightBanner) {
    return <SpotlightSectionSkeleton />;
  }

  if (!spotlightBanner) return null;

  const handleCopyCode = () => {
    if (spotlightBanner.discountCode) {
      navigator.clipboard.writeText(spotlightBanner.discountCode);
      setCopied(true);
      toast.success(
        `Copied code ${spotlightBanner.discountCode} for 15% off at checkout!`
      );
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Text Content Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <SparklesIcon className="size-4 text-orange-500" />
                {spotlightBanner.tag}
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {spotlightBanner.title}
              </h2>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
                {spotlightBanner.description}
              </p>

              {/* Coupon Tag */}
              {spotlightBanner.discountCode && (
                <div className="pt-2 flex items-center gap-3">
                  <div
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold tracking-wider text-orange-400 cursor-pointer transition"
                    title="Click to copy coupon code"
                  >
                    <TagIcon className="size-4" />
                    <span>CODE: {spotlightBanner.discountCode}</span>
                    <span className="text-[10px] text-stone-300 font-sans font-normal">
                      (15% OFF)
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {copied ? "Copied!" : "Click code to copy"}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-8">
              <Link
                to={spotlightBanner.ctaLink}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm shadow-lg hover:shadow-orange-700/30 transition cursor-pointer"
              >
                <span>{spotlightBanner.ctaText}</span>
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>

          {/* Image Column */}
          <div className="lg:col-span-5 relative h-64 lg:h-auto overflow-hidden">
            <img
              src={spotlightBanner.image}
              alt={spotlightBanner.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-stone-900 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
