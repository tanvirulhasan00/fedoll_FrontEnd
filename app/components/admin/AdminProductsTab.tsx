import React, { useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { ProductItem, ProductCategoryItem } from "~/firebase";
import { saveProductToFirestore, deleteProductFromFirestore } from "~/firebase";
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
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterStock, setFilterStock] = useState<"all" | "inStock" | "outOfStock">("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(isAddModalOpen);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]?.name || "Outerwear");
  const [formPrice, setFormPrice] = useState(2500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | undefined>(2900);
  const [formBadge, setFormBadge] = useState<"New" | "Sale" | "Best Seller" | "Trending" | "Limited" | "">("New");
  const [formStockCount, setFormStockCount] = useState(50);
  const [formInStock, setFormInStock] = useState(true);
  const [formPrimaryImage, setFormPrimaryImage] = useState("");
  const [formSecondaryImage, setFormSecondaryImage] = useState("");
  const [formGalleryImages, setFormGalleryImages] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState("");
  const [formMaterial, setFormMaterial] = useState("100% Organic Cotton");
  const [formFit, setFormFit] = useState("Regular Fit");
  const [formSizes, setFormSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [formColors, setFormColors] = useState<{ name: string; hex: string }[]>([
    { name: "Navy", hex: "#1e3a8a" },
    { name: "Black", hex: "#18181b" },
  ]);

  const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36"];

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory(categories[0]?.name || "Outerwear");
    setFormPrice(2500);
    setFormOriginalPrice(2900);
    setFormBadge("New");
    setFormStockCount(40);
    setFormInStock(true);
    setFormPrimaryImage("https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80");
    setFormSecondaryImage("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80");
    setFormGalleryImages(["https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80"]);
    setFormDescription("Premium export grade garment designed for durability and comfort.");
    setFormMaterial("100% Cotton");
    setFormFit("Modern Tailored Fit");
    setFormSizes(["S", "M", "L", "XL"]);
    setFormColors([{ name: "Navy", hex: "#1e3a8a" }]);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice);
    setFormBadge(product.badge || "");
    setFormStockCount(product.stockCount || 30);
    setFormInStock(product.inStock);
    setFormPrimaryImage(product.images?.[0] || "");
    setFormSecondaryImage(product.images?.[1] || "");
    setFormGalleryImages(product.images && product.images.length > 2 ? product.images.slice(2) : []);
    setFormDescription(product.description || "");
    setFormMaterial(product.material || "100% Cotton");
    setFormFit(product.fit || "Standard Fit");
    setFormSizes(product.sizes || ["M", "L"]);
    setFormColors(product.colors || [{ name: "Default", hex: "#000000" }]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const toggleSize = (size: string) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  const handleAddGalleryImage = () => {
    setFormGalleryImages([...formGalleryImages, ""]);
  };

  const handleUpdateGalleryImage = (index: number, value: string) => {
    const updated = [...formGalleryImages];
    updated[index] = value;
    setFormGalleryImages(updated);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormGalleryImages(formGalleryImages.filter((_, idx) => idx !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!formPrimaryImage.trim()) {
      toast.error("Primary cover photo is required.");
      return;
    }

    setIsSubmitting(true);
    const productId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;

    // Combine primary, secondary (hover), and additional gallery photos
    const allImages: string[] = [formPrimaryImage.trim()];
    if (formSecondaryImage.trim()) {
      allImages.push(formSecondaryImage.trim());
    }
    formGalleryImages.forEach((img) => {
      if (img.trim()) {
        allImages.push(img.trim());
      }
    });

    const newProduct: ProductItem = {
      id: productId,
      name: formName.trim(),
      category: formCategory,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      badge: (formBadge as any) || undefined,
      stockCount: Number(formStockCount),
      inStock: formInStock,
      images: allImages,
      description: formDescription.trim(),
      material: formMaterial.trim(),
      fit: formFit.trim(),
      sizes: formSizes.length > 0 ? formSizes : ["M", "L"],
      colors: formColors,
      rating: editingProduct?.rating || 4.8,
      reviewCount: editingProduct?.reviewCount || 12,
      sku: editingProduct?.sku || `FED-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    try {
      await saveProductToFirestore(newProduct);
      toast.success(
        editingProduct
          ? `Product "${newProduct.name}" updated with ${allImages.length} photos!`
          : `New product "${newProduct.name}" added with ${allImages.length} photos!`
      );
      handleCloseModal();
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}" from store catalog?`);
    if (!confirmDelete) return;

    try {
      await deleteProductFromFirestore(id);
      toast.success(`Product "${name}" deleted.`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete product.");
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      return false;
    }
    if (filterStock === "inStock" && !p.inStock) {
      return false;
    }
    if (filterStock === "outOfStock" && p.inStock) {
      return false;
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

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Product Catalog Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Manage garment collections, pricing in BDT, inventory stock levels, and size variations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
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

          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as any)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="inStock">In Stock Only</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, SKU or fabric..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-neutral-300">
            <thead className="bg-stone-50 dark:bg-neutral-800/60 uppercase text-[10px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider border-b border-gray-100 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (BDT)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sizes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative group size-12 shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-gray-200 dark:border-neutral-700 shadow-xs"
                          title={
                            p.images[1]
                              ? "Hover to preview secondary / hover photo"
                              : "Primary photo only"
                          }
                        >
                          <img
                            src={
                              p.images[0] ||
                              "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=100&q=80"
                            }
                            alt={p.name}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${
                              p.images[1] ? "group-hover:opacity-0" : ""
                            }`}
                          />
                          {p.images[1] && (
                            <img
                              src={p.images[1]}
                              alt={`${p.name} alternate view`}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            />
                          )}
                          {p.images.length > 1 && (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/75 text-[8px] font-bold text-white rounded-tl-sm backdrop-blur-xs">
                              {p.images.length}P
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {p.sku || `#${p.id}`}
                            </span>
                            {p.images[1] ? (
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200/50">
                                Dual-Hover
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                                1 Photo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-[10px] font-semibold text-gray-700 dark:text-neutral-300">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        ৳{p.price.toLocaleString()}
                      </div>
                      {p.originalPrice && (
                        <span className="text-[10px] line-through text-gray-400">
                          ৳{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-800 dark:text-neutral-200">
                      {p.stockCount ?? 25} pcs
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.inStock
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {p.sizes?.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[9px] px-1 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 font-bold"
                          >
                            {s}
                          </span>
                        ))}
                        {p.sizes && p.sizes.length > 3 && (
                          <span className="text-[9px] text-gray-400 font-medium">
                            +{p.sizes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title="Edit product"
                        >
                          <PencilSquareIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete product"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Transition show={modalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 font-sans" onClose={handleCloseModal}>
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
                <DialogPanel className="w-full max-w-3xl max-h-[92vh] overflow-y-auto transform rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      {editingProduct ? `Edit Garment: ${editingProduct.name}` : "Add New Garment to Catalog"}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Heavyweight Merino Wool Topcoat"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Collection / Category *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Selling Price (BDT ৳) *
                        </label>
                        <input
                          type="number"
                          required
                          value={formPrice}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Original Price (Optional)
                        </label>
                        <input
                          type="number"
                          value={formOriginalPrice || ""}
                          onChange={(e) => setFormOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Promotional Badge
                        </label>
                        <select
                          value={formBadge}
                          onChange={(e) => setFormBadge(e.target.value as any)}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                        >
                          <option value="">No Badge</option>
                          <option value="New">New</option>
                          <option value="Sale">Sale</option>
                          <option value="Best Seller">Best Seller</option>
                          <option value="Trending">Trending</option>
                          <option value="Limited">Limited Edition</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Inventory Stock Count
                        </label>
                        <input
                          type="number"
                          value={formStockCount}
                          onChange={(e) => setFormStockCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="inStockCheck"
                          checked={formInStock}
                          onChange={(e) => setFormInStock(e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <label htmlFor="inStockCheck" className="font-semibold text-gray-700 dark:text-neutral-300 cursor-pointer">
                          Item In Stock
                        </label>
                      </div>
                    </div>

                    {/* Garment Photography & Hover Views Section */}
                    <div className="space-y-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/50 p-4 border border-stone-200 dark:border-neutral-700/80">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                          <PhotoIcon className="size-4 text-orange-600" />
                          <span>Product Imagery &amp; Card Hover View</span>
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                          Fedoll product cards automatically show Photo 2 on mouse hover, and all photos appear in the product details gallery.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Photo 1: Primary Cover */}
                        <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-900 dark:text-white">
                              Photo 1: Primary Cover (Front View) *
                            </label>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                              Default Display
                            </span>
                          </div>
                          <input
                            type="url"
                            required
                            value={formPrimaryImage}
                            onChange={(e) => setFormPrimaryImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-600"
                          />
                          {/* Live Preview */}
                          <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
                            {formPrimaryImage.trim() ? (
                              <img
                                src={formPrimaryImage}
                                alt="Primary preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80";
                                }}
                              />
                            ) : (
                              <div className="text-center p-3 text-gray-400">
                                <PhotoIcon className="size-8 mx-auto stroke-1" />
                                <span className="text-[10px] block mt-1">Enter valid image URL to preview</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Photo 2: Secondary Hover View */}
                        <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-900 dark:text-white">
                              Photo 2: Secondary / Hover View (Back or Alternate)
                            </label>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                              Card Hover &amp; 2nd View
                            </span>
                          </div>
                          <input
                            type="url"
                            value={formSecondaryImage}
                            onChange={(e) => setFormSecondaryImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-600"
                          />
                          {/* Live Preview */}
                          <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
                            {formSecondaryImage.trim() ? (
                              <>
                                <img
                                  src={formSecondaryImage}
                                  alt="Hover view preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80";
                                  }}
                                />
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold backdrop-blur-xs">
                                  Hover Effect
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-3 text-gray-400">
                                <PhotoIcon className="size-8 mx-auto stroke-1" />
                                <span className="text-[10px] block mt-1">Optional hover view (e.g. back view)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Gallery Photos */}
                      <div className="pt-2 border-t border-stone-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-neutral-200">
                            Additional Gallery Photos (Detail, Fabric Close-ups &amp; Angles)
                          </span>
                          <button
                            type="button"
                            onClick={handleAddGalleryImage}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-xs font-bold hover:bg-orange-200 transition cursor-pointer"
                          >
                            <PlusIcon className="size-3.5" />
                            Add Gallery Photo
                          </button>
                        </div>

                        {formGalleryImages.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic">
                            No additional detail photos added yet. Click &quot;Add Gallery Photo&quot; to add more angles for the product detail page.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {formGalleryImages.map((imgUrl, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="size-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                                  {imgUrl.trim() ? (
                                    <img
                                      src={imgUrl}
                                      alt={`Gallery ${idx + 3}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=100&q=80";
                                      }}
                                    />
                                  ) : (
                                    <PhotoIcon className="size-5 m-auto text-gray-400 h-full" />
                                  )}
                                </div>
                                <input
                                  type="url"
                                  value={imgUrl}
                                  onChange={(e) => handleUpdateGalleryImage(idx, e.target.value)}
                                  placeholder={`Photo ${idx + 3} URL (e.g. fabric texture or side angle)`}
                                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryImage(idx)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                                  title="Remove this photo"
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Available Sizes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SIZES.map((sz) => {
                          const active = formSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                                active
                                  ? "bg-orange-600 text-white"
                                  : "bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Description &amp; Garment Details
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting && <Spinner className="size-3.5 text-white" />}
                        <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
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

export default AdminProductsTab;
