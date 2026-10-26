import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { LegalPolicySkeleton } from "~/components/main/Skeletons";
import {
  fetchSecurityCompliance,
  defaultSecurityCompliance,
  type SecurityComplianceData,
} from "~/firebase";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  ServerStackIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
  PrinterIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  CubeTransparentIcon,
  QrCodeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Security & Compliance | SilkenDrift Apparel Atelier Bangladesh" },
    {
      name: "description",
      content:
        "Learn about SilkenDrift's 256-bit TLS encryption, PCI-DSS Level 1 payments, tamper-evident thermal parcels, and regulatory compliance across Bangladesh.",
    },
  ];
}

export default function SecurityCompliancePage() {
  const [data, setData] =
    useState<SecurityComplianceData>(defaultSecurityCompliance);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSecurityCompliance()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Using default security compliance:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopySecurityEmail = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(data.vulnerabilityReportingEmail);
        setCopied(true);
        toast.success("Security team email copied to clipboard!");
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
            {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 text-white py-16 sm:py-24 border-b border-stone-800">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheckIcon className="size-4" />
              <span>Enterprise Grade Security Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Security, Cryptography &amp; Compliance
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              From military-grade 256-bit TLS encryption and isolated cloud databases to physical tamper-evident parcel seals,
              discover how SilkenDrift defends your transactions and confidentiality at every touchpoint.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <CalendarDaysIcon className="size-4 text-orange-400" />
                <span>Last Audited: <strong className="text-white">{data.lastUpdated}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <ClockIcon className="size-4 text-emerald-400" />
                <span>Standard Baseline: <strong className="text-white">{data.effectiveDate}</strong></span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 bg-stone-800/80 hover:bg-stone-700 px-3 py-1.5 rounded-lg border border-stone-700/60 text-stone-200 transition cursor-pointer"
                title="Print Compliance Certificate"
              >
                <PrinterIcon className="size-4 text-stone-300" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </section>

        {/* Notice Banner */}
        {data.noticeBanner && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-800/40 py-3.5 px-4 text-center">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <SparklesIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{data.noticeBanner}</span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          {/* Security Architecture Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <LockClosedIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Data Transport
              </h4>
              <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                {data.sslGrade}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Zero interception on all web orders and customer portals.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <KeyIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Payment Gateways
              </h4>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">
                PCI-DSS Level 1
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Tokenized transactions with bKash, Nagad, and 3D-Secure 2.0.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <ServerStackIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Database Governance
              </h4>
              <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1">
                Strict RBAC Firestore
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Role-based access rules preventing cross-customer traversal.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
              <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                <QrCodeIcon className="size-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                Logistics Anti-Fraud
              </h4>
              <p className="text-sm font-black text-orange-600 dark:text-orange-400 mt-1">
                Code-128 Barcodes
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Tamper-evident thermal stickers with courier consignment sync.
              </p>
            </div>
          </div>

          {/* Compliance Certifications & Audit Badges */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4 mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Certified Compliance Standards &amp; Industry Baselines</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed font-sans">
              SilkenDrift operates in rigorous adherence to regional digital commerce regulations and global manufacturing standards:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {data.complianceCertifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-stone-50/80 dark:bg-neutral-950 border border-stone-200/70 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {cert.title}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cert.badgeColor}`}>
                      {cert.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Audited under: <strong className="text-gray-700 dark:text-neutral-300">{cert.issuer}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Security Clauses */}
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
                        <CheckBadgeIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Responsible Disclosure / Security Desk Card */}
            <div className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  Responsible Security Disclosure
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Report a Security Vulnerability
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-light">
                  If you are a security researcher who has identified an exploit or data integrity concern within our systems,
                  please report it under our responsible disclosure program.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                    <EnvelopeIcon className="size-4" />
                    <span>Security Research Team</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySecurityEmail}
                    className="text-sm font-mono font-bold text-white hover:text-emerald-400 transition cursor-pointer text-left truncate block w-full"
                    title="Click to copy security email"
                  >
                    {data.vulnerabilityReportingEmail}
                  </button>
                  <span className="text-[10px] text-stone-400 block">
                    {copied ? "Copied to clipboard!" : "Click to copy address"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase">
                    <PhoneIcon className="size-4" />
                    <span>24/7 Security Escalation Hotline</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {data.securityHotline}
                  </p>
                  <p className="text-[10px] text-stone-400">Emergency incident line for technical partners</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>SilkenDrift International Ltd. | Dhaka Atelier Information Security</span>
                <Link
                  to="/privacy-policy"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Review Privacy Policy</span>
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
