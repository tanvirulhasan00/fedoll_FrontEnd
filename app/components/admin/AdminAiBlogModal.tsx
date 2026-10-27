import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  SparklesIcon,
  XMarkIcon,
  KeyIcon,
  DocumentTextIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { GeneratedBlogResult } from "~/services/geminiBlogService";

interface AdminAiBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (blog: GeneratedBlogResult) => void;
  categories: string[];
}

const TOPIC_SUGGESTIONS = [
  "How to Style Linen Shirts for Hot & Humid Summers",
  "The Beginner's Guide to Raw & Selvedge Denim Care",
  "Effortless Office Wear: Building a 7-Piece Capsule Wardrobe",
  "Styling Modern Panjabis for Festive & Evening Celebrations",
  "The Anatomy of a Perfect Cotton T-Shirt: Fabric, Fit & Longevity",
  "Layering Like a Pro in Dhaka's Mild Winter",
];

const LOCAL_STORAGE_KEY = "fedoll_gemini_api_key";

export const AdminAiBlogModal: React.FC<AdminAiBlogModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  categories,
}) => {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"editorial" | "casual" | "informative" | "trendsetter">("editorial");
  const [selectedCategory, setSelectedCategory] = useState("auto");
  const [targetLength, setTargetLength] = useState<"quick" | "standard" | "comprehensive">("standard");
  const [focusKeywords, setFocusKeywords] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved key from localStorage on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Cycle loading steps for visual feedback
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const LOADING_MESSAGES = [
    "Analyzing your topic and tailoring editorial angles...",
    "Drafting rich styling principles and markdown sections...",
    "Curating fabric advice, color palettes and blockquotes...",
    "Generating SEO tags, reading time and cover imagery...",
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic or select an inspiration below.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    // Save key to localStorage if user provided one
    if (apiKey.trim()) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
      } catch {
        // ignore
      }
    }

    try {
      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          category: selectedCategory === "auto" ? undefined : selectedCategory,
          targetLength,
          focusKeywords: focusKeywords.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate blog article.");
      }

      toast.success("Article generated with Gemini! Review and publish.");
      onGenerated(data.blog);
      onClose();
    } catch (err: any) {
      console.error("AI Generation error:", err);
      const msg = err.message || "Failed to generate blog post.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isGenerating ? () => {} : onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 text-left align-middle shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between bg-stone-50/70 dark:bg-neutral-950/40">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                      <SparklesIcon className="size-5" />
                    </div>
                    <div>
                      <DialogTitle
                        as="h3"
                        className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"
                      >
                        <span>Write Journal Article with AI</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Gemini 3.8
                        </span>
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        Provide a topic and let AI draft a publication-ready fashion article.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition disabled:opacity-40 cursor-pointer"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleGenerate} className="p-6 space-y-5">
                  {/* Topic Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-neutral-200 mb-1.5">
                      What should this article be about? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isGenerating}
                        placeholder="e.g., 5 Practical Rules for Styling Cuban Collar Shirts This Summer, or The Care Guide for 100% Combed Cotton..."
                        className="w-full rounded-2xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition resize-none disabled:opacity-60"
                      />
                    </div>

                    {/* Topic Suggestions Chips */}
                    <div className="mt-2.5">
                      <span className="text-[11px] font-semibold text-gray-400 dark:text-neutral-500 block mb-1.5">
                        Quick Ideas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {TOPIC_SUGGESTIONS.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isGenerating}
                            onClick={() => setTopic(sug)}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-300 border border-stone-200/80 dark:border-neutral-700/60 transition cursor-pointer text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customization Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* Tone */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-300 mb-1">
                        Editorial Tone
                      </label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value as any)}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-gray-800 dark:text-neutral-200 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="editorial">Editorial &amp; Refined</option>
                        <option value="casual">Casual &amp; Conversational</option>
                        <option value="informative">Educational &amp; Fabric-focused</option>
                        <option value="trendsetter">Bold &amp; Trendsetter</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-300 mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-gray-800 dark:text-neutral-200 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="auto">Auto-Detect Best Match</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Length */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-300 mb-1">
                        Target Length
                      </label>
                      <select
                        value={targetLength}
                        onChange={(e) => setTargetLength(e.target.value as any)}
                        disabled={isGenerating}
                        className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-gray-800 dark:text-neutral-200 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="standard">Standard (~4-5 min)</option>
                        <option value="quick">Quick Read (~2-3 min)</option>
                        <option value="comprehensive">In-Depth Guide (~7-8 min)</option>
                      </select>
                    </div>
                  </div>

                  {/* Focus Keywords / Specific Details */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-neutral-300 mb-1">
                      Focus Keywords or Specific Products to Highlight (Optional)
                    </label>
                    <input
                      type="text"
                      value={focusKeywords}
                      onChange={(e) => setFocusKeywords(e.target.value)}
                      disabled={isGenerating}
                      placeholder="e.g. linen overshirts, breathable cotton, white sneakers, humidity comfort"
                      className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-gray-800 dark:text-neutral-200 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* API Key Toggle & Input */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="text-[11px] text-gray-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <KeyIcon className="size-3.5" />
                      <span>{showApiKeyInput ? "Hide API Key settings" : "Configure / Override Gemini API Key"}</span>
                      {apiKey && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                          <CheckCircleIcon className="size-3" />
                          Key saved
                        </span>
                      )}
                    </button>

                    {showApiKeyInput && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200 dark:border-neutral-700">
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Paste AIzaSy... (Will be remembered securely in your browser)"
                          className="w-full rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-mono text-gray-800 dark:text-neutral-200 focus:border-purple-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">
                          Note: If you have already added <code>GEMINI_API_KEY</code> to your server <code>.env</code>, you can leave this empty.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error banner */}
                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                      <ExclamationCircleIcon className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Generation failed: </span>
                        <span>{errorMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Loading status bar */}
                  {isGenerating && (
                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex items-center gap-3 animate-pulse">
                      <Spinner className="size-5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block">Drafting your article with Gemini...</span>
                        <span className="text-[11px] opacity-80">{LOADING_MESSAGES[loadingStep]}</span>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isGenerating}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition disabled:opacity-40 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating || !topic.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 hover:opacity-95 active:scale-98 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-40 cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <Spinner className="size-3.5" />
                          <span>Generating Article...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="size-4" />
                          <span>Generate Article</span>
                          <ArrowRightIcon className="size-3.5" />
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
  );
};

export default AdminAiBlogModal;
