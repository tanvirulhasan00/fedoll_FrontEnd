import React, { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  TagIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  type ContactMessageRecord,
  updateContactMessageStatusInFirestore,
  deleteContactMessageFromFirestore,
} from "~/firebase";

interface AdminMessagesTabProps {
  messages: ContactMessageRecord[];
  onRefresh: () => void;
}

export const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({
  messages,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRecord | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Status Counts
  const totalCount = messages.length;
  const newCount = messages.filter((m) => m.status === "new").length;
  const inReviewCount = messages.filter((m) => m.status === "in-review").length;
  const resolvedCount = messages.filter((m) => m.status === "resolved").length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.orderNumber && msg.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (msg.phone && msg.phone.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" || msg.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || msg.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Unique categories for filter
  const categoriesList = Array.from(
    new Set(messages.map((m) => m.category).filter(Boolean))
  );

  const handleOpenDetail = (msg: ContactMessageRecord) => {
    setSelectedMessage(msg);
    setAdminNote(msg.adminNote || "");
  };

  const handleStatusChange = async (
    msgId: string,
    newStatus: "new" | "in-review" | "resolved",
    note?: string
  ) => {
    try {
      await updateContactMessageStatusInFirestore(msgId, newStatus, note);
      toast.success(`Message marked as ${newStatus.replace("-", " ")}`);
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage({
          ...selectedMessage,
          status: newStatus,
          ...(note !== undefined ? { adminNote: note } : {}),
        });
      }
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update message status");
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedMessage?.id) return;
    setSavingNote(true);
    try {
      await updateContactMessageStatusInFirestore(
        selectedMessage.id,
        selectedMessage.status,
        adminNote
      );
      toast.success("Admin note and reply record updated");
      setSelectedMessage({
        ...selectedMessage,
        adminNote,
        repliedAt: adminNote.trim() ? new Date().toISOString() : selectedMessage.repliedAt,
      });
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save admin note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to permanently delete this customer inquiry?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteContactMessageFromFirestore(id);
      toast.success("Customer message deleted successfully");
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <ChatBubbleLeftRightIcon className="size-6 text-orange-600 dark:text-orange-400" />
            <span>Customer Inquiries &amp; Messages</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            Real-time messages submitted by customers through the Contact Us page and customer service channels.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700 transition"
        >
          <SparklesIcon className="size-4 text-orange-600" />
          Refresh Inbox
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "all"
              ? "bg-stone-900 text-white dark:bg-neutral-800 border-stone-800 shadow-md ring-2 ring-orange-500/20"
              : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-white border-gray-200 dark:border-neutral-800 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Inquiries</span>
            <EnvelopeIcon className="size-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter("new")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "new"
              ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30"
              : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-white border-gray-200 dark:border-neutral-800 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
              New / Unread
            </span>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500"></span>
            </span>
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">{newCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter("in-review")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "in-review"
              ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30"
              : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-white border-gray-200 dark:border-neutral-800 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400">In Review</span>
            <ClockIcon className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">{inReviewCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter("resolved")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === "resolved"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30"
              : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-white border-gray-200 dark:border-neutral-800 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolved</span>
            <CheckCircleIcon className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, subject, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500 dark:text-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by message category"
          className="text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 focus:outline-hidden"
        >
          <option value="all">All Categories</option>
          {categoriesList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
          {(["all", "new", "in-review", "resolved"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === st
                  ? "bg-white dark:bg-neutral-900 text-orange-700 dark:text-orange-400 shadow-xs"
                  : "text-gray-600 dark:text-neutral-400 hover:text-gray-900"
              }`}
            >
              {st === "all" ? "All" : st === "in-review" ? "In Review" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-12 text-center space-y-3">
          <div className="size-14 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
            <ChatBubbleLeftRightIcon className="size-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No inquiries found</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "No messages match your selected search or filter criteria. Try clearing filters."
              : "No customer messages have been received yet. Inquiries submitted via the Contact Us page will appear here immediately."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredMessages.map((msg) => {
            const isNew = msg.status === "new";
            const isInReview = msg.status === "in-review";
            const isResolved = msg.status === "resolved";

            return (
              <div
                key={msg.id || msg.submittedAt}
                className={`p-5 rounded-2xl border transition-all ${
                  isNew
                    ? "bg-white dark:bg-neutral-900 border-amber-300/80 dark:border-amber-800/60 shadow-sm ring-1 ring-amber-500/10"
                    : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: Sender & Subject */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="size-10 rounded-full bg-stone-900 dark:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {msg.name}
                        </span>

                        {/* Status Badge */}
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300/60">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            New Inquiry
                          </span>
                        )}
                        {isInReview && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-300/60">
                            In Review
                          </span>
                        )}
                        {isResolved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300/60">
                            <CheckCircleIcon className="size-3" />
                            Resolved
                          </span>
                        )}

                        {/* Category */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 text-[10px] font-medium">
                          <TagIcon className="size-2.5" />
                          {msg.category}
                        </span>

                        {/* Order Number Badge */}
                        {msg.orderNumber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[10px] font-semibold border border-orange-200 dark:border-orange-900/60">
                            <ShoppingBagIcon className="size-2.5" />
                            Order: {msg.orderNumber}
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-1 truncate">
                        {msg.subject}
                      </h4>

                      {/* Message preview snippet */}
                      <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1 line-clamp-2">
                        {msg.message}
                      </p>

                      {/* Admin Note preview if present */}
                      {msg.adminNote && (
                        <div className="mt-2 text-[11px] bg-stone-50 dark:bg-neutral-800/60 text-stone-600 dark:text-neutral-400 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-neutral-700/60 flex items-center gap-1.5">
                          <span className="font-bold text-orange-600 dark:text-orange-400">Atelier Note:</span>
                          <span className="truncate">{msg.adminNote}</span>
                        </div>
                      )}

                      {/* Contact metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-neutral-400 mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800/80">
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-orange-600 flex items-center gap-1"
                        >
                          <EnvelopeIcon className="size-3" />
                          {msg.email}
                        </a>
                        {msg.phone && (
                          <a
                            href={`tel:${msg.phone}`}
                            className="hover:text-orange-600 flex items-center gap-1"
                          >
                            <PhoneIcon className="size-3" />
                            {msg.phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1 text-gray-400">
                          <CalendarDaysIcon className="size-3" />
                          {formatTimestamp(msg.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(msg)}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 hover:bg-orange-100 text-xs font-semibold transition"
                    >
                      View &amp; Reply
                    </button>

                    {/* Quick status cycle */}
                    {msg.status !== "resolved" ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(msg.id!, "resolved")}
                        title="Mark as Resolved"
                        className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      >
                        <CheckCircleIcon className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(msg.id!, "new")}
                        title="Reopen as New"
                        className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition"
                      >
                        <ExclamationCircleIcon className="size-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={deletingId === msg.id}
                      onClick={() => handleDelete(msg.id)}
                      title="Delete Inquiry"
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Inspection & Response Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 text-xs font-semibold">
                    {selectedMessage.category}
                  </span>
                  {selectedMessage.orderNumber && (
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-400 text-xs font-semibold">
                      Order: {selectedMessage.orderNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                  {selectedMessage.subject}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Received on {formatTimestamp(selectedMessage.submittedAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="bg-stone-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-orange-700 text-white font-bold flex items-center justify-center">
                  {selectedMessage.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedMessage.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {selectedMessage.email}
                  </p>
                  {selectedMessage.phone && (
                    <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                      {selectedMessage.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}&body=Dear ${encodeURIComponent(
                    selectedMessage.name
                  )},%0D%0A%0D%0AThank you for reaching out to Fedoll Luxury Apparel.`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-700 text-white text-xs font-semibold hover:bg-orange-800 transition shadow-xs"
                >
                  <EnvelopeIcon className="size-3.5" />
                  Email Customer
                </a>

                {selectedMessage.phone && (
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-neutral-700 text-stone-800 dark:text-white text-xs font-semibold hover:bg-stone-300 dark:hover:bg-neutral-600 transition"
                  >
                    <PhoneIcon className="size-3.5" />
                    Call
                  </a>
                )}
              </div>
            </div>

            {/* Full Message Body */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Customer Message
              </label>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-sm text-gray-800 dark:text-neutral-200 whitespace-pre-line leading-relaxed shadow-xs">
                {selectedMessage.message}
              </div>
            </div>

            {/* Status Switcher */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Inquiry Status
              </label>
              <div className="flex items-center gap-2">
                {(["new", "in-review", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(selectedMessage.id!, st, adminNote)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      selectedMessage.status === st
                        ? st === "new"
                          ? "bg-amber-600 text-white shadow-xs"
                          : st === "in-review"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-emerald-600 text-white shadow-xs"
                        : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {st === "new" && <ExclamationCircleIcon className="size-4" />}
                    {st === "in-review" && <ClockIcon className="size-4" />}
                    {st === "resolved" && <CheckCircleIcon className="size-4" />}
                    {st === "new" ? "New" : st === "in-review" ? "In Review" : "Resolved"}
                  </button>
                ))}
              </div>
            </div>

            {/* Atelier Admin Notes & Reply Record */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Internal Atelier Note / Resolution Record
                </label>
                {selectedMessage.repliedAt && (
                  <span className="text-[10px] text-gray-400">
                    Last updated: {formatTimestamp(selectedMessage.repliedAt)}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Log internal notes, action taken, customer call summary, or sizing advice provided..."
                className="w-full p-3 text-xs rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <TrashIcon className="size-3.5" />
                  Delete Inquiry
                </button>

                <button
                  type="button"
                  onClick={handleSaveAdminNote}
                  disabled={savingNote}
                  className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="size-3.5" />
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesTab;
