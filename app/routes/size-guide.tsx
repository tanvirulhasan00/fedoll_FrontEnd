import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import {
  Ruler,
  Sparkles,
  Check,
  HelpCircle,
  Scissors,
  Shirt,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
  MessageCircle,
  ChevronRight,
  Calculator,
} from "lucide-react";
import {
  CheckBadgeIcon,
  InformationCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [
    { title: "Size Guide & Fit Advice | Fedoll Apparel Atelier Bangladesh" },
    {
      name: "description",
      content:
        "Comprehensive sizing charts, how-to-measure guide, smart fit calculator, and garment care advice for Fedoll selvedge denim, outerwear, workwear, and tees.",
    },
  ];
}

type Unit = "in" | "cm";
type CategoryTab = "tops" | "bottoms" | "knitwear" | "blazers";

interface TableRow {
  size: string;
  intl: string;
  chestOrWaist: { in: string; cm: string };
  shoulderOrHip: { in: string; cm: string };
  length: { in: string; cm: string };
  sleeveOrInseam: { in: string; cm: string };
  recommendedWeight: string;
  recommendedHeight: string;
}

const TOPS_DATA: TableRow[] = [
  {
    size: "XS",
    intl: "36",
    chestOrWaist: { in: "37.5\"", cm: "95 cm" },
    shoulderOrHip: { in: "16.8\"", cm: "42.5 cm" },
    length: { in: "27.0\"", cm: "68.5 cm" },
    sleeveOrInseam: { in: "24.0\"", cm: "61 cm" },
    recommendedWeight: "50 – 58 kg",
    recommendedHeight: "5'4\" – 5'6\" (162–168 cm)",
  },
  {
    size: "S",
    intl: "38",
    chestOrWaist: { in: "39.5\"", cm: "100 cm" },
    shoulderOrHip: { in: "17.5\"", cm: "44.5 cm" },
    length: { in: "28.0\"", cm: "71 cm" },
    sleeveOrInseam: { in: "24.5\"", cm: "62 cm" },
    recommendedWeight: "58 – 66 kg",
    recommendedHeight: "5'6\" – 5'8\" (168–173 cm)",
  },
  {
    size: "M",
    intl: "40",
    chestOrWaist: { in: "41.5\"", cm: "105.5 cm" },
    shoulderOrHip: { in: "18.2\"", cm: "46.2 cm" },
    length: { in: "29.0\"", cm: "73.5 cm" },
    sleeveOrInseam: { in: "25.0\"", cm: "63.5 cm" },
    recommendedWeight: "66 – 76 kg",
    recommendedHeight: "5'8\" – 5'11\" (173–180 cm)",
  },
  {
    size: "L",
    intl: "42",
    chestOrWaist: { in: "43.5\"", cm: "110.5 cm" },
    shoulderOrHip: { in: "19.0\"", cm: "48.3 cm" },
    length: { in: "30.0\"", cm: "76 cm" },
    sleeveOrInseam: { in: "25.5\"", cm: "65 cm" },
    recommendedWeight: "76 – 85 kg",
    recommendedHeight: "5'10\" – 6'1\" (178–185 cm)",
  },
  {
    size: "XL",
    intl: "44",
    chestOrWaist: { in: "45.5\"", cm: "115.5 cm" },
    shoulderOrHip: { in: "19.8\"", cm: "50.3 cm" },
    length: { in: "30.5\"", cm: "77.5 cm" },
    sleeveOrInseam: { in: "26.0\"", cm: "66 cm" },
    recommendedWeight: "85 – 95 kg",
    recommendedHeight: "6'0\" – 6'3\" (183–190 cm)",
  },
  {
    size: "XXL",
    intl: "46",
    chestOrWaist: { in: "48.0\"", cm: "122 cm" },
    shoulderOrHip: { in: "20.5\"", cm: "52 cm" },
    length: { in: "31.0\"", cm: "78.5 cm" },
    sleeveOrInseam: { in: "26.5\"", cm: "67.5 cm" },
    recommendedWeight: "95 – 108 kg",
    recommendedHeight: "6'1\" – 6'5\" (185–195 cm)",
  },
];

