import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export type ProductCategory =
  | "Outerwear"
  | "Workwear"
  | "Denim"
  | "Knitwear"
  | "Essentials"
  | "Shirts"
  | "Trousers"
  | (string & {});

export interface ProductCategoryItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  itemCount: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  badge?: "New" | "Sale" | "Best Seller" | "Trending" | "Limited";
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  details?: string[];
  material?: string;
  fit?: string;
  care?: string;
  sizes: string[];
  colors: ProductColor[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  stockCount?: number;
  sku?: string;
}

export const initialProductCategories: ProductCategoryItem[] = [
  {
    id: "cat-outerwear",
    name: "Outerwear",
    slug: "outerwear",
    tagline: "Warm wool topcoats, casual jackets & all-weather trench coats",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    itemCount: 28,
  },
  {
    id: "cat-workwear",
    name: "Workwear",
    slug: "workwear",
    tagline: "Comfortable stretch blazers and formal tailored trousers",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    itemCount: 34,
  },
  {
    id: "cat-denim",
    name: "Denim",
    slug: "denim",
    tagline: "14oz durable raw selvedge denim jeans and chore jackets",
    image:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    itemCount: 19,
  },
  {
    id: "cat-knitwear",
    name: "Knitwear",
    slug: "knitwear",
    tagline: "Ultra-soft merino wool sweaters and breathable cardigans",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    itemCount: 22,
  },
  {
    id: "cat-essentials",
    name: "Essentials",
    slug: "essentials",
    tagline: "Heavyweight 240 GSM organic cotton tees and basic daily wear",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    itemCount: 16,
  },
  {
    id: "cat-shirts",
    name: "Shirts",
    slug: "shirts",
    tagline: "Pure cotton Oxford button-downs and casual utility shirts",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    itemCount: 24,
  },
  {
    id: "cat-trousers",
    name: "Trousers",
    slug: "trousers",
    tagline: "Pleated chinos and everyday relaxed tapered pants",
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    itemCount: 18,
  },
];

