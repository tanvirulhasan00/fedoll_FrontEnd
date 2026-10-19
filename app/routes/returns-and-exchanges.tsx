import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import {
  fetchReturnsExchanges,
  defaultReturnsExchanges,
  createReturnExchangeRequest,
  fetchReturnRequestByTicket,
  fetchOrderByTrackingOrNumber,
  type ReturnsExchangesData,
  type ReturnExchangeRequest,
} from "~/firebase";
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  TruckIcon,
  BanknotesIcon,
  ClockIcon,
  SparklesIcon,
  PrinterIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";

export function meta() {
  return [
    { title: "Returns & Exchanges Policy | Fedoll Apparel Atelier Bangladesh" },
    {
      name: "description",
      content:
        "7-day hassle-free doorstep size exchanges, complimentary defect replacements, and transparent refund processing across all 64 districts in Bangladesh.",
    },
  ];
}

type ActivePageTab = "policy" | "request" | "track";

export default function ReturnsAndExchangesPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ReturnsExchangesData>(defaultReturnsExchanges);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivePageTab>(
    (searchParams.get("tab") as ActivePageTab) || "policy"
  );

  // Form State for Return Request
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ReturnExchangeRequest | null>(null);
  const [orderQuery, setOrderQuery] = useState(searchParams.get("order") || "");
  const [verifyingOrder, setVerifyingOrder] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: searchParams.get("order") || "",
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
    reason: "Size is too small, need 1 size larger",
    additionalNotes: "",
  });

  // Tracking State
  const [trackQuery, setTrackQuery] = useState(searchParams.get("ticket") || "");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedRequest, setTrackedRequest] = useState<ReturnExchangeRequest | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Fetch policy on mount
  useEffect(() => {
    fetchReturnsExchanges()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Using default returns policy:", err);
      })
      .finally(() => {
        setLoadingPolicy(false);
      });
  }, []);

  // Quick order verification if entered
  const handleVerifyOrder = async () => {
    const code = orderQuery.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter your Order Number (e.g. FED-1001).");
      return;
    }
    setVerifyingOrder(true);
    try {
      const order = await fetchOrderByTrackingOrNumber(code);
      if (order) {
        setFormData((prev) => ({
          ...prev,
          orderNumber: order.orderNumber,
          customerName: order.customerName || prev.customerName,
          customerPhone: order.customerPhone || prev.customerPhone,
          customerEmail: order.customerEmail || prev.customerEmail,
          pickupAddress:
            `${order.shippingAddress?.streetAddress || ""}, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.district || ""}`.replace(/^,\s*|,\s*$/g, "") ||
            prev.pickupAddress,
          zone: (order.shippingAddress?.city || "").toLowerCase().includes("dhaka")
            ? "inside_dhaka"
            : "outside_dhaka",
          itemDetails: order.items.map((i) => `${i.name} (Size: ${i.size || "Standard"})`).join(", "),
        }));
        toast.success(`Verified Order #${order.orderNumber}. Details pre-filled!`);
      } else {
        toast.info(
          `Order #${code} not found in immediate cache. You can still submit your ticket with your details.`
        );
        setFormData((prev) => ({ ...prev, orderNumber: code }));
      }
    } catch {
      toast.info(`Proceeding with Order #${code}.`);
      setFormData((prev) => ({ ...prev, orderNumber: code }));
    } finally {
      setVerifyingOrder(false);
    }
  };

  // Submit Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber.trim()) {
      toast.error("Please provide your Order Number.");
      return;
    }
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error("Please provide your Name and Contact Phone Number.");
      return;
    }
    if (!formData.pickupAddress.trim()) {
      toast.error("Please provide your Doorstep Reverse Pickup Address.");
      return;
    }
    if (!formData.itemDetails.trim()) {
      toast.error("Please specify the garment item you wish to exchange or return.");
      return;
    }

    setSubmitting(true);
    try {
      const fullReason = formData.additionalNotes.trim()
        ? `${formData.reason} - ${formData.additionalNotes.trim()}`
        : formData.reason;

      const record = await createReturnExchangeRequest({
        orderNumber: formData.orderNumber.trim().toUpperCase(),
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        pickupAddress: formData.pickupAddress.trim(),
        zone: formData.zone,
        type: formData.type,
        itemDetails: formData.itemDetails.trim(),
        requestedReplacement:
          formData.type === "refund" ? undefined : formData.requestedReplacement.trim(),
        refundMethod: formData.type === "refund" ? formData.refundMethod : undefined,
        refundAccountDetails:
          formData.type === "refund" ? formData.refundAccountDetails.trim() : undefined,
        reason: fullReason,
      });

      setSubmittedTicket(record);
      toast.success(`Return request submitted! Ticket: ${record.ticketNumber}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Track Ticket Handler
  const handleTrackTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = trackQuery.trim();
    if (!query) {
      toast.error("Please enter a Ticket Number, Order Number, or Phone Number.");
      return;
    }

    setTrackingLoading(true);
    setTrackSearched(true);
    try {
      const found = await fetchReturnRequestByTicket(query);
      setTrackedRequest(found);
      if (!found) {
        toast.info("No active return or exchange ticket matches this query.");
      }
    } catch {
      toast.error("Error checking ticket status.");
    } finally {
      setTrackingLoading(false);
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 text-white py-16 sm:py-24 border-b border-stone-800">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <ArrowPathIcon className="size-4 animate-spin-slow" />
              <span>Fedoll Atelier 7-Day Fit &amp; Quality Guarantee</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Returns &amp; Exchanges Policy
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              Effortless doorstep size replacements, zero-friction reverse courier pickups across Dhaka and all 64 districts in Bangladesh, and transparent refund guarantees.
            </p>

            {/* Key Policy Highlights Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-300">
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <ClockIcon className="size-4 text-orange-400" />
                <span>Exchange Window: <strong className="text-white">{data.returnWindowDays} Days</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <TruckIcon className="size-4 text-blue-400" />
                <span>Doorstep Reverse Pickup: <strong className="text-white">৳{data.exchangeFeeInsideDhaka} (Dhaka) / ৳{data.exchangeFeeOutsideDhaka} (All BD)</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60">
                <BanknotesIcon className="size-4 text-emerald-400" />
                <span>Refund SLA: <strong className="text-white">{data.refundProcessingDays}</strong></span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 bg-stone-800/80 hover:bg-stone-700 px-3 py-1.5 rounded-lg border border-stone-700/60 text-stone-200 transition cursor-pointer"
                title="Print Policy"
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          {/* Main Navigation Tabs */}
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-stone-200/70 dark:bg-neutral-800 border border-stone-300/60 dark:border-neutral-700 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("policy")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === "policy"
                    ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <DocumentTextIcon className="size-4" />
                <span>Policy &amp; 5-Step Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("request")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === "request"
                    ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <ArrowPathIcon className="size-4" />
                <span>Initiate Return / Exchange</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("track")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === "track"
                    ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <MagnifyingGlassIcon className="size-4" />
                <span>Track Return Ticket</span>
              </button>
            </div>
          </div>

          {/* ==================================================================
              TAB 1: POLICY & 5-STEP PROCESS
              ================================================================== */}
          {activeTab === "policy" && (
            <div className="space-y-12">
              {/* 5-Step Visual Reverse Logistics Stepper */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-xs space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Zero-Friction Reverse Logistics
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    How Our 5-Step Return &amp; Exchange Works
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Never worry about incorrect sizes. We coordinate the courier pickup directly from your doorstep.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
                  {/* Step 1 */}
                  <div className="relative p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-2.5">
                    <div className="size-9 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      1
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Initiate Ticket
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                      Submit ticket online or notify our WhatsApp helpline within {data.returnWindowDays} days of receiving parcel.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-2.5">
                    <div className="size-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      2
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Doorstep Pickup
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                      Steadfast or Pathao rider arrives at your doorstep to collect the unworn garment with tags intact.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-2.5">
                    <div className="size-9 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      3
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Atelier Audit
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                      Garment reaches our Uttara Dhaka hub. Our quality team scans barcodes and checks unwashed condition.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-2.5">
                    <div className="size-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      4
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Express Swap / Refund
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                      Target replacement size is dispatched instantly, or monetary refund is sent via bKash / Nagad.
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="relative p-4 rounded-2xl bg-stone-50/70 dark:bg-neutral-800/40 border border-stone-200/60 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-2.5">
                    <div className="size-9 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black text-xs flex items-center justify-center shadow-xs">
                      5
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      Perfect Fit
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                      Fresh replacement delivered to your hands with new consignment tracking receipt.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("request")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <span>Initiate an Exchange Now</span>
                    <ArrowPathIcon className="size-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Policy Clauses */}
              <div className="space-y-6">
                <div className="border-b border-stone-200 dark:border-neutral-800 pb-3">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    Official Exchange &amp; Return Terms
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Last updated on {data.lastUpdated}. Binding under consumer fair-trade regulations of Bangladesh.
                  </p>
                </div>

                <div className="space-y-6">
                  {data.clauses.map((clause) => (
                    <div
                      key={clause.id}
                      id={clause.id}
                      className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4"
                    >
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="size-2 rounded-full bg-orange-600" />
                        <span>{clause.title}</span>
                      </h4>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                        {clause.content}
                      </p>

                      {clause.bulletPoints && clause.bulletPoints.length > 0 && (
                        <ul className="space-y-2 pt-2 border-t border-stone-100 dark:border-neutral-800/80">
                          {clause.bulletPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-neutral-300"
                            >
                              <CheckCircleIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility & Non-Returnable Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Eligible */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircleIcon className="size-5 text-emerald-600 shrink-0" />
                    <span>Eligible for Return &amp; Exchange</span>
                  </div>
                  <ul className="space-y-2 text-xs text-emerald-900/90 dark:text-emerald-200">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Unworn, unwashed garments with original tags, barcodes, and fabric labels intact.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Items returned within {data.returnWindowDays} calendar days from delivery date.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Manufacturing fabric defects, stitching errors, or incorrect sizes dispatched.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Original Fedoll garment bag and thermal courier box provided during handover.</span>
                    </li>
                  </ul>
                </div>

                {/* Ineligible */}
                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <XCircleIcon className="size-5 text-rose-600 shrink-0" />
                    <span>Non-Returnable Exceptions &amp; Hygiene Standards</span>
                  </div>
                  <ul className="space-y-2 text-xs text-rose-900/90 dark:text-rose-200">
                    {data.nonReturnableItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircleIcon className="size-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Atelier Walk-in Studio Hub */}
              <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-orange-400 text-xs font-bold uppercase tracking-wider">
                    <BuildingStorefrontIcon className="size-3.5" />
                    <span>Dhaka Walk-in Exchange Studio</span>
                  </div>
                  <h3 className="text-xl font-black">
                    Prefer an In-Person Fitting &amp; Swap?
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Visit our master tailor workshop in Uttara, Dhaka for immediate size swaps and free hem adjustments.
                  </p>
                  <p className="text-xs text-stone-400 font-mono pt-1">
                    📍 {data.hubAddress}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <a
                    href={`https://wa.me/${data.supportWhatsApp.replace(/[^0-9]/g, "")}?text=Hello%20Fedoll,%20I%20would%20like%20to%20visit%20your%20Uttara%20atelier%20for%20a%20size%20exchange.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2"
                  >
                    <ChatBubbleLeftRightIcon className="size-4" />
                    <span>WhatsApp Concierge</span>
                  </a>
                  <a
                    href={`tel:${data.supportHotline.replace(/[^0-9]/g, "")}`}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition border border-stone-700"
                  >
                    Call: {data.supportHotline}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================
              TAB 2: INITIATE RETURN / EXCHANGE WIZARD
              ================================================================== */}
          {activeTab === "request" && (
            <div className="max-w-3xl mx-auto space-y-8">
              {submittedTicket ? (
                /* Success Card after submitting */
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-emerald-300 dark:border-emerald-800 p-8 sm:p-10 shadow-lg text-center space-y-6">
                  <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckBadgeIcon className="size-10" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Request Submitted Successfully
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                      Your Return Ticket Has Been Created
                    </h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Our reverse courier logistics team has received your ticket and will verify parcel pickup.
                    </p>
                  </div>

                  {/* Ticket Details Pill */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/70 border border-stone-200 dark:border-neutral-700 max-w-md mx-auto space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Ticket Number:</span>
                      <span className="font-mono font-bold text-sm text-orange-600 dark:text-orange-400">
                        {submittedTicket.ticketNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Order Number:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {submittedTicket.orderNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Customer:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {submittedTicket.customerName} ({submittedTicket.customerPhone})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Action:</span>
                      <span className="font-bold text-emerald-600 capitalize">
                        {submittedTicket.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackQuery(submittedTicket.ticketNumber);
                        setActiveTab("track");
                        handleTrackTicket();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs transition cursor-pointer"
                    >
                      Track This Ticket Live &rarr;
                    </button>
                    <a
                      href={`https://wa.me/${data.supportWhatsApp.replace(/[^0-9]/g, "")}?text=Hello%20Fedoll,%20I%20have%20submitted%20Return%20Ticket%20${submittedTicket.ticketNumber}%20for%20Order%20${submittedTicket.orderNumber}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <ChatBubbleLeftRightIcon className="size-4" />
                      <span>Confirm via WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* The Request Form */
                <form
                  onSubmit={handleSubmitRequest}
                  className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-xs space-y-6"
                >
                  <div className="border-b border-stone-100 dark:border-neutral-800 pb-4">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                      Self-Service Return &amp; Exchange Desk
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your order details below. We schedule a reverse courier rider directly to your address.
                    </p>
                  </div>

                  {/* Step 1: Order Verification */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
                      1. Order Identification
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={orderQuery}
                        onChange={(e) => {
                          setOrderQuery(e.target.value);
                          setFormData({ ...formData, orderNumber: e.target.value });
                        }}
                        placeholder="Enter Order Number (e.g. FED-1001)"
                        className="flex-1 text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono uppercase"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOrder}
                        disabled={verifyingOrder}
                        className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {verifyingOrder ? "Verifying..." : "Auto-Fill Order"}
                      </button>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        placeholder="Tanvir Hasan"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                        placeholder="017XXXXXXXX"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  {/* Step 2: Action Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
                      2. Select Action Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "size_exchange", label: "Size Exchange", desc: "Swap for bigger/smaller" },
                        { id: "color_style_exchange", label: "Color / Style Swap", desc: "Different variant" },
                        { id: "defective_replacement", label: "Defective Item", desc: "100% Free pickup" },
                        { id: "refund", label: "Monetary Refund", desc: "bKash / Nagad / Bank" },
                      ].map((typeOption) => (
                        <button
                          key={typeOption.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              type: typeOption.id as ReturnExchangeRequest["type"],
                            })
                          }
                          className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                            formData.type === typeOption.id
                              ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200 font-bold"
                              : "bg-stone-50 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300"
                          }`}
                        >
                          <span className="block text-xs font-bold">{typeOption.label}</span>
                          <span className="block text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
                            {typeOption.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                      Garment Item to Return *
                    </label>
                    <input
                      type="text"
                      value={formData.itemDetails}
                      onChange={(e) => setFormData({ ...formData, itemDetails: e.target.value })}
                      placeholder="e.g., Raw Selvedge Denim 14oz (Current size 32)"
                      className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      required
                    />
                  </div>

                  {/* Conditional Replacement or Refund Target */}
                  {formData.type !== "refund" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Desired Replacement Size or Item *
                      </label>
                      <input
                        type="text"
                        value={formData.requestedReplacement}
                        onChange={(e) =>
                          setFormData({ ...formData, requestedReplacement: e.target.value })
                        }
                        placeholder="e.g., Please exchange for Size 34 in same dark indigo wash"
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                        required
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                          Refund Disbursement Method
                        </label>
                        <select
                          value={formData.refundMethod}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              refundMethod: e.target.value as NonNullable<ReturnExchangeRequest["refundMethod"]>,
                            })
                          }
                          className="w-full text-xs p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 cursor-pointer font-bold"
                        >
                          <option value="bKash">bKash Personal Account</option>
                          <option value="Nagad">Nagad Personal Account</option>
                          <option value="Bank Transfer">Bangladeshi Bank Account</option>
                          <option value="Store Credit">Store Credit Voucher (+5% Bonus!)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                          Account Number / Details
                        </label>
                        <input
                          type="text"
                          value={formData.refundAccountDetails}
                          onChange={(e) =>
                            setFormData({ ...formData, refundAccountDetails: e.target.value })
                          }
                          placeholder="e.g., 017XXXXXXXX or Bank name, A/C #, Branch"
                          className="w-full text-xs p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Reverse Pickup Address */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Doorstep Reverse Pickup Address *
                      </label>
                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="zone"
                            checked={formData.zone === "inside_dhaka"}
                            onChange={() => setFormData({ ...formData, zone: "inside_dhaka" })}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <span>Inside Dhaka (৳{data.exchangeFeeInsideDhaka})</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="zone"
                            checked={formData.zone === "outside_dhaka"}
                            onChange={() => setFormData({ ...formData, zone: "outside_dhaka" })}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <span>Outside Dhaka (৳{data.exchangeFeeOutsideDhaka})</span>
                        </label>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      placeholder="Holding / Flat #, Road, Area / Thana, City / District"
                      className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      required
                    />
                  </div>

                  {/* Reason & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Primary Reason
                      </label>
                      <select
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 cursor-pointer"
                      >
                        <option value="Size is too small, need 1 size larger">
                          Size is too small (need 1 size larger)
                        </option>
                        <option value="Size is too large, need 1 size smaller">
                          Size is too large (need 1 size smaller)
                        </option>
                        <option value="Chest or shoulder fit is tight">
                          Chest or shoulder fit is tight
                        </option>
                        <option value="Prefer a different color or style">
                          Prefer a different color or wash
                        </option>
                        <option value="Manufacturing defect or stitch flaw">
                          Manufacturing defect or stitch flaw
                        </option>
                        <option value="Received wrong item or size">
                          Received wrong item or incorrect size
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                        Additional Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.additionalNotes}
                        onChange={(e) =>
                          setFormData({ ...formData, additionalNotes: e.target.value })
                        }
                        placeholder="Any additional sizing instructions..."
                        className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Reverse Courier Fee Notice */}
                  <div className="p-4 rounded-2xl bg-stone-100 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 flex items-start gap-3 text-xs text-gray-600 dark:text-neutral-300">
                    <ShieldCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Reverse Pickup Assurance:</strong> First size exchange has{" "}
                      <strong>0% atelier service fee</strong>. Only standard reverse courier logistics apply (
                      {formData.zone === "inside_dhaka"
                        ? `৳${data.exchangeFeeInsideDhaka} inside Dhaka`
                        : `৳${data.exchangeFeeOutsideDhaka} outside Dhaka`}
                      ), which can be adjusted with COD or paid via bKash. For defective items, reverse pickup is{" "}
                      <strong>100% Free</strong>.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Spinner className="size-4 text-white animate-spin" />
                          <span>Generating Ticket &amp; Booking Courier...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="size-4" />
                          <span>Submit Return / Exchange Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ==================================================================
              TAB 3: TRACK MY RETURN TICKET
              ================================================================== */}
          {activeTab === "track" && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-xs space-y-6">
                <div className="text-center max-w-md mx-auto space-y-1.5">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    Track Your Return or Exchange
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enter your Ticket Number (e.g. RET-104921-392), Order Number, or Phone Number to check status.
                  </p>
                </div>

                <form onSubmit={handleTrackTicket} className="flex items-center gap-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="RET-XXXXXX-XXX or 017XXXXXXXX"
                    className="flex-1 text-xs p-3.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {trackingLoading ? (
                      <Spinner className="size-4 text-white animate-spin" />
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="size-4" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Tracking Results */}
                {trackSearched && (
                  <div className="pt-4 border-t border-stone-100 dark:border-neutral-800">
                    {trackedRequest ? (
                      <div className="space-y-6">
                        {/* Status Header */}
                        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold text-gray-400 block">Ticket Number</span>
                            <span className="font-mono text-base font-black text-orange-600 dark:text-orange-400">
                              {trackedRequest.ticketNumber}
                            </span>
                            <span className="text-xs text-gray-500 block mt-0.5">
                              Order #{trackedRequest.orderNumber} • Submitted on{" "}
                              {new Date(trackedRequest.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                                trackedRequest.status === "pending"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : trackedRequest.status === "approved"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : trackedRequest.status === "pickup_scheduled"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                  : trackedRequest.status === "received_at_hub"
                                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                  : trackedRequest.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              }`}
                            >
                              Status: {trackedRequest.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Stepper for Ticket */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Reverse Logistics Progression
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div
                              className={`p-3 rounded-xl border ${
                                ["pending", "approved", "pickup_scheduled", "received_at_hub", "resolved"].includes(
                                  trackedRequest.status
                                )
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-400"
                              }`}
                            >
                              <span className="block text-sm mb-1">1</span>
                              <span>Ticket Created</span>
                            </div>

                            <div
                              className={`p-3 rounded-xl border ${
                                ["approved", "pickup_scheduled", "received_at_hub", "resolved"].includes(
                                  trackedRequest.status
                                )
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-400"
                              }`}
                            >
                              <span className="block text-sm mb-1">2</span>
                              <span>Approved</span>
                            </div>

                            <div
                              className={`p-3 rounded-xl border ${
                                ["pickup_scheduled", "received_at_hub", "resolved"].includes(
                                  trackedRequest.status
                                )
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-400"
                              }`}
                            >
                              <span className="block text-sm mb-1">3</span>
                              <span>Pickup Scheduled</span>
                            </div>

                            <div
                              className={`p-3 rounded-xl border ${
                                trackedRequest.status === "resolved"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold"
                                  : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-400"
                              }`}
                            >
                              <span className="block text-sm mb-1">4</span>
                              <span>Resolved / Dispatched</span>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Details Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 border border-stone-200/80 dark:border-neutral-700/80 space-y-1.5">
                            <span className="text-gray-400 font-semibold block">Customer &amp; Item</span>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {trackedRequest.customerName} ({trackedRequest.customerPhone})
                            </p>
                            <p className="text-gray-600 dark:text-neutral-300">
                              Item: <strong>{trackedRequest.itemDetails}</strong>
                            </p>
                            {trackedRequest.requestedReplacement && (
                              <p className="text-orange-600 dark:text-orange-400 font-semibold">
                                Target Replacement: {trackedRequest.requestedReplacement}
                              </p>
                            )}
                            {trackedRequest.refundMethod && (
                              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                Refund: {trackedRequest.refundMethod} ({trackedRequest.refundAccountDetails})
                              </p>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 border border-stone-200/80 dark:border-neutral-700/80 space-y-1.5">
                            <span className="text-gray-400 font-semibold block">Pickup Address &amp; Zone</span>
                            <p className="text-gray-700 dark:text-neutral-300">
                              {trackedRequest.pickupAddress}
                            </p>
                            <span className="inline-block mt-1 font-mono text-[11px] font-bold text-gray-500 uppercase">
                              Zone: {trackedRequest.zone.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* WhatsApp Helpline Button */}
                        <div className="text-center pt-2">
                          <a
                            href={`https://wa.me/${data.supportWhatsApp.replace(/[^0-9]/g, "")}?text=Hello%20Fedoll,%20I%20am%20tracking%20Return%20Ticket%20${trackedRequest.ticketNumber}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            <ChatBubbleLeftRightIcon className="size-4" />
                            <span>Inquire via WhatsApp Support</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-gray-500">
                        <QuestionMarkCircleIcon className="size-8 text-gray-400 mx-auto mb-2" />
                        <p>No ticket found matching &quot;{trackQuery}&quot;.</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Double-check your ticket number or contact our WhatsApp concierge for immediate lookup.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
