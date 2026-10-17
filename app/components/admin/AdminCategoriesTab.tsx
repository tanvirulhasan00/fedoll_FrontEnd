import React, { useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  RectangleStackIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import type { ProductCategoryItem } from "~/firebase";
import { saveCategoryToFirestore, deleteCategoryFromFirestore } from "~/firebase";
import { Spinner } from "~/components/ui/spinner";

interface AdminCategoriesTabProps {
  categories: ProductCategoryItem[];
  onRefresh: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onRefresh,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [modalOpen, setModalOpen] = useState(isAddModalOpen);
  const [editingCategory, setEditingCategory] = useState<ProductCategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [image, setImage] = useState("");
  const [itemCount, setItemCount] = useState(15);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setTagline("");
    setImage("https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80");
    setItemCount(20);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: ProductCategoryItem) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setTagline(category.tagline);
    setImage(category.image);
    setItemCount(category.itemCount || 10);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    const categoryId = editingCategory ? editingCategory.id : `cat-${Date.now()}`;

    const newCategory: ProductCategoryItem = {
      id: categoryId,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "-"),
      tagline: tagline.trim(),
      image: image.trim() || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
      itemCount: Number(itemCount),
    };

    try {
      await saveCategoryToFirestore(newCategory);
      toast.success(
        editingCategory
          ? `Category "${newCategory.name}" updated successfully!`
          : `New category "${newCategory.name}" created!`
      );
      handleCloseModal();
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete category "${catName}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCategoryFromFirestore(id);
      toast.success(`Category "${catName}" deleted.`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete category.");
    }
  };

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
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-3xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 overflow-hidden bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-black text-white">{cat.name}</h3>
                  <span className="text-[11px] font-mono text-orange-300">
                    /{cat.slug}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2 text-xs">
                <p className="text-gray-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                  {cat.tagline || "High-quality collection curated for everyday elegance."}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400 pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <span>Assigned Garments:</span>
                  <strong className="text-gray-900 dark:text-white font-mono">
                    {cat.itemCount || 10} items
                  </strong>
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50/60 dark:bg-neutral-950/60 border-t border-stone-200/60 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <PencilSquareIcon className="size-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <TrashIcon className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
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
                      className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCategory} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Knitwear & Sweaters"
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
                      <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                        Showcase Cover Image URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
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
    </div>
  );
};

export default AdminCategoriesTab;
