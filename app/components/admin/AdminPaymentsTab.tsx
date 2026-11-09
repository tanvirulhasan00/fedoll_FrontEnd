import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCardIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  BanknotesIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  XCircleIcon,
  XMarkIcon,
  PrinterIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import {
  fetchPaymentSettings,
  savePaymentSettings,
  defaultBkashSandboxCredentials,
  type PaymentGatewaySettings,
  type BkashSettings,
} from "~/firebase/paymentSettings";
import {
  fetchPaymentsFromFirestore,
  subscribeToPayments,
  updatePaymentRecordStatus,
  syncPaymentsFromOrders,
  formatPaymentTimestamp,
  type PaymentRecord,
  type PaymentRecordStatus,
} from "~/firebase/payments";
import type { Order } from "~/firebase/orders";
import { Spinner } from "~/components/ui/spinner";

interface AdminPaymentsTabProps {
  orders?: Order[];
  onRefresh?: () => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({ orders = [], onRefresh }) => {
  // Navigation Sub-tab: "transactions" (table) vs "gateways" (bKash config)
  const [activeSubTab, setActiveSubTab] = useState<"transactions" | "gateways">("transactions");

  // Gateway Settings State
  const [settings, setSettings] = useState<PaymentGatewaySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testing, setTesting] = useState(false);

