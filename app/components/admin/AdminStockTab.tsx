import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
  DocumentDuplicateIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ProductItem, ProductCategoryItem, Order } from "~/firebase";
import {
  type StockMovement,
  type StockMovementType,
  fetchStockMovements,
  restockProductOrVariant,
  initializeCatalogStockLedgerIfEmpty,
} from "~/firebase";

interface AdminStockTabProps {
  products: ProductItem[];
  categories: ProductCategoryItem[];
  orders?: Order[];
  onRefresh: () => void;
  onNavigateTab?: (tab: any) => void;
  adminName?: string;
}

export const AdminStockTab: React.FC<AdminStockTabProps> = ({
  products,
  categories,
  orders = [],
  onRefresh,
  onNavigateTab,
  adminName = "Admin Atelier Desk",
}) => {
  // Views: "inventory" (Uneditable table) | "ledger" (Audit movement log)
  const [activeView, setActiveView] = useState<"inventory" | "ledger">("inventory");

  // Movemens State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Filters for Live Stock Table
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Filters for Movement Ledger
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>("all");
  const [ledgerProductFilter, setLedgerProductFilter] = useState<string>("all");

  // Restock Modal State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("all");
  const [allVariantsMode, setAllVariantsMode] = useState<"distribute" | "each">("distribute");
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNote, setRestockNote] = useState("");
  const [referenceBatch, setReferenceBatch] = useState("");
  const [submittingRestock, setSubmittingRestock] = useState(false);

  // Load and sync stock movements
  const loadMovements = async () => {
    setLoadingMovements(true);
    try {
      let data = await fetchStockMovements(undefined, 200);
      if (data.length === 0 && products.length > 0) {
        data = await initializeCatalogStockLedgerIfEmpty(products);
      }
      setMovements(data);
    } catch (err) {
      console.warn("Could not load stock movements:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [products]);

  // Live Products State with immediate local reactivity
  const [localProducts, setLocalProducts] = useState<ProductItem[]>(products);

  useEffect(() => {
    if (products && products.length > 0) {
      setLocalProducts(products);
    }
  }, [products]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    localProducts.forEach((p) => {
      const stock = Number(p.stockCount) || 0;
      totalUnits += stock;
      totalValuation += stock * (Number(p.price) || 0);

      if (stock === 0 || !p.inStock) {
        outOfStockCount++;
      } else if (stock <= 5) {
        lowStockCount++;
      }
    });

    return {
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      totalMovements: movements.length,
    };
  }, [localProducts, movements]);

  // Filtered Products for Live Stock Table
  const filteredProducts = useMemo(() => {
    return localProducts.filter((p) => {
      const stock = Number(p.stockCount) || 0;

      // Category filter
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === "in_stock" && (stock <= 5 || !p.inStock)) {
        return false;
      }
      if (stockStatusFilter === "low_stock" && (stock > 5 || stock === 0)) {
        return false;
      }
      if (stockStatusFilter === "out_of_stock" && stock > 0 && p.inStock) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(p.name || "").toLowerCase().includes(q);
        const matchCat = String(p.category || "").toLowerCase().includes(q);
        const matchSku = String(p.sku || "").toLowerCase().includes(q);
        const matchId = String(p.id || "").toLowerCase().includes(q);
        const matchVariant = p.variants?.some(
          (v) =>
            String(v.sku || "").toLowerCase().includes(q) ||
            String(v.size || "").toLowerCase().includes(q) ||
            String(v.color || "").toLowerCase().includes(q)
        );
        if (!matchName && !matchCat && !matchSku && !matchId && !matchVariant) return false;
      }

      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  // Filtered Movements for Ledger
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (ledgerTypeFilter !== "all" && m.type !== ledgerTypeFilter) {
        return false;
      }
      if (ledgerProductFilter !== "all" && String(m.productId) !== String(ledgerProductFilter)) {
        return false;
      }
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        const matchName = String(m.productName || "").toLowerCase().includes(q);
        const matchRef = String(m.referenceId || "").toLowerCase().includes(q);
        const matchNote = String(m.note || "").toLowerCase().includes(q);
        const matchSku = String(m.variantSku || "").toLowerCase().includes(q);
        const matchBy = String(m.performedBy || "").toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchNote && !matchSku && !matchBy) return false;
      }
      return true;
    });
  }, [movements, ledgerTypeFilter, ledgerProductFilter, ledgerSearch]);

  // Open Restock Modal for a specific product
  const handleOpenRestock = (product?: ProductItem) => {
    if (product) {
      setSelectedProduct(product);
    } else if (localProducts.length > 0) {
      setSelectedProduct(localProducts[0]);
    } else if (products && products.length > 0) {
      setSelectedProduct(products[0]);
    }
    setSelectedVariantId("all");
    setAllVariantsMode("distribute");
    setRestockQty(10);
    setRestockNote("Fresh batch received at Uttara Atelier Hub.");
    setReferenceBatch(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsRestockOpen(true);
  };

  // Submit Restock
  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a catalog garment to restock.");
      return;
    }

    const qty = Math.max(1, Math.floor(Number(restockQty) || 0));
    if (qty <= 0) {
      toast.error("Restock quantity must be at least 1 unit.");
      return;
    }

    setSubmittingRestock(true);
    try {
      const isSpecificVariant =
        selectedVariantId &&
        selectedVariantId !== "all" &&
        selectedVariantId !== "all_distribute" &&
        selectedVariantId !== "all_each";

      const effectiveAllVariantsMode: "distribute" | "each" =
        selectedVariantId === "all_each"
          ? "each"
          : selectedVariantId === "all_distribute"
          ? "distribute"
          : allVariantsMode;

      const res = await restockProductOrVariant({
        productId: String(selectedProduct.id),
        variantId: isSpecificVariant ? selectedVariantId : undefined,
        allVariantsMode: isSpecificVariant ? undefined : effectiveAllVariantsMode,
        quantityToAdd: qty,
        note: `${restockNote.trim()} ${referenceBatch ? `[Batch: ${referenceBatch.trim()}]` : ""}`.trim(),
        performedBy: adminName,
        product: selectedProduct,
      });

      // Immediate UI update in local state for instantaneous feedback
      setLocalProducts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(selectedProduct.id)) return p;
          if (res.updatedProduct) return res.updatedProduct;
          let updatedVariants = p.variants ? [...p.variants] : [];
          if (isSpecificVariant && selectedVariantId) {
            updatedVariants = updatedVariants.map((v) =>
              String(v.id) === String(selectedVariantId)
                ? { ...v, stockCount: (Number(v.stockCount) || 0) + qty, inStock: true }
                : v
            );
          } else if (updatedVariants.length > 0) {
            if (effectiveAllVariantsMode === "each") {
              updatedVariants = updatedVariants.map((v) => ({
                ...v,
                stockCount: (Number(v.stockCount) || 0) + qty,
                inStock: true,
              }));
            } else {
              const perVar = Math.floor(qty / updatedVariants.length);
              const rem = qty % updatedVariants.length;
              updatedVariants = updatedVariants.map((v, i) => ({
                ...v,
                stockCount: (Number(v.stockCount) || 0) + perVar + (i < rem ? 1 : 0),
                inStock: true,
              }));
            }
          }
          return {
            ...p,
            variants: updatedVariants,
            stockCount: res.newStock,
            inStock: true,
          };
        })
      );

      const addedUnits = res.totalAdded || qty;
      toast.success(
        `Successfully restocked +${addedUnits} units for "${selectedProduct.name}"! New stock: ${res.newStock} pcs.`
      );
      setIsRestockOpen(false);

      try {
        await loadMovements();
      } catch (movErr) {
        console.warn("Could not reload movements after restock:", movErr);
      }

      try {
        if (typeof onRefresh === "function") {
          await onRefresh();
        }
      } catch (refErr) {
        console.warn("Could not refresh admin data after restock:", refErr);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to process restock intake.");
    } finally {
      setSubmittingRestock(false);
    }
  };

  // View history for specific product
  const handleViewProductLedger = (product: ProductItem) => {
    setLedgerProductFilter(product.id);
    setActiveView("ledger");
  };

  // Helper badge for movement types
  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "initial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <PlusIcon className="size-3" /> Initial Creation
          </span>
        );
      case "restock":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ArrowTrendingUpIcon className="size-3" /> Restock Intake
          </span>
        );
      case "sale":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShoppingCartIcon className="size-3" /> Customer Sale
          </span>
        );
      case "order_cancel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ArrowPathIcon className="size-3" /> Cancel Reversal
          </span>
        );
      case "return_restock":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <CheckCircleIcon className="size-3" /> Return Restock
          </span>
        );
      case "exchange_dispatch":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <ArrowsRightLeftIcon className="size-3" /> Exchange Dispatch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-neutral-300">
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Inventory &amp; Stock Management
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              <ShieldCheckIcon className="size-3.5 text-orange-600" />
              Real-World Ledger
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            Automated stock synchronization. Table is strictly audit-locked: sales, restocks, returns, and exchanges maintain verifiable integrity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadMovements}
            disabled={loadingMovements}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Refresh Stock Movement Ledger"
          >
            <ArrowPathIcon className={`size-4 ${loadingMovements ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenRestock()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Restock Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Total In Stock</span>
            <ArchiveBoxIcon className="size-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {metrics.totalUnits.toLocaleString()}
            <span className="text-xs font-semibold text-gray-400 ml-1">units</span>
          </p>
          <span className="text-[10px] text-gray-400 block mt-0.5">Across {products.length} garments</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Valuation (BDT)</span>
            <span className="font-mono text-xs font-black text-emerald-600">৳</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2 truncate">
            ৳{metrics.totalValuation.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 block mt-0.5">Retail inventory value</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Low Stock</span>
            <ExclamationTriangleIcon className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {metrics.lowStockCount}
            <span className="text-xs font-semibold text-gray-400 ml-1">items</span>
          </p>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">&le; 5 units remaining</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Sold Out</span>
            <XCircleIcon className="size-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {metrics.outOfStockCount}
            <span className="text-xs font-semibold text-gray-400 ml-1">items</span>
          </p>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5">Require immediate restock</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Audit Ledger</span>
            <ClockIcon className="size-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {metrics.totalMovements}
            <span className="text-xs font-semibold text-gray-400 ml-1">events</span>
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live sync active
          </span>
        </div>
      </div>

      {/* View Switcher: Live Stock Table vs Audit Movement Ledger */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView("inventory")}
            className={`px-4 py-3 text-xs font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeView === "inventory"
                ? "border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-950/20 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <ArchiveBoxIcon className="size-4" />
            <span>Live Stock Table (Read-Only Locked)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-bold">
              {filteredProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("ledger")}
            className={`px-4 py-3 text-xs font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeView === "ledger"
                ? "border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-950/20 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <ClockIcon className="size-4" />
            <span>Stock Movement Audit Ledger</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-bold">
              {filteredMovements.length}
            </span>
          </button>
        </div>

        {activeView === "inventory" && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-neutral-400 pr-2">
            <LockClosedIcon className="size-3.5 text-stone-400" />
            <span>Ledger-Locked: Direct cell typing is disabled</span>
          </div>
        )}
      </div>

      {/* VIEW 1: LIVE UNEDITABLE STOCK TABLE */}
      {activeView === "inventory" && (
        <div className="space-y-4">
          {/* Security Notice Banner */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-100/80 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 text-stone-700 dark:text-neutral-300 shadow-2xs">
                <LockClosedIcon className="size-4" />
              </div>
              <p className="text-gray-700 dark:text-neutral-300 text-[11px] sm:text-xs">
                <strong>Audit-Protected Stock Table:</strong> Quantities reflect exact physical ledger units. Direct cell typing is locked to guarantee 100% financial consistency with customer checkout sales, returns, and restocks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenRestock()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition cursor-pointer shrink-0"
            >
              <PlusIcon className="size-3.5" />
              <span>Intake Restock</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; 5 units)</option>
                <option value="low_stock">Low Stock Alert (&le; 5 units)</option>
                <option value="out_of_stock">Sold Out (0 units)</option>
              </select>

              {(selectedCategory !== "all" || stockStatusFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setStockStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garment title, SKU, variant..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
              />
            </div>
          </div>

          {/* Uneditable Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-stone-50/80 dark:bg-neutral-800/80 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider">
                    <th className="py-3.5 px-4">Garment &amp; Catalog ID</th>
                    <th className="py-3.5 px-4">SKU / Style</th>
                    <th className="py-3.5 px-4">Retail Price</th>
                    <th className="py-3.5 px-4">Total Stock</th>
                    <th className="py-3.5 px-4">Variant-Wise Inventory Breakdown</th>
                    <th className="py-3.5 px-4">Stock Valuation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-500 dark:text-neutral-400">
                        <ArchiveBoxIcon className="size-10 mx-auto text-gray-300 dark:text-neutral-700 mb-2" />
                        <p className="font-bold text-sm">No garments found matching filters.</p>
                        <p className="text-xs text-gray-400 mt-0.5">Try clearing your search term or stock filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = Number(p.stockCount) || 0;
                      const valuation = stock * (Number(p.price) || 0);
                      const hasVariants = Boolean(p.variants && p.variants.length > 0);

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          {/* Garment Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative size-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                                <img
                                  src={p.images?.[0] || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80"}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80";
                                  }}
                                />
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                  {p.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    #{p.id}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400">
                                    {p.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-gray-700 dark:text-neutral-300">
                              {p.sku || `FED-${p.id.slice(-6).toUpperCase()}`}
                            </span>
                          </td>

                          {/* Retail Price */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 dark:text-white">
                              ৳{p.price.toLocaleString()}
                            </span>
                          </td>

                          {/* Total Stock: UNEDITABLE READ-ONLY CELL */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center justify-center font-black px-2.5 py-1 rounded-xl text-xs select-none ${
                                  stock === 0
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : stock <= 5
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                }`}
                                title="Uneditable Cell: Maintained via ledger movements"
                              >
                                {stock} pcs
                              </span>
                              <LockClosedIcon
                                className="size-3 text-stone-400 select-none"
                                title="Direct cell editing disabled"
                              />
                            </div>
                          </td>

                          {/* Variant Breakdown: UNEDITABLE READ-ONLY PILLS */}
                          <td className="py-3 px-4 max-w-sm">
                            {hasVariants && p.variants ? (
                              <div className="flex flex-wrap gap-1.5">
                                {p.variants.map((v) => {
                                  const varStock = Number(v.stockCount) || 0;
                                  return (
                                    <span
                                      key={v.id}
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-medium ${
                                        varStock === 0
                                          ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400"
                                          : varStock <= 3
                                          ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400"
                                          : "bg-stone-50 border-stone-200 text-stone-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                                      }`}
                                      title={`${v.color} / Size ${v.size} (SKU: ${v.sku || "N/A"})`}
                                    >
                                      {v.colorHex && (
                                        <span
                                          className="size-2 rounded-full border border-black/10 shrink-0"
                                          style={{ backgroundColor: v.colorHex }}
                                        />
                                      )}
                                      <span className="font-semibold">{v.color.slice(0, 4)}/{v.size}:</span>
                                      <strong className="font-mono">{varStock}</strong>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Single Item (Standard Size)</span>
                            )}
                          </td>

                          {/* Valuation */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-gray-700 dark:text-neutral-300">
                              ৳{valuation.toLocaleString()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {stock === 0 || !p.inStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                                <XCircleIcon className="size-3" /> Sold Out
                              </span>
                            ) : stock <= 5 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                                <ExclamationTriangleIcon className="size-3" /> Low Stock ({stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                                <CheckCircleIcon className="size-3" /> In Stock
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRestock(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                title="Add Restock intake for this garment"
                              >
                                <PlusIcon className="size-3.5" />
                                <span>Restock</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleViewProductLedger(p)}
                                className="p-1.5 rounded-xl border border-stone-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                title="View Movement History in Ledger"
                              >
                                <ClockIcon className="size-4" />
                              </button>
                            </div>
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

      {/* VIEW 2: STOCK MOVEMENT AUDIT LEDGER */}
      {activeView === "ledger" && (
        <div className="space-y-4">
          {/* Ledger Notice */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                <ClockIcon className="size-4" />
              </div>
              <p className="text-gray-700 dark:text-neutral-300 text-[11px] sm:text-xs">
                <strong>Immutable Stock Ledger:</strong> Every unit added via restock, subtracted via sale checkout, reversed upon cancellation, or inspected in returns is permanently logged with timestamps and references.
              </p>
            </div>
            <button
              type="button"
              onClick={loadMovements}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition cursor-pointer shrink-0"
            >
              <ArrowPathIcon className="size-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Ledger Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
              >
                <option value="all">All Movement Types</option>
                <option value="sale">Storefront Sales (-)</option>
                <option value="restock">Restock Intakes (+)</option>
                <option value="order_cancel">Order Cancellations (+)</option>
                <option value="return_restock">Return Restocks (+)</option>
                <option value="exchange_dispatch">Exchange Dispatches (-)</option>
                <option value="initial">Initial Product Creation</option>
              </select>

              <select
                value={ledgerProductFilter}
                onChange={(e) => setLedgerProductFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer max-w-xs"
              >
                <option value="all">All Catalog Garments</option>
                {localProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {(ledgerTypeFilter !== "all" || ledgerProductFilter !== "all" || ledgerSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setLedgerTypeFilter("all");
                    setLedgerProductFilter("all");
                    setLedgerSearch("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                >
                  Clear Ledger Filters
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search reference #, order #, note..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-stone-50/80 dark:bg-neutral-800/80 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider">
                    <th className="py-3.5 px-4">Timestamp &amp; Reference</th>
                    <th className="py-3.5 px-4">Event Type</th>
                    <th className="py-3.5 px-4">Garment &amp; Variant</th>
                    <th className="py-3.5 px-4">Quantity Change</th>
                    <th className="py-3.5 px-4">Inventory Balance</th>
                    <th className="py-3.5 px-4">Audit Note &amp; Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/80">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-500 dark:text-neutral-400">
                        <ClockIcon className="size-10 mx-auto text-gray-300 dark:text-neutral-700 mb-2" />
                        <p className="font-bold text-sm">No stock movements found.</p>
                        <p className="text-xs text-gray-400 mt-0.5">Movements are generated when you restock, or upon sales &amp; returns.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantityDelta > 0;
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          {/* Timestamp & Reference */}
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-mono font-bold text-gray-900 dark:text-white block">
                                {m.referenceId ? `#${m.referenceId}` : `#${m.id.slice(-6)}`}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(m.createdAt).toLocaleString("en-BD", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Event Type Badge */}
                          <td className="py-3 px-4">
                            {getMovementBadge(m.type)}
                          </td>

                          {/* Garment & Variant */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {m.productImage && (
                                <img
                                  src={m.productImage}
                                  alt={m.productName}
                                  className="size-9 rounded-lg object-cover border border-stone-200 dark:border-neutral-700 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=80&q=80";
                                  }}
                                />
                              )}
                              <div className="min-w-0 max-w-xs">
                                <span className="font-bold text-gray-900 dark:text-white truncate block">
                                  {m.productName}
                                </span>
                                {(m.variantColor || m.variantSize || m.variantSku) && (
                                  <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono">
                                    {[m.variantColor, m.variantSize, m.variantSku].filter(Boolean).join(" • ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Quantity Delta */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center font-black px-2.5 py-1 rounded-xl text-xs font-mono ${
                                isPositive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              }`}
                            >
                              {isPositive ? `+${m.quantityDelta}` : m.quantityDelta} pcs
                            </span>
                          </td>

                          {/* Inventory Balance */}
                          <td className="py-3 px-4">
                            <div className="text-[11px] font-mono">
                              <span className="text-gray-400">{m.previousStock}</span>
                              <span className="mx-1 text-gray-400">&rarr;</span>
                              <strong className="text-gray-900 dark:text-white font-bold">{m.newStock} pcs</strong>
                            </div>
                          </td>

                          {/* Note & Performed By */}
                          <td className="py-3 px-4 max-w-md">
                            <p className="text-gray-800 dark:text-neutral-200 text-xs">
                              {m.note}
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                              Operated by: <strong>{m.performedBy}</strong>
                            </span>
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

      {/* RESTOCK MODAL */}
      <Transition appear show={isRestockOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsRestockOpen(false)}>
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
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 space-y-6">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                        <ArchiveBoxIcon className="size-6" />
                      </div>
                      <div>
                        <DialogTitle as="h3" className="text-lg font-black text-gray-900 dark:text-white">
                          Atelier Restock Intake
                        </DialogTitle>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                          Record verifiable stock replenishment into live store inventory.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRestockOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleExecuteRestock} className="space-y-4 text-xs">
                    {/* Product Selection */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Select Catalog Garment *
                      </label>
                      <select
                        value={selectedProduct?.id || ""}
                        onChange={(e) => {
                          const p = localProducts.find((prod) => String(prod.id) === String(e.target.value)) || null;
                          setSelectedProduct(p);
                          setSelectedVariantId("all");
                          setAllVariantsMode("distribute");
                        }}
                        className="w-full p-3 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-bold text-gray-900 dark:text-white cursor-pointer"
                      >
                        {localProducts.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} (Current Stock: {prod.stockCount ?? 0} pcs) — ৳{prod.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selection if available */}
                    {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="font-bold text-gray-700 dark:text-neutral-300">
                            Specific Variant or All Matrix *
                          </label>
                          <select
                            value={selectedVariantId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedVariantId(val);
                            }}
                            className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-medium text-gray-900 dark:text-white cursor-pointer"
                          >
                            <option value="all">
                              All Variants Matrix ({selectedProduct.variants.length} combinations)
                            </option>
                            {selectedProduct.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.color} / Size {v.size} (Current: {v.stockCount ?? 0} pcs) — SKU: {v.sku || "N/A"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Strategy Switcher for All Variants */}
                        {(selectedVariantId === "all" || selectedVariantId === "all_distribute" || selectedVariantId === "all_each") && (
                          <div className="space-y-1.5 bg-stone-100/70 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-neutral-700">
                            <label className="font-bold text-gray-700 dark:text-neutral-300 text-[11px] block">
                              All-Variants Allocation Strategy *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setAllVariantsMode("distribute")}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                  allVariantsMode === "distribute"
                                    ? "bg-white dark:bg-neutral-900 border-orange-500 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500 shadow-xs"
                                    : "bg-white/60 dark:bg-neutral-800/60 border-stone-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <span className={`size-2 rounded-full ${allVariantsMode === "distribute" ? "bg-orange-500" : "bg-stone-300 dark:bg-neutral-600"}`} />
                                  <span>Distribute Evenly</span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 leading-tight">
                                  Divides {restockQty} pcs evenly across all {selectedProduct.variants.length} variants
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setAllVariantsMode("each")}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                  allVariantsMode === "each"
                                    ? "bg-white dark:bg-neutral-900 border-orange-500 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500 shadow-xs"
                                    : "bg-white/60 dark:bg-neutral-800/60 border-stone-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <span className={`size-2 rounded-full ${allVariantsMode === "each" ? "bg-orange-500" : "bg-stone-300 dark:bg-neutral-600"}`} />
                                  <span>Add to Each Variant</span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 leading-tight">
                                  Adds +{restockQty} pcs to each of {selectedProduct.variants.length} variants (+{restockQty * selectedProduct.variants.length} total)
                                </p>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Intake Quantity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gray-700 dark:text-neutral-300">
                          Replenishment Quantity (+ Units) *
                        </label>
                        <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                          Must be greater than 0
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={restockQty}
                          onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                          className="flex-1 p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold text-base text-gray-900 dark:text-white"
                        />
                        <div className="flex items-center gap-1">
                          {[5, 10, 25, 50, 100].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRestockQty((prev) => prev + num)}
                              className="px-2.5 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-orange-600 hover:text-white text-gray-700 dark:text-neutral-300 font-bold text-[11px] transition cursor-pointer"
                            >
                              +{num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Batch / PO Reference Number */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Purchase Order / Batch Lot Reference #
                      </label>
                      <input
                        type="text"
                        value={referenceBatch}
                        onChange={(e) => setReferenceBatch(e.target.value)}
                        placeholder="e.g. PO-2026-OCT-109 / Narayanganj Lot 04"
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 font-mono font-bold"
                      />
                    </div>

                    {/* Intake Audit Notes */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700 dark:text-neutral-300">
                        Intake Reason &amp; Atelier Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={restockNote}
                        onChange={(e) => setRestockNote(e.target.value)}
                        placeholder="e.g. Received new fabric production batch from atelier..."
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-gray-400">Quick presets:</span>
                        {[
                          "New Atelier Production Run",
                          "Supplier Factory Reorder",
                          "Inter-Warehouse Transfer",
                          "Quality Pass Audit Release",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRestockNote(preset)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-orange-600 cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculation Preview Box */}
                    {selectedProduct && (
                      <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/40 text-xs space-y-2">
                        {selectedVariantId !== "all" && selectedVariantId !== "all_distribute" && selectedVariantId !== "all_each" && selectedProduct.variants ? (() => {
                          const v = selectedProduct.variants.find((item) => String(item.id) === String(selectedVariantId));
                          const currentVarStock = Number(v?.stockCount) || 0;
                          return (
                            <>
                              <div className="flex items-center justify-between text-gray-700 dark:text-neutral-300">
                                <span>Selected Variant:</span>
                                <strong>{v?.color} / {v?.size} (SKU: {v?.sku || "N/A"})</strong>
                              </div>
                              <div className="flex items-center justify-between text-gray-600 dark:text-neutral-400">
                                <span>Variant Stock on Hand:</span>
                                <span className="font-mono font-bold">{currentVarStock} pcs</span>
                              </div>
                              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>Variant Restock Intake:</span>
                                <span className="font-mono">+{restockQty} pcs</span>
                              </div>
                              <div className="border-t border-orange-200 dark:border-orange-800/60 my-1.5" />
                              <div className="flex items-center justify-between text-gray-900 dark:text-white font-black text-sm">
                                <span>Projected Variant Stock:</span>
                                <span className="font-mono text-orange-600 dark:text-orange-400">
                                  {currentVarStock + restockQty} pcs
                                </span>
                              </div>
                            </>
                          );
                        })() : selectedProduct.variants && selectedProduct.variants.length > 0 ? (() => {
                          const varCount = selectedProduct.variants.length;
                          const currentTotalStock = selectedProduct.stockCount ?? 0;
                          const isEach = allVariantsMode === "each";
                          const perVar = Math.floor(restockQty / varCount);
                          const rem = restockQty % varCount;
                          const totalIntake = isEach ? restockQty * varCount : restockQty;
                          const newTotal = currentTotalStock + totalIntake;

                          return (
                            <>
                              <div className="flex items-center justify-between text-gray-600 dark:text-neutral-400">
                                <span>Allocation Strategy:</span>
                                <strong className="text-gray-900 dark:text-white font-semibold">
                                  {isEach
                                    ? `Add +${restockQty} pcs to EACH variant`
                                    : `Distribute ${restockQty} pcs evenly across ${varCount} variants`}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between text-gray-600 dark:text-neutral-400">
                                <span>Per-Variant Increase:</span>
                                <span className="font-mono font-bold text-gray-800 dark:text-neutral-200">
                                  {isEach
                                    ? `+${restockQty} pcs each`
                                    : `${perVar} pcs each ${rem > 0 ? `(+1 for ${rem} variants)` : ""}`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>Total Restock Intake:</span>
                                <span className="font-mono font-bold">+{totalIntake} pcs</span>
                              </div>
                              <div className="border-t border-orange-200 dark:border-orange-800/60 my-1.5" />
                              <div className="flex items-center justify-between text-gray-900 dark:text-white font-black text-sm">
                                <span>Projected New Total Stock:</span>
                                <span className="font-mono text-orange-600 dark:text-orange-400">
                                  {newTotal} pcs
                                </span>
                              </div>

                              {/* Variant-Level Breakdown */}
                              <div className="pt-2 border-t border-orange-200/60 dark:border-orange-800/40">
                                <p className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                  Variant-Level Stock Breakdown:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                  {selectedProduct.variants.map((v, i) => {
                                    const curr = Number(v.stockCount) || 0;
                                    const added = isEach ? restockQty : perVar + (i < rem ? 1 : 0);
                                    return (
                                      <div
                                        key={v.id}
                                        className="p-1.5 rounded-lg bg-white/70 dark:bg-neutral-800/80 border border-orange-100 dark:border-neutral-700 text-[10px] flex items-center justify-between"
                                      >
                                        <span className="truncate mr-1 font-medium text-gray-700 dark:text-neutral-300">
                                          {v.color.slice(0, 4)}/{v.size}:
                                        </span>
                                        <span className="font-mono shrink-0">
                                          {curr}{" "}
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                            +{added}
                                          </span>{" "}
                                          → <strong>{curr + added}</strong>
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          );
                        })() : (
                          <>
                            <div className="flex items-center justify-between text-gray-600 dark:text-neutral-400">
                              <span>Current Total Stock on Hand:</span>
                              <span className="font-mono font-bold">{selectedProduct.stockCount ?? 0} pcs</span>
                            </div>
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                              <span>Restock Intake:</span>
                              <span className="font-mono">+{restockQty} pcs</span>
                            </div>
                            <div className="border-t border-orange-200 dark:border-orange-800/60 my-2" />
                            <div className="flex items-center justify-between text-gray-900 dark:text-white font-black text-sm">
                              <span>Projected New Total Stock:</span>
                              <span className="font-mono text-orange-600 dark:text-orange-400">
                                {(selectedProduct.stockCount ?? 0) + restockQty} pcs
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setIsRestockOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submittingRestock}
                        className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submittingRestock ? (
                          <Spinner className="size-4 text-white animate-spin" />
                        ) : (
                          <CheckIcon className="size-4" />
                        )}
                        <span>Confirm &amp; Record Intake</span>
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminStockTab;

