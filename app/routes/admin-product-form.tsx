import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchProductsFromFirestore,
  fetchProductByIdFromFirestore,
  fetchCategoriesFromFirestore,
  saveProductToFirestore,
  recordInitialProductStock,
  formatCategoryHierarchy,
  normalizeGoogleDriveImageUrl,
  type ProductItem,
  type ProductCategoryItem,
  type ProductColor,
  type ProductVariant,
} from "~/firebase";
import { AdminSidebar, type AdminTab } from "~/components/admin/AdminSidebar";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import ThemeToggle from "~/components/main/Utilities/ThemeToggle";
import { ProductFormSkeleton } from "~/components/main/Skeletons";

interface FormColorItem {
  name: string;
  hex: string;
  images: string[];
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "30", "31", "32", "34", "36", "38R", "40R", "42R"];

const COLOR_PRESETS = [
  { name: "Deep Indigo", hex: "#1e3a8a" },
  { name: "Classic Black", hex: "#111827" },
  { name: "Charcoal Grey", hex: "#374151" },
  { name: "Warm Camel", hex: "#c29b62" },
  { name: "Olive Green", hex: "#3f6212" },
  { name: "Burgundy Red", hex: "#881337" },
  { name: "Off-White / Ecru", hex: "#f3f4f6" },
  { name: "Khaki Tan", hex: "#d97706" },
];

