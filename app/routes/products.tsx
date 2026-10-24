import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/products";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import QuickViewModal from "~/components/main/Home/QuickViewModal";
import StockAvailabilityBadge from "~/components/ui/StockAvailabilityBadge";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchProducts,
  fetchProductCategories,
  syncProductsFromFirestore,
  setProductCategory,
  setProductSearchQuery,
  setSortBy,
  setOnlyInStock,
  resetProductFilters,
  setProductCategories,
} from "~/redux/features/productSlice";
import { setQuickViewProduct, toggleWishlistAsync } from "~/redux/features/homeSlice";
import { addToCart } from "~/redux/features/cart/cartSlice";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ShoppingBagIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import type { ProductItem, ProductCategoryItem } from "~/firebase";
import {
  getVariantImages,
  subscribeToCategoriesFromFirestore,
  DEFAULT_CATEGORY_NAME,
  initialProductCategories,
  findCategory,
  getCategoryAncestors,
  getCategoryDescendantNames,
  getCategoryChildren,
} from "~/firebase";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Products & Collections | Fedoll Bangladesh" },
    {
      name: "description",
      content:
        "Explore Fedoll's complete collection of export-quality garments: selvedge denim jackets, double-layer wool coats, stretch workwear, and heavy combed cotton essentials in Bangladesh.",
    },
    {
      name: "keywords",
      content:
        "Fedoll products, Bangladesh clothing shop, selvedge denim, wool coats Dhaka, workwear blazers, casual shirts Bangladesh",
    },
  ];
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug?: string;
  tagline?: string;
  itemCount?: number;
  count: number;
  level: number;
  order?: number;
  children: CategoryTreeNode[];
}

interface CatalogProductCardProps {
  product: ProductItem;
  isWishlisted: boolean;
  onWishlist: (e: React.MouseEvent, id: string) => void;
  onQuickView: (product: ProductItem) => void;
}