const BOTTOMS_DATA: TableRow[] = [
  {
    size: "30",
    intl: "S",
    chestOrWaist: { in: "30.5\"", cm: "77.5 cm" },
    shoulderOrHip: { in: "38.5\"", cm: "98 cm" },
    length: { in: "39.5\"", cm: "100.5 cm" },
    sleeveOrInseam: { in: "30.0\"", cm: "76 cm" },
    recommendedWeight: "52 – 60 kg",
    recommendedHeight: "5'5\" – 5'8\" (165–173 cm)",
  },
  {
    size: "32",
    intl: "M",
    chestOrWaist: { in: "32.5\"", cm: "82.5 cm" },
    shoulderOrHip: { in: "40.5\"", cm: "103 cm" },
    length: { in: "40.0\"", cm: "101.5 cm" },
    sleeveOrInseam: { in: "30.5\"", cm: "77.5 cm" },
    recommendedWeight: "60 – 70 kg",
    recommendedHeight: "5'7\" – 5'10\" (170–178 cm)",
  },
  {
    size: "34",
    intl: "L",
    chestOrWaist: { in: "34.5\"", cm: "87.5 cm" },
    shoulderOrHip: { in: "42.5\"", cm: "108 cm" },
    length: { in: "40.5\"", cm: "103 cm" },
    sleeveOrInseam: { in: "31.0\"", cm: "78.5 cm" },
    recommendedWeight: "70 – 80 kg",
    recommendedHeight: "5'9\" – 6'0\" (175–183 cm)",
  },
  {
    size: "36",
    intl: "XL",
    chestOrWaist: { in: "36.5\"", cm: "92.5 cm" },
    shoulderOrHip: { in: "44.5\"", cm: "113 cm" },
    length: { in: "41.0\"", cm: "104 cm" },
    sleeveOrInseam: { in: "31.5\"", cm: "80 cm" },
    recommendedWeight: "80 – 92 kg",
    recommendedHeight: "5'11\" – 6'2\" (180–188 cm)",
  },
  {
    size: "38",
    intl: "XXL",
    chestOrWaist: { in: "38.5\"", cm: "98 cm" },
    shoulderOrHip: { in: "46.5\"", cm: "118 cm" },
    length: { in: "41.5\"", cm: "105.5 cm" },
    sleeveOrInseam: { in: "32.0\"", cm: "81 cm" },
    recommendedWeight: "92 – 105 kg",
    recommendedHeight: "6'0\" – 6'4\" (183–193 cm)",
  },
  {
    size: "40",
    intl: "3XL",
    chestOrWaist: { in: "40.5\"", cm: "103 cm" },
    shoulderOrHip: { in: "48.5\"", cm: "123 cm" },
    length: { in: "42.0\"", cm: "106.5 cm" },
    sleeveOrInseam: { in: "32.0\"", cm: "81 cm" },
    recommendedWeight: "105 – 118 kg",
    recommendedHeight: "6'1\" – 6'5\" (185–195 cm)",
  },
];

