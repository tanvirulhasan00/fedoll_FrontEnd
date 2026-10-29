import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import {
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  DEFAULT_CATEGORY_NAME,
  DEFAULT_CATEGORY_ID,
  formatCategoryHierarchy,
  isCategoryDescendantOf,
  getCategoryAncestors,
  getCategoryChildren,
  isProductInCategory,
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl,
  type ProductCategoryItem,
  type ProductItem,
} from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminCategoriesTabProps {
  categories: ProductCategoryItem[];
  products?: ProductItem[];
  onRefresh: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories = [],
  products = [],
  onRefresh,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [modalOpen, setModalOpen] = useState(isAddModalOpen);
  const [localCategories, setLocalCategories] = useState<ProductCategoryItem[]>(categories || []);
  const [editingCategory, setEditingCategory] = useState<ProductCategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [image, setImage] = useState("");
  const [itemCount, setItemCount] = useState(15);
  const [parentId, setParentId] = useState<string | null>(null);

  // Synchronize localCategories with incoming props
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Synchronize modalOpen when triggered from parent
  useEffect(() => {
    if (isAddModalOpen) {
      handleOpenCreate();
    }
  }, [isAddModalOpen]);

  const handleOpenCreate = (initialParentId: string | null = null) => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setTagline("");
    setImage("https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80");
    setItemCount(20);
    setParentId(initialParentId);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: ProductCategoryItem) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setTagline(category.tagline);
    setImage(category.image);
    setItemCount(category.itemCount || 10);
    setParentId(category.parentId || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const generateSlugForName = (val: string, currentParentId?: string | null) => {
    const raw = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!raw) return "";
    if (currentParentId) {
      const parent = localCategories.find((c) => c.id === currentParentId);
      if (parent) {
        const parentSlug = (parent.slug || parent.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (parentSlug && !raw.startsWith(parentSlug + "-")) {
          return `${parentSlug}-${raw}`;
        }
      }
    }
    return raw;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlugForName(val, parentId));
    }
  };

  const handleParentChange = (newParentId: string | null) => {
    setParentId(newParentId);
    if (!editingCategory && name.trim()) {
      setSlug(generateSlugForName(name, newParentId));
    }
  };

  const handleImageChange = (val: string) => {
    const trimmed = val.trim();
    const fileId = extractGoogleDriveFileId(trimmed);
    // If a Google Drive share or open URL was pasted, convert directly to Google CDN URL
    if (fileId && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com"))) {
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      setImage(directUrl);
      toast.success("Google Drive share link converted to direct image URL!");
      return;
    }
    setImage(val);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    const categoryId = editingCategory ? editingCategory.id : `cat-${Date.now()}`;

    // Determine level based on parent category
    const parentCat = parentId ? localCategories.find((c) => c.id === parentId) : null;
    const computedLevel = parentCat ? (parentCat.level !== undefined ? parentCat.level + 1 : 1) : 0;

    const normalizedImage =
      normalizeGoogleDriveImageUrl(image.trim()) ||
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";

    // Auto-generate and ensure unique slug
    let baseSlug = slug.trim() || generateSlugForName(name.trim(), parentId);
    if (!baseSlug) {
      baseSlug = `cat-${Date.now().toString(36)}`;
    }
    let candidateSlug = baseSlug;
    let counter = 1;
    while (
      localCategories.some(
        (c) => c.id !== categoryId && c.slug?.toLowerCase() === candidateSlug.toLowerCase()
      )
    ) {
      counter++;
      candidateSlug = `${baseSlug}-${counter}`;
    }

    const newCategory: ProductCategoryItem = {
      id: categoryId,
      name: name.trim(),
      slug: candidateSlug,
      tagline: tagline.trim(),
      image: normalizedImage,
      itemCount: Number(itemCount) || 0,
      parentId: parentId || null,
      level: computedLevel,
    };

    try {
      await saveCategoryToFirestore(newCategory);
      // Optimistically update local state immediately
      setLocalCategories((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === newCategory.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = newCategory;
          return next;
        }
        return [newCategory, ...prev];
      });

      toast.success(
        editingCategory
          ? `Category "${newCategory.name}" updated successfully!`
          : `New category "${newCategory.name}" created!`
      );
      handleCloseModal();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (category: ProductCategoryItem) => {
    const isDefault =
      category.id === DEFAULT_CATEGORY_ID ||
      category.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase();

    if (isDefault) {
      toast.error(
        `"${DEFAULT_CATEGORY_NAME}" is the default fallback category for unassigned products and cannot be deleted.`
      );
      return;
    }

    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteCategoryFromFirestore(categoryToDelete.id, categoryToDelete.name);

      // Optimistically remove from local state
      setLocalCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));

      if (res.reassignedCount > 0) {
        toast.success(
          `Category "${categoryToDelete.name}" deleted. ${res.reassignedCount} garment${
            res.reassignedCount === 1 ? "" : "s"
          } automatically adapted to "${DEFAULT_CATEGORY_NAME}".`
        );
      } else {
        toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      }

      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate assigned products for the category pending deletion
  const assignedGarmentsCount = categoryToDelete
    ? products.filter((p) =>
        isProductInCategory(p, categoryToDelete, localCategories)
      ).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Product Categories &amp; Collections
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Organize garments into collections with promotional hero imagery and taglines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {formatCategoryHierarchy(localCategories).map(({ category: cat, depth, fullPath }) => {
          const isDefault =
            cat.id === DEFAULT_CATEGORY_ID ||
            cat.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase();

          const directCount = products.filter(
            (p) =>
              p.categoryId === cat.id ||
              (!p.categoryId && p.category?.trim().toLowerCase() === cat.name.trim().toLowerCase())
          ).length;

          const totalBranchCount = products.filter((p) =>
            isProductInCategory(p, cat, localCategories)
          ).length;

          const ancestors = getCategoryAncestors(cat.id, localCategories);
          const directChildren = getCategoryChildren(cat.id, localCategories);

          return (
            <div
              key={cat.id}
              className={`group rounded-3xl bg-white dark:bg-neutral-900 border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                isDefault
                  ? "border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20"
                  : depth > 0
                  ? "border-orange-200/70 dark:border-orange-950/40 ring-1 ring-orange-500/10"
                  : "border-stone-200/80 dark:border-neutral-800"
              }`}
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                  <img
                    src={normalizeGoogleDriveImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fileId = extractGoogleDriveFileId(cat.image);
                      if (fileId && !target.dataset.triedThumbnail) {
                        target.dataset.triedThumbnail = "true";
                        target.src = getGoogleDriveThumbnailUrl(cat.image, 1000);
                        return;
                      }
                      target.src =
                        "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Badges on Cover Image */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
                    {isDefault && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white font-bold text-[10px] backdrop-blur-xs shadow-xs">
                        <ShieldCheckIcon className="size-3.5" />
                        <span>Default Fallback</span>
                      </span>
                    )}
                    {depth > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-600/90 text-white font-bold text-[10px] backdrop-blur-xs shadow-xs">
                        Level {depth} Child
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    {ancestors.length > 1 && (
                      <div className="text-[11px] font-semibold text-orange-300 truncate mb-0.5 flex items-center gap-1">
                        <span>{ancestors.slice(0, -1).map((a) => a.name).join(" › ")}</span>
                        <span>›</span>
                      </div>
                    )}
                    <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                      {depth > 0 && <span className="text-orange-400 text-sm">↳</span>}
                      <span>{cat.name}</span>
                    </h3>
                    <span className="text-[11px] font-mono text-orange-200/90">
                      /{cat.slug}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  <p className="text-gray-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                    {cat.tagline || "High-quality collection curated for everyday elegance."}
                  </p>

                  {/* Hierarchy Path & Child Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {ancestors.length > 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-neutral-300 text-[10px] font-medium">
                        Path: {fullPath}
                      </span>
                    )}
                    {directChildren.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                        {directChildren.length} subcategory{directChildren.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <span>Assigned Garments:</span>
                    <strong className="text-gray-900 dark:text-white font-mono">
                      {totalBranchCount > 0 ? (
                        <>
                          <span>{directCount} direct</span>
                          {directChildren.length > 0 && totalBranchCount !== directCount && (
                            <span className="text-orange-600 dark:text-orange-400 font-medium ml-1">
                              ({totalBranchCount} in branch)
                            </span>
                          )}
                        </>
                      ) : (
                        `${cat.itemCount || 0} items`
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50/60 dark:bg-neutral-950/60 border-t border-stone-200/60 dark:border-neutral-800 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">
                  {isDefault ? "Permanent" : `#${cat.id.slice(-6)}`}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* + Child Subcategory Quick Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenCreate(cat.id)}
                    title={`Create child category under "${cat.name}"`}
                    className="px-2.5 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlusIcon className="size-3.5" />
                    <span>+ Child</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <PencilSquareIcon className="size-3.5" />
                    <span>Edit</span>
                  </button>

                  {isDefault ? (
                    <button
                      type="button"
                      disabled
                      title={`The "${DEFAULT_CATEGORY_NAME}" category is required as the default fallback and cannot be deleted.`}
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-neutral-800 text-stone-400 dark:text-neutral-600 text-xs font-semibold flex items-center gap-1 cursor-not-allowed opacity-60"
                    >
                      <LockClosedIcon className="size-3.5" />
                      <span>Protected</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteConfirm(cat)}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <TrashIcon className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
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
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-8 text-left shadow-2xl transition-all border border-stone-200/80 dark:border-neutral-800 text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Collection Category"}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCategory} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Parent Category (Hierarchical Nesting)
                      </label>
                      <select
                        value={parentId || ""}
                        onChange={(e) => handleParentChange(e.target.value ? e.target.value : null)}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer font-sans"
                      >
                        <option value="">(None - Top-Level Root Category)</option>
                        {formatCategoryHierarchy(localCategories)
                          .filter(({ category }) => {
                            if (!editingCategory) return true;
                            // Cannot select itself as parent
                            if (category.id === editingCategory.id) return false;
                            // Cannot select any of its own descendants as parent
                            if (isCategoryDescendantOf(category.id, editingCategory.id, localCategories)) return false;
                            return true;
                          })
                          .map(({ category, label }) => (
                            <option key={category.id} value={category.id}>
                              {label}
                            </option>
                          ))}
                      </select>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                        Nest under another category to create parent &rarr; child hierarchies (e.g. Winter &rarr; Mens &rarr; Hoodie).
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Knitwear &amp; Sweaters"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="e.g. knitwear"
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                          Item Count Display
                        </label>
                        <input
                          type="number"
                          value={itemCount}
                          onChange={(e) => setItemCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-gray-700 dark:text-neutral-300">
                          Showcase Cover Image URL *
                        </label>
                        <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                          Google Drive &amp; Web URLs supported
                        </span>
                      </div>
                      <input
                        type="url"
                        required
                        value={image}
                        onChange={(e) => handleImageChange(e.target.value)}
                        placeholder="https://images.unsplash.com/... or Google Drive share link"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 font-mono text-[11px]"
                      />

                      {/* Google Drive Status Notification */}
                      {extractGoogleDriveFileId(image) && (
                        <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px]">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>
                            <strong>Google Drive image active:</strong> direct high-speed CDN enabled. (Ensure file is set to "Anyone with the link can view").
                          </span>
                        </div>
                      )}

                      {/* Live Image Preview */}
                      {image.trim() && (
                        <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/80 dark:border-neutral-700">
                          <div className="relative size-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-neutral-700 shrink-0 border border-stone-300 dark:border-neutral-600">
                            <img
                              src={normalizeGoogleDriveImageUrl(image)}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fileId = extractGoogleDriveFileId(image);
                                if (fileId && !target.dataset.triedThumbnail) {
                                  target.dataset.triedThumbnail = "true";
                                  target.src = getGoogleDriveThumbnailUrl(image, 400);
                                  return;
                                }
                                target.src =
                                  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-neutral-400 leading-tight overflow-hidden">
                            <p className="font-semibold text-gray-900 dark:text-white">Live Cover Preview</p>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5 truncate font-mono">
                              {normalizeGoogleDriveImageUrl(image)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Marketing Tagline
                      </label>
                      <textarea
                        rows={2}
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Ultra-soft merino wool sweaters and fine knitwear"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting && <Spinner className="size-3.5 text-white" />}
                        <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal with Auto-Adapt Notice */}
      <Transition show={deleteModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => !isDeleting && setDeleteModalOpen(false)}
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
                        Delete Collection Category
                      </DialogTitle>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        This action permanently deletes the category.
                      </p>
                    </div>
                  </div>

                  {/* Auto-reassignment explanation */}
                  {assignedGarmentsCount > 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                        <ArrowPathRoundedSquareIcon className="size-4" />
                        <span>Automatic Product Reassignment</span>
                      </div>
                      <p className="leading-relaxed">
                        There {assignedGarmentsCount === 1 ? "is" : "are"}{" "}
                        <strong className="underline decoration-amber-400">
                          {assignedGarmentsCount} garment{assignedGarmentsCount === 1 ? "" : "s"}
                        </strong>{" "}
                        currently assigned to "{categoryToDelete?.name}".
                      </p>
                      <p className="leading-relaxed text-[11px] opacity-90">
                        Deleting this category will <strong>not</strong> delete those products. Instead, all{" "}
                        {assignedGarmentsCount} garment{assignedGarmentsCount === 1 ? "" : "s"} will{" "}
                        <strong>automatically adapt to the default "{DEFAULT_CATEGORY_NAME}"</strong> category across Cloud Firestore and storefront filters.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-950 border border-stone-200/80 dark:border-neutral-800 text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                      Are you sure you want to delete category{" "}
                      <strong className="text-gray-900 dark:text-white font-semibold">
                        "{categoryToDelete?.name}"
                      </strong>
                      ? No garments are currently assigned to this category.
                    </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setDeleteModalOpen(false)}
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
                      <span>{isDeleting ? "Reassigning & Deleting..." : "Delete Category"}</span>
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

export default AdminCategoriesTab;
