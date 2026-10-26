import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import {
  fetchPrivacyPolicy,
  defaultPrivacyPolicy,
  type PrivacyPolicyData,
} from "~/firebase";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ServerStackIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  ClockIcon,
  SparklesIcon,
  InformationCircleIcon,
  ShareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { LegalPolicySkeleton } from "~/components/main/Skeletons";

export function meta() {
  return [
    { title: "Privacy Policy | SilkenDrift Apparel Atelier Bangladesh" },
    {
      name: "description",
      content:
        "Understand how SilkenDrift collects, protects, and handles your personal information for nationwide courier delivery across Bangladesh.",
    },
  ];
}

export default function PrivacyPolicyPage() {
  const [data, setData] = useState<PrivacyPolicyData>(defaultPrivacyPolicy);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPrivacyPolicy()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Using default privacy policy:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopyEmail = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(data.contactEmail);
        setCopied(true);
        toast.success("DPO email copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Could not copy email.");
    }
  };

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
            {/* Hero Header */}
            <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 text-white py-16 sm:py-24 border-b border-stone-800">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheckIcon className="size-4" />
              <span>Customer Trust &amp; Data Governance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Privacy Policy &amp; Data Rights
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              Your trust is our cornerstone. Learn how SilkenDrift safeguards your personal identity,
              delivery address, and transaction records throughout our garment atelier and nationwide courier operations.
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
                title="Print Policy Document"
              >
                <PrinterIcon className="size-4 text-stone-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Notice Banner (if set by Admin) */}
        {data.noticeBanner && (
          <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200/80 dark:border-orange-800/40 py-3.5 px-4 text-center">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
              <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>{data.noticeBanner}</span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                <ServerStackIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Data Retention
              </h4>
              <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                {data.dataRetentionMonths} Months
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Inactive customer order records purged periodically after fulfillment.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <LockClosedIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Monetization Policy
              </h4>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                Zero Data Sale
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                We never sell, rent, or trade your personal numbers to third-party telemarketers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <CheckBadgeIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Regulatory Scope
              </h4>
              <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                BD Guidelines &apos;26
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Complies with Bangladesh Digital Commerce Directives &amp; Consumer Rights Act.
              </p>
            </div>
          </div>

          {/* Policy Clauses */}
          <div className="space-y-8">
            {data.clauses.map((clause) => (
              <div
                key={clause.id}
                id={clause.id}
                className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4 transition-all"
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
                        <CheckBadgeIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Third-Party Logistics & Infrastructure Integrations */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-600" />
                <span>Authorized Courier &amp; Processing Partners</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                To guarantee secure nationwide delivery and seamless checkout, SilkenDrift connects directly with the following certified partners:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {data.thirdPartyServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800 text-xs font-semibold text-gray-800 dark:text-neutral-200"
                  >
                    <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cookies & Device Preferences */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-600" />
                <span>Browser Cookies &amp; Local Storage</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                {data.cookieNotice}
              </p>
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/60 dark:border-neutral-800 text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                <InformationCircleIcon className="size-4 text-orange-600 shrink-0" />
                <span>We do NOT deploy intrusive third-party cross-site behavioral advertising trackers.</span>
              </div>
            </div>

            {/* Contact Data Protection Officer Card */}
            <div className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold uppercase tracking-wider">
                  Direct Grievance Redressal
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Questions or Data Erasure Requests?
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-light">
                  If you wish to rectify an incorrect shipping record, withdraw consent, or request a complete export of your customer file, reach out directly to our Data Protection Office.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase">
                    <EnvelopeIcon className="size-4" />
                    <span>DPO Direct Email</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="text-sm font-mono font-bold text-white hover:text-orange-400 transition cursor-pointer text-left truncate block w-full"
                    title="Click to copy email"
                  >
                    {data.contactEmail}
                  </button>
                  <span className="text-[10px] text-stone-400 block">
                    {copied ? "Copied to clipboard!" : "Click to copy address"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                    <PhoneIcon className="size-4" />
                    <span>Privacy Hotline</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {data.dpoContact}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {data.dpoName}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase">
                    <MapPinIcon className="size-4" />
                    <span>Physical Atelier</span>
                  </div>
                  <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed">
                    {data.officeAddress}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>SilkenDrift International Ltd. | Dhaka Atelier</span>
                <Link
                  to="/terms-of-service"
                  className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View Terms of Service</span>
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
