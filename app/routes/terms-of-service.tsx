import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { LegalPolicySkeleton } from "~/components/main/Skeletons";
import {
  fetchTermsOfService,
  defaultTermsOfService,
  type TermsOfServiceData,
} from "~/firebase";
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ClockIcon,
  ScaleIcon,
  SparklesIcon,
  PrinterIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Terms of Service | SilkenDrift Apparel Atelier Bangladesh" },
    {
      name: "description",
      content:
        "Official terms and conditions for ordering garments, Cash on Delivery, 7-day size exchanges, and courier shipping across Bangladesh.",
    },
  ];
}

export default function TermsOfServicePage() {
  const [data, setData] = useState<TermsOfServiceData>(defaultTermsOfService);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTermsOfService()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Using default terms of service:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      <Topbar />
      <Header />

      <main className="flex-1 pb-20">
        {loading ? (
          <LegalPolicySkeleton />
        ) : (
          <>
            {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 text-white py-16 sm:py-24 border-b border-stone-800">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <ScaleIcon className="size-4" />
              <span>Customer Agreement &amp; Consumer Fair-Trade</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Terms of Service &amp; Conditions
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              Clear, honest, and transparent guidelines governing apparel orders, nationwide courier handovers,
              doorstep size exchanges, and consumer rights with SilkenDrift across all 64 districts in Bangladesh.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <CalendarDaysIcon className="size-4 text-orange-400" />
                <span>Last Updated: <strong className="text-white">{data.lastUpdated}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <ClockIcon className="size-4 text-emerald-400" />
                <span>Effective Date: <strong className="text-white">{data.effectiveDate}</strong></span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 bg-stone-800/80 hover:bg-stone-700 px-3 py-1.5 rounded-lg border border-stone-700/60 text-stone-200 transition cursor-pointer"
                title="Print Terms"
              >
                <PrinterIcon className="size-4 text-stone-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </section>

        {/* Notice Banner */}
        {data.noticeBanner && (
          <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200/80 dark:border-orange-800/40 py-3.5 px-4 text-center">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
              <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>{data.noticeBanner}</span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          {/* Key Commerce Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                <ArrowPathIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Exchange Window
              </h4>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {data.returnWindowDays} Days
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Hassle-free size or color swap from day of delivery.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ClockIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Free Cancellation
              </h4>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {data.orderCancellationHours} Hours
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Cancel prior to atelier packaging and courier dispatch.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <TruckIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Exchange Delivery
              </h4>
              <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                ৳{data.exchangeFeeInsideDhaka} / ৳{data.exchangeFeeOutsideDhaka}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Inside Dhaka / Outside Dhaka. 100% Free if defective.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <ScaleIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Jurisdiction
              </h4>
              <p className="text-lg font-black text-gray-900 dark:text-white mt-1 truncate">
                {data.disputeJurisdiction}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Governed under laws of Bangladesh courts.
              </p>
            </div>
          </div>

          {/* Clauses List */}
          <div className="space-y-8">
            {data.clauses.map((clause) => (
              <div
                key={clause.id}
                id={clause.id}
                className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="size-2 rounded-full bg-orange-600" />
                  <span>{clause.title}</span>
                </h3>

                <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed font-sans">
                  {clause.content}
                </p>

                {clause.bulletPoints && clause.bulletPoints.length > 0 && (
                  <ul className="space-y-2.5 pt-2 border-t border-stone-100 dark:border-neutral-800/80">
                    {clause.bulletPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-neutral-300"
                      >
                        <CheckCircleIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Cash on Delivery High-Value Policy Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-stone-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border border-orange-200/80 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400 font-bold text-sm uppercase tracking-wide">
                <BanknotesIcon className="size-5 text-orange-600" />
                <span>Cash on Delivery (COD) High-Value Order Rule</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">
                For parcels exceeding <strong>৳{data.codVerificationThreshold.toLocaleString()} BDT</strong> in value,
                our fulfillment desk will make a brief automated or representative phone call to verify parcel availability
                and delivery scheduling prior to releasing garments to courier personnel.
              </p>
            </div>

            {/* Legal Support Help Desk Card */}
            <div className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold uppercase tracking-wider">
                  Legal Compliance Desk
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Questions About Customer Terms &amp; Conditions?
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-light">
                  If you have queries regarding wholesale orders, warranty claims, or legal notices, contact our compliance secretariat.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase">
                    <EnvelopeIcon className="size-4" />
                    <span>Legal &amp; Contracts</span>
                  </div>
                  <a
                    href={`mailto:${data.contactEmail}`}
                    className="text-sm font-mono font-bold text-white hover:text-orange-400 transition"
                  >
                    {data.contactEmail}
                  </a>
                  <p className="text-[10px] text-stone-400">Response within 24–48 business hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                    <PhoneIcon className="size-4" />
                    <span>Customer Hotline</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {data.supportPhone}
                  </p>
                  <p className="text-[10px] text-stone-400">Saturday to Thursday (10:00 AM – 10:00 PM)</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>SilkenDrift International Ltd. | Registered in Bangladesh</span>
                <Link
                  to="/security"
                  className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Explore Security &amp; Compliance</span>
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
