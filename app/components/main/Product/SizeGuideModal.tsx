import React, { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { Ruler, Sparkles, HelpCircle } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  selectedSize?: string;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = "Shirts",
  selectedSize = "",
}: SizeGuideModalProps) {
  const isBottomCategory =
    category === "Trousers" ||
    category === "Denim" ||
    category?.toLowerCase().includes("pant") ||
    category?.toLowerCase().includes("jean");

  const [activeTab, setActiveTab] = useState<"tops" | "bottoms" | "guide">(
    isBottomCategory ? "bottoms" : "tops"
  );
  const [unit, setUnit] = useState<"in" | "cm">("in");

  const tops = [
    {
      size: "XS",
      matchSizes: ["XS", "36"],
      chestIn: "37.5\"",
      chestCm: "95 cm",
      shoulderIn: "16.8\"",
      shoulderCm: "42.5 cm",
      lengthIn: "27.0\"",
      lengthCm: "68.5 cm",
      sleeveIn: "24.0\"",
      sleeveCm: "61 cm",
    },
    {
      size: "S / 38",
      matchSizes: ["S", "38", "38R"],
      chestIn: "39.5\"",
      chestCm: "100 cm",
      shoulderIn: "17.5\"",
      shoulderCm: "44.5 cm",
      lengthIn: "28.0\"",
      lengthCm: "71 cm",
      sleeveIn: "24.5\"",
      sleeveCm: "62 cm",
    },
    {
      size: "M / 40",
      matchSizes: ["M", "40", "40R"],
      chestIn: "41.5\"",
      chestCm: "105.5 cm",
      shoulderIn: "18.2\"",
      shoulderCm: "46.2 cm",
      lengthIn: "29.0\"",
      lengthCm: "73.5 cm",
      sleeveIn: "25.0\"",
      sleeveCm: "63.5 cm",
    },
    {
      size: "L / 42",
      matchSizes: ["L", "42", "42R"],
      chestIn: "43.5\"",
      chestCm: "110.5 cm",
      shoulderIn: "19.0\"",
      shoulderCm: "48.3 cm",
      lengthIn: "30.0\"",
      lengthCm: "76 cm",
      sleeveIn: "25.5\"",
      sleeveCm: "65 cm",
    },
    {
      size: "XL / 44",
      matchSizes: ["XL", "44", "44R"],
      chestIn: "45.5\"",
      chestCm: "115.5 cm",
      shoulderIn: "19.8\"",
      shoulderCm: "50.3 cm",
      lengthIn: "30.5\"",
      lengthCm: "77.5 cm",
      sleeveIn: "26.0\"",
      sleeveCm: "66 cm",
    },
    {
      size: "XXL / 46",
      matchSizes: ["XXL", "46", "46R"],
      chestIn: "47.5\"",
      chestCm: "120.5 cm",
      shoulderIn: "20.5\"",
      shoulderCm: "52 cm",
      lengthIn: "31.0\"",
      lengthCm: "78.5 cm",
      sleeveIn: "26.5\"",
      sleeveCm: "67.5 cm",
    },
  ];

  const bottoms = [
    {
      size: "30",
      matchSizes: ["30"],
      waistIn: "30.5\"",
      waistCm: "77.5 cm",
      hipIn: "38.0\"",
      hipCm: "96.5 cm",
      lengthIn: "39.5\"",
      lengthCm: "100 cm",
      thighIn: "23.5\"",
      thighCm: "59.5 cm",
    },
    {
      size: "31",
      matchSizes: ["31"],
      waistIn: "31.5\"",
      waistCm: "80 cm",
      hipIn: "39.0\"",
      hipCm: "99 cm",
      lengthIn: "39.5\"",
      lengthCm: "100 cm",
      thighIn: "24.0\"",
      thighCm: "61 cm",
    },
    {
      size: "32",
      matchSizes: ["32"],
      waistIn: "32.5\"",
      waistCm: "82.5 cm",
      hipIn: "40.0\"",
      hipCm: "101.5 cm",
      lengthIn: "40.0\"",
      lengthCm: "101.5 cm",
      thighIn: "24.5\"",
      thighCm: "62 cm",
    },
    {
      size: "33",
      matchSizes: ["33"],
      waistIn: "33.5\"",
      waistCm: "85 cm",
      hipIn: "41.0\"",
      hipCm: "104 cm",
      lengthIn: "40.0\"",
      lengthCm: "101.5 cm",
      thighIn: "25.0\"",
      thighCm: "63.5 cm",
    },
    {
      size: "34",
      matchSizes: ["34"],
      waistIn: "34.5\"",
      waistCm: "87.5 cm",
      hipIn: "42.0\"",
      hipCm: "106.5 cm",
      lengthIn: "40.5\"",
      lengthCm: "103 cm",
      thighIn: "25.5\"",
      thighCm: "65 cm",
    },
    {
      size: "36",
      matchSizes: ["36"],
      waistIn: "36.5\"",
      waistCm: "92.5 cm",
      hipIn: "44.0\"",
      hipCm: "112 cm",
      lengthIn: "41.0\"",
      lengthCm: "104 cm",
      thighIn: "26.5\"",
      thighCm: "67.5 cm",
    },
    {
      size: "38",
      matchSizes: ["38"],
      waistIn: "38.5\"",
      waistCm: "98 cm",
      hipIn: "46.0\"",
      hipCm: "117 cm",
      lengthIn: "41.5\"",
      lengthCm: "105.5 cm",
      thighIn: "27.5\"",
      thighCm: "70 cm",
    },
  ];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-60 font-sans" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 p-6 sm:p-8">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 size-9 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                >
                  <XMarkIcon className="size-5" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3.5 border-b border-stone-200 dark:border-neutral-800 pb-5">
                  <div className="size-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Ruler className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Size Guide &amp; Measurements
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <Sparkles className="size-2.5" />
                        Bangladesh Standard
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                      Find your perfect fit with exact garment dimensions.
                    </p>
                  </div>
                </div>

                {/* Navigation and Unit Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-5 pb-3">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-neutral-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab("tops")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeTab === "tops"
                          ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs font-bold"
                          : "text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Tops / Shirts / Panjabis
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bottoms")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeTab === "bottoms"
                          ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs font-bold"
                          : "text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Trousers / Denims
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("guide")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer hidden sm:flex items-center gap-1 ${
                        activeTab === "guide"
                          ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs font-bold"
                          : "text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <HelpCircle className="size-3.5" />
                      <span>How to Measure</span>
                    </button>
                  </div>

                  {/* Unit Switcher */}
                  {activeTab !== "guide" && (
                    <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-neutral-800 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setUnit("in")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          unit === "in"
                            ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs font-bold"
                            : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200"
                        }`}
                      >
                        Inches (&quot;)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit("cm")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          unit === "cm"
                            ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs font-bold"
                            : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200"
                        }`}
                      >
                        Centimeters (cm)
                      </button>
                    </div>
                  )}
                </div>

                {/* Table Content */}
                <div className="mt-2">
                  {activeTab === "tops" && (
                    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/70 shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-100/80 dark:bg-neutral-800/80 border-b border-stone-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold">
                            <th className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                              Size
                            </th>
                            <th className="py-3 px-4 text-center">
                              Chest ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Shoulder ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Length ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Sleeve ({unit})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-gray-700 dark:text-neutral-300">
                          {tops.map((row) => {
                            const isSelected =
                              Boolean(selectedSize) &&
                              row.matchSizes.some(
                                (s) => s.toLowerCase() === selectedSize.trim().toLowerCase()
                              );

                            return (
                              <tr
                                key={row.size}
                                className={`transition-colors ${
                                  isSelected
                                    ? "bg-orange-50/90 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 font-semibold"
                                    : "hover:bg-stone-50/70 dark:hover:bg-neutral-800/40"
                                }`}
                              >
                                <td className="py-3 px-4 font-bold whitespace-nowrap text-gray-900 dark:text-white flex items-center gap-2">
                                  <span>{row.size}</span>
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white">
                                      <CheckIcon className="size-3" />
                                      Your Size
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.chestIn : row.chestCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.shoulderIn : row.shoulderCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.lengthIn : row.lengthCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.sleeveIn : row.sleeveCm}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "bottoms" && (
                    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/70 shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-100/80 dark:bg-neutral-800/80 border-b border-stone-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold">
                            <th className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                              Waist Size
                            </th>
                            <th className="py-3 px-4 text-center">
                              Waist ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Hip ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Length ({unit})
                            </th>
                            <th className="py-3 px-4 text-center">
                              Thigh ({unit})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-gray-700 dark:text-neutral-300">
                          {bottoms.map((row) => {
                            const isSelected =
                              Boolean(selectedSize) &&
                              row.matchSizes.some(
                                (s) => s.toLowerCase() === selectedSize.trim().toLowerCase()
                              );

                            return (
                              <tr
                                key={row.size}
                                className={`transition-colors ${
                                  isSelected
                                    ? "bg-orange-50/90 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 font-semibold"
                                    : "hover:bg-stone-50/70 dark:hover:bg-neutral-800/40"
                                }`}
                              >
                                <td className="py-3 px-4 font-bold whitespace-nowrap text-gray-900 dark:text-white flex items-center gap-2">
                                  <span>{row.size}</span>
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white">
                                      <CheckIcon className="size-3" />
                                      Your Size
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.waistIn : row.waistCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.hipIn : row.hipCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.lengthIn : row.lengthCm}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  {unit === "in" ? row.thighIn : row.thighCm}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "guide" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 border border-stone-200 dark:border-neutral-800 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200/70 dark:border-neutral-700/80">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">
                          1. Chest
                        </span>
                        <p className="text-gray-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          Wrap measuring tape around the fullest part of your chest under your armpits. Keep tape comfortably snug and horizontal.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200/70 dark:border-neutral-700/80">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">
                          2. Shoulder Width
                        </span>
                        <p className="text-gray-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          Measure straight across the back from the edge of one shoulder bone to the opposite shoulder bone.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200/70 dark:border-neutral-700/80">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">
                          3. Garment Length
                        </span>
                        <p className="text-gray-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          Measure from the highest point of the shoulder seam straight down to the bottom hemline.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200/70 dark:border-neutral-700/80">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">
                          4. Waist
                        </span>
                        <p className="text-gray-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                          Measure around the natural waistband position where your trousers or jeans normally sit comfortably.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Assurance */}
                <div className="mt-6 pt-4 border-t border-stone-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400">
                    <ShieldCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px]">
                      Hassle-free <strong>7-Day Size Exchange</strong> across Bangladesh.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition cursor-pointer text-xs"
                  >
                    Got It, Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