const KNITWEAR_DATA: TableRow[] = [
  {
    size: "S",
    intl: "38",
    chestOrWaist: { in: "40.0\"", cm: "101.5 cm" },
    shoulderOrHip: { in: "17.0\"", cm: "43 cm" },
    length: { in: "27.5\"", cm: "70 cm" },
    sleeveOrInseam: { in: "24.5\"", cm: "62 cm" },
    recommendedWeight: "58 – 68 kg",
    recommendedHeight: "5'6\" – 5'8\" (168–173 cm)",
  },
  {
    size: "M",
    intl: "40",
    chestOrWaist: { in: "42.0\"", cm: "106.5 cm" },
    shoulderOrHip: { in: "17.8\"", cm: "45 cm" },
    length: { in: "28.5\"", cm: "72.5 cm" },
    sleeveOrInseam: { in: "25.0\"", cm: "63.5 cm" },
    recommendedWeight: "68 – 78 kg",
    recommendedHeight: "5'8\" – 5'11\" (173–180 cm)",
  },
  {
    size: "L",
    intl: "42",
    chestOrWaist: { in: "44.5\"", cm: "113 cm" },
    shoulderOrHip: { in: "18.5\"", cm: "47 cm" },
    length: { in: "29.5\"", cm: "75 cm" },
    sleeveOrInseam: { in: "25.5\"", cm: "65 cm" },
    recommendedWeight: "78 – 88 kg",
    recommendedHeight: "5'10\" – 6'1\" (178–185 cm)",
  },
  {
    size: "XL",
    intl: "44",
    chestOrWaist: { in: "47.0\"", cm: "119.5 cm" },
    shoulderOrHip: { in: "19.5\"", cm: "49.5 cm" },
    length: { in: "30.5\"", cm: "77.5 cm" },
    sleeveOrInseam: { in: "26.0\"", cm: "66 cm" },
    recommendedWeight: "88 – 100 kg",
    recommendedHeight: "6'0\" – 6'3\" (183–190 cm)",
  },
];

const BLAZERS_DATA: TableRow[] = [
  {
    size: "38R",
    intl: "S",
    chestOrWaist: { in: "40.0\"", cm: "101.5 cm" },
    shoulderOrHip: { in: "17.8\"", cm: "45.2 cm" },
    length: { in: "29.0\"", cm: "73.5 cm" },
    sleeveOrInseam: { in: "25.0\"", cm: "63.5 cm" },
    recommendedWeight: "60 – 68 kg",
    recommendedHeight: "5'7\" – 5'9\" (170–175 cm)",
  },
  {
    size: "40R",
    intl: "M",
    chestOrWaist: { in: "42.0\"", cm: "106.5 cm" },
    shoulderOrHip: { in: "18.5\"", cm: "47 cm" },
    length: { in: "29.5\"", cm: "75 cm" },
    sleeveOrInseam: { in: "25.5\"", cm: "64.8 cm" },
    recommendedWeight: "68 – 78 kg",
    recommendedHeight: "5'9\" – 5'11\" (175–180 cm)",
  },
  {
    size: "42R",
    intl: "L",
    chestOrWaist: { in: "44.0\"", cm: "111.8 cm" },
    shoulderOrHip: { in: "19.2\"", cm: "48.8 cm" },
    length: { in: "30.0\"", cm: "76.2 cm" },
    sleeveOrInseam: { in: "26.0\"", cm: "66 cm" },
    recommendedWeight: "78 – 88 kg",
    recommendedHeight: "5'11\" – 6'1\" (180–185 cm)",
  },
  {
    size: "44R",
    intl: "XL",
    chestOrWaist: { in: "46.0\"", cm: "116.8 cm" },
    shoulderOrHip: { in: "20.0\"", cm: "50.8 cm" },
    length: { in: "30.5\"", cm: "77.5 cm" },
    sleeveOrInseam: { in: "26.5\"", cm: "67.3 cm" },
    recommendedWeight: "88 – 98 kg",
    recommendedHeight: "6'0\" – 6'3\" (183–190 cm)",
  },
];