  // Masked field toggles
  const [showSecret, setShowSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Test Connection result
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  // Payments Table State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentRecordStatus>("all");
  const [gatewayFilter, setGatewayFilter] = useState<"all" | "bkash" | "cod">("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load gateway settings
  useEffect(() => {
    let mounted = true;
    fetchPaymentSettings().then((res) => {
      if (mounted) {
        setSettings(res);
        setLoadingSettings(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to payments real-time from Firestore 'payments' table
  useEffect(() => {
    setLoadingPayments(true);
    const unsubscribe = subscribeToPayments((list) => {
      setPayments(list);
      setLoadingPayments(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-sync historical orders if payments collection has fewer records than existing orders
  useEffect(() => {
    if (orders && orders.length > 0 && payments.length === 0 && !loadingPayments) {
      syncPaymentsFromOrders(orders).then((synced) => {
        if (synced > 0) {
          fetchPaymentsFromFirestore().then((refreshed) => setPayments(refreshed));
        }
      });
    }
  }, [orders, payments.length, loadingPayments]);

  // Manual trigger to backfill any unsynced orders into payments table
  const handleSyncOrders = async () => {
    if (!orders || orders.length === 0) {
      toast.info("No orders available to sync.");
      return;
    }
    setSyncingOrders(true);
    try {
      const synced = await syncPaymentsFromOrders(orders);
      const refreshed = await fetchPaymentsFromFirestore();
      setPayments(refreshed);
      if (synced > 0) {
        toast.success(`🎉 Synced ${synced} order payments into the payment ledger!`);
      } else {
        toast.info("All orders are already recorded in the payment ledger.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to sync orders.");
    } finally {
      setSyncingOrders(false);
    }
  };

  // Gateway Settings Handlers
  const handleToggleBkash = (enabled: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bkash: {
        ...settings.bkash,
        enabled,
      },
    });
  };

  const handleToggleMode = (isSandbox: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bkash: {
        ...settings.bkash,
        isSandbox,
      },
    });
    setTestResult({ status: "idle", message: "" });
  };

  const handleBkashChange = (field: keyof BkashSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bkash: {
        ...settings.bkash,
        [field]: value,
      },
    });
  };

  const handleRestoreSandbox = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      bkash: {
        ...defaultBkashSandboxCredentials,
        enabled: true,
      },
    });
    setTestResult({
      status: "idle",
      message: "Restored official bKash developer sandbox credentials.",
    });
    toast.info("Restored official bKash developer sandbox credentials.");
  };

  const handleTestConnection = async () => {
    if (!settings) return;
    const bkash = settings.bkash;

    if (!bkash.appKey || !bkash.appSecret || !bkash.username || !bkash.password) {
      toast.error("Please fill in App Key, App Secret, Username, and Password before testing.");
      return;
    }

    setTesting(true);
    setTestResult({ status: "idle", message: "" });

    try {
      const res = await fetch("/api/bkash/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: bkash }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResult({
          status: "success",
          message: data.message || "Connected to bKash API successfully! Token granted.",
        });
        toast.success(`🎉 bKash ${bkash.isSandbox ? "Sandbox" : "Live"} connection verified!`);
      } else {
        setTestResult({
          status: "error",
          message: data.message || "Failed to authenticate with bKash API.",
        });
        toast.error(data.message || "bKash connection rejected.");
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err?.message || "Network error while connecting to bKash API.",
      });
      toast.error("Network error while connecting to bKash API.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSavingSettings(true);
    try {
      await savePaymentSettings(settings);
      toast.success(
        `Payment settings saved! bKash is configured in ${
          settings.bkash.isSandbox ? "Sandbox (Testing)" : "Live (Production)"
        } mode.`
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save payment settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Payment Status Update inside Modal
  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: PaymentRecordStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updatePaymentRecordStatus(paymentId, newStatus);
      toast.success(`Payment status marked as "${newStatus}".`);
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
      );
      if (selectedPayment && selectedPayment.id === paymentId) {
        setSelectedPayment({ ...selectedPayment, status: newStatus });
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter & Search Logic
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      // Gateway filter
      if (gatewayFilter !== "all" && item.gateway !== gatewayFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const customerName = item.customer?.name?.toLowerCase() || "";
        const customerPhone = item.customer?.phone?.toLowerCase() || "";
        const customerEmail = item.customer?.email?.toLowerCase() || "";
        const customerMsisdn = item.customer?.customerMsisdn?.toLowerCase() || "";
        const orderNum = item.orderNumber?.toLowerCase() || "";
        const trx = item.trxId?.toLowerCase() || "";
        const payId = item.paymentId?.toLowerCase() || "";

        return (
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          customerEmail.includes(q) ||
          customerMsisdn.includes(q) ||
          orderNum.includes(q) ||
          trx.includes(q) ||
          payId.includes(q)
        );
      }
      return true;
    });
  }, [payments, statusFilter, gatewayFilter, searchQuery]);

  // Statistics
  const metrics = useMemo(() => {
    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const totalCompletedRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const bkashCompleted = completedPayments.filter((p) => p.gateway === "bkash");
    const bkashRevenue = bkashCompleted.reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayments = payments.filter((p) => p.status === "PENDING");
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const failedPayments = payments.filter(
      (p) => p.status === "FAILED" || p.status === "CANCELLED"
    );

    return {
      totalCount: payments.length,
      completedCount: completedPayments.length,
      totalCompletedRevenue,
      bkashCount: bkashCompleted.length,
      bkashRevenue,
      pendingCount: pendingPayments.length,
      pendingRevenue,
      failedCount: failedPayments.length,
    };
  }, [payments]);

  const formatDate = (val?: any) => {
    return formatPaymentTimestamp(val, "Just now");
  };

  if (loadingSettings || !settings) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner className="size-8 mx-auto text-orange-600" />
        <p className="text-xs text-stone-500 font-medium">Loading payment configurations and transactions...</p>
      </div>
    );
  }

  const { bkash, cod } = settings;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-pink-950 text-white shadow-xl border border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider mb-3 border border-pink-500/30">
            <CreditCardIcon className="size-4 text-pink-400" />
            <span>Official Bangladesh Payment Gateway &amp; Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Payment Management &amp; Customer Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
            Monitor verified online customer transactions, bKash TrxID receipts, and Cash on Delivery settlements. Switch between the <strong>Payment Transactions Ledger</strong> and <strong>Gateway Settings</strong> below.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold ${
                bkash.isSandbox
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  bkash.isSandbox ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {bkash.isSandbox ? "bKash Sandbox (Testing)" : "bKash Live Production"}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-stone-300 font-medium">
              Recorded Transactions: <strong>{payments.length}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSyncOrders}
            disabled={syncingOrders}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600/90 hover:bg-pink-600 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            title="Scan orders and populate missing entries into payments table"
          >
            {syncingOrders ? <Spinner className="size-4 text-white" /> : <ArrowPathIcon className="size-4" />}
            <span>Sync Orders with Ledger</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreSandbox}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
            title="Reset to working developer sandbox keys"
          >
            <SparklesIcon className="size-4 text-amber-400" />
            <span>Reset Sandbox Keys</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "transactions"
              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
              : "text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <CreditCardIcon className="size-4" />
          <span>Payment Transactions Ledger</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === "transactions"
                ? "bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-900"
                : "bg-stone-200 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300"
            }`}
          >
            {payments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("gateways")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === "gateways"
              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
              : "text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheckIcon className="size-4" />
          <span>Gateway Settings (bKash &amp; COD)</span>
        </button>
      </div>

      {/* VIEW 1: TRANSACTIONS TABLE */}
      {activeSubTab === "transactions" && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Revenue Paid</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <BanknotesIcon className="size-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                ৳ {metrics.totalCompletedRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {metrics.completedCount} successful transactions
              </p>
            </div>

            {/* bKash Collected */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">bKash PGW Online</span>
                <span className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-[#E2136E]">
                  <CreditCardIcon className="size-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-[#E2136E]">
                ৳ {metrics.bkashRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#E2136E] font-medium">
                {metrics.bkashCount} tokenized bKash payments
              </p>
            </div>

            {/* Pending Payments */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Pending (COD / Unpaid)</span>
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <ClockIcon className="size-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-600">
                ৳ {metrics.pendingRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-amber-600 font-medium">
                {metrics.pendingCount} orders pending cash collection
              </p>
            </div>

            {/* Failed / Cancelled */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Failed / Cancelled</span>
                <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <XCircleIcon className="size-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-600">
                {metrics.failedCount}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                Customer abandoned or declined payments
              </p>
            </div>
          </div>

          {/* Toolbar: Filters and Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { key: "all", label: "All Transactions", count: payments.length },
                { key: "COMPLETED", label: "Completed", count: metrics.completedCount },
                { key: "PENDING", label: "Pending", count: metrics.pendingCount },
                { key: "FAILED", label: "Failed / Cancelled", count: metrics.failedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.key
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                      : "bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-300 dark:bg-neutral-700 text-[10px] font-bold text-gray-800 dark:text-white">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Gateway Filter & Search Bar */}
            <div className="flex items-center gap-3">
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
              >
                <option value="all">All Gateways</option>
                <option value="bkash">bKash Online Only</option>
                <option value="cod">Cash on Delivery</option>
              </select>

              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, phone, TrxID, order #..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                />
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
                <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Transaction / TrxID</th>
                    <th className="py-3 px-4">Order Reference</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Method &amp; Gateway</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {loadingPayments ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Spinner className="size-6 mx-auto text-orange-600 mb-2" />
                        <span className="text-xs text-stone-500">Loading payment ledger entries...</span>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-400">
                        <CreditCardIcon className="size-10 mx-auto text-stone-300 dark:text-neutral-700 mb-2" />
                        <p className="font-medium text-xs">No payment records found matching criteria.</p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          Click &quot;Sync Orders with Ledger&quot; above to import existing orders into the table.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((item) => {
                      const isBkash = item.gateway === "bkash";
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-stone-50/80 dark:hover:bg-neutral-800/40 transition"
                        >
                          {/* TrxID / Payment ID */}
                          <td className="py-3 px-4 font-mono">
                            {item.trxId ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 dark:text-white bg-stone-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-neutral-700">
                                  {item.trxId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.trxId!, "TrxID")}
                                  className="text-stone-400 hover:text-stone-700 dark:hover:text-white"
                                  title="Copy TrxID"
                                >
                                  <DocumentDuplicateIcon className="size-3.5" />
                                </button>
                              </div>
                            ) : item.paymentId ? (
                              <div className="text-[11px] text-stone-500 max-w-[130px] truncate" title={item.paymentId}>
                                ID: {item.paymentId}
                              </div>
                            ) : (
                              <span className="text-stone-400 italic text-[11px]">COD Ref</span>
                            )}
                            {item.isSandbox && (
                              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                Sandbox
                              </span>
                            )}
                          </td>

                          {/* Order Number */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              #{item.orderNumber}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {item.itemsCount || 1} item(s)
                            </span>
                          </td>

                          {/* Customer Details */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <UserIcon className="size-3 text-stone-400 shrink-0" />
                                <span>{item.customer?.name || "Customer"}</span>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-400">
                                <PhoneIcon className="size-3 text-stone-400 shrink-0" />
                                <a
                                  href={`tel:${item.customer?.phone}`}
                                  className="hover:underline font-mono"
                                >
                                  {item.customer?.phone || "No phone"}
                                </a>
                              </div>

                              {item.customer?.email && (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <EnvelopeIcon className="size-3 text-stone-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {item.customer?.email}
                                  </span>
                                </div>
                              )}

                              {/* bKash Wallet Number Pill */}
                              {item.customer?.customerMsisdn && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-[#E2136E] text-[10px] font-bold border border-pink-500/20 font-mono">
                                    <span>bKash:</span>
                                    <span>{item.customer.customerMsisdn}</span>
                                  </span>
                                </div>
                              )}

                              {item.customer?.city && (
                                <div className="text-[10px] text-stone-400 flex items-center gap-1">
                                  <MapPinIcon className="size-2.5 text-stone-400" />
                                  <span>{item.customer.city}{item.customer.district ? `, ${item.customer.district}` : ""}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Method & Gateway */}
                          <td className="py-3 px-4">
                            {isBkash ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E2136E]/10 text-[#E2136E] font-bold text-[11px] border border-[#E2136E]/20">
                                <CreditCardIcon className="size-3.5" />
                                <span>bKash Tokenized</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                <BanknotesIcon className="size-3.5" />
                                <span>Cash on Delivery</span>
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white text-sm">
                            ৳ {item.amount?.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {item.status === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                                <CheckCircleIcon className="size-3.5" />
                                <span>COMPLETED</span>
                              </span>
                            ) : item.status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                                <ClockIcon className="size-3.5" />
                                <span>PENDING</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                                <XCircleIcon className="size-3.5" />
                                <span>{item.status}</span>
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-[11px] text-gray-500 dark:text-neutral-400 whitespace-nowrap">
                            {formatDate(item.paymentExecuteTime || item.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPayment(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer"
                            >
                              <EyeIcon className="size-3.5" />
                              <span>View Info</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GATEWAY CONFIGURATION */}
      {activeSubTab === "gateways" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* bKash Gateway Configuration Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header & Main Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-neutral-800">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-[#E2136E]/10 border border-[#E2136E]/30 flex items-center justify-center shrink-0">
                  <span className="font-black text-[#E2136E] text-lg font-mono tracking-tighter">
                    bKash
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>bKash Tokenized Checkout</span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        bkash.enabled
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {bkash.enabled ? "Active on Checkout" : "Disabled"}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Accept instant wallet payments via bKash hosted checkout with automated TrxID verification.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bkash.enabled}
                  onChange={(e) => handleToggleBkash(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                <span className="ml-3 text-xs font-bold text-gray-900 dark:text-white">
                  {bkash.enabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>

            {/* Sandbox vs Live Mode Switcher */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200 dark:border-neutral-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-200 flex items-center gap-2">
                    <ShieldCheckIcon className="size-4 text-orange-600" />
                    <span>Gateway Environment / Mode</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Choose whether you are testing with bKash Developer Sandbox or accepting live customer money.
                  </p>
                </div>

                <div className="flex items-center p-1 rounded-xl bg-stone-200 dark:bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleToggleMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      bkash.isSandbox
                        ? "bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs"
                        : "text-stone-600 dark:text-neutral-400 hover:text-stone-900"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Sandbox (Test)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      !bkash.isSandbox
                        ? "bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "text-stone-600 dark:text-neutral-400 hover:text-stone-900"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Live (Production)</span>
                  </button>
                </div>
              </div>

              {/* Mode Description Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => handleToggleMode(true)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                    bkash.isSandbox
                      ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                      : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>Sandbox (Testing Mode)</span>
                    <span className="text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      tokenized.sandbox.bka.sh
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Uses bKash official test servers. Pre-configured with developer keys. Test transactions use simulated OTP and PIN.
                  </p>
                </div>

                <div
                  onClick={() => handleToggleMode(false)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                    !bkash.isSandbox
                      ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                      : "bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                    <span>Live (Production Mode)</span>
                    <span className="text-[10px] font-mono bg-emerald-200/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                      tokenized.pay.bka.sh
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Uses bKash production servers. Once you get your credentials from the bKash Merchant Portal, select this mode and paste your live credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Banner when Live is selected */}
            {!bkash.isSandbox && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <ExclamationTriangleIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Live Production Mode is selected</p>
                  <p className="text-[11px] mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                    Make sure you have replaced the sandbox test keys below with the official live credentials provided by your bKash Account Manager. Real money will be debited from customers&apos; bKash accounts.
                  </p>
                </div>
              </div>
            )}

            {/* Credentials Inputs Grid */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                <KeyIcon className="size-4 text-orange-600" />
                <span>bKash API Credentials ({bkash.isSandbox ? "Sandbox" : "Live"})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* App Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                    bKash App Key *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={bkash.appKey}
                      onChange={(e) => handleBkashChange("appKey", e.target.value.trim())}
                      placeholder="e.g. 4f6o0cjiki2rfm34kfdadl1eqq"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    {bkash.appKey && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bkash.appKey, "App Key")}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                        title="Copy App Key"
                      >
                        <DocumentDuplicateIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* App Secret */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                    bKash App Secret *
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      required
                      value={bkash.appSecret}
                      onChange={(e) => handleBkashChange("appSecret", e.target.value.trim())}
                      placeholder="Enter bKash App Secret"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                      title={showSecret ? "Hide secret" : "Show secret"}
                    >
                      {showSecret ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                    bKash API Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={bkash.username}
                    onChange={(e) => handleBkashChange("username", e.target.value.trim())}
                    placeholder="e.g. sandboxTokenizedUser02"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                    bKash API Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={bkash.password}
                      onChange={(e) => handleBkashChange("password", e.target.value.trim())}
                      placeholder="Enter bKash API Password"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Merchant Display Phone Number */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300">
                    bKash Merchant Contact Number (Display / Customer Support)
                  </label>
                  <input
                    type="text"
                    value={bkash.merchantNumber || ""}
                    onChange={(e) => handleBkashChange("merchantNumber", e.target.value.trim())}
                    placeholder="e.g. 01712-345678"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                    Shown to shoppers on payment receipt invoices as your registered merchant identity.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Result Banner */}
            <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500 dark:text-neutral-400">
                  Verify credential authenticity with bKash API servers prior to accepting customer orders.
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-bold text-gray-800 dark:text-neutral-200 transition cursor-pointer flex items-center gap-2"
                >
                  {testing ? <Spinner className="size-3.5 text-orange-600" /> : <SparklesIcon className="size-4 text-orange-600" />}
                  <span>{testing ? "Connecting to bKash..." : "Test bKash Connection"}</span>
                </button>
              </div>

              {testResult.status === "success" && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                  <CheckCircleIcon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Connection Verified Successfully</h4>
                    <p className="text-[11px] mt-0.5 text-emerald-800 dark:text-emerald-300">{testResult.message}</p>
                  </div>
                </div>
              )}

              {testResult.status === "error" && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
                  <ExclamationTriangleIcon className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Connection Test Failed</h4>
                    <p className="text-[11px] mt-0.5 text-red-800 dark:text-red-300">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Testing Cheatsheet Card */}
            {bkash.isSandbox && (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200 dark:border-neutral-700/60 space-y-3">
                <div className="flex items-center gap-2">
                  <InformationCircleIcon className="size-4 text-orange-600" />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    bKash Sandbox Developer Testing Cheatsheet
                  </h4>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
                  When testing checkout on your storefront in Sandbox mode, use these official bKash simulation credentials:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-stone-200 dark:border-neutral-700">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Test bKash Wallet</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">01770618575</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-stone-200 dark:border-neutral-700">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Simulation OTP</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">123456</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-stone-200 dark:border-neutral-700">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Simulation PIN</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">12121</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cash on Delivery (COD) Configuration Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                  <BanknotesIcon className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Cash on Delivery (COD)</span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        cod.enabled
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {cod.enabled ? "Active on Checkout" : "Disabled"}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Allow shoppers across Bangladesh to inspect their order and pay cash to the rider at their doorstep.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cod.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cod: { ...cod, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-gray-900 dark:text-white">
                  {cod.enabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>

          {/* Sticky Submit Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              {savingSettings ? <Spinner className="size-4 text-white" /> : <ShieldCheckIcon className="size-4" />}
              <span>{savingSettings ? "Saving Payment Settings..." : "Save Payment Settings"}</span>
            </button>
          </div>
        </form>
      )}

      {/* PAYMENT & CUSTOMER DETAILS MODAL */}
      <Transition appear show={!!selectedPayment} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedPayment(null)}>
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
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                  {selectedPayment && (
                    <>
                      {/* Modal Header */}
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-neutral-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Payment Receipt &amp; Verification
                            </span>
                            {selectedPayment.status === "COMPLETED" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                                PAID COMPLETED
                              </span>
                            ) : selectedPayment.status === "PENDING" ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                                PENDING PAYMENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                                {selectedPayment.status}
                              </span>
                            )}
                          </div>
                          <DialogTitle as="h3" className="text-xl font-black text-gray-900 dark:text-white mt-1">
                            Order #{selectedPayment.orderNumber}
                          </DialogTitle>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPayment(null)}
                          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <XMarkIcon className="size-5" />
                        </button>
                      </div>

                      {/* Main Modal Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Customer Information Card */}
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200 dark:border-neutral-700/60 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-200 flex items-center gap-2">
                            <UserIcon className="size-4 text-orange-600" />
                            <span>Customer Profile &amp; Contact</span>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Full Name</span>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {selectedPayment.customer?.name || "Customer"}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Phone Number</span>
                              <a
                                href={`tel:${selectedPayment.customer?.phone}`}
                                className="font-mono font-bold text-orange-600 hover:underline"
                              >
                                {selectedPayment.customer?.phone || "N/A"}
                              </a>
                            </div>

                            {selectedPayment.customer?.email && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                                <a
                                  href={`mailto:${selectedPayment.customer?.email}`}
                                  className="text-gray-700 dark:text-neutral-300 hover:underline"
                                >
                                  {selectedPayment.customer?.email}
                                </a>
                              </div>
                            )}

                            {/* Paying bKash Mobile Wallet */}
                            {selectedPayment.customer?.customerMsisdn && (
                              <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/60">
                                <span className="text-[10px] uppercase font-bold text-[#E2136E] block">
                                  Customer bKash Paying Wallet
                                </span>
                                <span className="font-mono font-bold text-[#E2136E] text-sm">
                                  {selectedPayment.customer.customerMsisdn}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Delivery Address</span>
                              <p className="text-stone-700 dark:text-neutral-300 leading-relaxed text-[11px]">
                                {selectedPayment.customer?.streetAddress
                                  ? `${selectedPayment.customer.streetAddress}, ${selectedPayment.customer.city || ""}, ${selectedPayment.customer.district || ""}`
                                  : "Standard delivery address on file"}
                              </p>
                            </div>

                            {selectedPayment.customer?.notes && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Delivery Notes</span>
                                <p className="text-[11px] text-stone-500 italic">
                                  &quot;{selectedPayment.customer.notes}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment & Gateway Verification Card */}
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200 dark:border-neutral-700/60 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-200 flex items-center gap-2">
                            <CreditCardIcon className="size-4 text-orange-600" />
                            <span>Payment &amp; Gateway Details</span>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Payment Method</span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {selectedPayment.methodTitle}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Amount</span>
                              <span className="font-black text-lg text-emerald-600">
                                ৳ {selectedPayment.amount?.toLocaleString()} {selectedPayment.currency}
                              </span>
                            </div>

                            {/* TrxID with copy */}
                            {selectedPayment.trxId && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">bKash TrxID</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono font-bold bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-neutral-700 text-gray-900 dark:text-white text-xs">
                                    {selectedPayment.trxId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(selectedPayment.trxId!, "TrxID")}
                                    className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-400 hover:text-stone-700"
                                    title="Copy TrxID"
                                  >
                                    <DocumentDuplicateIcon className="size-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {selectedPayment.paymentId && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block">bKash Payment ID</span>
                                <span className="font-mono text-[11px] text-stone-600 dark:text-neutral-400 break-all">
                                  {selectedPayment.paymentId}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Payment Timestamp</span>
                              <span className="text-[11px] text-gray-700 dark:text-neutral-300">
                                {formatDate(selectedPayment.paymentExecuteTime || selectedPayment.createdAt)}
                              </span>
                            </div>

                            {selectedPayment.failureReason && (
                              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px]">
                                <span className="font-bold block">Gateway Message:</span>
                                <span>{selectedPayment.failureReason}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer with Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-600 dark:text-neutral-400">
                            Change Status:
                          </label>
                          <select
                            disabled={isUpdatingStatus}
                            value={selectedPayment.status}
                            onChange={(e) =>
                              handleUpdatePaymentStatus(selectedPayment.id, e.target.value as PaymentRecordStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-white cursor-pointer focus:outline-none"
                          >
                            <option value="COMPLETED">COMPLETED (Paid)</option>
                            <option value="PENDING">PENDING</option>
                            <option value="FAILED">FAILED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedPayment.trxId && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedPayment.trxId!, "TrxID")}
                              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <DocumentDuplicateIcon className="size-4" />
                              <span>Copy TrxID</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <PrinterIcon className="size-4" />
                            <span>Print Slip</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPayment(null)}
                            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs transition cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
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

export default AdminPaymentsTab;
