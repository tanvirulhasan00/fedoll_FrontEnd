import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  EyeIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { ProductItem, ProductCategoryItem } from "~/firebase";
import {
  deleteProductFromFirestore,
  deleteMultipleProductsFromFirestore,
  formatCategoryHierarchy,
  getCategoryDescendantNames,
} from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminProductsTabProps {
  products: ProductItem[];
  categories: ProductCategoryItem[];
  onRefresh: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [localProducts, setLocalProducts] = useState<ProductItem[]>(products || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<ProductItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalProducts(products || []);
  }, [products]);

  const filteredProducts = localProducts.filter((p) => {
    if (selectedCategory !== "all") {
      const allowedNames = new Set(
        getCategoryDescendantNames(selectedCategory, categories).map((n) => n.trim().toLowerCase())
      );
      if (!allowedNames.has((p.category || "").trim().toLowerCase())) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchSku) return false;
    }
    return true;
  });

  // Multi-selection helpers
  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const someFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.some((p) => selectedIds.includes(p.id)) &&
    !allFilteredSelected;

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredProducts.map((p) => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleOpenDeleteConfirm = (product: ProductItem) => {
    setItemsToDelete([product]);
    setDeleteModalOpen(true);
  };

  const handleOpenBulkDeleteConfirm = () => {
    const toDelete = localProducts.filter((p) => selectedIds.includes(p.id));
    if (toDelete.length === 0) return;
    setItemsToDelete(toDelete);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setItemsToDelete([]);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      if (itemsToDelete.length === 1) {
        const target = itemsToDelete[0];
        await deleteProductFromFirestore(target.id);

        setLocalProducts((prev) =>
          prev.filter((p) => String(p.id).trim() !== String(target.id).trim())
        );
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        toast.success(`Garment "${target.name}" deleted from store catalog.`);
      } else {
        const targetIds = itemsToDelete.map((p) => p.id);
        const count = await deleteMultipleProductsFromFirestore(targetIds);
        const targetIdSet = new Set(targetIds);

        setLocalProducts((prev) =>
          prev.filter((p) => !targetIdSet.has(p.id))
        );
        setSelectedIds((prev) => prev.filter((id) => !targetIdSet.has(id)));
        toast.success(`Successfully deleted ${count} garments from store catalog.`);
      }

      setDeleteModalOpen(false);
      setItemsToDelete([]);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete products.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Dedicated Add Page Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Product Catalog Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Manage garment collections, pricing in BDT, inventory stock levels, and size variations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin?tab=inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-bold text-xs shadow-xs transition"
          >
            <ArchiveBoxIcon className="size-4 text-orange-600" />
            <span>Stock &amp; Ledger</span>
          </Link>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer font-sans"
          >
            <option value="all">All Categories</option>
            {formatCategoryHierarchy(categories).map(({ category: c, label, fullPath }) => (
              <option key={c.id} value={c.name} title={fullPath}>
                {label}
              </option>
            ))}
          </select>

          {(selectedCategory !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline px-2 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, SKU or fabric..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold text-orange-900 dark:text-orange-200">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-mono text-xs">
              {selectedIds.length}
            </span>
            <span>Product{selectedIds.length > 1 ? "s" : ""} Selected</span>
            {selectedIds.length < filteredProducts.length && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="ml-2 text-xs text-orange-700 dark:text-orange-300 underline font-semibold hover:text-orange-900 cursor-pointer"
              >
                Select all {filteredProducts.length} filtered
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-neutral-700 transition cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleOpenBulkDeleteConfirm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <TrashIcon className="size-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-800/40 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all products"
                    className="rounded border-stone-300 dark:border-neutral-600 text-orange-600 focus:ring-orange-500 cursor-pointer size-4"
                  />
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (BDT)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Variants &amp; Colors</th>
                <th className="py-3.5 px-4">Sizes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-sm">No garments found matching filter.</p>
                    <p className="text-xs mt-1">Try clearing your filters or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-orange-50/40 dark:bg-orange-950/20"
                          : "hover:bg-stone-50/50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(p.id)}
                          aria-label={`Select ${p.name}`}
                          className="rounded border-stone-300 dark:border-neutral-600 text-orange-600 focus:ring-orange-500 cursor-pointer size-4"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80";
                              }}
                            />
                            {p.images.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[8px] font-bold text-white px-1 rounded-sm">
                                {p.images.length}P
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono">
                                #{p.id}
                              </span>
                              {p.images.length > 1 && (
                                <span className="inline-flex items-center text-[9px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded">
                                  Dual-Hover
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            ৳{p.price.toLocaleString()}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-[10px] text-gray-400 line-through block">
                              ৳{p.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.inStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                            Sold Out
                          </span>
                        )}
                      </td>

                      {/* Variants & Colors Preview */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {p.colors && p.colors.length > 0 ? (
                              p.colors.map((c, i) => (
                                <span
                                  key={i}
                                  className="size-3 rounded-full border border-gray-300 dark:border-neutral-600 shadow-2xs"
                                  style={{ backgroundColor: c.hex }}
                                  title={`${c.name} (${c.images?.length || 0} photos)`}
                                />
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400">1 Color</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400">
                              {p.colors?.length || 1} Colors
                            </span>
                            {p.variants && p.variants.length > 0 && (
                              <span className="text-[9px] font-semibold text-orange-600 dark:text-orange-400">
                                {p.variants.length} var
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {p.sizes.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300"
                            >
                              {s}
                            </span>
                          ))}
                          {p.sizes.length > 3 && (
                            <span className="text-[9px] text-gray-400 font-medium">
                              +{p.sizes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/products/${p.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                            title="View live in storefront"
                          >
                            <EyeIcon className="size-4" />
                          </Link>
                          <Link
                            to="/admin?tab=inventory"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                            title="Manage Stock & Restock Ledger"
                          >
                            <ArchiveBoxIcon className="size-4" />
                          </Link>
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                            title="Edit product on dedicated page"
                          >
                            <PencilSquareIcon className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteConfirm(p)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete product from catalog"
                          >
                            <TrashIcon className="size-4" />
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

      {/* Delete Product Confirmation Modal */}
      <Transition appear show={deleteModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={handleCloseDeleteModal}
        >
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

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white space-y-5">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50 dark:ring-rose-950/20">
                      <ExclamationTriangleIcon className="size-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                        {itemsToDelete.length > 1
                          ? `Delete ${itemsToDelete.length} Catalog Garments`
                          : "Delete Catalog Garment"}
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        {itemsToDelete.length > 1
                          ? `This action permanently removes ${itemsToDelete.length} selected garments from the store catalog.`
                          : "This action permanently removes this garment from the store catalog."}
                      </p>
                    </div>
                  </div>

                  {/* Single Product Details Preview Box */}
                  {itemsToDelete.length === 1 && (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700/80 flex items-center gap-3.5">
                      <div className="relative size-14 rounded-xl overflow-hidden bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                        <img
                          src={itemsToDelete[0].images?.[0] || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80"}
                          alt={itemsToDelete[0].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {itemsToDelete[0].name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300">
                            {itemsToDelete[0].category}
                          </span>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            ৳{itemsToDelete[0].price.toLocaleString()}
                          </span>
                          {itemsToDelete[0].sku && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {itemsToDelete[0].sku}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                          {itemsToDelete[0].colors?.length || 1} Color{(itemsToDelete[0].colors?.length || 1) > 1 ? "s" : ""} •{" "}
                          {itemsToDelete[0].variants?.length || 1} Variant{(itemsToDelete[0].variants?.length || 1) > 1 ? "s" : ""} •{" "}
                          {itemsToDelete[0].stockCount ?? 0} in stock
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Multiple Products List Box */}
                  {itemsToDelete.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-neutral-400 px-1">
                        <span>Selected Products ({itemsToDelete.length})</span>
                        <span className="text-[11px] font-mono">
                          Total: ৳{itemsToDelete.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100 dark:divide-neutral-800 rounded-2xl bg-stone-50/80 dark:bg-neutral-800/40 p-2.5 border border-stone-200/80 dark:border-neutral-700/80">
                        {itemsToDelete.map((item) => (
                          <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-3">
                            <div className="relative size-10 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                              <img
                                src={item.images?.[0] || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80";
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
                                <span className="truncate max-w-[100px]">{item.category}</span>
                                <span>•</span>
                                <span className="font-bold text-orange-600 dark:text-orange-400">
                                  ৳{item.price.toLocaleString()}
                                </span>
                                {item.sku && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{item.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                    {itemsToDelete.length === 1 ? (
                      <>
                        Are you sure you want to delete <strong className="font-bold">"{itemsToDelete[0]?.name}"</strong>? Once deleted, customers will no longer be able to discover, view, or purchase this garment.
                      </>
                    ) : (
                      <>
                        Are you sure you want to delete <strong className="font-bold">{itemsToDelete.length} selected garments</strong>? This action cannot be undone and will permanently remove all associated variants, color options, and stock records.
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleCloseDeleteModal}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting && <Spinner className="size-3.5 text-white" />}
                      <span>
                        {isDeleting
                          ? "Deleting..."
                          : itemsToDelete.length > 1
                          ? `Delete ${itemsToDelete.length} Garments`
                          : "Delete Garment"}
                      </span>
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminProductsTab;