export function meta() {
  return [
    { title: "Garment Editor | Admin Atelier | SilkenDrift eCommerce" },
    { name: "description", content: "Dedicated garment editor: manage variants, sizes, colors, and variant-wise photography." },
  ];
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const canManageProducts =
    user?.role === "admin" || user?.role === "manager";

  const isEditMode = Boolean(id && id !== "new" && id !== "add");

  // Layout state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formCategory, setFormCategory] = useState("Outerwear");
  const [formCategoryPath, setFormCategoryPath] = useState("");
  const [formPrice, setFormPrice] = useState(2500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | undefined>(2900);
  const [formBadge, setFormBadge] = useState<"New" | "Sale" | "Best Seller" | "Trending" | "Limited" | "">("New");
  const [formStockCount, setFormStockCount] = useState(40);
  const [formInStock, setFormInStock] = useState(true);
  const [formPrimaryImage, setFormPrimaryImage] = useState(
    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"
  );
  const [formSecondaryImage, setFormSecondaryImage] = useState(
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
  );
  const [formGalleryImages, setFormGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
  ]);
  const [formDescription, setFormDescription] = useState(
    "Premium export grade garment designed for durability, style, and breathable comfort."
  );
  const [formMaterial, setFormMaterial] = useState("100% Cotton");
  const [formFit, setFormFit] = useState("Modern Tailored Fit");
  const [formSizes, setFormSizes] = useState<string[]>(["S", "M", "L", "XL"]);

  // Color Variations & Variant-wise Images
  const [formColors, setFormColors] = useState<FormColorItem[]>([
    {
      name: "Midnight Navy",
      hex: "#1e3a8a",
      images: ["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"],
    },
    {
      name: "Warm Camel",
      hex: "#c29b62",
      images: ["https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80"],
    },
  ]);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [newColorImageUrl, setNewColorImageUrl] = useState<{ [colorIdx: number]: string }>({});

  // Helper to generate/sync variant matrix combinations (Color × Size)
  const generateVariantsMatrix = (
    colorsToSync: FormColorItem[],
    sizesToSync: string[],
    basePrice: number,
    existingVariants: ProductVariant[] = formVariants
  ): ProductVariant[] => {
    const list: ProductVariant[] = [];
    if (!Array.isArray(colorsToSync) || !Array.isArray(sizesToSync)) return list;

    colorsToSync.forEach((colorObj) => {
      if (!colorObj || !colorObj.name) return;
      sizesToSync.forEach((sizeVal) => {
        if (!sizeVal) return;
        const colorNameClean = (colorObj.name || "").trim().toLowerCase();
        const sizeValClean = (sizeVal || "").trim().toLowerCase();
        const found = (existingVariants || []).find(
          (v) =>
            (v?.color || "").trim().toLowerCase() === colorNameClean &&
            (v?.size || "").trim().toLowerCase() === sizeValClean
        );
        if (found) {
          list.push({
            ...found,
            color: colorObj.name,
            colorHex: colorObj.hex || "#111827",
            images:
              colorObj.images && colorObj.images.length > 0
                ? colorObj.images
                : found.images || [],
          });
        } else {
          const slugColor = (colorObj.name || "color")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          const slugSize = (sizeVal || "size")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          list.push({
            id: `var-${slugColor}-${slugSize}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            color: colorObj.name,
            colorHex: colorObj.hex || "#111827",
            size: sizeVal,
            sku: `FED-${slugColor.slice(0, 3).toUpperCase()}-${sizeVal.toUpperCase()}`,
            price: Number(basePrice) || 2500,
            stockCount: 10,
            inStock: true,
            images:
              colorObj.images && colorObj.images.length > 0
                ? [...colorObj.images]
                : [],
          });
        }
      });
    });
    return list;
  };

  // Load Categories & Product Data if in Edit Mode
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingInitial(true);
      try {
        const fetchedCats = await fetchCategoriesFromFirestore();
        if (!isMounted) return;
        setCategories(fetchedCats);

        if (!isEditMode && fetchedCats.length > 0) {
          const defaultCat =
            fetchedCats.find((c) => c.name.toLowerCase() === formCategory.toLowerCase()) ||
            fetchedCats[0];
          setFormCategoryId(defaultCat.id);
          setFormCategory(defaultCat.name);
        }

        if (isEditMode && id) {
          let foundProduct = await fetchProductByIdFromFirestore(id);
          if (!foundProduct) {
            const all = await fetchProductsFromFirestore();
            foundProduct = all.find((p) => p.id === id) || null;
          }

          if (foundProduct && isMounted) {
            setEditingProduct(foundProduct);
            setFormName(foundProduct.name);
            setFormCategory(foundProduct.category);
            const matchedCat = foundProduct.categoryId
              ? fetchedCats.find((c) => c.id === foundProduct.categoryId)
              : fetchedCats.find(
                  (c) => c.name.toLowerCase() === foundProduct.category?.toLowerCase()
                );
            if (matchedCat) {
              setFormCategoryId(matchedCat.id);
              setFormCategory(matchedCat.name);
            } else if (foundProduct.categoryId) {
              setFormCategoryId(foundProduct.categoryId);
            }
            if (foundProduct.categoryPath) {
              setFormCategoryPath(foundProduct.categoryPath);
            }
            setFormPrice(foundProduct.price);
            setFormOriginalPrice(foundProduct.originalPrice);
            setFormBadge(foundProduct.badge || "");
            setFormStockCount(foundProduct.stockCount || 30);
            setFormInStock(foundProduct.inStock);
            setFormPrimaryImage(foundProduct.images?.[0] || "");
            setFormSecondaryImage(foundProduct.images?.[1] || "");
            setFormGalleryImages(
              foundProduct.images && foundProduct.images.length > 2
                ? foundProduct.images.slice(2)
                : []
            );
            setFormDescription(foundProduct.description || "");
            setFormMaterial(foundProduct.material || "100% Cotton");
            setFormFit(foundProduct.fit || "Standard Fit");
            const activeSizes = foundProduct.sizes || ["M", "L"];
            setFormSizes(activeSizes);

            // Normalize colors
            const loadedColors: FormColorItem[] =
              foundProduct.colors && foundProduct.colors.length > 0
                ? foundProduct.colors.map((c) => ({
                    name: c.name,
                    hex: c.hex,
                    images: c.images ? [...c.images] : [],
                  }))
                : [
                    {
                      name: "Standard",
                      hex: "#111827",
                      images: foundProduct.images ? [...foundProduct.images] : [],
                    },
                  ];
            setFormColors(loadedColors);

            // Variants
            if (foundProduct.variants && foundProduct.variants.length > 0) {
              setFormVariants([...foundProduct.variants]);
            } else {
              setFormVariants(
                generateVariantsMatrix(loadedColors, activeSizes, foundProduct.price, [])
              );
            }
          }
        } else {
          // New product mode: initialize initial matrix
          setFormVariants(
            generateVariantsMatrix(formColors, formSizes, formPrice, [])
          );
        }
      } catch (err) {
        console.warn("Error initializing garment form:", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Size toggle
  const toggleSize = (size: string) => {
    const updatedSizes = formSizes.includes(size)
      ? formSizes.filter((s) => s !== size)
      : [...formSizes, size];
    setFormSizes(updatedSizes);
    setFormVariants(generateVariantsMatrix(formColors, updatedSizes, formPrice, formVariants));
  };

  // Gallery images handlers
  const handleAddGalleryImage = () => {
    setFormGalleryImages([...formGalleryImages, ""]);
  };

  const handleUpdateGalleryImage = (index: number, val: string) => {
    const updated = [...formGalleryImages];
    updated[index] = val;
    setFormGalleryImages(updated);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormGalleryImages(formGalleryImages.filter((_, i) => i !== index));
  };

  // Color handlers
  const handleAddColor = (preset?: { name: string; hex: string }) => {
    const newColor: FormColorItem = preset
      ? { name: preset.name, hex: preset.hex, images: [] }
      : { name: `Color ${formColors.length + 1}`, hex: "#374151", images: [] };

    const updatedColors = [...formColors, newColor];
    setFormColors(updatedColors);
    setFormVariants(generateVariantsMatrix(updatedColors, formSizes, formPrice, formVariants));
  };

  const handleUpdateColor = (index: number, field: "name" | "hex", val: string) => {
    const updated = [...formColors];
    updated[index] = { ...updated[index], [field]: val };
    setFormColors(updated);
    setFormVariants(generateVariantsMatrix(updated, formSizes, formPrice, formVariants));
  };

  const handleRemoveColor = (index: number) => {
    if (formColors.length <= 1) {
      toast.warning("Products must have at least one color option.");
      return;
    }
    const colorToRemove = formColors[index]?.name;
    const updated = formColors.filter((_, i) => i !== index);
    setFormColors(updated);
    const cleanedVariants = formVariants.filter(
      (v) => v.color.toLowerCase() !== colorToRemove?.toLowerCase()
    );
    setFormVariants(generateVariantsMatrix(updated, formSizes, formPrice, cleanedVariants));
  };

  const handleAddColorImage = (colorIdx: number) => {
    const rawInput = (newColorImageUrl[colorIdx] || "").trim();
    if (!rawInput) {
      toast.error("Please enter a valid image URL.");
      return;
    }
    const inputUrl = normalizeGoogleDriveImageUrl(rawInput);
    const updated = [...formColors];
    updated[colorIdx] = {
      ...updated[colorIdx],
      images: [...updated[colorIdx].images, inputUrl],
    };
    setFormColors(updated);
    setNewColorImageUrl({ ...newColorImageUrl, [colorIdx]: "" });
    setFormVariants(generateVariantsMatrix(updated, formSizes, formPrice, formVariants));
  };

  const handleRemoveColorImage = (colorIdx: number, imageIdx: number) => {
    const updated = [...formColors];
    updated[colorIdx] = {
      ...updated[colorIdx],
      images: updated[colorIdx].images.filter((_, i) => i !== imageIdx),
    };
    setFormColors(updated);
    setFormVariants(generateVariantsMatrix(updated, formSizes, formPrice, formVariants));
  };

  // Variants matrix table editing
  const handleUpdateVariant = (
    variantId: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    setFormVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const updated = { ...v, [field]: value };
          if (field === "stockCount" && Number(value) <= 0) {
            updated.inStock = false;
          }
          return updated;
        }
        return v;
      })
    );
  };

  const handleBulkStockFill = (count: number) => {
    setFormVariants((prev) =>
      prev.map((v) => ({
        ...v,
        stockCount: count,
        inStock: count > 0,
      }))
    );
    toast.success(`Set all ${formVariants.length} variant combinations to ${count} units.`);
  };

  // Computed total stock
  const calculatedTotalStock = useMemo(() => {
    if (formVariants.length > 0) {
      return formVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0);
    }
    return Number(formStockCount) || 0;
  }, [formVariants, formStockCount]);

  // Discount percentage preview
  const calculatedDiscount = useMemo(() => {
    if (formOriginalPrice && formOriginalPrice > formPrice) {
      return Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100);
    }
    return 0;
  }, [formPrice, formOriginalPrice]);

  // Submit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawPrimary = formPrimaryImage.trim();
    if (!rawPrimary) {
      toast.error("Please provide at least Photo 1 (Primary Front View).");
      return;
    }
    const primary = normalizeGoogleDriveImageUrl(rawPrimary);

    if (!formName.trim()) {
      toast.error("Please enter a garment title.");
      return;
    }

    setIsSubmitting(true);
    const productId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;

    // Collect all unique images
    const allImages: string[] = [primary];
    if (formSecondaryImage.trim()) {
      const secNorm = normalizeGoogleDriveImageUrl(formSecondaryImage.trim());
      if (!allImages.includes(secNorm)) {
        allImages.push(secNorm);
      }
    }
    formGalleryImages.forEach((img) => {
      const norm = normalizeGoogleDriveImageUrl(img.trim());
      if (norm && !allImages.includes(norm)) {
        allImages.push(norm);
      }
    });
    formColors.forEach((c) => {
      c.images.forEach((img) => {
        const norm = normalizeGoogleDriveImageUrl(img.trim());
        if (norm && !allImages.includes(norm)) {
          allImages.push(norm);
        }
      });
    });

    // Prepare final colors
    const finalColors: ProductColor[] = formColors.map((c) => ({
      name: c.name.trim(),
      hex: c.hex.trim(),
      images: c.images
        .map((img) => normalizeGoogleDriveImageUrl(img.trim()))
        .filter((img) => Boolean(img.trim())),
    }));

    // Ensure variants are present
    const finalVariants =
      formVariants.length > 0
        ? formVariants
        : generateVariantsMatrix(formColors, formSizes, formPrice, []);

    const resolvedStock = calculatedTotalStock;

    const hierarchy = formatCategoryHierarchy(categories);
    const matchedCategory =
      categories.find((c) => c.id === formCategoryId) ||
      categories.find((c) => c.name.toLowerCase() === formCategory.toLowerCase());
    const matchedHierarchy = hierarchy.find((h) => h.category.id === matchedCategory?.id);

    const savedProduct: ProductItem = {
      id: productId,
      name: formName.trim(),
      categoryId: matchedCategory ? matchedCategory.id : formCategoryId || undefined,
      category: matchedCategory ? matchedCategory.name : formCategory,
      categoryPath:
        matchedHierarchy?.fullPath || formCategoryPath || matchedCategory?.name || formCategory,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      badge: (formBadge as any) || undefined,
      stockCount: resolvedStock,
      inStock: formInStock && resolvedStock > 0,
      images: allImages,
      description: formDescription.trim(),
      material: formMaterial.trim(),
      fit: formFit.trim(),
      sizes: formSizes.length > 0 ? formSizes : ["M", "L"],
      colors: finalColors,
      variants: finalVariants,
      rating: editingProduct?.rating || 4.8,
      reviewCount: editingProduct?.reviewCount || 14,
      sku: editingProduct?.sku || `FED-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    try {
      await saveProductToFirestore(savedProduct);

      if (!isEditMode) {
        try {
          await recordInitialProductStock(savedProduct, user?.displayName || "Admin Atelier Creator");
        } catch (stockErr) {
          console.warn("Could not log initial stock movement:", stockErr);
        }
      }

      toast.success(
        editingProduct
          ? `Garment "${savedProduct.name}" updated successfully!`
          : `New garment "${savedProduct.name}" added to catalog!`
      );
      navigate("/admin?tab=products");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save garment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent access flicker while resolving auth status
  if (authLoading) {
    return <ProductFormSkeleton />;
  }

  // Access check
  if (!canManageProducts) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 p-8 text-center space-y-4 shadow-xl">
          <div className="size-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldCheckIcon className="size-8" />
          </div>
          <h2 className="text-xl font-bold">Catalog Management Privileges Required</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            You must be logged in as an Administrator or Operations Manager to create or edit catalog products.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Return to Storefront</span>
            </Link>
            <Link
              to="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-semibold text-xs transition"
            >
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadingInitial) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      {/* Sidebar for navigation */}
      <AdminSidebar
        currentTab="products"
        onSelectTab={(tab) => navigate(`/admin?tab=${tab}`)}
        user={user}
        onSignOut={() => navigate("/admin")}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 md:hidden"
              aria-label="Open Admin Menu"
            >
              <Bars3Icon className="size-6" />
            </button>

            {/* Back Button */}
            <Link
              to="/admin?tab=products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-bold text-gray-700 dark:text-neutral-200 transition"
              title="Return to Product Catalog"
            >
              <ArrowLeftIcon className="size-4" />
              <span>Back to Catalog</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span>/</span>
              <span className="font-semibold text-gray-700 dark:text-neutral-300">
                {isEditMode ? `Edit Garment` : `New Garment`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isEditMode && editingProduct && (
              <Link
                to={`/products/${editingProduct.id}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition"
                title="Preview this product in storefront"
              >
                <span>View Live</span>
                <ArrowTopRightOnSquareIcon className="size-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={(e) => handleSaveProduct(e as any)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              {isSubmitting ? (
                <Spinner className="size-3.5 text-white animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              <span>{isEditMode ? "Save Changes" : "Publish Garment"}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
                <SparklesIcon className="size-3.5" />
                <span>Product Catalog Atelier</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {isEditMode
                  ? `Edit Garment: ${editingProduct?.name || formName || "Product"}`
                  : "Add New Garment to Catalog"}
              </h1>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Configure garment descriptions, pricing, color variations with variant photos, and size stock matrix.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
                {formColors.length} Colors
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
                {formSizes.length} Sizes
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                {calculatedTotalStock} Pcs In Stock
              </span>
            </div>
          </div>

          {/* Form Grid: 2 Columns on Large Screens */}
          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Details & Media (8 Columns) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Basic Information */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                  <span>General Information</span>
                  <span className="text-[10px] text-gray-400 font-normal">Fields marked * are required</span>
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Garment Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Double-Layer Wool Long Coat"
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-600 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                        Collection / Category *
                      </label>
                      <select
                        value={
                          formCategoryId ||
                          categories.find((c) => c.name.toLowerCase() === formCategory.toLowerCase())?.id ||
                          ""
                        }
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setFormCategoryId(selectedId);
                          const cat = categories.find((c) => c.id === selectedId);
                          if (cat) {
                            setFormCategory(cat.name);
                            const hItem = formatCategoryHierarchy(categories).find(
                              (h) => h.category.id === cat.id
                            );
                            if (hItem) {
                              setFormCategoryPath(hItem.fullPath);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer font-sans"
                      >
                        {formatCategoryHierarchy(categories).map(({ category: c, label, fullPath }) => (
                          <option key={c.id} value={c.id} title={fullPath}>
                            {label} {fullPath !== label ? `(${fullPath})` : ""}
                          </option>
                        ))}
                        {formCategoryId &&
                          !categories.some((c) => c.id === formCategoryId) && (
                            <option value={formCategoryId}>{formCategory || formCategoryId}</option>
                          )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                        Material &amp; Fabric
                      </label>
                      <input
                        type="text"
                        value={formMaterial}
                        onChange={(e) => setFormMaterial(e.target.value)}
                        placeholder="e.g. 100% Combed Cotton"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                        Fit &amp; Silhouette
                      </label>
                      <input
                        type="text"
                        value={formFit}
                        onChange={(e) => setFormFit(e.target.value)}
                        placeholder="e.g. Regular Tailored Fit"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Garment Description &amp; Specifications
                    </label>
                    <textarea
                      rows={4}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe the fabric texture, construction, tailoring, and styling tips..."
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Garment Photography & Hover Views */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                    <PhotoIcon className="size-4 text-orange-600" />
                    <span>Garment Photography &amp; Card Hover View</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    SilkenDrift storefront product cards show Photo 2 on mouse hover, and all photos appear in the product gallery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo 1: Primary Cover */}
                  <div className="bg-stone-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-900 dark:text-white">
                        Photo 1: Primary Cover (Front View) *
                      </label>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                        Default Front View
                      </span>
                    </div>
                    <input
                      type="url"
                      required
                      value={formPrimaryImage}
                      onChange={(e) => setFormPrimaryImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                    />
                    {/* Live Preview */}
                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
                      {formPrimaryImage.trim() ? (
                        <img
                          src={formPrimaryImage}
                          alt="Primary cover preview"
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

                  {/* Photo 2: Secondary / Hover View */}
                  <div className="bg-stone-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-900 dark:text-white">
                        Photo 2: Secondary / Hover View
                      </label>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                        Hover Effect Active
                      </span>
                    </div>
                    <input
                      type="url"
                      value={formSecondaryImage}
                      onChange={(e) => setFormSecondaryImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                    />
                    {/* Live Preview */}
                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
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
                            Hover State
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-gray-400">
                          <PhotoIcon className="size-8 mx-auto stroke-1" />
                          <span className="text-[10px] block mt-1">Optional hover view (e.g. back angle)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Detail Photos */}
                <div className="pt-3 border-t border-stone-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Additional Detail &amp; Fabric Photos ({formGalleryImages.length})
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Fabric close-ups, lining, pocket stitches, or styling angles for the product detail page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGalleryImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-orange-600 hover:text-white text-gray-700 dark:text-neutral-300 font-bold text-xs transition cursor-pointer"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Add Detail Photo</span>
                    </button>
                  </div>

                  {formGalleryImages.length > 0 && (
                    <div className="space-y-2">
                      {formGalleryImages.map((imgUrl, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="size-11 rounded-xl overflow-hidden bg-stone-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shrink-0">
                            {imgUrl.trim() ? (
                              <img
                                src={imgUrl}
                                alt={`Detail view ${idx + 1}`}
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
                            placeholder={`Photo ${idx + 3} URL (e.g. fabric close-up)`}
                            className="flex-1 px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Remove photo"
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Available Sizes */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Available Sizes
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                      Select which size cuts are available for this garment collection.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {formSizes.length} Sizes Active
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_SIZES.map((sz) => {
                    const active = formSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                          active
                            ? "bg-orange-600 text-white shadow-xs scale-105"
                            : "bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 4: Color Variations & Variant-Wise Images */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="size-2 rounded-full bg-orange-600 animate-pulse" />
                      <span>Color Variations &amp; Variant-Wise Images</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                      Each color option can have its own dedicated set of photography. When customers click a color dot in the catalog or product page, the gallery automatically updates to that color.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddColor()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <PlusIcon className="size-4" />
                    <span>Add Color</span>
                  </button>
                </div>

                {/* Quick Color Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                    Quick Presets:
                  </span>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleAddColor(preset)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-[11px] font-medium text-gray-700 dark:text-neutral-300 hover:border-orange-500 hover:text-orange-600 transition cursor-pointer"
                    >
                      <span
                        className="size-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Colors List */}
                <div className="space-y-4 pt-2">
                  {formColors.map((colorObj, cIdx) => (
                    <div
                      key={cIdx}
                      className="rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-700/80 p-4 space-y-3.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="color"
                            value={colorObj.hex}
                            onChange={(e) => handleUpdateColor(cIdx, "hex", e.target.value)}
                            className="size-9 rounded-xl border border-gray-300 dark:border-neutral-700 cursor-pointer p-0 bg-transparent shrink-0"
                            title="Pick color hex code"
                          />
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                            <input
                              type="text"
                              value={colorObj.name}
                              onChange={(e) => handleUpdateColor(cIdx, "name", e.target.value)}
                              placeholder="Color Name (e.g. Warm Camel)"
                              className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-600"
                            />
                            <input
                              type="text"
                              value={colorObj.hex}
                              onChange={(e) => handleUpdateColor(cIdx, "hex", e.target.value)}
                              placeholder="#c29b62"
                              className="px-3 py-1.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-600"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400">
                            {colorObj.images.length} photos
                          </span>
                          {formColors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(cIdx)}
                              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Delete color option"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Variant-Specific Images for this Color */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 dark:text-neutral-200">
                            Variant-Specific Images for &quot;{colorObj.name}&quot;
                          </span>
                          <span className="text-[10px] text-gray-400">
                            First photo becomes cover when {colorObj.name} is clicked
                          </span>
                        </div>

                        {colorObj.images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                            {colorObj.images.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative group aspect-square rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-2xs"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${colorObj.name} view ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=200&q=80";
                                  }}
                                />
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-[8px] font-bold text-white backdrop-blur-xs">
                                  {imgIdx === 0 ? "Cover" : `#${imgIdx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorImage(cIdx, imgIdx)}
                                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                                  title="Remove photo"
                                >
                                  <XMarkIcon className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-3 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-dashed border-gray-200 dark:border-neutral-700 text-center">
                            <p className="text-[11px] text-gray-400 italic">
                              No dedicated photos added for {colorObj.name}. (Will fall back to product primary photos if empty).
                            </p>
                          </div>
                        )}

                        {/* Add photo URL input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="url"
                            value={newColorImageUrl[cIdx] || ""}
                            onChange={(e) =>
                              setNewColorImageUrl({
                                ...newColorImageUrl,
                                [cIdx]: e.target.value,
                              })
                            }
                            placeholder={`Paste image URL for ${colorObj.name} (e.g. Unsplash URL)...`}
                            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddColorImage(cIdx);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddColorImage(cIdx)}
                            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition cursor-pointer shrink-0"
                          >
                            Add Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: Product Variants Matrix (Color × Size) */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                      <SparklesIcon className="size-4 text-orange-600" />
                      <span>Product Variants Matrix (Color &times; Size)</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                      Manage inventory stock counts, SKU identifiers, and individual variant pricing. Total product stock auto-syncs with this matrix.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = generateVariantsMatrix(formColors, formSizes, formPrice, formVariants);
                      setFormVariants(updated);
                      toast.success(`Matrix synchronized (${updated.length} variants).`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 font-bold text-xs hover:bg-orange-600 hover:text-white transition cursor-pointer shrink-0 self-start sm:self-auto"
                    title="Regenerate all combinations based on current colors and sizes"
                  >
                    <ArrowPathIcon className="size-3.5" />
                    <span>Sync Matrix</span>
                  </button>
                </div>

                {/* Bulk Stock Fill Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formVariants.length} Active Combinations
                    </span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-500 dark:text-neutral-400">
                      Total: <strong className="text-orange-600 dark:text-orange-400">{calculatedTotalStock} pcs</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">Bulk stock set:</span>
                    <button
                      type="button"
                      onClick={() => handleBulkStockFill(10)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[11px] font-bold hover:bg-orange-600 hover:text-white transition cursor-pointer"
                    >
                      10 pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStockFill(20)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[11px] font-bold hover:bg-orange-600 hover:text-white transition cursor-pointer"
                    >
                      20 pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStockFill(50)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[11px] font-bold hover:bg-orange-600 hover:text-white transition cursor-pointer"
                    >
                      50 pcs
                    </button>
                  </div>
                </div>

                {/* Variants Matrix Table */}
                <div className="max-h-96 overflow-y-auto rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-neutral-800 uppercase text-[9px] font-bold text-gray-500 dark:text-neutral-400 tracking-wider sticky top-0 border-b border-gray-100 dark:border-neutral-800">
                      <tr>
                        <th className="py-2.5 px-4">Variant (Color &amp; Size)</th>
                        <th className="py-2.5 px-4">SKU Identifier</th>
                        <th className="py-2.5 px-4">Price (BDT ৳)</th>
                        <th className="py-2.5 px-4">Stock Count</th>
                        <th className="py-2.5 px-4 text-center">In Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {formVariants.map((v) => (
                        <tr key={v.id} className="hover:bg-stone-50/60 dark:hover:bg-neutral-800/40 transition">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="size-4 rounded-full border border-gray-300 dark:border-neutral-600 shrink-0 shadow-2xs"
                                style={{ backgroundColor: v.colorHex || "#000" }}
                              />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {v.color}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                {v.size}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={v.sku || ""}
                              onChange={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                              placeholder="SKU"
                              className="w-32 px-2.5 py-1 text-xs font-mono bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </td>

                          <td className="py-2.5 px-4">
                            <input
                              type="number"
                              value={v.price ?? formPrice}
                              onChange={(e) => handleUpdateVariant(v.id, "price", Number(e.target.value))}
                              className="w-24 px-2.5 py-1 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </td>

                          <td className="py-2.5 px-4">
                            <input
                              type="number"
                              value={v.stockCount}
                              onChange={(e) => handleUpdateVariant(v.id, "stockCount", Number(e.target.value))}
                              className="w-20 px-2.5 py-1 text-xs font-bold bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={v.inStock && v.stockCount > 0}
                              onChange={(e) => handleUpdateVariant(v.id, "inStock", e.target.checked)}
                              className="size-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Cards (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Publish & Inventory Status */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-neutral-800">
                  Inventory &amp; Visibility
                </h3>

                <div className="space-y-4 text-xs">
                  {/* In Stock Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-700">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">
                        Item In Stock
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Controls whether &apos;Add to Cart&apos; is active
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="inStockSidebarCheck"
                      checked={formInStock}
                      onChange={(e) => setFormInStock(e.target.checked)}
                      className="size-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Promotional Badge */}
                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Promotional Ribbon Badge
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

                  {/* Stock Counter Summary */}
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-900 dark:text-orange-300">
                        Total Units Available:
                      </span>
                      <span className="text-base font-black text-orange-600 dark:text-orange-400">
                        {calculatedTotalStock} pcs
                      </span>
                    </div>
                    <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-tight">
                      Calculated across {formVariants.length} color &amp; size combinations in the matrix.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Pricing in BDT */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-neutral-800">
                  Pricing (Bangladeshi Taka ৳)
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Selling Price (৳) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">
                        ৳
                      </span>
                      <input
                        type="number"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-600 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5">
                      Original Price (৳) <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={formOriginalPrice || ""}
                        onChange={(e) =>
                          setFormOriginalPrice(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="Strike-through regular price"
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                      />
                    </div>
                  </div>

                  {calculatedDiscount > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Customer Discount:
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {calculatedDiscount}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Live Storefront Card Preview */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    <EyeIcon className="size-4 text-orange-600" />
                    <span>Live Storefront Preview</span>
                  </h3>
                  <span className="text-[10px] text-gray-400">Catalog Card</span>
                </div>

                {/* Mini Card Preview */}
                <div className="rounded-2xl border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs bg-white dark:bg-neutral-900">
                  <div className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                    <img
                      src={formPrimaryImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    {formBadge && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-extrabold uppercase shadow-xs">
                        {formBadge}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="text-orange-600 font-bold uppercase text-[10px]">
                        {formCategory}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <StarSolidIcon className="size-3 text-amber-500 fill-current" />
                        <span className="font-bold text-gray-700 dark:text-neutral-300">4.9</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                      {formName || "Untitled Garment"}
                    </h4>

                    <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ৳{formPrice.toLocaleString()}
                        </span>
                        {formOriginalPrice && formOriginalPrice > formPrice && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ৳{formOriginalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Color dots preview */}
                      <div className="flex items-center gap-1">
                        {formColors.slice(0, 4).map((c, i) => (
                          <span
                            key={i}
                            className="size-2.5 rounded-full border border-gray-300 dark:border-neutral-600"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Action Buttons */}
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Spinner className="size-4 text-white animate-spin" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                  <span>{isEditMode ? "Save Garment Changes" : "Create & Publish Garment"}</span>
                </button>

                <Link
                  to="/admin?tab=products"
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-xs text-center block hover:bg-stone-50 dark:hover:bg-neutral-800 transition"
                >
                  Cancel / Return to Catalog
                </Link>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
