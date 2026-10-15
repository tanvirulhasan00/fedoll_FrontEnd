import React, { useState } from "react";
import {
  Ruler,
  Check,
  ShieldCheck,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SizeGuideBoxProps {
  category?: string;
  selectedSize?: string;
  onOpenModal?: () => void;
  compact?: boolean;
}

interface TopsMeasurement {
  size: string;
  matchSizes: string[];
  chestIn: string;
  chestCm: string;
  shoulderIn: string;
  shoulderCm: string;
  lengthIn: string;
  lengthCm: string;
  sleeveIn: string;
  sleeveCm: string;
}

interface BottomsMeasurement {
  size: string;
  matchSizes: string[];
  waistIn: string;
  waistCm: string;
  hipIn: string;
  hipCm: string;
  lengthIn: string;
  lengthCm: string;
  thighIn: string;
  thighCm: string;
}

const TOPS_DATA: TopsMeasurement[] = [
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

const BOTTOMS_DATA: BottomsMeasurement[] = [
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

export default function SizeGuideBox({
  category = "Shirts",
  selectedSize = "",
  onOpenModal,
  compact = false,
}: SizeGuideBoxProps) {
  const isBottomCategory =
    category === "Trousers" ||
    category === "Denim" ||
    category?.toLowerCase().includes("pant") ||
    category?.toLowerCase().includes("jean");

  const [activeTab, setActiveTab] = useState<"tops" | "bottoms">(
    isBottomCategory ? "bottoms" : "tops"
  );
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [showHowToMeasure, setShowHowToMeasure] = useState(false);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-xs space-y-3.5 shadow-xs transition-all">
      {/* Top Bar: Title & Unit Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Ruler className="size-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm leading-tight">
              Bangladesh Fit &amp; Measurements
            </h4>
            <span className="text-[11px] text-gray-500 dark:text-neutral-400">
              Standard garment measurements
            </span>
          </div>
        </div>

        {/* Unit Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-stone-200/70 dark:bg-neutral-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setUnit("in")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                unit === "in"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-2xs font-bold"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200"
              }`}
            >
              Inches (&quot;)
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                unit === "cm"
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-2xs font-bold"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200"
              }`}
            >
              CM
            </button>
          </div>

          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              title="Open full size guide modal"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500 transition cursor-pointer text-[11px] font-medium"
            >
              <Maximize2 className="size-3" />
              <span>Full Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (Tops vs Bottoms) */}
      <div className="flex items-center gap-1.5 border-b border-stone-200/50 dark:border-neutral-800/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("tops")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "tops"
              ? "bg-orange-600 text-white shadow-2xs"
              : "bg-white dark:bg-neutral-800/80 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 border border-stone-200 dark:border-neutral-700"
          }`}
        >
          Tops / Shirts / Panjabis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bottoms")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "bottoms"
              ? "bg-orange-600 text-white shadow-2xs"
              : "bg-white dark:bg-neutral-800/80 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 border border-stone-200 dark:border-neutral-700"
          }`}
        >
          Trousers / Denims
        </button>
      </div>

      {/* Responsive Non-Overlapping Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950/70 shadow-2xs">
        {activeTab === "tops" ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/80 dark:bg-neutral-800/70 border-b border-stone-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold">
                <th className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                  Size
                </th>
                <th className="py-2.5 px-3 text-center">
                  Chest ({unit})
                </th>
                <th className="py-2.5 px-3 text-center">
                  Shoulder ({unit})
                </th>
                <th className="py-2.5 px-3 text-center">
                  Length ({unit})
                </th>
                {!compact && (
                  <th className="py-2.5 px-3 text-center hidden sm:table-cell">
                    Sleeve ({unit})
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-gray-700 dark:text-neutral-300">
              {TOPS_DATA.map((row) => {
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
                        ? "bg-orange-50/90 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-semibold"
                        : "hover:bg-stone-50/70 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold whitespace-nowrap text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{row.size}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-600 text-white tracking-wide">
                          <Check className="size-2.5 stroke-3" />
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.chestIn : row.chestCm}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.shoulderIn : row.shoulderCm}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.lengthIn : row.lengthCm}
                    </td>
                    {!compact && (
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap hidden sm:table-cell">
                        {unit === "in" ? row.sleeveIn : row.sleeveCm}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/80 dark:bg-neutral-800/70 border-b border-stone-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold">
                <th className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                  Waist Size
                </th>
                <th className="py-2.5 px-3 text-center">
                  Waist ({unit})
                </th>
                <th className="py-2.5 px-3 text-center">
                  Hip ({unit})
                </th>
                <th className="py-2.5 px-3 text-center">
                  Length ({unit})
                </th>
                {!compact && (
                  <th className="py-2.5 px-3 text-center hidden sm:table-cell">
                    Thigh ({unit})
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-gray-700 dark:text-neutral-300">
              {BOTTOMS_DATA.map((row) => {
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
                        ? "bg-orange-50/90 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-semibold"
                        : "hover:bg-stone-50/70 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold whitespace-nowrap text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{row.size}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-600 text-white tracking-wide">
                          <Check className="size-2.5 stroke-3" />
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.waistIn : row.waistCm}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.hipIn : row.hipCm}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                      {unit === "in" ? row.lengthIn : row.lengthCm}
                    </td>
                    {!compact && (
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap hidden sm:table-cell">
                        {unit === "in" ? row.thighIn : row.thighCm}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* How to Measure Accordion Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowHowToMeasure(!showHowToMeasure)}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
        >
          {showHowToMeasure ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          <span>How to measure for the perfect fit?</span>
        </button>

        {showHowToMeasure && (
          <div className="mt-2 p-3 rounded-xl bg-white dark:bg-neutral-950/60 border border-stone-200/70 dark:border-neutral-800 text-[11px] space-y-1.5 text-gray-600 dark:text-neutral-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Chest:</strong> Measure around fullest part under arms, keeping tape straight.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Shoulder:</strong> Measure straight across back from shoulder tip to shoulder tip.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Length:</strong> Measure from highest point of shoulder down to bottom hem.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Waist:</strong> Measure around your natural waistline where trousers comfortably sit.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Guarantee Banner */}
      <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 dark:border-neutral-800/80 text-[11px] text-gray-600 dark:text-neutral-400">
        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          Unsure about sizing? We offer a <strong>7-day hassle-free size exchange</strong> anywhere in Bangladesh.
        </span>
      </div>
    </div>
  );
}
