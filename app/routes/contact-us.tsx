import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/contact-us";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchContactPageData,
  submitContactMessage,
  seedContactData,
  resetContactFormState,
} from "~/redux/features/contactSlice";
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "~/components/ui/spinner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Fedoll Bangladesh" },
    {
      name: "description",
      content:
        "Get in touch with Fedoll Bangladesh. Visit our Dhaka studio in Banani, contact our customer support for sizing advice, or submit an inquiry.",
    },
    {
      name: "keywords",
      content:
        "Fedoll contact, Fedoll customer care, Dhaka clothing showroom, Banani studio, selvedge denim Bangladesh, fashion support Dhaka",
    },
  ];
}

const CATEGORY_OPTIONS = [
  "Customer Support & Orders",
  "Size & Styling Advice",
  "Exchanges & Returns",
  "Showroom & Studio Visit",
  "Wholesale & Corporate Inquiries",
  "General Inquiry",
];

export default function ContactUsPage() {
  const dispatch = useAppDispatch();
  const {
    pageData,
    loadingPage,
    submitting,
    submitSuccess,
    submitError,
    lastSubmittedId,
    syncing,
  } = useAppSelector((state) => state.contact);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Customer Support & Orders",
    orderNumber: "",
    subject: "",
    message: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedName, setSubmittedName] = useState("");

  useEffect(() => {
    dispatch(fetchContactPageData());
  }, [dispatch]);

  const handleSyncFirebase = async () => {
    try {
      await dispatch(seedContactData(true)).unwrap();
      toast.success("Contact page data synchronized with Cloud Firestore!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync with Firebase");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      errors.message = "Message cannot be empty";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Please write at least 10 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      const result = await dispatch(
        submitContactMessage({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          category: formData.category,
          orderNumber: formData.orderNumber,
          subject: formData.subject,
          message: formData.message,
        })
      ).unwrap();

      setSubmittedName(formData.name);
      toast.success(result.message || "Inquiry sent successfully to Fedoll!");

      // Reset form fields
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "Customer Support & Orders",
        orderNumber: "",
        subject: "",
        message: "",
      });
      setValidationErrors({});
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to submit message. Please try again.");
    }
  };

  const handleSendAnother = () => {
    dispatch(resetContactFormState());
  };

  const renderChannelIcon = (iconName: string) => {
    const iconClass = "size-6 text-orange-600 dark:text-orange-400";
    switch (iconName) {
      case "PhoneIcon":
        return <PhoneIcon className={iconClass} />;
      case "ChatBubbleBottomCenterTextIcon":
        return <ChatBubbleBottomCenterTextIcon className={iconClass} />;
      case "BuildingStorefrontIcon":
        return <BuildingStorefrontIcon className={iconClass} />;
      case "EnvelopeIcon":
      default:
        return <EnvelopeIcon className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Navigation Layer */}
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-stone-50 dark:bg-neutral-900/60 border-b border-stone-200/60 dark:border-neutral-800 py-3 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition">
                Home
              </Link>
              <span>/</span>
              <span className="font-medium text-gray-900 dark:text-white">Contact Us</span>
            </nav>
          </div>
        </div>

        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 dark:from-neutral-900/50 via-orange-50/20 dark:via-neutral-950 to-white dark:to-neutral-950 border-b border-stone-200/60 dark:border-neutral-800 py-16 sm:py-20 transition-colors">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-semibold uppercase tracking-wider mb-4">
                  <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400" />
                  {pageData?.tagline || "We're Here For You"}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                  Let&apos;s Talk Quality &amp; Comfort. <br />
                  <span className="text-orange-600 dark:text-orange-400 italic font-serif">
                    We&apos;re Always Here to Help.
                  </span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                  {pageData?.subtitle ||
                    "Have questions about our garments, sizing, your existing order, or visiting our Dhaka studio? Our friendly support team is always ready to help."}
                </p>
              </div>

              {/* Live Cloud Firestore Connection Badge & Sync Button */}
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-full shadow-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Cloud Firestore</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncFirebase}
                  disabled={syncing || loadingPage}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Resync contact settings directly with Firebase Firestore"
                >
                  <ArrowPathIcon
                    className={`size-3.5 ${syncing ? "animate-spin text-orange-600 dark:text-orange-400" : ""}`}
                  />
                  <span>{syncing ? "Syncing..." : "Sync with Firebase"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Direct Assistance Channels */}
        <section className="py-12 bg-white dark:bg-neutral-950 border-b border-stone-200/60 dark:border-neutral-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageData?.channels?.map((channel) => (
                <div
                  key={channel.id}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-900 hover:bg-white dark:hover:bg-neutral-850 hover:border-orange-400 dark:hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-700/5 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                        {renderChannelIcon(channel.iconName)}
                      </div>
                      {channel.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-200/80 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
                          {channel.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      {channel.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                      {channel.description}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white font-mono">
                      {channel.contact}
                    </p>
                  </div>

                  <a
                    href={channel.actionUrl}
                    target={channel.actionUrl.startsWith("http") ? "_blank" : undefined}
                    rel={channel.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition"
                  >
                    <span>{channel.actionText}</span>
                    <ArrowRightIcon className="size-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Section: Interactive Form + Studio Details */}
        <section className="py-16 sm:py-20 bg-stone-50/50 dark:bg-neutral-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Form Container (7 Cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-stone-200/80 dark:border-neutral-800 shadow-xl shadow-stone-200/40 dark:shadow-none">
                {submitSuccess ? (
                  /* Success Confirmation Receipt */
                  <div className="py-8 text-center space-y-6">
                    <div className="size-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in-75 duration-300">
                      <CheckCircleIcon className="size-10" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Inquiry Received, {submittedName}!
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
                        Your message has been securely recorded into our Cloud Firestore database.
                        Our Dhaka support team will review your inquiry and respond within 2 to 4
                        hours.
                      </p>
                    </div>

                    {lastSubmittedId && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-xs font-mono text-gray-700 dark:text-neutral-300">
                        <span className="text-gray-400 dark:text-neutral-500">Reference Ticket ID:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{lastSubmittedId}</span>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleSendAnother}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                      >
                        Send Another Message
                      </button>
                      <Link
                        to="/"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 text-gray-700 dark:text-neutral-300 text-sm font-semibold transition text-center"
                      >
                        Return to Store
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Interactive Submission Form */
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          Send Us a Message
                        </h2>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 px-2.5 py-1 rounded-full">
                          Typical reply: &lt; 2 hrs
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                        Fill in the details below. Messages are saved directly to Cloud Firestore and
                        notified to our Dhaka operations team.
                      </p>
                    </div>

                    {submitError && (
                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                        <InformationCircleIcon className="size-5 shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <p className="font-semibold">Unable to submit inquiry</p>
                          <p className="text-xs mt-0.5">{submitError}</p>
                        </div>
                      </div>
                    )}

                    {/* Inquiry Category Selector */}
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-2"
                      >
                        Inquiry Category <span className="text-orange-600 dark:text-orange-400">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-600 focus:border-orange-600 focus:outline-none transition cursor-pointer"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Name & Email Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-1.5"
                        >
                          Full Name <span className="text-orange-600 dark:text-orange-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          autoComplete="name"
                          placeholder="e.g. Tanvirul Hasan"
                          value={formData.name}
                          onChange={handleInputChange}
                          aria-invalid={!!validationErrors.name}
                          className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none transition ${
                            validationErrors.name
                              ? "border-red-400 focus:ring-2 focus:ring-red-400"
                              : "border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          }`}
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            {validationErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-1.5"
                        >
                          Email Address <span className="text-orange-600 dark:text-orange-400">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          placeholder="e.g. tanvir@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          aria-invalid={!!validationErrors.email}
                          className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none transition ${
                            validationErrors.email
                              ? "border-red-400 focus:ring-2 focus:ring-red-400"
                              : "border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Order ID Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-1.5"
                        >
                          Phone Number <span className="text-xs text-gray-400 dark:text-neutral-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          autoComplete="tel"
                          placeholder="+880 1700-000000"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="orderNumber"
                          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-1.5"
                        >
                          Order Number <span className="text-xs text-gray-400 dark:text-neutral-500 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          id="orderNumber"
                          name="orderNumber"
                          placeholder="e.g. #FD-8924"
                          value={formData.orderNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 mb-1.5"
                      >
                        Subject <span className="text-orange-600 dark:text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        placeholder="What is this inquiry regarding?"
                        value={formData.subject}
                        onChange={handleInputChange}
                        aria-invalid={!!validationErrors.subject}
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none transition ${
                          validationErrors.subject
                            ? "border-red-400 focus:ring-2 focus:ring-red-400"
                            : "border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        }`}
                      />
                      {validationErrors.subject && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          {validationErrors.subject}
                        </p>
                      )}
                    </div>

                    {/* Message Box */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="message"
                          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300"
                        >
                          Message <span className="text-orange-600 dark:text-orange-400">*</span>
                        </label>
                        <span className="text-[11px] text-gray-400 dark:text-neutral-500">
                          {formData.message.length} characters
                        </span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="Please write your questions, custom sizing requirements, or order query here..."
                        value={formData.message}
                        onChange={handleInputChange}
                        aria-invalid={!!validationErrors.message}
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none transition resize-y ${
                          validationErrors.message
                            ? "border-red-400 focus:ring-2 focus:ring-red-400"
                            : "border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        }`}
                      />
                      {validationErrors.message && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          {validationErrors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Spinner className="size-4 text-white" />
                          <span>Sending Message to Cloud Firestore...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="size-4" />
                          <span>Submit Message</span>
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-400 dark:text-neutral-500">
                      We value your privacy. Your information is never shared with third parties.
                    </p>
                  </form>
                )}
              </div>

              {/* Showroom & Studio Information (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Visual Atelier Card */}
                <div className="rounded-3xl overflow-hidden border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl shadow-stone-200/40 dark:shadow-none">
                  <div className="relative aspect-16/9 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                    <img
                      src={
                        pageData?.heroImage ||
                        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt="Fedoll Studio in Banani Dhaka"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-600 text-white backdrop-blur-xs">
                        Flagship Showroom
                      </span>
                      <h3 className="text-lg font-bold mt-1.5">
                        {pageData?.office?.name || "Fedoll Design Studio"}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <MapPinIcon className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          Studio Location
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {pageData?.office?.address || "House 18, Road 11, Block D, Banani"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {pageData?.office?.city || "Dhaka"} - {pageData?.office?.postalCode || "1213"},{" "}
                          {pageData?.office?.country || "Bangladesh"}
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <ClockIcon className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          Visiting Hours
                        </p>
                        <p className="text-xs font-medium text-gray-900 dark:text-white mt-0.5">
                          {pageData?.office?.hoursWeekday || "Sat – Thu: 10:00 AM – 08:00 PM (BST)"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {pageData?.office?.hoursWeekend || "Friday: 02:30 PM – 08:30 PM (BST)"}
                        </p>
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="pt-2 border-t border-stone-100 dark:border-neutral-800 flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 dark:text-neutral-500 block">Phone Support:</span>
                        <a
                          href={`tel:${pageData?.office?.phone || "+8801700123456"}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition"
                        >
                          {pageData?.office?.phone || "+880 1700-123456"}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-neutral-500 block">Support Email:</span>
                        <a
                          href={`mailto:${pageData?.office?.email || "support@fedoll.com"}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition"
                        >
                          {pageData?.office?.email || "support@fedoll.com"}
                        </a>
                      </div>
                    </div>

                    {/* Google Maps Embed */}
                    <div className="pt-2">
                      <div className="rounded-2xl overflow-hidden border border-stone-200/80 dark:border-neutral-800 aspect-16/9 bg-stone-100 dark:bg-neutral-800">
                        <iframe
                          title="Fedoll Studio Banani Dhaka Location"
                          src={
                            pageData?.office?.googleMapsEmbedUrl ||
                            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.0477174624403!2d90.4022839760237!3d23.781313087570414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c70b72a08271%3A0xb56306e00b730f81!2sRoad%2011%2C%20Dhaka%201213!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                          }
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <a
                          href={pageData?.office?.googleMapsUrl || "https://maps.google.com/?q=Banani+Road+11+Dhaka+Bangladesh"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          <span>Open in Google Maps</span>
                          <ArrowTopRightOnSquareIcon className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fedoll Customer Promises Strip */}
                <div className="p-6 rounded-3xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Our Customer Commitments
                  </h4>
                  <div className="space-y-2 text-xs text-orange-950 dark:text-orange-200">
                    <div className="flex items-center gap-2">
                      <TruckIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>Delivery to all 64 districts with Cash on Delivery &amp; bKash</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>7-Day effortless size and style exchange guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>Authentic export quality selvedge denim and pure cotton</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section className="py-16 sm:py-20 bg-white dark:bg-neutral-950 border-t border-stone-200/60 dark:border-neutral-800 transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <InformationCircleIcon className="size-4 text-orange-600 dark:text-orange-400" />
                Helpful Answers
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-neutral-400">
                Quick answers regarding our Bangladesh delivery network, sizing, COD payments, and
                studio visits.
              </p>
            </div>

            <Accordion className="space-y-4">
              {pageData?.faqs?.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-neutral-800 bg-stone-50/40 dark:bg-neutral-900 p-2 sm:p-4 hover:border-orange-400 dark:hover:border-orange-500/40 transition duration-200"
                >
                  <AccordionTrigger className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 py-3 px-2">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed px-2 pt-1 pb-3">
                    <p>{faq.answer}</p>
                    <span className="inline-block mt-2 text-[11px] font-medium text-orange-800 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full">
                      {faq.category}
                    </span>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Still Need Help CTA */}
            <div className="mt-12 text-center p-8 rounded-3xl bg-stone-50 dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Can&apos;t find what you&apos;re looking for?
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Our Dhaka care team is active on WhatsApp every day from 10:00 AM to 08:00 PM.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="https://wa.me/8801700123456?text=Hi%20Fedoll%2C%20I%20need%20assistance%20with%20my%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <ChatBubbleBottomCenterTextIcon className="size-4" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href="tel:+8801700123456"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 text-xs font-semibold shadow-2xs transition"
                >
                  <PhoneIcon className="size-4 text-orange-600 dark:text-orange-400" />
                  <span>Call +880 1700-123456</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
