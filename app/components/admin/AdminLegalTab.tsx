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
import { LegalPolicySkeleton } from "~/components/main/Skeletons";
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
  fetchReturnsExchanges,
  saveReturnsExchanges,
  defaultReturnsExchanges,
  fetchReturnExchangeRequests,
  updateReturnRequestStatus,
  type PrivacyPolicyData,
  type TermsOfServiceData,
  type SecurityComplianceData,
  type ReturnsExchangesData,
  type ReturnExchangeRequest,
  type LegalClause,
} from "~/firebase";

type LegalSubTab = "privacy" | "terms" | "security" | "returns";

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
  const [returnsData, setReturnsData] =
    useState<ReturnsExchangesData>(defaultReturnsExchanges);
  const [returnRequests, setReturnRequests] = useState<ReturnExchangeRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<string>("all");

  // Load all documents on mount
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [priv, term, sec, ret, reqs] = await Promise.all([
          fetchPrivacyPolicy(),
          fetchTermsOfService(),
          fetchSecurityCompliance(),
          fetchReturnsExchanges(),
          fetchReturnExchangeRequests(),
        ]);
        if (priv) setPrivacyData(priv);
        if (term) setTermsData(term);
        if (sec) setSecurityData(sec);
        if (ret) setReturnsData(ret);
        if (reqs) setReturnRequests(reqs);
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

  const handleSaveReturns = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveReturnsExchanges(returnsData);
      toast.success("Returns & Exchanges Policy updated successfully on live storefront!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update Returns & Exchanges Policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateReturnStatus = async (
    id: string,
    newStatus: ReturnExchangeRequest["status"],
    notes?: string
  ) => {
    try {
      await updateReturnRequestStatus(id, newStatus, notes);
      setReturnRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: newStatus, adminNotes: notes ?? r.adminNotes } : r
        )
      );
      toast.success(`Request status updated to "${newStatus.replace("_", " ")}"`);
    } catch {
      toast.error("Failed to update return ticket status.");
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
    } else if (type === "security") {
      setSecurityData({
        ...securityData,
        clauses: [...securityData.clauses, newClause],
      });
    } else {
      setReturnsData({
        ...returnsData,
        clauses: [...returnsData.clauses, newClause],
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
    } else if (type === "security") {
      setSecurityData({
        ...securityData,
        clauses: securityData.clauses.filter((c) => c.id !== id),
      });
    } else {
      setReturnsData({
        ...returnsData,
        clauses: returnsData.clauses.filter((c) => c.id !== id),
      });
    }
  };

  if (loading) {
    return <LegalPolicySkeleton />;
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
                : activeSubTab === "security"
                ? "/security"
                : "/returns-and-exchanges"
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
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-stone-100 dark:bg-neutral-800/80 rounded-2xl w-fit border border-stone-200/80 dark:border-neutral-700/80">
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

        <button
          type="button"
          onClick={() => setActiveSubTab("returns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "returns"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <ArrowPathIcon className="size-4" />
          <span>Returns &amp; Exchanges</span>
          {returnRequests.filter((r) => r.status === "pending").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
              {returnRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
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

      {/* ======================================================================
          TAB 4: RETURNS & EXCHANGES POLICY & REQUESTS FORM
          ====================================================================== */}
      {activeSubTab === "returns" && (
        <div className="space-y-6">
          {/* Quick Jump to Dedicated Returns Operational Console */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <TruckIcon className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Looking to process live customer Return &amp; Exchange requests?
                </h4>
                <p className="text-xs text-gray-600 dark:text-neutral-400 mt-0.5">
                  Inspect items, assign Steadfast reverse tracking, record bKash/Nagad refunds, and print thermal courier stickers.
                </p>
              </div>
            </div>
            <Link
              to="/admin?tab=returns"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition shrink-0 active:scale-98"
            >
              <span>Open Returns Console</span>
              <ArrowTopRightOnSquareIcon className="size-3.5" />
            </Link>
          </div>

          <form onSubmit={handleSaveReturns} className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowPathIcon className="size-5 text-orange-600" />
                    <span>Returns, Exchanges &amp; Reverse Logistics Policy</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure exchange windows, reverse courier fees, refund processing timelines, and customer guidelines.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Spinner className="size-3.5 text-white animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="size-4" />
                      <span>Save Policy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notice Banner */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Storefront Notice Banner (Optional)
                </label>
                <input
                  type="text"
                  value={returnsData.noticeBanner || ""}
                  onChange={(e) =>
                    setReturnsData({ ...returnsData, noticeBanner: e.target.value })
                  }
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  placeholder="e.g., Complimentary Hassle-Free Doorstep Size Exchange across Dhaka and all 64 districts in Bangladesh."
                />
              </div>

              {/* Key Commerce Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Return / Exchange Window (Days)
                  </label>
                  <input
                    type="number"
                    value={returnsData.returnWindowDays}
                    onChange={(e) =>
                      setReturnsData({
                        ...returnsData,
                        returnWindowDays: Number(e.target.value) || 7,
                      })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                  <span className="text-[10px] text-gray-400">Days from delivery date</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Reverse Pickup (Inside Dhaka ৳)
                  </label>
                  <input
                    type="number"
                    value={returnsData.exchangeFeeInsideDhaka}
                    onChange={(e) =>
                      setReturnsData({
                        ...returnsData,
                        exchangeFeeInsideDhaka: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                  <span className="text-[10px] text-gray-400">Regular courier fee</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Reverse Pickup (Outside Dhaka ৳)
                  </label>
                  <input
                    type="number"
                    value={returnsData.exchangeFeeOutsideDhaka}
                    onChange={(e) =>
                      setReturnsData({
                        ...returnsData,
                        exchangeFeeOutsideDhaka: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                  <span className="text-[10px] text-gray-400">Nationwide courier fee</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Refund Processing Turnaround
                  </label>
                  <input
                    type="text"
                    value={returnsData.refundProcessingDays}
                    onChange={(e) =>
                      setReturnsData({
                        ...returnsData,
                        refundProcessingDays: e.target.value,
                      })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                    placeholder="3 - 5 business days"
                  />
                  <span className="text-[10px] text-gray-400">bKash/Nagad/Bank refund speed</span>
                </div>
              </div>

              {/* Contact & Hub Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Returns Support Hotline
                  </label>
                  <input
                    type="text"
                    value={returnsData.supportHotline}
                    onChange={(e) =>
                      setReturnsData({ ...returnsData, supportHotline: e.target.value })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    WhatsApp Helpline Number
                  </label>
                  <input
                    type="text"
                    value={returnsData.supportWhatsApp}
                    onChange={(e) =>
                      setReturnsData({ ...returnsData, supportWhatsApp: e.target.value })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Returns Department Email
                  </label>
                  <input
                    type="email"
                    value={returnsData.supportEmail}
                    onChange={(e) =>
                      setReturnsData({ ...returnsData, supportEmail: e.target.value })
                    }
                    className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Hub Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Atelier Return &amp; Exchange Hub Address (For Walk-in Customers &amp; Reverse Courier Routing)
                </label>
                <input
                  type="text"
                  value={returnsData.hubAddress}
                  onChange={(e) =>
                    setReturnsData({ ...returnsData, hubAddress: e.target.value })
                  }
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              {/* Non-Returnable Items List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                    Non-Returnable Exceptions &amp; Hygiene Standards
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setReturnsData({
                        ...returnsData,
                        nonReturnableItems: [
                          ...returnsData.nonReturnableItems,
                          "New non-returnable exception item",
                        ],
                      })
                    }
                    className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="size-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {returnsData.nonReturnableItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...returnsData.nonReturnableItems];
                          updated[idx] = e.target.value;
                          setReturnsData({ ...returnsData, nonReturnableItems: updated });
                        }}
                        className="flex-1 text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = returnsData.nonReturnableItems.filter((_, i) => i !== idx);
                          setReturnsData({ ...returnsData, nonReturnableItems: updated });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Legal Clauses */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Returns &amp; Exchanges Policy Clauses
                    </h4>
                    <p className="text-xs text-gray-500">
                      Clauses appear on the storefront under Returns &amp; Exchanges.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addClause("returns")}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="size-3.5 text-orange-600" />
                    <span>Add Policy Section</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {returnsData.clauses.map((clause, index) => (
                    <div
                      key={clause.id}
                      className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-neutral-800/50 border border-stone-200/80 dark:border-neutral-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={clause.title}
                          onChange={(e) => {
                            const updated = [...returnsData.clauses];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setReturnsData({ ...returnsData, clauses: updated });
                          }}
                          className="flex-1 font-bold text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                          placeholder="Clause Title (e.g., 1. 7-Day Hassle-Free Exchange)"
                        />
                        <button
                          type="button"
                          onClick={() => removeClause("returns", clause.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={clause.content}
                        onChange={(e) => {
                          const updated = [...returnsData.clauses];
                          updated[index] = { ...updated[index], content: e.target.value };
                          setReturnsData({ ...returnsData, clauses: updated });
                        }}
                        className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                        placeholder="Detailed clause explanation..."
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
                            const updated = [...returnsData.clauses];
                            updated[index] = {
                              ...updated[index],
                              bulletPoints: e.target.value
                                .split("\n")
                                .filter((line) => line.trim().length > 0),
                            };
                            setReturnsData({ ...returnsData, clauses: updated });
                          }}
                          className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                      <span>Save Returns &amp; Exchanges Policy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* ==================================================================
              CUSTOMER RETURN & EXCHANGE REQUESTS QUEUE
              ================================================================== */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <TruckIcon className="size-3.5" />
                  <span>Reverse Courier Logistics Desk</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Customer Return &amp; Exchange Requests Queue ({returnRequests.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Requests submitted by customers via storefront or helpline. Manage reverse pickups and replacements.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    "all",
                    "pending",
                    "approved",
                    "pickup_scheduled",
                    "received_at_hub",
                    "resolved",
                    "rejected",
                  ] as const
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRequestFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      requestFilter === f
                        ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {returnRequests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-200 dark:border-neutral-800 rounded-2xl">
                <ArrowPathIcon className="size-8 text-gray-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  No return or exchange requests submitted yet.
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  When customers submit requests via the storefront, tickets will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {returnRequests
                  .filter((r) => requestFilter === "all" || r.status === requestFilter)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-800/40 space-y-4 transition hover:border-orange-500/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/50 dark:border-neutral-700/50 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-stone-200/80 dark:bg-neutral-700 text-gray-900 dark:text-white">
                            {req.ticketNumber}
                          </span>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            Order: {req.orderNumber}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-500">Status:</label>
                          <select
                            value={req.status}
                            onChange={(e) =>
                              handleUpdateReturnStatus(
                                req.id,
                                e.target.value as ReturnExchangeRequest["status"]
                              )
                            }
                            className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer ${
                              req.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400"
                                : req.status === "approved"
                                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400"
                                : req.status === "pickup_scheduled"
                                ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400"
                                : req.status === "dropoff_pending"
                                ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-400"
                                : req.status === "received_at_hub"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400"
                                : req.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400"
                            }`}
                          >
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="pickup_scheduled">Pickup Scheduled</option>
                            <option value="dropoff_pending">Drop-Off Pending</option>
                            <option value="received_at_hub">Received at Hub</option>
                            <option value="resolved">Resolved / Dispatched</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[11px] font-semibold">Customer</span>
                          <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                            {req.customerName}
                          </span>
                          <span className="text-gray-600 dark:text-neutral-300 block">
                            {req.customerPhone}
                          </span>
                          {req.customerEmail && (
                            <span className="text-gray-400 block text-[11px]">{req.customerEmail}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-gray-400 block text-[11px] font-semibold">Request Type &amp; Item</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-stone-200 dark:bg-neutral-700 text-stone-800 dark:text-neutral-200 capitalize">
                            {req.type.replace(/_/g, " ")}
                          </span>
                          <p className="text-gray-700 dark:text-neutral-300 mt-1 line-clamp-2">
                            {req.itemDetails}
                          </p>
                          {req.requestedReplacement && (
                            <p className="text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                              Target: {req.requestedReplacement}
                            </p>
                          )}
                          {req.refundMethod && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              Refund: {req.refundMethod} ({req.refundAccountDetails || "Account not set"})
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-gray-400 block text-[11px] font-semibold">Pickup Address</span>
                          <p className="text-gray-700 dark:text-neutral-300 mt-0.5">
                            {req.pickupAddress}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Zone: {req.zone === "inside_dhaka" ? "Inside Dhaka (৳60)" : "Outside Dhaka (৳120)"}
                          </span>
                        </div>
                      </div>

                      {/* Reason & WhatsApp Action */}
                      <div className="pt-2 border-t border-stone-200/50 dark:border-neutral-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <span className="text-gray-400 text-[11px] font-semibold">Customer Note: </span>
                          <span className="text-gray-700 dark:text-neutral-300 italic">
                            &quot;{req.reason}&quot;
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${req.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                              req.customerName
                            )},%20this%20is%20SilkenDrift%20Apparel%20regarding%20your%20Return%20Ticket%20${req.ticketNumber}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            <span>WhatsApp Customer</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLegalTab;