export const initialProductsData: ProductItem[] = [
  {
    id: "prod-wool-coat",
    name: "Double-Layer Wool Long Coat",
    category: "Outerwear",
    price: 4850,
    originalPrice: 5600,
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 142,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Warm, premium quality double-layer wool coat with a relaxed modern silhouette. Crafted with itch-free wool blend lining for superior winter comfort in Dhaka, Sylhet, and Northern Bangladesh.",
    details: [
      "Heavyweight 680 GSM wool blend exterior",
      "Soft breathable satin interior lining",
      "Horn button front closure with notched lapel",
      "Two deep welt side pockets & interior breast pocket",
    ],
    material: "70% Wool, 30% Fine Polyester Lining",
    fit: "Relaxed regular fit (fits easily over thick sweaters)",
    care: "Dry clean only. Hang on wide cedar hanger.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal Grey", hex: "#374151" },
      { name: "Warm Camel", hex: "#c29b62" },
      { name: "Classic Black", hex: "#111827" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 18,
    sku: "FD-WL-01",
  },
  {
    id: "prod-selvedge-jacket",
    name: "14oz Selvedge Denim Chore Jacket",
    category: "Denim",
    price: 3200,
    originalPrice: 3800,
    badge: "Trending",
    rating: 4.8,
    reviewCount: 88,
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Made with genuine 14oz shuttle-loom selvedge denim woven from 100% natural cotton. Features solid brass custom-embossed buttons, contrast white selvedge ID at the interior placket, and deep utility pockets.",
    details: [
      "14oz shuttle-loom raw redline selvedge denim",
      "Custom anti-rust brass shank buttons",
      "Triple-needle reinforced seam stitching",
      "Square utility chest pocket and double waist pockets",
    ],
    material: "100% Ring-Spun Cotton Denim",
    fit: "Classic boxy workwear chore fit",
    care: "Machine wash cold inside-out, hang dry to preserve indigo fades.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Indigo", hex: "#1e3a8a" },
      { name: "Washed Black", hex: "#1e293b" },
    ],
    isFeatured: true,
    inStock: true,
    stockCount: 25,
    sku: "FD-DN-02",
  },
  {
    id: "prod-hybrid-blazer",
    name: "Comfort Stretch Work Blazer",
    category: "Workwear",
    price: 3950,
    originalPrice: 4500,
    badge: "New",
    rating: 5.0,
    reviewCount: 64,
    images: [
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "A lightweight, unstructured blazer made with 4-way stretch fabric. Looks sharp for corporate presentations in Motijheel and Gulshan, yet flexes naturally for all-day comfort.",
    details: [
      "Unstructured natural shoulders without stiff padding",
      "Breathable moisture-wicking stretch blend",
      "Two-button closure with functional kissing cuff buttons",
      "Dual rear vents for effortless movement while driving",
    ],
    material: "65% Viscose, 30% Polyamide, 5% Spandex",
    fit: "Tailored modern fit with flexible chest drape",
    care: "Gentle cold cycle or dry clean. Low steam iron.",
    sizes: ["38R", "40R", "42R", "44R"],
    colors: [
      { name: "Slate Grey", hex: "#4b5563" },
      { name: "Midnight Navy", hex: "#0f172a" },
    ],
    isFeatured: true,
    isNewArrival: true,
    inStock: true,
    stockCount: 14,
    sku: "FD-WW-03",
  },
  {
    id: "prod-heavyweight-tee",
    name: "240 GSM Heavyweight Cotton T-Shirt",
    category: "Essentials",
    price: 850,
    originalPrice: 1100,
    badge: "Sale",
    rating: 4.9,
    reviewCount: 312,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Substantial 240 GSM combed cotton fabric with a reinforced 1x1 ribbed collar that keeps its shape wash after wash. Pre-shrunk and custom-dyed for colorfast richness.",
    details: [
      "240 GSM tightly knit combed cotton jersey",
      "Reinforced twin-needle collar & hem stitching",
      "Pre-shrunk fabric to prevent post-wash shrinkage",
      "Tagless itch-free printed neck label",
    ],
    material: "100% Organic Combed Cotton",
    fit: "Standard boxy streetwear fit",
    care: "Normal machine wash with similar colors. Line dry.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Off-White", hex: "#f4f4f5" },
      { name: "Oat Beige", hex: "#e4d5b7" },
      { name: "Jet Black", hex: "#27272a" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 80,
    sku: "FD-ES-04",
  },
  {
    id: "prod-stretch-trouser",
    name: "Pleated Tapered Stretch Pants",
    category: "Workwear",
    price: 2150,
    originalPrice: 2600,
    badge: "Trending",
    rating: 4.8,
    reviewCount: 96,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Smart formal trousers with single front pleats, hidden elastic waistband gussets, and a clean taper toward the ankle. Perfect for business casual days and smart dinners.",
    details: [
      "Flexible hidden waistband expansion mechanism",
      "Deep front slanted pockets & buttoned back jet pockets",
      "Pre-hemmed clean taper finish",
      "Crease-resistant fabric blend",
    ],
    material: "70% Cotton, 27% Polyester, 3% Elastane",
    fit: "Relaxed through thigh with modern tapered leg",
    care: "Machine wash cold. Warm iron if desired.",
    sizes: ["30", "32", "34", "36", "38"],
    colors: [
      { name: "Warm Stone", hex: "#d6cfc7" },
      { name: "Dark Olive", hex: "#3f4a3c" },
      { name: "Charcoal", hex: "#374151" },
    ],
    isFeatured: true,
    inStock: true,
    stockCount: 30,
    sku: "FD-WW-05",
  },
  {
    id: "prod-tech-trench",
    name: "Water-Resistant All-Weather Trench Coat",
    category: "Outerwear",
    price: 5200,
    badge: "New",
    rating: 4.9,
    reviewCount: 52,
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Tough organic cotton gabardine weave treated with a light eco-friendly DWR water repellent coating. Features a removable storm collar strap, waist tie belt, and solid tortoiseshell buttons.",
    details: [
      "High-density water-resistant cotton gabardine",
      "Detachable throat latch for breezy evenings",
      "Deep storm flap back with button hold",
      "Interior zip stash pocket for wallet and phone",
    ],
    material: "100% Water-Resistant Cotton Gabardine",
    fit: "Tailored overcoat fit with self-tie belt",
    care: "Specialist clean or wipe down with damp cloth.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Khaki Sage", hex: "#8a8b79" },
      { name: "Deep Navy", hex: "#172554" },
    ],
    isFeatured: true,
    isNewArrival: true,
    inStock: true,
    stockCount: 12,
    sku: "FD-OW-06",
  },
  {
    id: "prod-merino-knit",
    name: "Soft Fine Merino Wool Sweater",
    category: "Knitwear",
    price: 2250,
    originalPrice: 2750,
    badge: "Sale",
    rating: 4.8,
    reviewCount: 74,
    images: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Ultra-soft, non-scratchy fine merino wool sweater. Light enough to slide under your favorite blazer or chore jacket, yet warm enough for chilly evenings.",
    details: [
      "100% extra-fine Merino wool yarn",
      "Ribbed crew neckline, cuffs, and bottom hem",
      "Thermal self-regulating natural fiber",
      "Natural odor-resistant properties",
    ],
    material: "100% Extra-Fine Merino Wool",
    fit: "True to size slim-regular fit",
    care: "Hand wash cold with wool detergent, lay flat to dry.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Terracotta Brown", hex: "#c2410c" },
      { name: "Midnight Blue", hex: "#0f172a" },
      { name: "Oatmeal", hex: "#f5f5f4" },
    ],
    isFeatured: false,
    inStock: true,
    stockCount: 22,
    sku: "FD-KW-07",
  },
  {
    id: "prod-selvedge-jeans",
    name: "Classic Straight-Fit Selvedge Jeans",
    category: "Denim",
    price: 2650,
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 178,
    images: [
      "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Pure unwashed raw denim that molds to your unique body contour over time. Double-stitched with authentic chain-stitched hem and copper rivets at all stress points.",
    details: [
      "13.5oz red-line raw selvedge cotton denim",
      "Button fly with custom solid copper hardware",
      "Chain-stitched waistband and hemline",
      "Embossed genuine leather back patch",
    ],
    material: "100% Shuttle-Loom Cotton",
    fit: "Classic straight-leg cut with medium rise",
    care: "Wear as long as possible before first wash. Cold soak only.",
    sizes: ["30", "31", "32", "33", "34", "36"],
    colors: [
      { name: "Raw Indigo", hex: "#1e3a8a" },
      { name: "Natural Ecru", hex: "#fafaf9" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 35,
    sku: "FD-DN-08",
  },
  {
    id: "prod-oxford-shirt",
    name: "Pure Cotton Oxford Button-Down Shirt",
    category: "Shirts",
    price: 1650,
    originalPrice: 1950,
    badge: "Trending",
    rating: 4.9,
    reviewCount: 110,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "A staple Oxford cloth button-down shirt woven with two-ply combed cotton. Features a perfect collar roll, mother-of-pearl buttons, and a chest patch pocket.",
    details: [
      "Traditional basketweave Oxford cotton fabric",
      "Button-down collar with subtle back collar button",
      "Box pleat with hanger loop on reverse",
      "Single button rounded cuffs",
    ],
    material: "100% Two-Ply Combed Cotton",
    fit: "Modern regular fit",
    care: "Machine wash warm, tumble dry low, warm iron.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Sky Blue", hex: "#bae6fd" },
      { name: "Crisp White", hex: "#ffffff" },
      { name: "Soft Pink", hex: "#fbcfe8" },
    ],
    isFeatured: false,
    inStock: true,
    stockCount: 40,
    sku: "FD-SH-09",
  },
  {
    id: "prod-casual-chinos",
    name: "Everyday Stretch Cotton Chinos",
    category: "Trousers",
    price: 1850,
    badge: "New",
    rating: 4.7,
    reviewCount: 48,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Versatile cotton twill chinos tailored for everyday life in Dhaka. Stretchy enough for active commuting and polished enough for weekend coffee dates.",
    details: [
      "Midweight cotton twill with 3% spandex stretch",
      "YKK zip fly with horn button closure",
      "Coin pocket hidden in right pocket",
      "Garment-dyed for rich vintage color depth",
    ],
    material: "97% Cotton, 3% Spandex",
    fit: "Slim tapered leg",
    care: "Wash inside out in cold water. Tumble dry low.",
    sizes: ["30", "32", "34", "36"],
    colors: [
      { name: "Khaki Tan", hex: "#d4b996" },
      { name: "Deep Navy", hex: "#1e293b" },
      { name: "Olive Green", hex: "#4b5320" },
    ],
    isFeatured: false,
    inStock: true,
    stockCount: 28,
    sku: "FD-TR-10",
  },
];

