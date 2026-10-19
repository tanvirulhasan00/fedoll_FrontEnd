import React, { useState, useEffect } from "react";
import {
  ScaleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  TruckIcon,
  BanknotesIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import {
  fetchPrivacyPolicy,
  savePrivacyPolicy,
  defaultPrivacyPolicy,
  fetchTermsOfService,
  saveTermsOfService,
  defaultTermsOfService,
  fetchSecurityCompliance,
  saveSecurityCompliance,
  defaultSecurityCompliance,
  type PrivacyPolicyData,
  type TermsOfServiceData,
  type SecurityComplianceData,
  type LegalClause,
} from "~/firebase";

type LegalSubTab = "privacy" | "terms" | "security";

export const AdminLegalTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<LegalSubTab>("privacy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States
  const [privacyData, setPrivacyData] =
    useState<PrivacyPolicyData>(defaultPrivacyPolicy);
  const [termsData, setTermsData] =
    useState<TermsOfServiceData>(defaultTermsOfService);
  const [securityData, setSecurityData] =
    useState<SecurityComplianceData>(defaultSecurityCompliance);

  // Load all 3 documents on mount
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [priv, term, sec] = await Promise.all([
          fetchPrivacyPolicy(),
          fetchTermsOfService(),
          fetchSecurityCompliance(),
        ]);
        if (priv) setPrivacyData(priv);
        if (term) setTermsData(term);
        if (sec) setSecurityData(sec);
      } catch (err) {
        console.warn("Error loading legal policies in admin:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Save Handlers
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePrivacyPolicy(privacyData);
      toast.success("Privacy Policy updated successfully on live storefront!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update Privacy Policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveTermsOfService(termsData);
      toast.success("Terms of Service updated successfully on live storefront!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update Terms of Service.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSecurityCompliance(securityData);
      toast.success("Security & Compliance updated successfully on live storefront!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update Security & Compliance.");
    } finally {
      setSaving(false);
    }
  };

  // Helper for adding new clause
  const addClause = (type: LegalSubTab) => {
    const newClause: LegalClause = {
      id: `clause_${Date.now()}`,
      title: "New Policy Section",
      content: "Detailed description of this policy or legal provision.",
      bulletPoints: ["Key operational guideline or consumer safeguard."],
    };

    if (type === "privacy") {
      setPrivacyData({
        ...privacyData,
        clauses: [...privacyData.clauses, newClause],
      });
    } else if (type === "terms") {
      setTermsData({
        ...termsData,
        clauses: [...termsData.clauses, newClause],
      });
    } else {
      setSecurityData({
        ...securityData,
        clauses: [...securityData.clauses, newClause],
      });
    }
    toast.info("Added new policy clause. Edit details below and click Save.");
  };

  const removeClause = (type: LegalSubTab, id: string) => {
    if (type === "privacy") {
      setPrivacyData({
        ...privacyData,
        clauses: privacyData.clauses.filter((c) => c.id !== id),
      });
    } else if (type === "terms") {
      setTermsData({
        ...termsData,
        clauses: termsData.clauses.filter((c) => c.id !== id),
      });
    } else {
      setSecurityData({
        ...securityData,
        clauses: securityData.clauses.filter((c) => c.id !== id),
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 p-12 rounded-3xl border border-stone-200 dark:border-neutral-800 text-center space-y-4">
        <Spinner className="size-8 text-orange-600 mx-auto animate-spin" />
        <p className="text-xs text-gray-500 font-semibold">
          Loading legal policies from Cloud Firestore...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ScaleIcon className="size-3.5" />
            <span>Store Governance &amp; Compliance Atelier</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Legal Policies &amp; Compliance Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Frequently adjusted store policies: Return/exchange windows, cancellation cutoffs, Cash on Delivery thresholds, DPO contacts, and security protocols update immediately on live storefront pages.
          </p>
        </div>

        {/* View Live Storefront Pages */}
        <div className="flex items-center gap-2">
          <Link
            to={
              activeSubTab === "privacy"
                ? "/privacy-policy"
                : activeSubTab === "terms"
                ? "/terms-of-service"
                : "/security"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-orange-500 text-gray-700 dark:text-neutral-200 hover:text-orange-600 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <span>Preview Live Page</span>
            <ArrowTopRightOnSquareIcon className="size-4" />
          </Link>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-neutral-800/80 rounded-2xl w-fit border border-stone-200/80 dark:border-neutral-700/80">
        <button
          type="button"
          onClick={() => setActiveSubTab("privacy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "privacy"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <DocumentTextIcon className="size-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("terms")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "terms"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <ScaleIcon className="size-4" />
          <span>Terms of Service</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "security"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <ShieldCheckIcon className="size-4" />
          <span>Security &amp; Compliance</span>
        </button>
      </div>

      {/* ======================================================================
          TAB 1: PRIVACY POLICY FORM
          ====================================================================== */}
      {activeSubTab === "privacy" && (
        <form onSubmit={handleSavePrivacy} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Privacy Policy &amp; Customer Data Parameters
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Controls data retention rules, DPO contacts, and privacy disclosures.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyData(defaultPrivacyPolicy)}
                className="text-xs text-stone-500 hover:text-orange-600 font-semibold underline cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Last Updated Date Display *
                </label>
                <input
                  type="text"
                  required
                  value={privacyData.lastUpdated}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, lastUpdated: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                  placeholder="e.g. October 20, 2026"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Effective Baseline Date *
                </label>
                <input
                  type="text"
                  required
                  value={privacyData.effectiveDate}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                  placeholder="e.g. January 1, 2026"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Top Highlight Announcement / Notice Banner
                </label>
                <input
                  type="text"
                  value={privacyData.noticeBanner || ""}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, noticeBanner: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                  placeholder="e.g. Updated for 2026 Bangladesh Digital Commerce Guidelines."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Data Protection Officer (DPO) Email *
                </label>
                <input
                  type="email"
                  required
                  value={privacyData.contactEmail}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Data Retention Duration (Months) *
                </label>
                <input
                  type="number"
                  required
                  min={6}
                  max={120}
                  value={privacyData.dataRetentionMonths}
                  onChange={(e) =>
                    setPrivacyData({
                      ...privacyData,
                      dataRetentionMonths: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  DPO / Grievance Officer Name *
                </label>
                <input
                  type="text"
                  required
                  value={privacyData.dpoName}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, dpoName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  DPO Hotline / Telephone *
                </label>
                <input
                  type="text"
                  required
                  value={privacyData.dpoContact}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, dpoContact: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Physical Office Address for Legal Inquiries *
                </label>
                <textarea
                  rows={2}
                  required
                  value={privacyData.officeAddress}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, officeAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Cookie &amp; LocalStorage Policy Notice
                </label>
                <textarea
                  rows={2}
                  value={privacyData.cookieNotice}
                  onChange={(e) =>
                    setPrivacyData({ ...privacyData, cookieNotice: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            {/* Clauses List */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Privacy Policy Clauses ({privacyData.clauses.length})
                </h4>
                <button
                  type="button"
                  onClick={() => addClause("privacy")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 transition cursor-pointer"
                >
                  <PlusIcon className="size-4" />
                  <span>Add New Clause</span>
                </button>
              </div>

              {privacyData.clauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => {
                        const updated = [...privacyData.clauses];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setPrivacyData({ ...privacyData, clauses: updated });
                      }}
                      className="font-bold text-sm bg-transparent border-b border-gray-300 dark:border-neutral-700 focus:outline-none focus:border-orange-500 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeClause("privacy", clause.id)}
                      className="text-stone-400 hover:text-red-500 p-1"
                      title="Delete clause"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={clause.content}
                    onChange={(e) => {
                      const updated = [...privacyData.clauses];
                      updated[index] = { ...updated[index], content: e.target.value };
                      setPrivacyData({ ...privacyData, clauses: updated });
                    }}
                    className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                    placeholder="Clause content paragraph..."
                  />

                  {/* Bullet Points */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Bullet Points (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={(clause.bulletPoints || []).join("\n")}
                      onChange={(e) => {
                        const updated = [...privacyData.clauses];
                        updated[index] = {
                          ...updated[index],
                          bulletPoints: e.target.value
                            .split("\n")
                            .filter((line) => line.trim().length > 0),
                        };
                        setPrivacyData({ ...privacyData, clauses: updated });
                      }}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono"
                      placeholder="Bullet point 1&#10;Bullet point 2"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Spinner className="size-4 text-white animate-spin" />
                    <span>Saving to Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    <span>Save Privacy Policy Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================
          TAB 2: TERMS OF SERVICE FORM
          ====================================================================== */}
      {activeSubTab === "terms" && (
        <form onSubmit={handleSaveTerms} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Terms of Service &amp; Commerce Rules
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Configure return/exchange days, exchange delivery fees, COD thresholds, and legal terms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTermsData(defaultTermsOfService)}
                className="text-xs text-stone-500 hover:text-orange-600 font-semibold underline cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Last Updated Date *
                </label>
                <input
                  type="text"
                  required
                  value={termsData.lastUpdated}
                  onChange={(e) =>
                    setTermsData({ ...termsData, lastUpdated: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Effective Baseline Date *
                </label>
                <input
                  type="text"
                  required
                  value={termsData.effectiveDate}
                  onChange={(e) =>
                    setTermsData({ ...termsData, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Legal Jurisdiction *
                </label>
                <input
                  type="text"
                  required
                  value={termsData.disputeJurisdiction}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      disputeJurisdiction: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Top Highlight Announcement / Notice Banner
                </label>
                <input
                  type="text"
                  value={termsData.noticeBanner || ""}
                  onChange={(e) =>
                    setTermsData({ ...termsData, noticeBanner: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              {/* Dynamic Numbers / Frequently Changing Store Policies */}
              <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 space-y-1">
                <label className="block font-bold text-orange-950 dark:text-orange-300">
                  Return / Exchange Window (Days) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={termsData.returnWindowDays}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      returnWindowDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg font-bold"
                />
                <span className="text-[10px] text-gray-500">Days customer has to request exchange</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                <label className="block font-bold text-emerald-950 dark:text-emerald-300">
                  Order Cancellation Cutoff (Hours) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={72}
                  value={termsData.orderCancellationHours}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      orderCancellationHours: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg font-bold"
                />
                <span className="text-[10px] text-gray-500">Hours before dispatch cancellation is allowed</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-1">
                <label className="block font-bold text-blue-950 dark:text-blue-300">
                  COD Verification Threshold (৳ BDT) *
                </label>
                <input
                  type="number"
                  required
                  step={500}
                  value={termsData.codVerificationThreshold}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      codVerificationThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg font-bold"
                />
                <span className="text-[10px] text-gray-500">Orders above this amount get phone verified</span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Exchange Delivery Fee Inside Dhaka (৳ BDT) *
                </label>
                <input
                  type="number"
                  required
                  value={termsData.exchangeFeeInsideDhaka}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      exchangeFeeInsideDhaka: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Exchange Delivery Fee Outside Dhaka (৳ BDT) *
                </label>
                <input
                  type="number"
                  required
                  value={termsData.exchangeFeeOutsideDhaka}
                  onChange={(e) =>
                    setTermsData({
                      ...termsData,
                      exchangeFeeOutsideDhaka: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Legal Department Email *
                </label>
                <input
                  type="email"
                  required
                  value={termsData.contactEmail}
                  onChange={(e) =>
                    setTermsData({ ...termsData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            {/* Clauses List */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Terms &amp; Conditions Clauses ({termsData.clauses.length})
                </h4>
                <button
                  type="button"
                  onClick={() => addClause("terms")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 transition cursor-pointer"
                >
                  <PlusIcon className="size-4" />
                  <span>Add New Clause</span>
                </button>
              </div>

              {termsData.clauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => {
                        const updated = [...termsData.clauses];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setTermsData({ ...termsData, clauses: updated });
                      }}
                      className="font-bold text-sm bg-transparent border-b border-gray-300 dark:border-neutral-700 focus:outline-none focus:border-orange-500 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeClause("terms", clause.id)}
                      className="text-stone-400 hover:text-red-500 p-1"
                      title="Delete clause"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={clause.content}
                    onChange={(e) => {
                      const updated = [...termsData.clauses];
                      updated[index] = { ...updated[index], content: e.target.value };
                      setTermsData({ ...termsData, clauses: updated });
                    }}
                    className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                    placeholder="Clause content paragraph..."
                  />

                  {/* Bullet Points */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Bullet Points (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={(clause.bulletPoints || []).join("\n")}
                      onChange={(e) => {
                        const updated = [...termsData.clauses];
                        updated[index] = {
                          ...updated[index],
                          bulletPoints: e.target.value
                            .split("\n")
                            .filter((line) => line.trim().length > 0),
                        };
                        setTermsData({ ...termsData, clauses: updated });
                      }}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Spinner className="size-4 text-white animate-spin" />
                    <span>Saving to Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    <span>Save Terms of Service Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================
          TAB 3: SECURITY & COMPLIANCE FORM
          ====================================================================== */}
      {activeSubTab === "security" && (
        <form onSubmit={handleSaveSecurity} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Security, Cryptography &amp; Compliance Specifications
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Manage encryption tiers, payment certifications, and vulnerability reporting contacts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSecurityData(defaultSecurityCompliance)}
                className="text-xs text-stone-500 hover:text-orange-600 font-semibold underline cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Last Audited Date *
                </label>
                <input
                  type="text"
                  required
                  value={securityData.lastUpdated}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, lastUpdated: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Standard Baseline Date *
                </label>
                <input
                  type="text"
                  required
                  value={securityData.effectiveDate}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Top Highlight Announcement / Notice Banner
                </label>
                <input
                  type="text"
                  value={securityData.noticeBanner || ""}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, noticeBanner: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Transport Encryption Grade *
                </label>
                <input
                  type="text"
                  required
                  value={securityData.sslGrade}
                  onChange={(e) =>
                    setSecurityData({ ...securityData, sslGrade: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Payment Card Compliance Standard *
                </label>
                <input
                  type="text"
                  required
                  value={securityData.pciDssCompliance}
                  onChange={(e) =>
                    setSecurityData({
                      ...securityData,
                      pciDssCompliance: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Vulnerability Reporting Email *
                </label>
                <input
                  type="email"
                  required
                  value={securityData.vulnerabilityReportingEmail}
                  onChange={(e) =>
                    setSecurityData({
                      ...securityData,
                      vulnerabilityReportingEmail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  24/7 Security Escalation Hotline *
                </label>
                <input
                  type="text"
                  required
                  value={securityData.securityHotline}
                  onChange={(e) =>
                    setSecurityData({
                      ...securityData,
                      securityHotline: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Logistics &amp; Parcel Anti-Fraud Protocol
                </label>
                <input
                  type="text"
                  value={securityData.antiFraudLabeling}
                  onChange={(e) =>
                    setSecurityData({
                      ...securityData,
                      antiFraudLabeling: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            {/* Certifications Manager */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Audited Certifications &amp; Regional Badges ({securityData.complianceCertifications.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {securityData.complianceCertifications.map((cert, index) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 space-y-2"
                  >
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) => {
                        const updated = [...securityData.complianceCertifications];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setSecurityData({
                          ...securityData,
                          complianceCertifications: updated,
                        });
                      }}
                      className="font-bold text-xs bg-transparent border-b border-gray-200 dark:border-neutral-700 w-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const updated = [...securityData.complianceCertifications];
                          updated[index] = { ...updated[index], issuer: e.target.value };
                          setSecurityData({
                            ...securityData,
                            complianceCertifications: updated,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border text-[11px]"
                        placeholder="Issuer..."
                      />
                      <input
                        type="text"
                        value={cert.status}
                        onChange={(e) => {
                          const updated = [...securityData.complianceCertifications];
                          updated[index] = { ...updated[index], status: e.target.value };
                          setSecurityData({
                            ...securityData,
                            complianceCertifications: updated,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border text-[11px]"
                        placeholder="Status..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clauses List */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Security Architecture Clauses ({securityData.clauses.length})
                </h4>
                <button
                  type="button"
                  onClick={() => addClause("security")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 transition cursor-pointer"
                >
                  <PlusIcon className="size-4" />
                  <span>Add New Clause</span>
                </button>
              </div>

              {securityData.clauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => {
                        const updated = [...securityData.clauses];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setSecurityData({ ...securityData, clauses: updated });
                      }}
                      className="font-bold text-sm bg-transparent border-b border-gray-300 dark:border-neutral-700 focus:outline-none focus:border-orange-500 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeClause("security", clause.id)}
                      className="text-stone-400 hover:text-red-500 p-1"
                      title="Delete clause"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={clause.content}
                    onChange={(e) => {
                      const updated = [...securityData.clauses];
                      updated[index] = { ...updated[index], content: e.target.value };
                      setSecurityData({ ...securityData, clauses: updated });
                    }}
                    className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                    placeholder="Clause content paragraph..."
                  />

                  {/* Bullet Points */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Bullet Points (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={(clause.bulletPoints || []).join("\n")}
                      onChange={(e) => {
                        const updated = [...securityData.clauses];
                        updated[index] = {
                          ...updated[index],
                          bulletPoints: e.target.value
                            .split("\n")
                            .filter((line) => line.trim().length > 0),
                        };
                        setSecurityData({ ...securityData, clauses: updated });
                      }}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Spinner className="size-4 text-white animate-spin" />
                    <span>Saving to Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    <span>Save Security &amp; Compliance Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminLegalTab;
