import React, { useState, useMemo, useRef } from "react";
import {
  ArrowPathRoundedSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PrinterIcon,
  TrashIcon,
  TruckIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import {
  type ReturnExchangeRequest,
  type ReturnsExchangesData,
  defaultReturnsExchanges,
  createReturnExchangeRequest,
  updateReturnRequest,
  deleteReturnRequest,
  saveReturnsExchanges,
  fetchOrderByTrackingOrNumber,
  type Order,
  type LegalClause,
} from "~/firebase";

// ---------------------------------------------------------------------------
// Standard Code 128 Barcode Generator (Pure TypeScript Vector SVG)
// ---------------------------------------------------------------------------
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

function generateCode128SvgBars(text: string): { totalWidth: number; bars: { x: number; width: number }[] } {
  const codes: number[] = [104];
  let sum = 104;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    const safeCode = code >= 0 && code <= 95 ? code : 0;
    codes.push(safeCode);
    sum += safeCode * (i + 1);
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106);

  let patternStr = "";
  for (const c of codes) {
    patternStr += CODE128_PATTERNS[c] || "";
  }

  const bars: { x: number; width: number }[] = [];
  let isBar = true;
  let x = 0;
  for (const digit of patternStr) {
    const width = parseInt(digit, 10) || 1;
    if (isBar) {
      bars.push({ x, width });
    }
    x += width;
    isBar = !isBar;
  }
  return { totalWidth: x, bars };
}

interface AdminReturnsTabProps {
  returnRequests: ReturnExchangeRequest[];
  policyData?: ReturnsExchangesData;
  orders?: Order[];
  onRefresh: () => void;
}