/**
 * Fetch all products from Cloud Firestore with filtering and sorting
 */
export const fetchProductsFromFirestore = async (params?: {
  category?: string;
  searchQuery?: string;
  sortBy?: string;
}): Promise<ProductItem[]> => {
  try {
    const productsRef = collection(db, "products");
    const snap = await getDocs(productsRef);

    let items: ProductItem[] = [];

    if (!snap.empty) {
      items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as DocumentData),
      })) as ProductItem[];
    } else {
      // Auto-seed if empty
      await seedProductsToFirestore();
      items = initialProductsData;
    }

    // Apply category filter if specified
    if (params?.category && params.category !== "All") {
      items = items.filter(
        (p) => p.category?.toLowerCase() === params.category?.toLowerCase()
      );
    }

    // Apply search query filter if specified
    if (params?.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      switch (params.sortBy) {
        case "price-asc":
          items.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          items.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          items.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          items.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
          break;
        case "featured":
        default:
          items.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    return items;
  } catch (error) {
    console.warn("Failed to fetch products from Firestore, using initial fallback:", error);
    let items = [...initialProductsData];

    if (params?.category && params.category !== "All") {
      items = items.filter(
        (p) => p.category?.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return items;
  }
};

/**
 * Fetch a single product by ID from Cloud Firestore
 */
export const fetchProductByIdFromFirestore = async (
  id: string
): Promise<ProductItem | null> => {
  try {
    const docRef = doc(db, "products", id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as DocumentData) } as ProductItem;
    }

    // Fallback to local dataset
    const found = initialProductsData.find((p) => p.id === id);
    return found || null;
  } catch (error) {
    console.warn(`Failed to fetch product ${id} from Firestore:`, error);
    const found = initialProductsData.find((p) => p.id === id);
    return found || null;
  }
};

