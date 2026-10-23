import React from "react";

export interface StockStatusInfo {
  state: "out_of_stock" | "low_stock" | "in_stock";
  label: string;
  count?: number;
  badgeClass: string;
}

/**
 * Universal inventory visibility helper:
 * - When stock count is 0 (or out of stock): "Out of Stock"
 * - When stock count is below 5 (<= 5 and > 0): reveals exact count "Only X left!"
 * - When stock count is above 5: reveals ONLY "Stock Available" without exposing exact inventory count
 */
export const getStockStatusInfo = (
  stockCount?: number,
  inStock: boolean = true
): StockStatusInfo => {
  const count = typeof stockCount === "number" ? Math.floor(stockCount) : undefined;
  const isAvailable = inStock !== false && (count === undefined || count > 0);

  if (!isAvailable || (count !== undefined && count <= 0)) {
    return {
      state: "out_of_stock",
      label: "Sold Out",
      count: 0,
      badgeClass:
        "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    };
  }

  // Below or equal to 5 (1, 2, 3, 4, 5 units): Show exact count with urgency
  if (count !== undefined && count <= 5) {
    return {
      state: "low_stock",
      label: `Only ${count} left!`,
      count,
      badgeClass:
        "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    };
  }

  // Above 5: Do NOT reveal exact count, just show "Stock Available"
  return {
    state: "in_stock",
    label: "Stock Available",
    count: undefined,
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  };
};

interface StockAvailabilityBadgeProps {
  stockCount?: number;
  inStock?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  showDot?: boolean;
  customLowStockPrefix?: string;
}

export const StockAvailabilityBadge: React.FC<StockAvailabilityBadgeProps> = ({
  stockCount,
  inStock = true,
  size = "xs",
  className = "",
  showDot = true,
  customLowStockPrefix,
}) => {
  const info = getStockStatusInfo(stockCount, inStock);

  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 rounded-full font-bold",
    sm: "text-xs px-2.5 py-1 rounded-lg font-semibold",
    md: "text-xs px-3 py-1.5 rounded-xl font-semibold",
  };

  const displayLabel =
    info.state === "low_stock" && customLowStockPrefix && info.count !== undefined
      ? `${customLowStockPrefix} ${info.count} left!`
      : info.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border shadow-2xs backdrop-blur-xs transition-colors shrink-0 ${
        info.badgeClass
      } ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        info.state === "low_stock" ? (
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
        ) : info.state === "in_stock" ? (
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        ) : (
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
        )
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

export default StockAvailabilityBadge;