export const AdminReturnsTab: React.FC<AdminReturnsTabProps> = ({
  returnRequests,
  policyData = defaultReturnsExchanges,
  orders = [],
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "policy">("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Manage / Edit Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<ReturnExchangeRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState<ReturnExchangeRequest["status"]>("pending");
  const [editReverseCourier, setEditReverseCourier] = useState("");
  const [editReverseTracking, setEditReverseTracking] = useState("");
  const [editReplacementTracking, setEditReplacementTracking] = useState("");
  const [editReplacementDetails, setEditReplacementDetails] = useState("");
  const [editRefundAmount, setEditRefundAmount] = useState<number | "">("");
  const [editRefundTrxId, setEditRefundTrxId] = useState("");
  const [editInspectionResult, setEditInspectionResult] = useState<
    NonNullable<ReturnExchangeRequest["inspectionResult"]>
  >("pending");
  const [editAdminNotes, setEditAdminNotes] = useState("");

  // Printable Reverse Logistics Sticker Modal
  const [stickerTicket, setStickerTicket] = useState<ReturnExchangeRequest | null>(null);
  const [isStickerOpen, setIsStickerOpen] = useState(false);

  // Manual Log Ticket Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [manualForm, setManualForm] = useState({
    orderNumber: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupAddress: "",
    zone: "inside_dhaka" as "inside_dhaka" | "outside_dhaka",
    type: "size_exchange" as ReturnExchangeRequest["type"],
    itemDetails: "",
    requestedReplacement: "",
    refundMethod: "bKash" as NonNullable<ReturnExchangeRequest["refundMethod"]>,
    refundAccountDetails: "",
    refundAmount: "" as number | "",
    reason: "Customer requested size exchange over WhatsApp",
    adminNotes: "Logged manually via Admin Panel",
    status: "approved" as ReturnExchangeRequest["status"],
  });

  // Policy Form State
  const [policyForm, setPolicyForm] = useState<ReturnsExchangesData>(policyData);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Open Edit Modal
  const handleOpenEdit = (ticket: ReturnExchangeRequest) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditReverseCourier(ticket.reverseCourier || "Steadfast Courier Reverse Logistics");
    setEditReverseTracking(ticket.reverseTrackingNumber || "");
    setEditReplacementTracking(ticket.replacementTrackingNumber || "");
    setEditReplacementDetails(ticket.requestedReplacement || "");
    setEditRefundAmount(ticket.refundAmount ?? "");
    setEditRefundTrxId(ticket.refundTransactionId || "");
    setEditInspectionResult(ticket.inspectionResult || "pending");
    setEditAdminNotes(ticket.adminNotes || "");
  };

  // Save Ticket Updates
  const handleSaveTicketUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdating(true);
    try {
      await updateReturnRequest(selectedTicket.id, {
        status: editStatus,
        reverseCourier: editReverseCourier,
        reverseTrackingNumber: editReverseTracking,
        replacementTrackingNumber: editReplacementTracking,
        requestedReplacement: editReplacementDetails,
        refundAmount: editRefundAmount === "" ? undefined : Number(editRefundAmount),
        refundTransactionId: editRefundTrxId,
        inspectionResult: editInspectionResult,
        adminNotes: editAdminNotes,
        resolvedAt: editStatus === "resolved" ? new Date().toISOString() : selectedTicket.resolvedAt,
      });

      toast.success(`Ticket ${selectedTicket.ticketNumber} updated successfully!`);
      setSelectedTicket(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update ticket.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (ticket: ReturnExchangeRequest) => {
    if (!window.confirm(`Are you sure you want to permanently delete return ticket ${ticket.ticketNumber}?`)) {
      return;
    }
    try {
      await deleteReturnRequest(ticket.id);
      toast.success(`Deleted ticket ${ticket.ticketNumber}.`);
      onRefresh();
    } catch {
      toast.error("Failed to delete ticket.");
    }
  };

  // Manual Creation Auto-Fill from Order Number
  const handleAutoFillManualOrder = async () => {
    const code = manualForm.orderNumber.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter an Order Number to look up.");
      return;
    }
    try {
      const found = await fetchOrderByTrackingOrNumber(code);
      if (found) {
        setManualForm((prev) => ({
          ...prev,
          orderNumber: found.orderNumber,
          customerName: found.customerName || prev.customerName,
          customerPhone: found.customerPhone || prev.customerPhone,
          customerEmail: found.customerEmail || prev.customerEmail,
          pickupAddress:
            `${found.shippingAddress?.streetAddress || ""}, ${found.shippingAddress?.city || ""}, ${found.shippingAddress?.district || ""}`.replace(/^,\s*|,\s*$/g, "") ||
            prev.pickupAddress,
          zone: (found.shippingAddress?.city || "").toLowerCase().includes("dhaka")
            ? "inside_dhaka"
            : "outside_dhaka",
          itemDetails: found.items.map((i) => `${i.name} (Size: ${i.size || "Standard"})`).join(", "),
        }));
        toast.success(`Found Order #${found.orderNumber}. Details auto-filled!`);
      } else {
        toast.info(`Order #${code} not found. You can fill details manually.`);
      }
    } catch {
      toast.info(`Proceeding with #${code}.`);
    }
  };

  // Submit Manual Ticket Creation
  const handleCreateManualTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.orderNumber.trim() || !manualForm.customerName.trim() || !manualForm.customerPhone.trim()) {
      toast.error("Please fill in Order Number, Customer Name, and Phone Number.");
      return;
    }

    setIsCreating(true);
    try {
      const record = await createReturnExchangeRequest({
        orderNumber: manualForm.orderNumber.trim().toUpperCase(),
        customerName: manualForm.customerName.trim(),
        customerPhone: manualForm.customerPhone.trim(),
        customerEmail: manualForm.customerEmail.trim(),
        pickupAddress: manualForm.pickupAddress.trim(),
        zone: manualForm.zone,
        type: manualForm.type,
        itemDetails: manualForm.itemDetails.trim(),
        requestedReplacement: manualForm.requestedReplacement.trim(),
        refundMethod: manualForm.type === "refund" ? manualForm.refundMethod : undefined,
        refundAccountDetails: manualForm.type === "refund" ? manualForm.refundAccountDetails.trim() : undefined,
        refundAmount: manualForm.refundAmount !== "" ? Number(manualForm.refundAmount) : undefined,
        reason: manualForm.reason.trim(),
        adminNotes: manualForm.adminNotes.trim(),
      });

      if (manualForm.status !== "pending") {
        await updateReturnRequest(record.id, { status: manualForm.status });
      }

      toast.success(`Created return ticket ${record.ticketNumber}!`);
      setIsCreateOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to create manual return ticket.");
    } finally {
      setIsCreating(false);
    }
  };

  // Save Policy Form
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      await saveReturnsExchanges(policyForm);
      toast.success("Returns & Exchanges Policy updated successfully on live storefront!");
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save policy.");
    } finally {
      setSavingPolicy(false);
    }
  };

  // Print Thermal Reverse Sticker
  const handleOpenSticker = (ticket: ReturnExchangeRequest) => {
    setStickerTicket(ticket);
    setIsStickerOpen(true);
  };

  const handlePrintSticker = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return returnRequests.filter((r) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        r.ticketNumber.toLowerCase().includes(query) ||
        r.orderNumber.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        r.customerPhone.includes(query) ||
        r.itemDetails.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesType = typeFilter === "all" || r.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [returnRequests, searchQuery, statusFilter, typeFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = returnRequests.length;
    const pending = returnRequests.filter((r) => r.status === "pending").length;
    const pickupScheduled = returnRequests.filter((r) => r.status === "pickup_scheduled").length;
    const atHub = returnRequests.filter((r) => r.status === "received_at_hub").length;
    const resolved = returnRequests.filter((r) => r.status === "resolved").length;
    const totalRefunds = returnRequests
      .filter((r) => r.type === "refund" && r.refundAmount)
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

    return { total, pending, pickupScheduled, atHub, resolved, totalRefunds };
  }, [returnRequests]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ArrowPathRoundedSquareIcon className="size-3.5" />
            <span>Reverse Logistics &amp; Atelier Concierge</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Returns, Exchanges &amp; Reverse Couriers
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Manage customer doorstep reverse pickups, assign reverse courier consignment IDs, conduct atelier quality audits, disburse bKash/Nagad refunds, and print thermal inspection stickers.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Log Manual Return Request</span>
          </button>
          <a
            href="/returns-and-exchanges"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-orange-500 text-gray-700 dark:text-neutral-200 hover:text-orange-600 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <span>Preview Storefront Page</span>
            <ArrowTopRightOnSquareIcon className="size-4" />
          </a>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Total Tickets
          </span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
            {stats.total}
          </p>
          <span className="text-[10px] text-gray-400">All submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Pending Review
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.pending}
          </p>
          <span className="text-[10px] text-gray-400">Requires decision</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Pickup In-Transit
          </span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {stats.pickupScheduled}
          </p>
          <span className="text-[10px] text-gray-400">Rider on the way</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
            At Uttara Hub
          </span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {stats.atHub}
          </p>
          <span className="text-[10px] text-gray-400">In inspection audit</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Resolved
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.resolved}
          </p>
          <span className="text-[10px] text-gray-400">Swapped / Refunded</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            Refunds Settled
          </span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 truncate">
            ৳{stats.totalRefunds.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400">Direct bKash/Bank</span>
        </div>
      </div>

      {/* Main Subtab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-neutral-800/80 rounded-2xl w-fit border border-stone-200/80 dark:border-neutral-700/80">
        <button
          type="button"
          onClick={() => setActiveSubTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "requests"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <ClipboardDocumentCheckIcon className="size-4" />
          <span>Return &amp; Exchange Requests ({returnRequests.length})</span>
          {stats.pending > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("policy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "policy"
              ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
              : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <ShieldCheckIcon className="size-4" />
          <span>Policy, Fees &amp; SLA Rules</span>
        </button>
      </div>

      {/* ======================================================================
          VIEW 1: RETURN & EXCHANGE REQUESTS QUEUE
          ====================================================================== */}
      {activeSubTab === "requests" && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Search & Filter Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, order #, customer phone, name..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-neutral-800 p-1 rounded-xl">
                {[
                  { id: "all", label: "All" },
                  { id: "pending", label: "Pending" },
                  { id: "approved", label: "Approved" },
                  { id: "pickup_scheduled", label: "Pickup" },
                  { id: "received_at_hub", label: "At Hub" },
                  { id: "resolved", label: "Resolved" },
                  { id: "rejected", label: "Rejected" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      statusFilter === s.id
                        ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs p-2 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 cursor-pointer font-bold"
              >
                <option value="all">All Request Types</option>
                <option value="size_exchange">Size Exchange</option>
                <option value="color_style_exchange">Style / Color Swap</option>
                <option value="defective_replacement">Defective Item</option>
                <option value="refund">Monetary Refund</option>
              </select>
            </div>
          </div>

          {/* Tickets Table / List */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-200 dark:border-neutral-800 rounded-2xl space-y-2">
              <ArrowPathRoundedSquareIcon className="size-10 text-gray-300 dark:text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-gray-600 dark:text-neutral-400">
                No return or exchange tickets match your current filters.
              </p>
              <p className="text-[11px] text-gray-400">
                Customers can submit tickets via the storefront, or you can log one manually above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-800/40 space-y-4 transition hover:border-orange-500/50"
                >
                  {/* Top Bar: Ticket #, Order #, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 dark:border-neutral-700/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(ticket.ticketNumber, "Ticket #")}
                        className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-stone-200 dark:bg-neutral-700 text-gray-900 dark:text-white flex items-center gap-1.5 hover:bg-stone-300 cursor-pointer"
                        title="Click to copy ticket code"
                      >
                        <span>{ticket.ticketNumber}</span>
                        <DocumentDuplicateIcon className="size-3 text-gray-500" />
                      </button>

                      <span className="font-bold text-xs text-orange-600 dark:text-orange-400">
                        Order #{ticket.orderNumber}
                      </span>

                      <span className="text-[11px] text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
                        {new Date(ticket.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* Request Type Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-200/90 dark:bg-neutral-700 text-stone-800 dark:text-neutral-200">
                        {ticket.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                          ticket.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                            : ticket.status === "approved"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                            : ticket.status === "pickup_scheduled"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300"
                            : ticket.status === "received_at_hub"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300"
                            : ticket.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                        }`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Body Details: Customer, Item & Action, Pickup Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Customer Details</span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {ticket.customerName}
                      </p>
                      <a
                        href={`tel:${ticket.customerPhone.replace(/[^0-9]/g, "")}`}
                        className="text-orange-600 dark:text-orange-400 font-mono hover:underline block"
                      >
                        {ticket.customerPhone}
                      </a>
                      {ticket.customerEmail && (
                        <span className="text-gray-400 block text-[11px]">{ticket.customerEmail}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Item &amp; Target</span>
                      <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                        {ticket.itemDetails}
                      </p>
                      {ticket.requestedReplacement && (
                        <p className="text-orange-600 dark:text-orange-400 font-bold mt-1">
                          Swap To: {ticket.requestedReplacement}
                        </p>
                      )}
                      {ticket.refundMethod && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                          Refund: {ticket.refundMethod} ({ticket.refundAccountDetails})
                          {ticket.refundAmount ? ` • ৳${ticket.refundAmount}` : ""}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px] font-semibold">Reverse Pickup Location</span>
                      <p className="text-gray-800 dark:text-neutral-200 mt-0.5">
                        {ticket.pickupAddress}
                      </p>
                      <span className="inline-block mt-1 font-mono text-[10px] font-bold text-gray-500 uppercase">
                        {ticket.zone === "inside_dhaka" ? "Zone: Inside Dhaka (৳60)" : "Zone: Outside Dhaka (৳120)"}
                      </span>
                    </div>
                  </div>

                  {/* Operational Tracking Badges (if assigned) */}
                  {(ticket.reverseTrackingNumber || ticket.replacementTrackingNumber || ticket.inspectionResult) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/50 dark:border-neutral-700/50 text-[11px]">
                      {ticket.reverseTrackingNumber && (
                        <span className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                          Reverse Pickup Trk: <strong>{ticket.reverseTrackingNumber}</strong>
                        </span>
                      )}
                      {ticket.replacementTrackingNumber && (
                        <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                          Replacement Outbound Trk: <strong>{ticket.replacementTrackingNumber}</strong>
                        </span>
                      )}
                      {ticket.inspectionResult && (
                        <span
                          className={`px-2 py-1 rounded border font-semibold ${
                            ticket.inspectionResult === "passed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : ticket.inspectionResult === "pending"
                              ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-neutral-400"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          Audit: {ticket.inspectionResult.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Customer Reason & Admin Notes */}
                  <div className="text-xs text-gray-600 dark:text-neutral-400 bg-stone-100/70 dark:bg-neutral-800/60 p-3 rounded-xl space-y-1">
                    <p>
                      <strong className="text-gray-800 dark:text-neutral-200">Customer Reason:</strong>{" "}
                      &quot;{ticket.reason}&quot;
                    </p>
                    {ticket.adminNotes && (
                      <p className="text-orange-700 dark:text-orange-300 text-[11px]">
                        <strong>Internal Admin Notes:</strong> {ticket.adminNotes}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/60 dark:border-neutral-700/60">
                    <div className="flex items-center gap-2">
                      {/* Manage / Update Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ticket)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition cursor-pointer"
                      >
                        Manage &amp; Update
                      </button>

                      {/* Print Thermal Reverse Consignment Sticker */}
                      <button
                        type="button"
                        onClick={() => handleOpenSticker(ticket)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:text-orange-600 hover:border-orange-500 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Print Thermal Reverse Pickup & Inspection Slip"
                      >
                        <PrinterIcon className="size-3.5" />
                        <span>Print Sticker</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* WhatsApp Customer */}
                      <a
                        href={`https://wa.me/${ticket.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                          ticket.customerName
                        )},%20this%20is%20Fedoll%20Apparel%20regarding%20your%20Return/Exchange%20Ticket%20${ticket.ticketNumber}%20(Order%20${ticket.orderNumber}).`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <ChatBubbleLeftRightIcon className="size-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(ticket)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Delete ticket"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          VIEW 2: STORE POLICY & SLA RULES
          ====================================================================== */}
      {activeSubTab === "policy" && (
        <form onSubmit={handleSavePolicy} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheckIcon className="size-5 text-orange-600" />
                  <span>Storewide Return Policy, Courier Fees &amp; SLA Rules</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  These settings define customer exchange eligibility and automatically sync across the public storefront.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingPolicy}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingPolicy ? (
                  <>
                    <Spinner className="size-4 text-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    <span>Save Policy Changes</span>
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
                value={policyForm.noticeBanner || ""}
                onChange={(e) => setPolicyForm({ ...policyForm, noticeBanner: e.target.value })}
                className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                placeholder="e.g. Complimentary Doorstep Size Exchange across Dhaka and all 64 districts in Bangladesh."
              />
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Return / Exchange Window (Days)
                </label>
                <input
                  type="number"
                  value={policyForm.returnWindowDays}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, returnWindowDays: Number(e.target.value) || 7 })
                  }
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Reverse Pickup (Inside Dhaka ৳)
                </label>
                <input
                  type="number"
                  value={policyForm.exchangeFeeInsideDhaka}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, exchangeFeeInsideDhaka: Number(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Reverse Pickup (Outside Dhaka ৳)
                </label>
                <input
                  type="number"
                  value={policyForm.exchangeFeeOutsideDhaka}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, exchangeFeeOutsideDhaka: Number(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Refund Processing SLA
                </label>
                <input
                  type="text"
                  value={policyForm.refundProcessingDays}
                  onChange={(e) => setPolicyForm({ ...policyForm, refundProcessingDays: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  placeholder="3 - 5 business days"
                />
              </div>
            </div>

            {/* Contact & Hub Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Returns Support Hotline
                </label>
                <input
                  type="text"
                  value={policyForm.supportHotline}
                  onChange={(e) => setPolicyForm({ ...policyForm, supportHotline: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  WhatsApp Support Helpline
                </label>
                <input
                  type="text"
                  value={policyForm.supportWhatsApp}
                  onChange={(e) => setPolicyForm({ ...policyForm, supportWhatsApp: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Returns Department Email
                </label>
                <input
                  type="email"
                  value={policyForm.supportEmail}
                  onChange={(e) => setPolicyForm({ ...policyForm, supportEmail: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                />
              </div>
            </div>

            {/* Hub Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                Atelier Hub Address (Walk-ins &amp; Reverse Courier Destination)
              </label>
              <input
                type="text"
                value={policyForm.hubAddress}
                onChange={(e) => setPolicyForm({ ...policyForm, hubAddress: e.target.value })}
                className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
              />
            </div>

            {/* Non-Returnable Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                  Non-Returnable Exceptions &amp; Hygiene Standards
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPolicyForm({
                      ...policyForm,
                      nonReturnableItems: [...policyForm.nonReturnableItems, "New exception guideline"],
                    })
                  }
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
              <div className="space-y-2">
                {policyForm.nonReturnableItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...policyForm.nonReturnableItems];
                        updated[idx] = e.target.value;
                        setPolicyForm({ ...policyForm, nonReturnableItems: updated });
                      }}
                      className="flex-1 text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = policyForm.nonReturnableItems.filter((_, i) => i !== idx);
                        setPolicyForm({ ...policyForm, nonReturnableItems: updated });
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Clauses */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Policy Clauses (Rendered on Public Storefront)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Add, edit, or adjust wording and consumer safeguards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newClause: LegalClause = {
                      id: `clause_${Date.now()}`,
                      title: "New Policy Clause",
                      content: "Clause description and customer instructions.",
                      bulletPoints: ["Key operational guideline."],
                    };
                    setPolicyForm({ ...policyForm, clauses: [...policyForm.clauses, newClause] });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 text-gray-800 dark:text-neutral-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <PlusIcon className="size-3.5 text-orange-600" />
                  <span>Add Section</span>
                </button>
              </div>

              <div className="space-y-4">
                {policyForm.clauses.map((clause, index) => (
                  <div
                    key={clause.id}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-neutral-800/50 border border-stone-200/80 dark:border-neutral-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={clause.title}
                        onChange={(e) => {
                          const updated = [...policyForm.clauses];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setPolicyForm({ ...policyForm, clauses: updated });
                        }}
                        className="flex-1 font-bold text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = policyForm.clauses.filter((c) => c.id !== clause.id);
                          setPolicyForm({ ...policyForm, clauses: updated });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={clause.content}
                      onChange={(e) => {
                        const updated = [...policyForm.clauses];
                        updated[index] = { ...updated[index], content: e.target.value };
                        setPolicyForm({ ...policyForm, clauses: updated });
                      }}
                      className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                    />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        Bullet Points (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={(clause.bulletPoints || []).join("\n")}
                        onChange={(e) => {
                          const updated = [...policyForm.clauses];
                          updated[index] = {
                            ...updated[index],
                            bulletPoints: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                          };
                          setPolicyForm({ ...policyForm, clauses: updated });
                        }}
                        className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="submit"
                disabled={savingPolicy}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingPolicy ? (
                  <>
                    <Spinner className="size-4 text-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    <span>Save Policy Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================================
          MODAL 1: MANAGE / EDIT TICKET MODAL
          ====================================================================== */}
      <Transition appear show={!!selectedTicket} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedTicket(null)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                  {selectedTicket && (
                    <form onSubmit={handleSaveTicketUpdates} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                              {selectedTicket.ticketNumber}
                            </span>
                            <span className="text-xs text-gray-500 font-bold">
                              Order #{selectedTicket.orderNumber}
                            </span>
                          </div>
                          <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                            Manage Return &amp; Exchange Logistics
                          </DialogTitle>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(null)}
                          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                        >
                          <XMarkIcon className="size-5" />
                        </button>
                      </div>

                      {/* Customer & Request Overview Box */}
                      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 font-semibold block text-[11px]">Customer</span>
                          <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                            {selectedTicket.customerName}
                          </span>
                          <span className="text-gray-600 dark:text-neutral-300 block">
                            {selectedTicket.customerPhone}
                          </span>
                          <span className="text-gray-500 block mt-1">
                            Pickup: {selectedTicket.pickupAddress}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-semibold block text-[11px]">Current Item</span>
                          <span className="font-medium text-gray-800 dark:text-neutral-200 block mt-0.5">
                            {selectedTicket.itemDetails}
                          </span>
                          <span className="text-gray-500 block mt-1 italic">
                            &quot;{selectedTicket.reason}&quot;
                          </span>
                        </div>
                      </div>

                      {/* Operational Inputs */}
                      <div className="space-y-4">
                        {/* Status Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                            Logistics Status *
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) =>
                              setEditStatus(e.target.value as ReturnExchangeRequest["status"])
                            }
                            className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold cursor-pointer"
                          >
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="pickup_scheduled">Reverse Pickup Scheduled</option>
                            <option value="received_at_hub">Received at Dhaka Hub (Quality Audit)</option>
                            <option value="resolved">Resolved (Replacement Dispatched / Refund Settled)</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Reverse Courier Assignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                              Reverse Courier Partner
                            </label>
                            <input
                              type="text"
                              value={editReverseCourier}
                              onChange={(e) => setEditReverseCourier(e.target.value)}
                              placeholder="Steadfast Courier / Pathao Express"
                              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                              Reverse Pickup Consignment #
                            </label>
                            <input
                              type="text"
                              value={editReverseTracking}
                              onChange={(e) => setEditReverseTracking(e.target.value)}
                              placeholder="e.g., REV-STF-994821"
                              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                            />
                          </div>
                        </div>

                        {/* Quality Audit Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                              Atelier Quality Audit Result
                            </label>
                            <select
                              value={editInspectionResult}
                              onChange={(e) =>
                                setEditInspectionResult(
                                  e.target.value as NonNullable<ReturnExchangeRequest["inspectionResult"]>
                                )
                              }
                              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 cursor-pointer"
                            >
                              <option value="pending">Pending Inspection</option>
                              <option value="passed">Passed (Tags Intact &amp; Brand New)</option>
                              <option value="failed_damaged">Failed (Damaged / Stained / Washed)</option>
                              <option value="failed_tags_missing">Failed (Tags Cut / Missing)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                              Outbound Replacement Tracking #
                            </label>
                            <input
                              type="text"
                              value={editReplacementTracking}
                              onChange={(e) => setEditReplacementTracking(e.target.value)}
                              placeholder="e.g., STF-884912"
                              className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                            />
                          </div>
                        </div>

                        {/* If Refund Request */}
                        {selectedTicket.type === "refund" && (
                          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                Refund Disbursed Amount (৳)
                              </label>
                              <input
                                type="number"
                                value={editRefundAmount}
                                onChange={(e) =>
                                  setEditRefundAmount(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                placeholder="Amount in BDT (৳)"
                                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                                bKash / Bank TrxID
                              </label>
                              <input
                                type="text"
                                value={editRefundTrxId}
                                onChange={(e) => setEditRefundTrxId(e.target.value)}
                                placeholder="e.g. BL9948210"
                                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {/* Internal Admin Notes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                            Internal Admin / Tailor Remarks
                          </label>
                          <textarea
                            rows={2}
                            value={editAdminNotes}
                            onChange={(e) => setEditAdminNotes(e.target.value)}
                            placeholder="Add notes about customer calls, garment quality, or courier dispatch..."
                            className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                          />
                        </div>

                        {/* WhatsApp Notification Quick Shortcuts */}
                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                            Quick WhatsApp Customer Status Updates:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <a
                              href={`https://wa.me/${selectedTicket.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                                selectedTicket.customerName
                              )},%20your%20Fedoll%20Return%20Ticket%20${selectedTicket.ticketNumber}%20has%20been%20APPROVED.%20Our%20reverse%20courier%20rider%20will%20collect%20the%20package%20from%20your%20doorstep.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                            >
                              Send &quot;Approved&quot;
                            </a>
                            <a
                              href={`https://wa.me/${selectedTicket.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                                selectedTicket.customerName
                              )},%20we%20have%20received%20your%20return%20parcel%20at%20our%20Uttara%20atelier.%20Quality%20inspection%20has%20PASSED.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                            >
                              Send &quot;At Hub / Passed&quot;
                            </a>
                            <a
                              href={`https://wa.me/${selectedTicket.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                                selectedTicket.customerName
                              )},%20your%20fresh%20replacement%20garment%20has%20been%20dispatched!%20Tracking%20number:%20${editReplacementTracking || "Dispatched"}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                            >
                              Send &quot;Dispatched&quot;
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(null)}
                          className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <>
                              <Spinner className="size-4 text-white animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckIcon className="size-4" />
                              <span>Save Ticket Updates</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ======================================================================
          MODAL 2: MANUAL RETURN TICKET CREATION (Admin Logging on Phone/WhatsApp)
          ====================================================================== */}
      <Transition appear show={isCreateOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800 pb-4">
                    <div>
                      <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                        Log Manual Return / Exchange Ticket
                      </DialogTitle>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Create a ticket on behalf of a customer calling over hotline or messaging WhatsApp.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateManualTicket} className="space-y-4 text-xs">
                    {/* Order Auto-Fill */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Order Number *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={manualForm.orderNumber}
                          onChange={(e) => setManualForm({ ...manualForm, orderNumber: e.target.value })}
                          placeholder="e.g. FED-1001"
                          className="flex-1 p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono uppercase"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleAutoFillManualOrder}
                          className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold transition shrink-0 cursor-pointer"
                        >
                          Fetch Order Info
                        </button>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Customer Name *</label>
                        <input
                          type="text"
                          value={manualForm.customerName}
                          onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Phone Number *</label>
                        <input
                          type="tel"
                          value={manualForm.customerPhone}
                          onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Email (Optional)</label>
                        <input
                          type="email"
                          value={manualForm.customerEmail}
                          onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        />
                      </div>
                    </div>

                    {/* Action Type & Initial Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Request Type</label>
                        <select
                          value={manualForm.type}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              type: e.target.value as ReturnExchangeRequest["type"],
                            })
                          }
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 cursor-pointer"
                        >
                          <option value="size_exchange">Size Exchange</option>
                          <option value="color_style_exchange">Style / Color Swap</option>
                          <option value="defective_replacement">Defective Item (100% Free)</option>
                          <option value="refund">Monetary Refund</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Initial Status</label>
                        <select
                          value={manualForm.status}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              status: e.target.value as ReturnExchangeRequest["status"],
                            })
                          }
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 cursor-pointer font-bold"
                        >
                          <option value="approved">Approved (Ready for Pickup)</option>
                          <option value="pending">Pending Review</option>
                          <option value="pickup_scheduled">Pickup Scheduled</option>
                          <option value="received_at_hub">Received at Hub</option>
                        </select>
                      </div>
                    </div>

                    {/* Garment Details & Target */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">Item to Return *</label>
                        <input
                          type="text"
                          value={manualForm.itemDetails}
                          onChange={(e) => setManualForm({ ...manualForm, itemDetails: e.target.value })}
                          placeholder="e.g. Raw Selvedge Denim, Size 32"
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">
                          {manualForm.type === "refund" ? "Refund Account Details" : "Desired Replacement Size/Item"}
                        </label>
                        <input
                          type="text"
                          value={
                            manualForm.type === "refund"
                              ? manualForm.refundAccountDetails
                              : manualForm.requestedReplacement
                          }
                          onChange={(e) =>
                            manualForm.type === "refund"
                              ? setManualForm({ ...manualForm, refundAccountDetails: e.target.value })
                              : setManualForm({ ...manualForm, requestedReplacement: e.target.value })
                          }
                          placeholder={
                            manualForm.type === "refund"
                              ? "bKash / Nagad 017XXXXXXXX"
                              : "e.g. Size 34 (same wash)"
                          }
                          className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        />
                      </div>
                    </div>

                    {/* Pickup Address & Zone */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">
                          Reverse Pickup Address *
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="manualZone"
                              checked={manualForm.zone === "inside_dhaka"}
                              onChange={() => setManualForm({ ...manualForm, zone: "inside_dhaka" })}
                            />
                            <span>Inside Dhaka (৳{policyForm.exchangeFeeInsideDhaka})</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="manualZone"
                              checked={manualForm.zone === "outside_dhaka"}
                              onChange={() => setManualForm({ ...manualForm, zone: "outside_dhaka" })}
                            />
                            <span>Outside Dhaka (৳{policyForm.exchangeFeeOutsideDhaka})</span>
                          </label>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={manualForm.pickupAddress}
                        onChange={(e) => setManualForm({ ...manualForm, pickupAddress: e.target.value })}
                        placeholder="Street, Area, District"
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        required
                      />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold hover:bg-stone-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCreating ? (
                          <>
                            <Spinner className="size-4 text-white animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <PlusIcon className="size-4" />
                            <span>Generate &amp; Save Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ======================================================================
          MODAL 3: PRINTABLE THERMAL REVERSE CONSIGNMENT & INSPECTION SLIP
          ====================================================================== */}
      <Transition appear show={isStickerOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsStickerOpen(false)}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs print:hidden" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto print:p-0">
            <div className="flex min-h-full items-center justify-center p-4 print:p-0">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none">
                  {stickerTicket && (
                    <div className="space-y-6">
                      {/* Non-print controls */}
                      <div className="flex items-center justify-between print:hidden border-b border-stone-200 dark:border-neutral-800 pb-3">
                        <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                          <PrinterIcon className="size-5 text-orange-600" />
                          <span>Thermal Reverse Pickup &amp; Quality Audit Slip</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePrintSticker}
                            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <PrinterIcon className="size-4" />
                            <span>Print Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsStickerOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                          >
                            <XMarkIcon className="size-5" />
                          </button>
                        </div>
                      </div>

                      {/* The Thermal Sticker Document */}
                      <div className="bg-white text-black p-6 rounded-2xl border-2 border-black space-y-4 font-sans text-xs print:p-3 print:border-2 print:border-black print:rounded-none print:w-[380px] print:mx-auto">
                        {/* Sticker Header */}
                        <div className="flex items-center justify-between border-b-2 border-black pb-2">
                          <div>
                            <span className="font-black text-lg tracking-wider block">FEDOLL</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-700 block">
                              Reverse Logistics &amp; Atelier Hub
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 border border-black font-black text-[10px] uppercase">
                              {stickerTicket.type.replace(/_/g, " ")}
                            </span>
                            <span className="block text-[10px] text-gray-600 mt-0.5">
                              Zone: {stickerTicket.zone === "inside_dhaka" ? "DHAKA HUB" : "NATIONWIDE"}
                            </span>
                          </div>
                        </div>

                        {/* Barcode Vector (Ticket #) */}
                        <div className="text-center py-1 border-b-2 border-black">
                          {(() => {
                            const barcode = generateCode128SvgBars(stickerTicket.ticketNumber);
                            return (
                              <div className="flex flex-col items-center">
                                <svg
                                  viewBox={`0 0 ${barcode.totalWidth} 40`}
                                  className="h-10 w-full max-w-[260px]"
                                  preserveAspectRatio="none"
                                >
                                  {barcode.bars.map((bar, idx) => (
                                    <rect
                                      key={idx}
                                      x={bar.x}
                                      y="0"
                                      width={bar.width}
                                      height="40"
                                      fill="black"
                                    />
                                  ))}
                                </svg>
                                <span className="font-mono text-xs font-black tracking-widest mt-1">
                                  {stickerTicket.ticketNumber}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Routing Addresses */}
                        <div className="grid grid-cols-2 gap-3 border-b-2 border-black pb-3 text-[11px]">
                          <div>
                            <span className="font-black uppercase text-[10px] block text-gray-600">
                              PICKUP FROM (CUSTOMER):
                            </span>
                            <p className="font-bold text-xs">{stickerTicket.customerName}</p>
                            <p className="font-mono text-xs">{stickerTicket.customerPhone}</p>
                            <p className="text-[10px] mt-0.5">{stickerTicket.pickupAddress}</p>
                          </div>
                          <div className="border-l border-gray-400 pl-3">
                            <span className="font-black uppercase text-[10px] block text-gray-600">
                              RETURN TO (ATELIER HUB):
                            </span>
                            <p className="font-bold text-xs">Fedoll Inspection Desk</p>
                            <p className="text-[10px] mt-0.5 leading-tight">
                              House 14, Road 7, Sector 3, Uttara Model Town, Dhaka 1230
                            </p>
                            <p className="font-mono text-[10px]">Hotline: {policyForm.supportHotline}</p>
                          </div>
                        </div>

                        {/* Garment & Swap Instructions */}
                        <div className="border-b-2 border-black pb-3 text-[11px] space-y-1">
                          <p>
                            <strong>Order Reference:</strong> #{stickerTicket.orderNumber}
                          </p>
                          <p>
                            <strong>Item in Consignment:</strong> {stickerTicket.itemDetails}
                          </p>
                          {stickerTicket.requestedReplacement && (
                            <p className="font-bold text-black">
                              Target Replacement: {stickerTicket.requestedReplacement}
                            </p>
                          )}
                          {stickerTicket.refundMethod && (
                            <p className="font-bold text-black">
                              Refund Gateway: {stickerTicket.refundMethod} ({stickerTicket.refundAccountDetails})
                            </p>
                          )}
                          <p className="text-[10px] text-gray-700 italic">
                            Reason: &quot;{stickerTicket.reason}&quot;
                          </p>
                        </div>

                        {/* Quality Audit Checklist for Tailor */}
                        <div className="space-y-1.5 text-[10px] pt-1">
                          <span className="font-black uppercase tracking-wider block">
                            ATELIER HUB QUALITY AUDIT CHECKLIST:
                          </span>
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <label className="flex items-center gap-1.5">
                              <span className="size-3 border border-black inline-block" />
                              <span>Original Tags &amp; Barcode Intact</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <span className="size-3 border border-black inline-block" />
                              <span>Unworn &amp; Unwashed Condition</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <span className="size-3 border border-black inline-block" />
                              <span>No Scents / Wash Detergents</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <span className="size-3 border border-black inline-block" />
                              <span>Replacement Dispatched / Approved</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-400 text-[10px]">
                          <span>Inspector: ____________________</span>
                          <span>Sign &amp; Date: ____________________</span>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminReturnsTab;