/**
 * Fetch all product categories from Firestore
 */
export const fetchCategoriesFromFirestore = async (): Promise<ProductCategoryItem[]> => {
  try {
    const snap = await getDocs(collection(db, "product_categories"));
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as ProductCategoryItem[];
    }
    return initialProductCategories;
  } catch (error) {
    console.warn("Failed to fetch categories from Firestore:", error);
    return initialProductCategories;
  }
};

/**
 * Seed all products and categories into Firebase Firestore
 */
export const seedProductsToFirestore = async (force: boolean = false) => {
  try {
    for (const product of initialProductsData) {
      await setDoc(
        doc(db, "products", product.id),
        {
          ...product,
          updatedAt: serverTimestamp(),
        },
        { merge: !force }
      );
    }

  for (const cat of initialProductCategories) {
    await setDoc(
      doc(db, "product_categories", cat.id),
      {
        ...cat,
        updatedAt: serverTimestamp(),
      },
      { merge: !force }
    );
  }

    return {
      success: true,
      message: "Products and categories successfully synchronized with Firebase Firestore!",
    };
  } catch (error) {
    console.warn("Error seeding products to Firestore:", error);
    return {
      success: false,
      message: "Could not seed all datasets to Firestore.",
    };
  }
};

/**
 * Admin: Create or update a product
 */
export const saveProductToFirestore = async (
  product: ProductItem
): Promise<ProductItem> => {
  try {
    const docRef = doc(db, "products", product.id);
    await setDoc(
      docRef,
      {
        ...product,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save product directly to Firestore:", err);
  }

  // Update in-memory / local dataset
  const index = initialProductsData.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    initialProductsData[index] = product;
  } else {
    initialProductsData.unshift(product);
  }

  return product;
};

/**
 * Admin: Delete a product
 */
export const deleteProductFromFirestore = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (err) {
    console.warn("Could not delete product from Firestore:", err);
  }

  const index = initialProductsData.findIndex((p) => p.id === id);
  if (index >= 0) {
    initialProductsData.splice(index, 1);
  }

  return true;
};

/**
 * Admin: Create or update a product category
 */
export const saveCategoryToFirestore = async (
  category: ProductCategoryItem
): Promise<ProductCategoryItem> => {
  try {
    const docRef = doc(db, "product_categories", category.id);
    await setDoc(
      docRef,
      {
        ...category,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save category directly to Firestore:", err);
  }

  const index = initialProductCategories.findIndex((c) => c.id === category.id);
  if (index >= 0) {
    initialProductCategories[index] = category;
  } else {
    initialProductCategories.push(category);
  }

  return category;
};

/**
 * Admin: Delete a product category
 */
export const deleteCategoryFromFirestore = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "product_categories", id));
  } catch (err) {
    console.warn("Could not delete category from Firestore:", err);
  }

  const index = initialProductCategories.findIndex((c) => c.id === id);
  if (index >= 0) {
    initialProductCategories.splice(index, 1);
  }

  return true;
};