const CatalogProductCard: React.FC<CatalogProductCardProps> = ({
  product,
  isWishlisted,
  onWishlist,
  onQuickView,
}) => {
  const dispatch = useAppDispatch();
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || "");

  // Resolve dynamic variant photography for selected color
  const activeVariantImages = useMemo(() => {
    return getVariantImages(product, selectedColor);
  }, [product, selectedColor]);

  const primaryImage = activeVariantImages[0] || product.images[0];
  const secondaryImage = activeVariantImages[1] || product.images[1];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isSoldOut = !product.inStock || (product.stockCount !== undefined && product.stockCount <= 0);
  const availableStock = product.stockCount ?? (product.inStock ? 25 : 0);

  const cartItems = useAppSelector((state) => state.cart.items);
  const existingInCart = cartItems.find(
    (item) =>
      item.id === product.id &&
      item.color === (selectedColor || product.colors[0]?.name || "Standard")
  );
  const currentInCart = existingInCart ? existingInCart.quantity : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut || availableStock <= 0) {
      toast.error(`${product.name} is currently sold out. Save it to your wishlist!`);
      return;
    }

    if (currentInCart + 1 > availableStock) {
      toast.error(
        `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available in stock. You already have all ${availableStock} in your bag!`
      );
      return;
    }

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: primaryImage,
        quantity: 1,
        size: product.sizes[0] || "M",
        color: selectedColor || product.colors[0]?.name || "Standard",
        category: product.category,
        maxStock: availableStock,
      })
    );
    toast.success(`Added ${product.name} (${selectedColor || "Standard"}) to your bag!`);
  };

  return (
    <div className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300">
      {/* Product Card Image Container */}
      <div className="relative aspect-4/5 overflow-hidden bg-stone-100 dark:bg-neutral-800">
        <Link to={`/products/${product.id}`} className="block w-full h-full cursor-pointer">
          <img
            src={primaryImage}
            alt={`${product.name} - ${selectedColor}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isSoldOut ? "opacity-85 grayscale-25" : ""
            }`}
          />

          {/* Secondary Hover Image */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              className={`absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isSoldOut ? "opacity-85 grayscale-25" : ""
              }`}
            />
          )}
        </Link>

        {/* Badges */}
        {isSoldOut ? (
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md bg-neutral-900/90 text-white tracking-wider backdrop-blur-xs border border-white/20">
              Sold Out
            </span>
          </div>
        ) : product.badge ? (
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs ${
                product.badge === "Sale"
                  ? "bg-rose-600 text-white"
                  : product.badge === "Best Seller"
                  ? "bg-stone-900 text-white"
                  : "bg-orange-600 dark:bg-orange-500 text-white"
              }`}
            >
              {product.badge}
            </span>
          </div>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => onWishlist(e, product.id)}
          className={`absolute top-3 right-3 size-8 rounded-full backdrop-blur-xs flex items-center justify-center transition shadow-xs cursor-pointer z-10 ${
            isWishlisted
              ? "bg-white/95 dark:bg-neutral-900/95 text-rose-600 shadow-sm"
              : "bg-white/90 dark:bg-neutral-900/90 text-gray-700 dark:text-neutral-200 hover:text-rose-600 hover:scale-110"
          }`}
          title={isWishlisted ? "Saved in wishlist" : "Save to wishlist"}
        >
          {isWishlisted ? (
            <HeartSolidIcon className="size-4 text-rose-600" />
          ) : (
            <HeartIcon className="size-4" />
          )}
        </button>

        {/* Hover Action Bar */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xs text-gray-900 dark:text-white text-xs font-bold hover:bg-white dark:hover:bg-neutral-700 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <EyeIcon className="size-4 text-gray-600 dark:text-neutral-300" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isSoldOut || currentInCart >= availableStock}
            className={`size-9 rounded-xl flex items-center justify-center shadow-md transition shrink-0 ${
              isSoldOut || currentInCart >= availableStock
                ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-60"
                : "bg-orange-600 hover:bg-orange-700 active:scale-98 text-white cursor-pointer"
            }`}
            title={
              isSoldOut
                ? "Sold Out"
                : currentInCart >= availableStock
                ? `Only ${availableStock} in stock (already in bag)`
                : `Quick Add (${selectedColor})`
            }
          >
            <ShoppingBagIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            <StockAvailabilityBadge
              stockCount={product.stockCount}
              inStock={product.inStock}
            />
          </div>

          <Link
            to={`/products/${product.id}`}
            className="block text-sm font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition line-clamp-1"
          >
            {product.name}
          </Link>

          <div className="flex items-center gap-1 mt-1">
            <StarSolidIcon className="size-3.5 text-amber-500 fill-current" />
            <span className="font-bold text-xs text-gray-700 dark:text-neutral-200">
              {product.rating}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500">({product.reviewCount})</span>
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ৳{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 dark:text-neutral-500 line-through">
                ৳{product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>

          {/* Interactive Color Swatch Dots with Dynamic Variant Imagery */}
          <div className="flex items-center gap-1.5">
            {product.colors.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c.name);
                  }}
                  onMouseEnter={() => setSelectedColor(c.name)}
                  className={`size-3.5 rounded-full border transition cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-orange-500/60 border-orange-600 scale-125 shadow-xs"
                      : "border-gray-300 dark:border-neutral-700 hover:scale-120"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (Hover or click to switch variant photo)`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    items: products,
    categories,
    selectedCategory,
    searchQuery,
    sortBy,
    onlyInStock,
    loading,
    syncing,
  } = useAppSelector((state) => state.products);

  const { user } = useAppSelector((state) => state.auth);
  const { wishlistIds } = useAppSelector((state) => state.home);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownBarRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterDropdown = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdownId(id);
  };

  const handleMouseLeaveDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdownId(null);
    }, 250);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownBarRef.current && !dropdownBarRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Sync category param from URL on initial load and URL changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const matched = categories.find(
        (c) =>
          c.name.trim().toLowerCase() === categoryParam.trim().toLowerCase() ||
          c.slug?.trim().toLowerCase() === categoryParam.trim().toLowerCase()
      );
      dispatch(setProductCategory(matched ? matched.name : categoryParam));
    }
    const searchParam = searchParams.get("search");
    if (searchParam) {
      dispatch(setProductSearchQuery(searchParam));
      setLocalSearch(searchParam);
    }
  }, [searchParams, categories, dispatch]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductCategories());

    // Subscribe to realtime updates from Firestore product_categories collection
    const unsubscribe = subscribeToCategoriesFromFirestore((liveCats) => {
      dispatch(setProductCategories(liveCats));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const handleCategoryChange = (cat: string) => {
    dispatch(setProductCategory(cat));
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (cat === "All") {
        updated.delete("category");
      } else {
        updated.set("category", cat);
      }
      return updated;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setProductSearchQuery(localSearch));
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (localSearch.trim()) {
        updated.set("search", localSearch.trim());
      } else {
        updated.delete("search");
      }
      return updated;
    });
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    dispatch(setProductSearchQuery(""));
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.delete("search");
      return updated;
    });
  };

  const handleSyncFirebase = async () => {
    try {
      await dispatch(syncProductsFromFirestore()).unwrap();
      toast.success("Products and categories synchronized from Cloud Firestore!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync products with Firebase");
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, product: (typeof products)[0]) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)) {
      toast.error(`${product.name} is currently sold out. Save it to your wishlist!`);
      return;
    }

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        size: product.sizes[0] || "M",
        color: product.colors[0]?.name || "Standard",
        category: product.category,
      })
    );
    toast.success(`Added ${product.name} to your shopping bag!`);
  };

  const handleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistAsync({ productId: id, userId: user?.uid }));
    const isSaved = wishlistIds.includes(id);
    if (isSaved) {
      toast.info("Removed from saved items");
    } else {
      toast.success("Saved to your wishlist!");
    }
  };

  // Active category object & hierarchy ancestors
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === "All") return null;
    return findCategory(selectedCategory, categories);
  }, [categories, selectedCategory]);

  const categoryAncestors = useMemo(() => {
    if (!activeCategoryObj) return [];
    return getCategoryAncestors(activeCategoryObj.id, categories);
  }, [activeCategoryObj, categories]);

  // Subcategory data for drilling down (children or siblings)
  const subcategoryData = useMemo(() => {
    if (!activeCategoryObj) return null;

    const directChildren = getCategoryChildren(activeCategoryObj.id, categories);
    if (directChildren.length > 0) {
      return {
        parentName: activeCategoryObj.name,
        isRootOfStrip: true,
        items: directChildren,
      };
    }

    if (activeCategoryObj.parentId) {
      const parentCat = categories.find((c) => c.id === activeCategoryObj.parentId);
      const siblings = getCategoryChildren(activeCategoryObj.parentId, categories);
      if (parentCat && siblings.length > 0) {
        return {
          parentName: parentCat.name,
          isRootOfStrip: false,
          items: siblings,
        };
      }
    }

    return null;
  }, [activeCategoryObj, categories]);

  // Filter and sort products in memory (hierarchically)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Hierarchical Category filter: match selected category and all its children/descendants
    if (selectedCategory !== "All") {
      const allowedCategories = new Set(
        getCategoryDescendantNames(selectedCategory, categories).map((c) =>
          c.trim().toLowerCase()
        )
      );
      result = result.filter((p) =>
        allowedCategories.has((p.category || "").trim().toLowerCase())
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // In stock filter
    if (onlyInStock) {
      result = result.filter((p) => p.inStock);
    }

    // Price range filter
    result = result.filter((p) => p.price <= maxPrice);

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case "featured":
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [products, selectedCategory, categories, searchQuery, onlyInStock, maxPrice, sortBy]);

  // Helper to determine if a node or any of its descendants is currently selected
  const isNodeOrDescendantSelected = (node: CategoryTreeNode, targetName: string): boolean => {
    if (!targetName || targetName === "All") return false;
    const normalizedTarget = targetName.trim().toLowerCase();
    if (node.name.trim().toLowerCase() === normalizedTarget) return true;
    return node.children.some((child) => isNodeOrDescendantSelected(child, targetName));
  };

  // Compute category counts dynamically including all descendant subcategories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    const sourceCategories =
      categories && categories.length > 0 ? categories : [];

    for (const cat of sourceCategories) {
      const descendants = new Set(
        getCategoryDescendantNames(cat.name, sourceCategories).map((n) => n.trim().toLowerCase())
      );
      const count = products.filter((p) =>
        descendants.has((p.category || "").trim().toLowerCase())
      ).length;
      counts[cat.name.trim().toLowerCase()] = count;
      counts[cat.id] = count;
    }

    for (const p of products) {
      const c = (p.category || "").trim().toLowerCase();
      if (c && counts[c] === undefined) {
        counts[c] = products.filter((prod) => (prod.category || "").trim().toLowerCase() === c).length;
      }
    }

    return counts;
  }, [products, categories]);

  // Compute dynamic recursive category tree with parent-child relationships
  const categoryTree = useMemo(() => {
    const sourceCategories =
      categories && categories.length > 0 ? categories : [];

    const getChildrenFor = (parentId: string, parentName: string): ProductCategoryItem[] => {
      return sourceCategories.filter(
        (c) =>
          c.id !== parentId &&
          (c.parentId === parentId ||
            (c.parentId && c.parentId.trim().toLowerCase() === parentName.trim().toLowerCase()))
      );
    };

    const visitedIds = new Set<string>();

    const buildTreeNode = (cat: ProductCategoryItem): CategoryTreeNode => {
      visitedIds.add(cat.id);
      const rawChildren = getChildrenFor(cat.id, cat.name).filter(
        (c) => !visitedIds.has(c.id)
      );

      rawChildren.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
      );

      const childrenNodes = rawChildren.map(buildTreeNode);
      const count = categoryCounts[cat.name.trim().toLowerCase()] ?? 0;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        tagline: cat.tagline,
        itemCount: cat.itemCount,
        count,
        level: cat.level ?? 0,
        order: cat.order,
        children: childrenNodes,
      };
    };

    // Root categories: no parentId, or parentId doesn't match any known category
    const rootCategories = sourceCategories.filter((cat) => {
      if (!cat.parentId) return true;
      const parentExists = sourceCategories.some(
        (c) => c.id === cat.parentId || c.name.trim().toLowerCase() === cat.parentId?.trim().toLowerCase()
      );
      return !parentExists;
    });

    rootCategories.sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
    );

    const filteredRoots = rootCategories.filter((cat) => {
      if (cat.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase()) {
        const hasUncat = products.some(
          (p) => p.category?.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase()
        );
        if (!hasUncat) return false;
      }
      return true;
    });

    const roots: CategoryTreeNode[] = filteredRoots.map(buildTreeNode);

    // Also include any standalone product categories not present in categories collection
    for (const p of products) {
      const catName = p.category?.trim();
      if (catName && !visitedIds.has(catName.toLowerCase())) {
        const existsInTree = (nodes: CategoryTreeNode[]): boolean =>
          nodes.some(
            (n) => n.name.trim().toLowerCase() === catName.toLowerCase() || existsInTree(n.children)
          );

        if (!existsInTree(roots)) {
          visitedIds.add(catName.toLowerCase());
          roots.push({
            id: `cat-${catName.toLowerCase()}`,
            name: catName,
            count: categoryCounts[catName.toLowerCase()] ?? 0,
            level: 0,
            children: [],
          });
        }
      }
    }

    return roots;
  }, [categories, products, categoryCounts]);

  // Recursive renderer for child categories inside dropdown menus
  const renderChildDropdownItems = (
    nodes: CategoryTreeNode[],
    depth = 0
  ): React.ReactNode => {
    return nodes.map((child) => {
      const isSelected =
        selectedCategory.trim().toLowerCase() === child.name.trim().toLowerCase();
      const hasSubChildren = child.children.length > 0;
      const isDescendantSelected = isNodeOrDescendantSelected(child, selectedCategory);

      return (
        <div key={child.id} className="flex flex-col">
          <button
            type="button"
            onClick={() => {
              handleCategoryChange(child.name);
              setOpenDropdownId(null);
            }}
            className={`w-full flex items-center justify-between text-left py-2 px-3 text-xs rounded-xl transition cursor-pointer ${
              isSelected
                ? "bg-orange-600 text-white font-bold shadow-xs"
                : isDescendantSelected
                ? "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-semibold"
                : "text-gray-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400 font-medium"
            }`}
            style={{ paddingLeft: `${12 + depth * 14}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {depth > 0 && (
                <span className="text-gray-400 dark:text-neutral-500 font-mono text-[11px] select-none">
                  ↳
                </span>
              )}
              <span className="truncate">{child.name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                }`}
              >
                {child.count}
              </span>
              {isSelected && <CheckIcon className="size-3.5 text-white stroke-[2.5]" />}
            </div>
          </button>

          {hasSubChildren && (
            <div className="space-y-0.5 mt-0.5">
              {renderChildDropdownItems(child.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Navigation Layer */}
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-stone-50 dark:bg-neutral-900/60 border-b border-stone-200/60 dark:border-neutral-800 py-3 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 overflow-x-auto scrollbar-none" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition shrink-0">
                Home
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={() => handleCategoryChange("All")}
                className="hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer shrink-0"
              >
                Collections
              </button>
              {selectedCategory === "All" || categoryAncestors.length === 0 ? (
                <>
                  <span>/</span>
                  <span className="font-bold text-gray-900 dark:text-white shrink-0">
                    {selectedCategory === "All" ? "All Products" : selectedCategory}
                  </span>
                </>
              ) : (
                categoryAncestors.map((anc, idx) => {
                  const isLast = idx === categoryAncestors.length - 1;
                  return (
                    <React.Fragment key={anc.id}>
                      <span>/</span>
                      {isLast ? (
                        <span className="font-bold text-gray-900 dark:text-white shrink-0">
                          {anc.name}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(anc.name)}
                          className="hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer shrink-0 font-medium"
                        >
                          {anc.name}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </nav>
          </div>
        </div>

        {/* Page Hero Header */}
        <section className="relative overflow-visible bg-gradient-to-b from-stone-50 dark:from-neutral-900/50 via-orange-50/15 dark:via-neutral-950 to-white dark:to-neutral-950 border-b border-stone-200/60 dark:border-neutral-800 py-12 sm:py-16 transition-colors z-20">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  <SparklesIcon className="size-3.5 text-orange-600 dark:text-orange-400" />
                  Export Quality Garments
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {selectedCategory === "All" ? (
                    <>
                      Explore All Collections. <br />
                      <span className="text-orange-600 dark:text-orange-400 italic font-serif">
                        Made for Everyday Living.
                      </span>
                    </>
                  ) : (
                    <>
                      {selectedCategory} Collection. <br />
                      <span className="text-orange-600 dark:text-orange-400 italic font-serif">
                        Crafted in Bangladesh.
                      </span>
                    </>
                  )}
                </h1>
                <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                  {activeCategoryObj?.tagline ||
                    "Crafted with heavy 14oz shuttle-loom selvedge denim, pure double-layer wool, and 240 GSM combed cotton. Shipped anywhere in Bangladesh with Cash on Delivery."}
                </p>
              </div>

              {/* Live Firestore Connection Status & Sync */}
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-full shadow-2xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Firestore Sync</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncFirebase}
                  disabled={syncing || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Resync products directly with Firebase Firestore"
                >
                  <ArrowPathIcon
                    className={`size-3.5 ${syncing ? "animate-spin text-orange-600 dark:text-orange-400" : ""}`}
                  />
                  <span>{syncing ? "Syncing..." : "Sync Products"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Category Filter Bar with Dropdowns for Child Categories */}
            <div
              ref={dropdownBarRef}
              className="mt-10 flex flex-wrap items-center gap-2.5 relative z-30"
            >
              {/* All Products Tab */}
              <button
                type="button"
                onClick={() => {
                  handleCategoryChange("All");
                  setOpenDropdownId(null);
                }}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-orange-600 dark:bg-orange-500 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200/80 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    selectedCategory === "All"
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {/* Dynamic Categories: Single pill if no children, Dropdown if child categories exist */}
              {categoryTree.map((tab) => {
                const hasChildren = tab.children.length > 0;
                const isDirectActive =
                  selectedCategory.trim().toLowerCase() === tab.name.trim().toLowerCase();
                const isDescendantActive = isNodeOrDescendantSelected(tab, selectedCategory);
                const isOpen = openDropdownId === tab.id;

                if (!hasChildren) {
                  return (
                    <button
                      key={tab.id || tab.name}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(tab.name);
                        setOpenDropdownId(null);
                      }}
                      className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        isDirectActive
                          ? "bg-orange-600 dark:bg-orange-500 text-white shadow-md shadow-orange-600/20"
                          : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200/80 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400"
                      }`}
                    >
                      <span>{tab.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isDirectActive
                            ? "bg-white/20 text-white"
                            : "bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                }

                // Category HAS child categories: render interactive pill with dropdown menu
                return (
                  <div
                    key={tab.id || tab.name}
                    className="relative"
                    onMouseEnter={() => handleMouseEnterDropdown(tab.id)}
                    onMouseLeave={handleMouseLeaveDropdown}
                  >
                    {/* Category Pill with Dropdown Trigger */}
                    <div
                      className={`inline-flex items-center rounded-full transition shadow-xs ${
                        isDirectActive
                          ? "bg-orange-600 dark:bg-orange-500 text-white shadow-md shadow-orange-600/20"
                          : isDescendantActive
                          ? "bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-2 border-orange-500/80 dark:border-orange-500"
                          : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border border-stone-200/80 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleCategoryChange(tab.name);
                          setOpenDropdownId(isOpen ? null : tab.id);
                        }}
                        className="inline-flex items-center gap-2 pl-4 pr-1.5 py-2.5 text-xs font-semibold cursor-pointer"
                      >
                        <span>{tab.name}</span>
                        {isDescendantActive && !isDirectActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-orange-200 dark:bg-orange-900/80 text-orange-900 dark:text-orange-200 truncate max-w-[100px]">
                            {selectedCategory}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isDirectActive
                              ? "bg-white/20 text-white"
                              : isDescendantActive
                              ? "bg-orange-200/60 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300"
                              : "bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(isOpen ? null : tab.id);
                        }}
                        aria-expanded={isOpen}
                        aria-label={`Toggle ${tab.name} subcategories dropdown`}
                        className={`pr-3 pl-1 py-2.5 flex items-center justify-center cursor-pointer transition ${
                          isDirectActive
                            ? "text-white/90 hover:text-white"
                            : isDescendantActive
                            ? "text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-white"
                            : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
                        }`}
                      >
                        <ChevronDownIcon
                          className={`size-3.5 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Popover Dropdown Menu */}
                    {isOpen && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                        role="menu"
                      >
                        {/* Parent Category "All [Name]" Action */}
                        <button
                          type="button"
                          onClick={() => {
                            handleCategoryChange(tab.name);
                            setOpenDropdownId(null);
                          }}
                          className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                            isDirectActive
                              ? "bg-orange-600 text-white shadow-2xs"
                              : "text-gray-900 dark:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-orange-600 dark:hover:text-orange-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <SparklesIcon className="size-3.5 text-orange-500 shrink-0" />
                            <span>All {tab.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                isDirectActive
                                  ? "bg-white/20 text-white"
                                  : "bg-stone-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                              }`}
                            >
                              {tab.count}
                            </span>
                            {isDirectActive && <CheckIcon className="size-3.5 text-white stroke-[2.5]" />}
                          </div>
                        </button>

                        <div className="my-1.5 border-t border-stone-100 dark:border-neutral-800" />

                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-neutral-500">
                          Subcategories
                        </div>

                        <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
                          {renderChildDropdownItems(tab.children)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Multi-Level Subcategory Exploration Strip */}
            {subcategoryData && (
              <div className="mt-4 pt-4 border-t border-stone-200/60 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-neutral-400 shrink-0 font-medium mr-1">
                  <span>↳ {subcategoryData.parentName} Subcategories:</span>
                </div>

                {/* "All [Parent]" option button */}
                <button
                  type="button"
                  onClick={() => handleCategoryChange(subcategoryData.parentName)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    selectedCategory.trim().toLowerCase() === subcategoryData.parentName.trim().toLowerCase()
                      ? "bg-stone-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                      : "bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 hover:bg-stone-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span>All {subcategoryData.parentName}</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    ({categoryCounts[subcategoryData.parentName.trim().toLowerCase()] || 0})
                  </span>
                </button>

                {/* Child categories */}
                {subcategoryData.items.map((sub) => {
                  const isSubActive =
                    selectedCategory.trim().toLowerCase() === sub.name.trim().toLowerCase();
                  const subCount = categoryCounts[sub.name.trim().toLowerCase()] || 0;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleCategoryChange(sub.name)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        isSubActive
                          ? "bg-orange-600 text-white shadow-xs"
                          : "bg-white dark:bg-neutral-900 border border-stone-200/90 dark:border-neutral-800 text-stone-700 dark:text-neutral-300 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
                      }`}
                    >
                      <span>{sub.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSubActive
                            ? "bg-white/20 text-white"
                            : "bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-neutral-400"
                        }`}
                      >
                        {subCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Product Catalog Body */}
        <section className="py-12 bg-white dark:bg-neutral-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search, Sort, and Filter Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-stone-200/80 dark:border-neutral-800">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search denim, coats, blazers..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition"
                />
                <MagnifyingGlassIcon className="absolute left-3.5 top-3 size-4 text-gray-400 dark:text-neutral-500" />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-3 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                  >
                    <XMarkIcon className="size-4" />
                  </button>
                )}
              </form>

              {/* Sort & Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-neutral-300">
                  <span className="text-gray-400 dark:text-neutral-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => dispatch(setSortBy(e.target.value as any))}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                  >
                    <option value="featured">Featured / Best</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">New Arrivals</option>
                  </select>
                </div>

                {/* In Stock Toggle */}
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-neutral-300 cursor-pointer px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-stone-50 dark:hover:bg-neutral-800 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => dispatch(setOnlyInStock(e.target.checked))}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  <span>In Stock Only</span>
                </label>

                {/* Price Filter Selector */}
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-neutral-400">
                  <span className="text-gray-400 dark:text-neutral-500">Max:</span>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-gray-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value={10000}>All Prices</option>
                    <option value={2000}>Under ৳2,000</option>
                    <option value={3500}>Under ৳3,500</option>
                    <option value={5000}>Under ৳5,000</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(selectedCategory !== "All" || searchQuery || onlyInStock || maxPrice < 10000) && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(resetProductFilters());
                      setLocalSearch("");
                      setMaxPrice(10000);
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    <XMarkIcon className="size-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Count Summary */}
            <div className="pt-6 pb-4 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
              <p>
                Showing{" "}
                <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> items
                {selectedCategory !== "All" && (
                  <span>
                    {" "}
                    in <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedCategory}</span>
                  </span>
                )}
              </p>
              <span className="text-gray-400 dark:text-neutral-500">All prices in Bangladeshi Taka (৳ BDT)</span>
            </div>

            {/* Products Grid */}
            {loading && filteredProducts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-neutral-800 overflow-hidden shadow-xs animate-pulse"
                  >
                    <div className="relative aspect-4/5 w-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-neutral-700 opacity-60" />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-3 rounded-full bg-stone-200 dark:bg-neutral-800" />
                        <div className="w-12 h-3 rounded-full bg-stone-200 dark:bg-neutral-800" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="w-4/5 h-4 rounded-md bg-stone-200 dark:bg-neutral-800" />
                        <div className="w-1/2 h-4 rounded-md bg-stone-200 dark:bg-neutral-800" />
                      </div>
                      <div className="w-24 h-3.5 rounded-full bg-stone-100 dark:bg-neutral-800" />
                      <div className="pt-3 mt-auto border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="w-20 h-5 rounded-md bg-stone-200 dark:bg-neutral-800" />
                        <div className="flex items-center gap-1.5">
                          <div className="size-3.5 rounded-full bg-stone-200 dark:bg-neutral-800" />
                          <div className="size-3.5 rounded-full bg-stone-200 dark:bg-neutral-800" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                <div className="size-16 mx-auto rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                  <MagnifyingGlassIcon className="size-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  We couldn&apos;t find any garments matching your selected filters. Try broadening
                  your search or switching categories.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(resetProductFilters());
                    setLocalSearch("");
                    setMaxPrice(10000);
                    setSearchParams({});
                  }}
                  className="px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                {filteredProducts.map((product) => (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onWishlist={handleWishlist}
                    onQuickView={(p) => dispatch(setQuickViewProduct(p))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Fedoll Customer Guarantees Strip */}
        <section className="py-12 bg-stone-50 dark:bg-neutral-900 border-t border-stone-200/60 dark:border-neutral-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <TruckIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Delivery in 64 Districts</h4>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Doorstep courier delivery across Dhaka and all districts in Bangladesh with Cash on Delivery &amp; bKash.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">7-Day Easy Size Exchange</h4>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Wrong size? Message our Dhaka support team for a seamless size exchange without hassle.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <SparklesIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">100% Export-Grade Fabrics</h4>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Solid selvedge denim, combed ring-spun cotton, and natural wool tested for longevity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quick View Modal */}
      <QuickViewModal />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
