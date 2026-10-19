import React, { useState, useMemo } from "react";
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import {
  type NewsletterSubscriber,
  addNewsletterSubscriber,
  updateNewsletterSubscriberStatus,
  deleteNewsletterSubscriber,
  bulkDeleteNewsletterSubscribers,
} from "~/firebase";

interface AdminNewsletterTabProps {
  subscribers: NewsletterSubscriber[];
  onRefresh: () => void;
}

export const AdminNewsletterTab: React.FC<AdminNewsletterTabProps> = ({
  subscribers,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Add Subscriber Form state
  const [newEmail, setNewEmail] = useState("");
  const [newSource, setNewSource] = useState("Admin Manual");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Campaign Composer state
  const [campaignSubject, setCampaignSubject] = useState("Exclusive 10% Welcome Voucher & VIP Autumn Drop");
  const [campaignPromo, setCampaignPromo] = useState("WELCOME10");
  const [campaignBody, setCampaignBody] = useState(
    "Dear VIP Member,\n\nWe are delighted to welcome you to the Fedoll Atelier VIP community. Explore our new season heavyweight denim and artisanal outerwear with your private discount code."
  );
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Derived metrics
  const totalCount = subscribers.length;
  const activeSubscribers = useMemo(
    () => subscribers.filter((s) => s.status === "active"),
    [subscribers]
  );
  const activeCount = activeSubscribers.length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "unsubscribed").length;

  const now = new Date();
  const recentCount = useMemo(() => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return subscribers.filter((s) => {
      const subDate = new Date(s.subscribedAt);
      return !isNaN(subDate.getTime()) && subDate >= sevenDaysAgo;
    }).length;
  }, [subscribers]);

  // Unique sources
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    subscribers.forEach((s) => {
      if (s.source) set.add(s.source);
    });
    return Array.from(set);
  }, [subscribers]);

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchEmail = s.email.toLowerCase().includes(q);
        const matchSource = s.source?.toLowerCase().includes(q);
        const matchNotes = s.notes?.toLowerCase().includes(q);
        if (!matchEmail && !matchSource && !matchNotes) return false;
      }
      return true;
    });
  }, [subscribers, statusFilter, sourceFilter, searchTerm]);

  // Selection helpers
  const allFilteredSelected =
    filteredSubscribers.length > 0 &&
    filteredSubscribers.every((s) => selectedIds.includes(s.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Copy helpers
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success(`Copied "${email}" to clipboard.`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyAllActiveEmails = () => {
    if (activeSubscribers.length === 0) {
      toast.info("No active subscribers to copy.");
      return;
    }
    const emailsList = activeSubscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emailsList);
    toast.success(`Copied ${activeSubscribers.length} active subscriber emails to clipboard!`);
  };

  const handleCopySelectedEmails = () => {
    const selectedList = subscribers.filter((s) => selectedIds.includes(s.id));
    if (selectedList.length === 0) return;
    const emails = selectedList.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${selectedList.length} selected emails to clipboard.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.info("No subscriber records available to export.");
      return;
    }

    const headers = ["ID", "Email", "Status", "Subscribed At", "Source", "Notes"];
    const rows = subscribers.map((s) => [
      s.id,
      `"${s.email}"`,
      s.status,
      `"${s.subscribedAt}"`,
      `"${s.source || "Storefront"}"`,
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fedoll_newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${subscribers.length} subscribers to CSV!`);
  };

  // Toggle status
  const handleToggleStatus = async (subscriber: NewsletterSubscriber) => {
    const newStatus = subscriber.status === "active" ? "unsubscribed" : "active";
    setProcessingId(subscriber.id);
    try {
      await updateNewsletterSubscriberStatus(subscriber.id, newStatus);
      toast.success(
        `Marked ${subscriber.email} as ${newStatus.toUpperCase()}`
      );
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update subscriber status.");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete single
  const handleDeleteSubscriber = async (subscriber: NewsletterSubscriber) => {
    const confirmDelete = window.confirm(
      `Remove "${subscriber.email}" from newsletter list permanently?`
    );
    if (!confirmDelete) return;

    setProcessingId(subscriber.id);
    try {
      await deleteNewsletterSubscriber(subscriber.id);
      toast.success(`Subscriber "${subscriber.email}" deleted.`);
      setSelectedIds((prev) => prev.filter((id) => id !== subscriber.id));
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete subscriber.");
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (status: "active" | "unsubscribed") => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateNewsletterSubscriberStatus(id, status))
      );
      toast.success(`Updated ${selectedIds.length} subscribers to ${status.toUpperCase()}`);
      onRefresh();
      setSelectedIds([]);
    } catch {
      toast.error("Failed to update selected subscribers.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Permanently delete ${selectedIds.length} selected subscribers?`
    );
    if (!confirm) return;

    try {
      await bulkDeleteNewsletterSubscribers(selectedIds);
      toast.success(`Deleted ${selectedIds.length} subscribers.`);
      setSelectedIds([]);
      onRefresh();
    } catch {
      toast.error("Failed to delete selected subscribers.");
    }
  };

  // Add subscriber submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Email address is required.");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await addNewsletterSubscriber(newEmail.trim(), newSource, newNotes.trim());
      toast.success(`Added "${newEmail.trim()}" to subscribers list!`);
      setNewEmail("");
      setNewNotes("");
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add subscriber.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Send Campaign Broadcast simulation
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject.trim()) {
      toast.error("Campaign subject line is required.");
      return;
    }

    setIsSendingCampaign(true);
    // Simulate transmission delay
    await new Promise((res) => setTimeout(res, 1200));

    toast.success(
      `🚀 Campaign broadcast sent successfully to ${activeCount} active subscribers!`
    );
    setIsSendingCampaign(false);
    setIsCampaignModalOpen(false);
  };

  // Helper date formatter
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "Recent";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <EnvelopeOpenIcon className="size-6" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Audience &amp; Marketing
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            Newsletter Subscribers &amp; VIP Club
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-xl">
            Live directory of all emails registered via the storefront footer, VIP drop inquiries, and manual entries. Manage subscriber statuses and export lists for campaigns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-700 transition cursor-pointer"
            title="Refresh Subscribers"
          >
            <ArrowPathIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleCopyAllActiveEmails}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Copy all active subscriber emails"
          >
            <ClipboardDocumentIcon className="size-4 text-stone-500" />
            <span>Copy Active ({activeCount})</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <ArrowDownTrayIcon className="size-4 text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCampaignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PaperAirplaneIcon className="size-4 text-orange-400" />
            <span>Broadcast Campaign</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscribers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
              Total Subscribers
            </span>
            <div className="p-2.5 rounded-xl border text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800">
              <UsersIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {totalCount}
            </span>
            <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
              Cumulative newsletter audience
            </p>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
              Active Subscribers
            </span>
            <div className="p-2.5 rounded-xl border text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
              <CheckCircleIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : "100%"}
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
              Receiving drops &amp; discount vouchers
            </p>
          </div>
        </div>

        {/* Unsubscribed */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
              Unsubscribed
            </span>
            <div className="p-2.5 rounded-xl border text-stone-500 bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700">
              <XCircleIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-700 dark:text-neutral-300">
              {unsubscribedCount}
            </span>
            <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
              Opted out / paused notifications
            </p>
          </div>
        </div>

        {/* Joined This Week */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
              Recent Signups (7d)
            </span>
            <div className="p-2.5 rounded-xl border text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
              <SparklesIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                +{recentCount}
              </span>
              <span className="text-xs text-blue-600 font-semibold">new</span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
              Acquired in the last 7 calendar days
            </p>
          </div>
        </div>
      </div>

      {/* Search, Filter & Bulk Actions Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="size-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email address, source, or notes..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-stone-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <XMarkIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Segment */}
            <div className="inline-flex rounded-xl bg-stone-100 dark:bg-neutral-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("unsubscribed")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  statusFilter === "unsubscribed"
                    ? "bg-white dark:bg-neutral-900 text-stone-700 dark:text-stone-300 shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                Unsubscribed ({unsubscribedCount})
              </button>
            </div>

            {/* Source Dropdown */}
            {uniqueSources.length > 0 && (
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-gray-700 dark:text-stone-200 outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">All Sources</option>
                {uniqueSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Bulk Action Strip (appears when items are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-900 dark:text-orange-200">
              <span className="px-2 py-0.5 rounded-md bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-mono">
                {selectedIds.length}
              </span>
              <span>Subscribers Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySelectedEmails}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 transition cursor-pointer"
              >
                Copy Selected
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("active")}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Mark Active
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("unsubscribed")}
                className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Mark Unsubscribed
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Subscribers Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        {filteredSubscribers.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="size-16 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-400 mx-auto flex items-center justify-center">
              <EnvelopeIcon className="size-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No Subscribers Found
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
                  ? "Try adjusting your search criteria or resetting the filters."
                  : "No newsletter subscribers have been recorded yet. Subscriptions via the storefront footer will appear here automatically."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchTerm || statusFilter !== "all" || sourceFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Add Subscriber Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-neutral-800 bg-stone-50/70 dark:bg-neutral-950/60 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-neutral-400">
                  <th className="py-3.5 pl-6 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleSelectAll}
                      className="rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer size-4"
                    />
                  </th>
                  <th className="py-3.5 px-3">Subscriber Email</th>
                  <th className="py-3.5 px-3">Subscribed Date</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Source</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-xs">
                {filteredSubscribers.map((subscriber) => {
                  const isSelected = selectedIds.includes(subscriber.id);
                  const isProcessing = processingId === subscriber.id;
                  const isCopied = copiedId === subscriber.id;

                  return (
                    <tr
                      key={subscriber.id}
                      className={`hover:bg-stone-50/60 dark:hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? "bg-orange-50/40 dark:bg-orange-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(subscriber.id)}
                          className="rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer size-4"
                        />
                      </td>

                      {/* Subscriber Email & Avatar */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-800/60 text-xs">
                            {subscriber.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white truncate">
                                {subscriber.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(subscriber.email, subscriber.id)}
                                className="text-stone-400 hover:text-orange-600 transition"
                                title="Copy Email"
                              >
                                {isCopied ? (
                                  <CheckIcon className="size-3.5 text-emerald-600" />
                                ) : (
                                  <ClipboardDocumentIcon className="size-3.5" />
                                )}
                              </button>
                            </div>
                            {subscriber.notes && (
                              <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5 max-w-xs">
                                {subscriber.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subscribed Date */}
                      <td className="py-4 px-3 text-stone-600 dark:text-neutral-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <ClockIcon className="size-3.5 text-stone-400 shrink-0" />
                          <span>{formatDate(subscriber.subscribedAt)}</span>
                        </div>
                      </td>

                      {/* Status Badge & Quick Toggle */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(subscriber)}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                            subscriber.status === "active"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-200"
                              : "bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700 hover:bg-stone-200"
                          }`}
                          title={`Click to switch to ${
                            subscriber.status === "active" ? "unsubscribed" : "active"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              subscriber.status === "active" ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{subscriber.status}</span>
                        </button>
                      </td>

                      {/* Source */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-neutral-800 text-[11px] font-medium text-stone-700 dark:text-neutral-300 border border-stone-200/60 dark:border-neutral-700/60">
                          {subscriber.source || "Storefront"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`mailto:${subscriber.email}`}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 text-stone-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
                            title="Compose Direct Email"
                          >
                            <EnvelopeIcon className="size-4" />
                          </a>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDeleteSubscriber(subscriber)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete Subscriber"
                          >
                            {isProcessing ? (
                              <Spinner className="size-4 text-rose-600" />
                            ) : (
                              <TrashIcon className="size-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info strip */}
        <div className="p-4 border-t border-stone-100 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-emerald-600" />
            <span>
              Real-time synchronization with Cloud Firestore <code className="font-mono text-orange-600 dark:text-orange-400">newsletters</code> collection.
            </span>
          </div>
          <span>
            Showing {filteredSubscribers.length} of {totalCount} total subscribers
          </span>
        </div>
      </div>

      {/* MODAL: Add Subscriber Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center">
                  <PlusIcon className="size-5" />
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Add Newsletter Subscriber
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Subscription Source
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="Admin Manual">Admin Manual Entry</option>
                  <option value="Showroom / In-Store">Showroom / In-Store Visitor</option>
                  <option value="VIP Invitation">VIP Invitation</option>
                  <option value="Fashion Week / Event">Fashion Week / Trade Event</option>
                  <option value="Storefront Footer">Storefront Footer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Requested selvedge denim catalog, showroom guest"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Spinner className="size-4 text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Subscriber</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Campaign Broadcast Composer / Simulation */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center">
                  <PaperAirplaneIcon className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Broadcast Newsletter Campaign
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Will be dispatched to {activeCount} active subscribers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="e.g., Seasonal Drop: Fedoll Artisan Winter Denim"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Include Voucher / Coupon Code
                </label>
                <div className="flex items-center gap-2">
                  <TagIcon className="size-4 text-orange-500" />
                  <select
                    value={campaignPromo}
                    onChange={(e) => setCampaignPromo(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none"
                  >
                    <option value="WELCOME10">WELCOME10 (10% Off Welcome Voucher)</option>
                    <option value="FEDOLL2026">FEDOLL2026 (15% Off Outerwear &amp; Denim)</option>
                    <option value="VIP20">VIP20 (20% Off Orders over ৳5,000)</option>
                    <option value="NONE">No Promo Code Attached</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Email Announcement Message
                </label>
                <textarea
                  rows={4}
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 text-[11px] space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Recipients:</span>
                  <span className="font-bold text-orange-600">{activeCount} Verified Emails</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Sender:</span>
                  <span className="text-gray-900 dark:text-white">newsletter@fedoll.com (Fedoll Atelier)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingCampaign || activeCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingCampaign ? (
                    <>
                      <Spinner className="size-4 text-white" />
                      <span>Sending Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="size-4" />
                      <span>Dispatch Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletterTab;