export default function SizeGuidePage() {
  const [unit, setUnit] = useState<Unit>("in");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("tops");
  const [highlightedSize, setHighlightedSize] = useState<string | null>(null);

  // Smart Fit Calculator State
  const [calcHeightFt, setCalcHeightFt] = useState<number>(5);
  const [calcHeightIn, setCalcHeightIn] = useState<number>(9);
  const [calcWeightKg, setCalcWeightKg] = useState<number>(72);
  const [calcFitStyle, setCalcFitStyle] = useState<"slim" | "regular" | "oversized">("regular");
  const [calcType, setCalcType] = useState<"tops" | "bottoms">("tops");

  // Dynamic recommendation calculation
  const recommendation = useMemo(() => {
    // Total height in inches
    const totalHeightInches = calcHeightFt * 12 + calcHeightIn;
    const weight = calcWeightKg;

    if (calcType === "tops") {
      let suggested = "M";
      let confidence = 94;

      if (weight < 58) suggested = "XS";
      else if (weight <= 66) suggested = "S";
      else if (weight <= 76) suggested = "M";
      else if (weight <= 86) suggested = "L";
      else if (weight <= 98) suggested = "XL";
      else suggested = "XXL";

      // Fit adjustment
      if (calcFitStyle === "oversized") {
        if (suggested === "XS") suggested = "S";
        else if (suggested === "S") suggested = "M";
        else if (suggested === "M") suggested = "L";
        else if (suggested === "L") suggested = "XL";
        else if (suggested === "XL") suggested = "XXL";
      } else if (calcFitStyle === "slim" && weight < 74) {
        if (suggested === "M" && weight < 70) suggested = "S";
        else if (suggested === "L" && weight < 80) suggested = "M";
      }

      return {
        size: suggested,
        intl: suggested === "XS" ? "36" : suggested === "S" ? "38" : suggested === "M" ? "40" : suggested === "L" ? "42" : suggested === "XL" ? "44" : "46",
        confidence: `${confidence}% Match`,
        notes:
          calcFitStyle === "oversized"
            ? "We sized you up for that relaxed streetwear drop-shoulder aesthetic."
            : calcFitStyle === "slim"
            ? "Tailored fit: clean torso lines with high armholes."
            : "Standard balanced drape with comfortable breathing room.",
      };
    } else {
      // Bottoms recommendation
      let waistSize = "32";
      if (weight < 60) waistSize = "30";
      else if (weight <= 70) waistSize = "32";
      else if (weight <= 80) waistSize = "34";
      else if (weight <= 92) waistSize = "36";
      else if (weight <= 104) waistSize = "38";
      else waistSize = "40";

      return {
        size: waistSize,
        intl: `Waist ${waistSize}"`,
        confidence: "95% Match",
        notes:
          calcFitStyle === "slim"
            ? "Tapered leg profile resting cleanly over boots or sneakers."
            : "Classic straight-leg cut with comfortable thigh and knee room.",
      };
    }
  }, [calcHeightFt, calcHeightIn, calcWeightKg, calcFitStyle, calcType]);

  const activeData = useMemo(() => {
    switch (activeCategory) {
      case "tops":
        return TOPS_DATA;
      case "bottoms":
        return BOTTOMS_DATA;
      case "knitwear":
        return KNITWEAR_DATA;
      case "blazers":
        return BLAZERS_DATA;
      default:
        return TOPS_DATA;
    }
  }, [activeCategory]);

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
              <Ruler className="size-4" />
              <span>Atelier Fit &amp; Precision Tailoring</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Size Guide &amp; Fit Advice
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-light">
              Crafted in Bangladesh to exacting export tolerances. Use our interactive measurement tables,
              custom fit calculator, and flat-lay guidelines to discover your perfect silhouette on the first try.
            </p>

            {/* Jump Navigation Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
              <a
                href="#sizing-tables"
                className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-200 font-semibold transition"
              >
                Sizing Tables
              </a>
              <a
                href="#fit-calculator"
                className="px-3.5 py-2 rounded-xl bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500/50 text-orange-300 font-semibold transition"
              >
                Smart Fit Calculator
              </a>
              <a
                href="#how-to-measure"
                className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-200 font-semibold transition"
              >
                How to Measure
              </a>
              <a
                href="#fit-profiles"
                className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-200 font-semibold transition"
              >
                Fit Profiles
              </a>
              <a
                href="#fabric-care"
                className="px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700/60 text-stone-200 font-semibold transition"
              >
                Fabric &amp; Shrinkage
              </a>
            </div>
          </div>
        </section>

        {/* 7-Day Guarantee Strip */}
        <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200/80 dark:border-orange-800/40 py-3.5 px-4 text-center">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-orange-900 dark:text-orange-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="size-4 text-orange-600 dark:text-orange-400" />
              <span>100% Fit Guarantee:</span>
            </span>
            <span>Wrong size? Enjoy hassle-free 7-day doorstep size exchange across all 64 districts in Bangladesh.</span>
            <Link
              to="/returns-and-exchanges"
              className="text-orange-700 dark:text-orange-400 font-bold underline hover:text-orange-800"
            >
              Returns &amp; Exchanges Policy &rarr;
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
          {/* ==================================================================
              SECTION 1: INTERACTIVE SIZING TABLES
              ================================================================== */}
          <section id="sizing-tables" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
                  Precision Garment Specs
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  Garment Measurement Charts
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
                  Select a product category below. Measurements represent actual garment flat dimensions.
                </p>
              </div>

              {/* Unit Switcher & Category Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 bg-stone-200/70 dark:bg-neutral-800 rounded-xl border border-stone-300/60 dark:border-neutral-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setUnit("in")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      unit === "in"
                        ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      unit === "cm"
                        ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>
            </div>

            {/* Category Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory("tops")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "tops"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200 dark:border-neutral-800 hover:bg-stone-100"
                }`}
              >
                <Shirt className="size-4" />
                <span>Jackets, Shirts &amp; Tees</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("bottoms")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "bottoms"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200 dark:border-neutral-800 hover:bg-stone-100"
                }`}
              >
                <Scissors className="size-4" />
                <span>Denim &amp; Trousers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("blazers")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "blazers"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200 dark:border-neutral-800 hover:bg-stone-100"
                }`}
              >
                <Layers className="size-4" />
                <span>Workwear Blazers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("knitwear")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "knitwear"
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200 dark:border-neutral-800 hover:bg-stone-100"
                }`}
              >
                <Sparkles className="size-4" />
                <span>Knitwear &amp; Sweaters</span>
              </button>
            </div>

            {/* Sizing Table Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-stone-100/70 dark:bg-neutral-800/70 border-b border-stone-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-300 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-4 sm:p-5">Size Label</th>
                      <th className="p-4 sm:p-5">UK/US Intl</th>
                      <th className="p-4 sm:p-5">
                        {activeCategory === "bottoms" ? "Waist" : "Chest / Bust"}
                      </th>
                      <th className="p-4 sm:p-5">
                        {activeCategory === "bottoms" ? "Seat / Hip" : "Shoulders"}
                      </th>
                      <th className="p-4 sm:p-5">Total Length</th>
                      <th className="p-4 sm:p-5">
                        {activeCategory === "bottoms" ? "Inseam" : "Sleeve"}
                      </th>
                      <th className="p-4 sm:p-5">Ideal Weight</th>
                      <th className="p-4 sm:p-5">Ideal Height</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-neutral-800">
                    {activeData.map((row) => {
                      const isHighlighted = highlightedSize === row.size;
                      return (
                        <tr
                          key={row.size}
                          onClick={() => setHighlightedSize(row.size === highlightedSize ? null : row.size)}
                          className={`transition cursor-pointer ${
                            isHighlighted
                              ? "bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-semibold"
                              : "hover:bg-stone-50 dark:hover:bg-neutral-800/40"
                          }`}
                        >
                          <td className="p-4 sm:p-5 font-black text-gray-900 dark:text-white flex items-center gap-2">
                            {isHighlighted && (
                              <span className="size-2 rounded-full bg-orange-600" />
                            )}
                            <span>{row.size}</span>
                          </td>
                          <td className="p-4 sm:p-5 text-gray-600 dark:text-neutral-400 font-mono">
                            {row.intl}
                          </td>
                          <td className="p-4 sm:p-5 font-mono font-bold text-gray-900 dark:text-white">
                            {unit === "in" ? row.chestOrWaist.in : row.chestOrWaist.cm}
                          </td>
                          <td className="p-4 sm:p-5 font-mono text-gray-700 dark:text-neutral-300">
                            {unit === "in" ? row.shoulderOrHip.in : row.shoulderOrHip.cm}
                          </td>
                          <td className="p-4 sm:p-5 font-mono text-gray-700 dark:text-neutral-300">
                            {unit === "in" ? row.length.in : row.length.cm}
                          </td>
                          <td className="p-4 sm:p-5 font-mono text-gray-700 dark:text-neutral-300">
                            {unit === "in" ? row.sleeveOrInseam.in : row.sleeveOrInseam.cm}
                          </td>
                          <td className="p-4 sm:p-5 text-gray-600 dark:text-neutral-400 text-xs">
                            {row.recommendedWeight}
                          </td>
                          <td className="p-4 sm:p-5 text-gray-600 dark:text-neutral-400 text-xs">
                            {row.recommendedHeight}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-stone-50/60 dark:bg-neutral-950 border-t border-stone-200/80 dark:border-neutral-800 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                <span>Tip: Click on any row to highlight and compare measurements.</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  Tolerance: ±0.5 inches (±1.2 cm)
                </span>
              </div>
            </div>
          </section>

          {/* ==================================================================
              SECTION 2: SMART FIT CALCULATOR ("FIND MY FIT")
              ================================================================== */}
          <section id="fit-calculator" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider">
                  <Calculator className="size-3.5" />
                  <span>Interactive Sizing Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Smart Fit Recommender
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-light">
                  Input your personal height, body weight, and desired silhouette drape. Our algorithm computes the ideal garment size for Fedoll cuts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Inputs Column */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Category Toggle */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                      Garment Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCalcType("tops")}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          calcType === "tops"
                            ? "bg-orange-600 text-white border-orange-500 shadow-md"
                            : "bg-stone-800/80 text-stone-300 border-stone-700/80 hover:bg-stone-700"
                        }`}
                      >
                        <Shirt className="size-4" />
                        <span>Jackets, Shirts &amp; Tees</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalcType("bottoms")}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          calcType === "bottoms"
                            ? "bg-orange-600 text-white border-orange-500 shadow-md"
                            : "bg-stone-800/80 text-stone-300 border-stone-700/80 hover:bg-stone-700"
                        }`}
                      >
                        <Scissors className="size-4" />
                        <span>Denim &amp; Trousers</span>
                      </button>
                    </div>
                  </div>

                  {/* Height & Weight Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-stone-300">Your Height</label>
                        <span className="font-mono text-orange-400 font-bold">
                          {calcHeightFt}&apos;{calcHeightIn}&quot; ({Math.round((calcHeightFt * 12 + calcHeightIn) * 2.54)} cm)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={calcHeightFt}
                          onChange={(e) => setCalcHeightFt(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-orange-600"
                        >
                          <option value={4}>4 Feet</option>
                          <option value={5}>5 Feet</option>
                          <option value={6}>6 Feet</option>
                        </select>
                        <select
                          value={calcHeightIn}
                          onChange={(e) => setCalcHeightIn(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-orange-600"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                              {i} Inches
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-stone-300">Your Weight</label>
                        <span className="font-mono text-orange-400 font-bold">
                          {calcWeightKg} kg ({Math.round(calcWeightKg * 2.20462)} lbs)
                        </span>
                      </div>
                      <input
                        type="range"
                        min={45}
                        max={120}
                        value={calcWeightKg}
                        onChange={(e) => setCalcWeightKg(Number(e.target.value))}
                        className="w-full accent-orange-600 bg-stone-800 rounded-lg cursor-pointer h-2 mt-3"
                      />
                    </div>
                  </div>

                  {/* Fit Style Preference */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                      Preferred Fit Silhouette
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCalcFitStyle("slim")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                          calcFitStyle === "slim"
                            ? "bg-orange-600 text-white border-orange-500 shadow-xs"
                            : "bg-stone-800/60 text-stone-300 border-stone-700/80 hover:bg-stone-700"
                        }`}
                      >
                        Tailored / Slim
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalcFitStyle("regular")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                          calcFitStyle === "regular"
                            ? "bg-orange-600 text-white border-orange-500 shadow-xs"
                            : "bg-stone-800/60 text-stone-300 border-stone-700/80 hover:bg-stone-700"
                        }`}
                      >
                        Classic / Regular
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalcFitStyle("oversized")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                          calcFitStyle === "oversized"
                            ? "bg-orange-600 text-white border-orange-500 shadow-xs"
                            : "bg-stone-800/60 text-stone-300 border-stone-700/80 hover:bg-stone-700"
                        }`}
                      >
                        Relaxed / Street
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recommendation Result Card */}
                <div className="lg:col-span-5 bg-stone-800/80 rounded-3xl p-6 sm:p-8 border border-stone-700/80 flex flex-col justify-between space-y-6 text-center">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                      Calculated Atelier Fit
                    </span>
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                      {recommendation.size}
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                      {recommendation.confidence}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed font-light">
                    {recommendation.notes}
                  </p>

                  <div className="pt-2 border-t border-stone-700/60 flex items-center justify-between text-xs text-stone-400">
                    <span>Intl standard: <strong>{recommendation.intl}</strong></span>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold transition"
                    >
                      <span>Shop Size {recommendation.size}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================
              SECTION 3: HOW TO MEASURE GUIDE
              ================================================================== */}
          <section id="how-to-measure" className="space-y-8 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Step-by-Step Instructions
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                How to Measure Like a Tailor
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                For the most accurate fit, lay your best-fitting garment flat on a hard table and measure across using a flexible tape.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Point 1: Chest */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Chest / Bust Width
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Button or zip the garment completely. Lay flat and measure armpit to armpit seam across the fullest part of the chest, then double the number.
                </p>
                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                  Example: 20.75&quot; across flat = 41.5&quot; Chest (Size M)
                </div>
              </div>

              {/* Point 2: Shoulder */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Shoulder Point to Point
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Turn garment onto its back. Measure horizontally across the highest points where the shoulder seam joins the sleeve head.
                </p>
                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                  Tip: Essential for tailored jackets &amp; selvedge coats.
                </div>
              </div>

              {/* Point 3: Sleeve Length */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Sleeve Length
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Start from the outer shoulder tip and follow along the outer edge of the arm down to the very end of the cuff opening.
                </p>
                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                  Sits nicely past the wrist bone without bunching.
                </div>
              </div>

              {/* Point 4: Natural Waist */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
                  4
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Trouser Waistband
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Button trousers flat. Fasten waist and pull the front and back waistband level. Measure edge to edge and double.
                </p>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Example: 16.25&quot; flat = 32.5&quot; Waist (Size 32)
                </div>
              </div>

              {/* Point 5: Inseam Length */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
                  5
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Inseam Length
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Measure from the lowest point of the crotch seam straight down the inside seam to the bottom hem of the leg.
                </p>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Standard 30–32&quot; inseam provides ideal clean break.
                </div>
              </div>

              {/* Point 6: Total Body Length */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 shadow-xs space-y-3">
                <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base">
                  6
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Garment Center Back Length
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                  From the base of the back collar seam (center of neck) straight down the vertical spine to the lowest hem line.
                </p>
                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                  Ensures perfect torso coverage when seated.
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================================
              SECTION 4: FIT PROFILES EXPLAINED
              ================================================================== */}
          <section id="fit-profiles" className="space-y-8 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Silhouettes &amp; Drape
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Understanding Fedoll Cut Profiles
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                Choose the fit profile that matches your styling aesthetic.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile 1: Tailored Slim */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">
                  Tailored / Slim Cut
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sleek &amp; Contoured
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                  Fitted through the chest, waist, and sleeve. High armholes provide a modern, sharp look for formal office wear and evening outings without excess fabric blousing.
                </p>
                <ul className="space-y-2 pt-2 border-t border-stone-100 dark:border-neutral-800 text-xs text-gray-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Closer to the body</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Tapered sleeve and torso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>If between sizes, consider sizing up</span>
                  </li>
                </ul>
              </div>

              {/* Profile 2: Classic Regular */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-orange-500/80 p-6 sm:p-8 shadow-md space-y-4 relative">
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
                  Most Popular
                </span>
                <div className="inline-block px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
                  Classic Regular Cut
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Timeless &amp; Balanced
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                  Our signature atelier silhouette. Engineered with adequate chest room, natural shoulder slope, and easy mobility for all-day comfort across Dhaka temperatures.
                </p>
                <ul className="space-y-2 pt-2 border-t border-stone-100 dark:border-neutral-800 text-xs text-gray-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>True to standard international sizing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Comfortable 2–3&quot; ease around chest</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Order your normal measured size</span>
                  </li>
                </ul>
              </div>

              {/* Profile 3: Relaxed Oversized */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">
                  Relaxed Oversized Cut
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Streetwear &amp; Layering
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
                  Dropped shoulder seams, generous chest allowance, and boxier drape. Tailored specifically for casual streetwear and cold-weather knitwear layering.
                </p>
                <ul className="space-y-2 pt-2 border-t border-stone-100 dark:border-neutral-800 text-xs text-gray-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Dropped shoulder line</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Extra 4–6&quot; chest circumference</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-orange-600" />
                    <span>Designed to look intentionally relaxed</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ==================================================================
              SECTION 5: FABRIC SHRINKAGE & CARE ADVICE
              ================================================================== */}
          <section id="fabric-care" className="space-y-6 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Longevity &amp; Fabric Science
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                Fabric Shrinkage &amp; Care Advice
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                How our premium textiles behave after washing, and how to maintain their tailored shape.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  Raw Selvedge Denim
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  14oz Shuttle-Loom Denim
                </h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                  Sanforized fabric shrinks less than <strong>1–2%</strong> on cold wash. Hand-wash inside out and hang dry to preserve indigo whisker fades. Never tumble dry.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Combed Cotton
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  240 GSM Heavyweight Tees
                </h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                  Pre-washed and mercerized ring-spun cotton. Shrinkage is pre-locked under <strong>1%</strong>. Wash in cold water (30°C) with like colors.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Wool &amp; Blends
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  Double-Layer Winter Coats
                </h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                  Natural animal fibers are sensitive to hot water and agitation. Professional <strong>dry cleaning only</strong> to maintain drape and prevent fiber felting.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  Stretch Workwear
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  Cotton-Elastane Twill
                </h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                  Contains 2% elastane for flexible recovery. Iron inside-out with medium heat. Avoid harsh bleaches to preserve elasticity over years of wear.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================================
              SECTION 6: STYLIST CONCIERGE & ASSISTANCE CARD
              ================================================================== */}
          <section className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold uppercase tracking-wider">
                  Personal Stylist Concierge
                </span>
                <h3 className="text-2xl sm:text-3xl font-black">
                  Still Hesitating Between Two Sizes?
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
                  Send us your height, weight, and your desired garment link on WhatsApp.
                  Our Dhaka atelier stylist will recommend the exact size for you in under 15 minutes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href="https://wa.me/8801712345678?text=Hello%20Fedoll%20Stylist,%20I%20need%20help%20choosing%20my%20size"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span>Chat on WhatsApp</span>
                </a>

                <Link
                  to="/contact-us"
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-stone-100 text-gray-900 dark:text-white font-bold text-xs border border-stone-300 dark:border-neutral-700 transition flex items-center justify-center gap-2"
                >
                  <Phone className="size-4" />
                  <span>Call Atelier Support</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-2">
                <TruckIcon className="size-4 text-orange-400" />
                <span>Cash on Delivery &amp; Doorstep Size Exchange across all 64 districts in Bangladesh</span>
              </span>
              <Link
                to="/products"
                className="text-orange-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Browse Latest Collections</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
