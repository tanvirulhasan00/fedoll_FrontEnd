import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";


export type ProductCategory =
  | "Outerwear"
  | "Workwear"
  | "Denim"
  | "Knitwear"
  | "Essentials"
  | "Shirts"
  | "Trousers"
  | "Uncategorized"
  | (string & {});

export const DEFAULT_CATEGORY_NAME = "Uncategorized";
export const DEFAULT_CATEGORY_ID = "cat-uncategorized";

export const DEFAULT_CATEGORY_ITEM: ProductCategoryItem = {
  id: DEFAULT_CATEGORY_ID,
  name: DEFAULT_CATEGORY_NAME,
  slug: "uncategorized",
  tagline: "Standard collection for unassigned garments",
  image:
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
  itemCount: 0,
  parentId: null,
  level: 0,
};

export interface ProductCategoryItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  itemCount: number;
  parentId?: string | null;
  level?: number;
  order?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  images?: string[]; // Variant-wise imagery specific to this color
}

export interface ProductVariant {
  id: string; // Unique variant ID, e.g. "prod-wool-coat-charcoal-m"
  color: string; // Color name, e.g. "Charcoal Grey"
  colorHex?: string; // Hex color code, e.g. "#374151"
  size: string; // Size, e.g. "M"
  sku?: string; // Variant SKU, e.g. "FD-WL-01-GRY-M"
  price?: number; // Optional variant price override
  originalPrice?: number;
  stockCount: number; // Stock count for this specific variant
  inStock: boolean;
  images: string[]; // Variant-wise images
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
  variants?: ProductVariant[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  stockCount?: number;
  sku?: string;
}

/**
 * Helper: Resolve variant-wise images for a given product and color selection
 */
export const getVariantImages = (
  product: ProductItem | null | undefined,
  colorName?: string
): string[] => {
  if (!product) return [];
  if (!colorName) return product.images || [];

  const normalized = colorName.trim().toLowerCase();

  // 1. Check if color has dedicated variant images
  const matchedColor = product.colors?.find(
    (c) => c.name.trim().toLowerCase() === normalized
  );
  if (matchedColor?.images && matchedColor.images.length > 0) {
    return matchedColor.images;
  }

  // 2. Check if any variant with this color has images
  const colorVariant = product.variants?.find(
    (v) => v.color.trim().toLowerCase() === normalized && v.images && v.images.length > 0
  );
  if (colorVariant?.images && colorVariant.images.length > 0) {
    return colorVariant.images;
  }

  // 3. Fallback to product general images
  return product.images && product.images.length > 0 ? product.images : [];
};

/**
 * Extracts a Google Drive File ID from various Google Drive and Google Docs share URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID or export=view&id=FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function extractGoogleDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/{id} or /d/{id} in drive.google.com, docs.google.com, or googleusercontent.com
  const fileDMatch = trimmed.match(/(?:drive|docs)\.google\.com\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // Pattern 2: id={id} parameter in query string
  if (/(?:drive|docs)\.google\.com/i.test(trimmed)) {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (idParamMatch && idParamMatch[1]) return idParamMatch[1];
  }

  // Pattern 3: thumbnail?id={id}
  const thumbnailMatch = trimmed.match(/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (thumbnailMatch && thumbnailMatch[1]) return thumbnailMatch[1];

  return null;
}

/**
 * Converts any Google Drive share URL into a direct, embeddable Google CDN image URL.
 * If the URL is not a Google Drive link, returns the original URL untouched.
 */
export function normalizeGoogleDriveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  const fileId = extractGoogleDriveFileId(trimmed);

  if (fileId) {
    // Return Google's direct CDN content URL for public Drive files
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Returns alternative fallback URL for Google Drive files if CDN fails (e.g. thumbnail endpoint)
 */
export function getGoogleDriveThumbnailUrl(url: string | null | undefined, width = 1600): string {
  if (!url || typeof url !== "string") return "";
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
  }
  return url || "";
}

/**
 * Helper: Find variant matching selected color and size
 */
export const getProductVariant = (
  product: ProductItem | null | undefined,
  colorName?: string,
  sizeName?: string
): ProductVariant | undefined => {
  if (!product || !product.variants || product.variants.length === 0) return undefined;
  return product.variants.find((v) => {
    const matchColor = !colorName || v.color.trim().toLowerCase() === colorName.trim().toLowerCase();
    const matchSize = !sizeName || v.size.trim().toLowerCase() === sizeName.trim().toLowerCase();
    return matchColor && matchSize;
  });
};

export const initialProductCategories: ProductCategoryItem[] = [
  {
    id: "cat-winter",
    name: "Winter",
    slug: "winter",
    tagline: "Essential cold-weather layers, outerwear, hoodies & thermal fleece",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    itemCount: 45,
    parentId: null,
    level: 0,
    order: 1,
  },
  {
    id: "cat-winter-mens",
    name: "Mens",
    slug: "winter-mens",
    tagline: "Heavyweight winter essentials, coats, and fleece hoodies tailored for men",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    itemCount: 26,
    parentId: "cat-winter",
    level: 1,
    order: 1,
  },
  {
    id: "cat-winter-mens-hoodie",
    name: "Hoodie",
    slug: "winter-mens-hoodie",
    tagline: "420 GSM brushed heavyweight cotton fleece pullover and zip hoodies",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    itemCount: 14,
    parentId: "cat-winter-mens",
    level: 2,
    order: 1,
  },
  {
    id: "cat-outerwear",
    name: "Outerwear",
    slug: "outerwear",
    tagline: "Warm wool topcoats, casual jackets & all-weather trench coats",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    itemCount: 28,
    parentId: null,
    level: 0,
    order: 2,
  },
  {
    id: "cat-workwear",
    name: "Workwear",
    slug: "workwear",
    tagline: "Comfortable stretch blazers and formal tailored trousers",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    itemCount: 34,
    parentId: null,
    level: 0,
    order: 3,
  },
  {
    id: "cat-denim",
    name: "Denim",
    slug: "denim",
    tagline: "14oz durable raw selvedge denim jeans and chore jackets",
    image:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    itemCount: 19,
    parentId: null,
    level: 0,
    order: 4,
  },
  {
    id: "cat-knitwear",
    name: "Knitwear",
    slug: "knitwear",
    tagline: "Ultra-soft merino wool sweaters and breathable cardigans",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    itemCount: 22,
    parentId: null,
    level: 0,
    order: 5,
  },
  {
    id: "cat-essentials",
    name: "Essentials",
    slug: "essentials",
    tagline: "Heavyweight 240 GSM organic cotton tees and basic daily wear",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    itemCount: 16,
    parentId: null,
    level: 0,
    order: 6,
  },
  {
    id: "cat-shirts",
    name: "Shirts",
    slug: "shirts",
    tagline: "Pure cotton Oxford button-downs and casual utility shirts",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    itemCount: 24,
    parentId: null,
    level: 0,
    order: 7,
  },
  {
    id: "cat-trousers",
    name: "Trousers",
    slug: "trousers",
    tagline: "Pleated chinos and everyday relaxed tapered pants",
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    itemCount: 18,
    parentId: null,
    level: 0,
    order: 8,
  },
  DEFAULT_CATEGORY_ITEM,
];

export const initialProductsData: ProductItem[] = [
  {
    id: "prod-winter-hoodie",
    name: "Heavyweight 420 GSM Brushed Fleece Hoodie",
    category: "Hoodie",
    price: 2450,
    originalPrice: 2950,
    badge: "Trending",
    rating: 4.9,
    reviewCount: 98,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Ultra-heavy 420 GSM combed organic cotton fleece hoodie featuring double-layer warm hood, front kangaroo pocket, and durable ribbed hems. Crafted specifically for cold winter evenings in Dhaka and northern Bangladesh.",
    details: [
      "420 GSM 100% combed cotton fleece exterior",
      "Plush brushed interior for maximum warmth and softness",
      "Double-layered structured hood with heavy-duty metal aglets",
      "Reinforced bartack stitching at stress points and kangaroo pocket",
    ],
    material: "100% Combed Organic Cotton Fleece",
    fit: "Modern Relaxed Boxy Fit",
    care: "Machine wash cold inside out, tumble dry gentle.",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      {
        name: "Vintage Ash Grey",
        hex: "#9ca3af",
        images: [
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
        ],
      },
      {
        name: "Jet Black",
        hex: "#111827",
        images: [
          "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
        ],
      },
    ],
    variants: [
      {
        id: "prod-winter-hoodie-grey-m",
        color: "Vintage Ash Grey",
        colorHex: "#9ca3af",
        size: "M",
        sku: "FD-HD-WTR-GRY-M",
        stockCount: 15,
        inStock: true,
        images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"],
      },
      {
        id: "prod-winter-hoodie-grey-l",
        color: "Vintage Ash Grey",
        colorHex: "#9ca3af",
        size: "L",
        sku: "FD-HD-WTR-GRY-L",
        stockCount: 12,
        inStock: true,
        images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"],
      },
      {
        id: "prod-winter-hoodie-blk-m",
        color: "Jet Black",
        colorHex: "#111827",
        size: "M",
        sku: "FD-HD-WTR-BLK-M",
        stockCount: 14,
        inStock: true,
        images: ["https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80"],
      },
      {
        id: "prod-winter-hoodie-blk-l",
        color: "Jet Black",
        colorHex: "#111827",
        size: "L",
        sku: "FD-HD-WTR-BLK-L",
        stockCount: 9,
        inStock: true,
        images: ["https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80"],
      },
    ],
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    inStock: true,
    stockCount: 50,
    sku: "FD-HD-WTR-01",
  },
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
      {
        name: "Charcoal Grey",
        hex: "#374151",
        images: [
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
        ],
      },
      {
        name: "Warm Camel",
        hex: "#c29b62",
        images: [
          "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
        ],
      },
      {
        name: "Classic Black",
        hex: "#111827",
        images: [
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=800&q=80",
        ],
      },
    ],
    variants: [
      { id: "var-coat-gry-s", color: "Charcoal Grey", colorHex: "#374151", size: "S", sku: "FD-WL-01-GRY-S", stockCount: 5, inStock: true, images: ["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-gry-m", color: "Charcoal Grey", colorHex: "#374151", size: "M", sku: "FD-WL-01-GRY-M", stockCount: 8, inStock: true, images: ["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-gry-l", color: "Charcoal Grey", colorHex: "#374151", size: "L", sku: "FD-WL-01-GRY-L", stockCount: 5, inStock: true, images: ["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-cml-s", color: "Warm Camel", colorHex: "#c29b62", size: "S", sku: "FD-WL-01-CML-S", stockCount: 4, inStock: true, images: ["https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-cml-m", color: "Warm Camel", colorHex: "#c29b62", size: "M", sku: "FD-WL-01-CML-M", stockCount: 6, inStock: true, images: ["https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-cml-l", color: "Warm Camel", colorHex: "#c29b62", size: "L", sku: "FD-WL-01-CML-L", stockCount: 1, inStock: true, images: ["https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-blk-m", color: "Classic Black", colorHex: "#111827", size: "M", sku: "FD-WL-01-BLK-M", stockCount: 7, inStock: true, images: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-coat-blk-l", color: "Classic Black", colorHex: "#111827", size: "L", sku: "FD-WL-01-BLK-L", stockCount: 4, inStock: true, images: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"] },
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
      {
        name: "Deep Indigo",
        hex: "#1e3a8a",
        images: [
          "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
        ],
      },
      {
        name: "Washed Black",
        hex: "#1e293b",
        images: [
          "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80",
        ],
      },
    ],
    variants: [
      { id: "var-dn-ind-s", color: "Deep Indigo", colorHex: "#1e3a8a", size: "S", sku: "FD-DN-02-IND-S", stockCount: 6, inStock: true, images: ["https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-dn-ind-m", color: "Deep Indigo", colorHex: "#1e3a8a", size: "M", sku: "FD-DN-02-IND-M", stockCount: 10, inStock: true, images: ["https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-dn-ind-l", color: "Deep Indigo", colorHex: "#1e3a8a", size: "L", sku: "FD-DN-02-IND-L", stockCount: 5, inStock: true, images: ["https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-dn-blk-m", color: "Washed Black", colorHex: "#1e293b", size: "M", sku: "FD-DN-02-BLK-M", stockCount: 8, inStock: true, images: ["https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-dn-blk-l", color: "Washed Black", colorHex: "#1e293b", size: "L", sku: "FD-DN-02-BLK-L", stockCount: 4, inStock: true, images: ["https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80"] },
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
      {
        name: "Slate Grey",
        hex: "#4b5563",
        images: [
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        ],
      },
      {
        name: "Midnight Navy",
        hex: "#0f172a",
        images: [
          "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
        ],
      },
    ],
    variants: [
      { id: "var-blz-gry-38", color: "Slate Grey", colorHex: "#4b5563", size: "38R", sku: "FD-WW-03-GRY-38", stockCount: 4, inStock: true, images: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-blz-gry-40", color: "Slate Grey", colorHex: "#4b5563", size: "40R", sku: "FD-WW-03-GRY-40", stockCount: 5, inStock: true, images: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-blz-nvy-38", color: "Midnight Navy", colorHex: "#0f172a", size: "38R", sku: "FD-WW-03-NVY-38", stockCount: 6, inStock: true, images: ["https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"] },
      { id: "var-blz-nvy-40", color: "Midnight Navy", colorHex: "#0f172a", size: "40R", sku: "FD-WW-03-NVY-40", stockCount: 8, inStock: true, images: ["https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"] },
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

const PRODUCTS_CACHE_KEY = "fedoll_products_v1";

export const getLocalProducts = (): ProductItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalProduct = (product: ProductItem) => {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalProducts();
    const idx = current.findIndex((p) => p.id === product.id);
    let updated: ProductItem[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = product;
    } else {
      updated = [product, ...current];
    }
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not cache product to local storage:", err);
  }
};

export const saveAllLocalProducts = (products: ProductItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn("Could not cache products to local storage:", err);
  }
};

const CATEGORIES_CACHE_KEY = "fedoll_categories_v1";

export const getLocalCategories = (): ProductCategoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAllLocalCategories = (cats: ProductCategoryItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(cats));
  } catch (err) {
    console.warn("Could not cache categories to local storage:", err);
  }
};

/**
 * Ensure every catalog garment has a concrete variant matrix for variant-level stock management
 */
export const ensureProductHasVariants = (p: ProductItem): ProductItem => {
  if (!p) return p;

  if (p.variants && p.variants.length > 0) {
    const totalFromVars = p.variants.reduce((sum, v) => sum + (Number(v?.stockCount) || 0), 0);
    return {
      ...p,
      stockCount: totalFromVars,
      inStock: totalFromVars > 0,
    };
  }

  const colors = p.colors && p.colors.length > 0 ? p.colors : [{ name: "Default", hex: "#111827" }];
  const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ["Standard"];
  const totalVariants = Math.max(1, colors.length * sizes.length);
  const totalStock = Number(p.stockCount) || 24;
  const baseStock = Math.max(1, Math.floor(totalStock / totalVariants));
  const remainder = totalStock % totalVariants;

  const variants: ProductVariant[] = [];
  let variantIdx = 0;
  const prodIdStr = String(p.id || "prod");
  const skuPrefix = p.sku || `FD-${prodIdStr.slice(-4).toUpperCase()}`;

  colors.forEach((c: any) => {
    const colorName = typeof c === "string" ? c : c?.name || "Default";
    const colorHex = typeof c === "object" && c?.hex ? c.hex : "#111827";
    const colorImages = typeof c === "object" && Array.isArray(c?.images) && c.images.length > 0 ? c.images : p.images || [];

    sizes.forEach((s: any) => {
      const sizeStr = String(s || "Standard");
      const slugColor = colorName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const slugSize = sizeStr.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const stock = baseStock + (variantIdx === 0 ? remainder : 0);
      variants.push({
        id: `var-${prodIdStr}-${slugColor}-${slugSize}`,
        color: colorName,
        colorHex,
        size: sizeStr,
        sku: `${skuPrefix}-${slugColor.slice(0, 3).toUpperCase()}-${slugSize.toUpperCase()}`,
        price: p.price,
        stockCount: stock,
        inStock: stock > 0,
        images: colorImages,
      });
      variantIdx++;
    });
  });

  const resolvedStock = variants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0);

  return {
    ...p,
    variants,
    stockCount: resolvedStock,
    inStock: resolvedStock > 0,
  };
};

/**
 * Fetch all products from Cloud Firestore or Local Cache with filtering and sorting
 */
export const fetchProductsFromFirestore = async (params?: {
  category?: string;
  searchQuery?: string;
  sortBy?: string;
}): Promise<ProductItem[]> => {
  let items: ProductItem[] = [];

  try {
    const productsRef = collection(db, "products");
    const snap = await getDocs(productsRef);

    if (!snap.empty) {
      items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as DocumentData),
      })) as ProductItem[];
    }
  } catch (error) {
    console.warn("Firestore products fetch failed:", error);
  }

  // Check local cache
  const localItems = getLocalProducts();

  if (items.length > 0) {
    items = items.map(ensureProductHasVariants);
    saveAllLocalProducts(items);
  } else if (localItems.length > 0) {
    items = localItems.map(ensureProductHasVariants);
  } else {
    // Initial bootstrap
    items = initialProductsData.map(ensureProductHasVariants);
    saveAllLocalProducts(items);
    seedProductsToFirestore().catch(() => {});
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
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
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
        items.sort((a, b) => (b.rating || 5) - (a.rating || 5));
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
};

/**
 * Fetch a single product by ID from Cloud Firestore or Local Storage
 */
export const fetchProductByIdFromFirestore = async (
  id: string
): Promise<ProductItem | null> => {
  if (!id) return null;
  const idStr = String(id).trim();

  // Primary: Live Firestore Read
  try {
    const docRef = doc(db, "products", idStr);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const p = ensureProductHasVariants({ id: snap.id, ...(snap.data() as DocumentData) } as ProductItem);
      saveLocalProduct(p);
      return p;
    }
  } catch (err) {
    console.warn(`Could not fetch product ${id} from Firestore:`, err);
  }

  // Secondary Fallback: Local Cache
  const local = getLocalProducts().find(
    (p) => String(p.id).trim() === idStr || p.name.trim().toLowerCase() === idStr.toLowerCase()
  );
  if (local) {
    return ensureProductHasVariants(local);
  }

  // Tertiary Fallback: In-memory Catalog
  const fallback = initialProductsData.find(
    (p) => String(p.id).trim() === idStr || p.name.trim().toLowerCase() === idStr.toLowerCase()
  );
  return fallback ? ensureProductHasVariants(fallback) : null;
};

/**
 * Fetch all product categories from Firestore
 */
export const fetchCategoriesFromFirestore = async (): Promise<ProductCategoryItem[]> => {
  try {
    const snap = await getDocs(collection(db, "product_categories"));
    if (!snap.empty) {
      const list = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          ...data,
          image: normalizeGoogleDriveImageUrl(data.image || ""),
        } as ProductCategoryItem;
      });

      const hasDefault = list.some(
        (c) =>
          c.id === DEFAULT_CATEGORY_ID ||
          c.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase()
      );

      if (!hasDefault) {
        list.push(DEFAULT_CATEGORY_ITEM);
        setDoc(
          doc(db, "product_categories", DEFAULT_CATEGORY_ID),
          sanitizeForFirestore({
            ...DEFAULT_CATEGORY_ITEM,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        ).catch(() => {});
      }

      saveAllLocalCategories(list);
      return list;
    }

    // Auto-seed initial categories to Firestore if empty
    for (const cat of initialProductCategories) {
      try {
        await setDoc(
          doc(db, "product_categories", cat.id),
          sanitizeForFirestore({
            ...cat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );
      } catch (err) {
        console.warn("Could not seed category:", err);
      }
    }

    saveAllLocalCategories(initialProductCategories);
    return initialProductCategories;
  } catch (error) {
    console.warn("Failed to fetch categories from Firestore:", error);
    const local = getLocalCategories();
    if (local && local.length > 0) {
      return local;
    }
    return initialProductCategories;
  }
};

/**
 * Real-time listener for product categories from Cloud Firestore.
 * Automatically notifies subscribers whenever categories are added, updated, or removed in Firestore.
 */
export const subscribeToCategoriesFromFirestore = (
  callback: (categories: ProductCategoryItem[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    const colRef = collection(db, "product_categories");
    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => {
            const data = d.data() as DocumentData;
            return {
              id: d.id,
              ...data,
              image: normalizeGoogleDriveImageUrl(data.image || ""),
            } as ProductCategoryItem;
          });

          const hasDefault = list.some(
            (c) =>
              c.id === DEFAULT_CATEGORY_ID ||
              c.name.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase()
          );

          if (!hasDefault) {
            list.push(DEFAULT_CATEGORY_ITEM);
          }

          saveAllLocalCategories(list);
          callback(list);
        } else {
          // If Firestore collection is empty, trigger fallback fetch
          fetchCategoriesFromFirestore().then((cats) => callback(cats));
        }
      },
      (error) => {
        console.warn("Realtime category subscription error:", error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Could not set up realtime category subscription:", err);
    return () => {};
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
        sanitizeForFirestore({
          ...product,
          updatedAt: serverTimestamp(),
        }),
        { merge: !force }
      );
    }

    for (const cat of initialProductCategories) {
      await setDoc(
        doc(db, "product_categories", cat.id),
        sanitizeForFirestore({
          ...cat,
          updatedAt: serverTimestamp(),
        }),
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
  const prepared = ensureProductHasVariants(product);

  const docRef = doc(db, "products", prepared.id);
  await setDoc(
    docRef,
    sanitizeForFirestore({
      ...prepared,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  // Update local storage cache
  try {
    saveLocalProduct(prepared);
  } catch (err) {
    console.warn("Could not save product to local cache:", err);
  }

  // Update in-memory dataset
  try {
    const index = initialProductsData.findIndex((p) => p.id === prepared.id);
    if (index >= 0) {
      initialProductsData[index] = prepared;
    } else {
      initialProductsData.unshift(prepared);
    }
  } catch (err) {
    console.warn("Could not mutate in-memory initialProductsData:", err);
  }

  return prepared;
};

/**
 * Admin: Delete a product
 */
export const deleteProductFromFirestore = async (id: string): Promise<boolean> => {
  await deleteDoc(doc(db, "products", id));

  try {
    const updated = getLocalProducts().filter((p) => p.id !== id);
    saveAllLocalProducts(updated);
  } catch (err) {
    console.warn("Could not update local products cache on delete:", err);
  }

  try {
    const index = initialProductsData.findIndex((p) => p.id === id);
    if (index >= 0) {
      initialProductsData.splice(index, 1);
    }
  } catch (err) {
    console.warn("Could not mutate in-memory initialProductsData on delete:", err);
  }

  return true;
};

/**
 * Admin: Create or update a product category
 */
export const saveCategoryToFirestore = async (
  category: ProductCategoryItem
): Promise<ProductCategoryItem> => {
  const normalizedCategory: ProductCategoryItem = {
    ...category,
    image: normalizeGoogleDriveImageUrl(category.image),
  };
  const docRef = doc(db, "product_categories", normalizedCategory.id);
  await setDoc(
    docRef,
    sanitizeForFirestore({
      ...normalizedCategory,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  try {
    const index = initialProductCategories.findIndex((c) => c.id === normalizedCategory.id);
    if (index >= 0) {
      initialProductCategories[index] = normalizedCategory;
    } else {
      initialProductCategories.push(normalizedCategory);
    }
  } catch (err) {
    console.warn("Could not mutate in-memory initialProductCategories:", err);
  }

  try {
    const local = getLocalCategories();
    const idx = local.findIndex((c) => c.id === normalizedCategory.id);
    let updatedCats: ProductCategoryItem[];
    if (idx >= 0) {
      updatedCats = [...local];
      updatedCats[idx] = normalizedCategory;
    } else {
      updatedCats = [...local, normalizedCategory];
    }
    saveAllLocalCategories(updatedCats);
  } catch {}

  return normalizedCategory;
};

/**
 * Admin: Delete a product category.
 * If any products were assigned to this category, automatically reassign them
 * to the default fallback "Uncategorized" category across Cloud Firestore,
 * in-memory cache, and local storage.
 */
export const deleteCategoryFromFirestore = async (
  id: string,
  categoryName?: string
): Promise<{ success: boolean; reassignedCount: number }> => {
  // Prevent deleting the default fallback category
  if (
    id === DEFAULT_CATEGORY_ID ||
    (categoryName && categoryName.trim().toLowerCase() === DEFAULT_CATEGORY_NAME.toLowerCase())
  ) {
    throw new Error(
      `The default "${DEFAULT_CATEGORY_NAME}" category is required as a fallback and cannot be deleted.`
    );
  }

  const catToDelete = initialProductCategories.find((c) => c.id === id);
  const targetName = (categoryName || catToDelete?.name || "").trim();

  let reassignedCount = 0;

  // 1. Ensure the default category exists in Firestore
  try {
    const defaultDocRef = doc(db, "product_categories", DEFAULT_CATEGORY_ID);
    await setDoc(
      defaultDocRef,
      sanitizeForFirestore({
        ...DEFAULT_CATEGORY_ITEM,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not ensure default category in Firestore:", err);
  }

  // 2. Query and reassign products assigned to this category
  if (targetName) {
    try {
      const q = query(collection(db, "products"), where("category", "==", targetName));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.update(d.ref, {
            category: DEFAULT_CATEGORY_NAME,
            updatedAt: serverTimestamp(),
          });
          reassignedCount++;
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn("Batch product reassignment failed, trying individual updates:", err);
      try {
        const allSnap = await getDocs(collection(db, "products"));
        for (const docSnap of allSnap.docs) {
          const data = docSnap.data();
          if (data.category && String(data.category).toLowerCase() === targetName.toLowerCase()) {
            await updateDoc(docSnap.ref, {
              category: DEFAULT_CATEGORY_NAME,
              updatedAt: serverTimestamp(),
            });
            reassignedCount++;
          }
        }
      } catch (innerErr) {
        console.warn("Fallback product reassignment failed:", innerErr);
      }
    }

    // 3. Update in-memory initialProductsData
    try {
      initialProductsData.forEach((p) => {
        if (p.category && p.category.toLowerCase() === targetName.toLowerCase()) {
          p.category = DEFAULT_CATEGORY_NAME;
        }
      });
    } catch (e) {
      // In-memory array may be frozen in production Redux state
    }

    // 4. Update local storage cached products
    try {
      const localProducts = getLocalProducts().map((p) => {
        if (p.category && p.category.toLowerCase() === targetName.toLowerCase()) {
          return { ...p, category: DEFAULT_CATEGORY_NAME };
        }
        return p;
      });
      saveAllLocalProducts(localProducts);
    } catch (e) {
      // Storage error ignored
    }
  }

  // 5. Delete category document from Firestore
  await deleteDoc(doc(db, "product_categories", id));

  // 5b. Reassign any children of this category to its parent (or root null)
  try {
    const childrenSnap = await getDocs(
      query(collection(db, "product_categories"), where("parentId", "==", id))
    );
    if (!childrenSnap.empty) {
      const batch = writeBatch(db);
      const newParentId = catToDelete?.parentId || null;
      childrenSnap.docs.forEach((childDoc) => {
        batch.update(childDoc.ref, {
          parentId: newParentId,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (childErr) {
    console.warn("Could not reassign children of deleted category:", childErr);
  }

  // 6. Update in-memory initialProductCategories
  try {
    const index = initialProductCategories.findIndex((c) => c.id === id);
    if (index >= 0) {
      initialProductCategories.splice(index, 1);
    }
    // Update in-memory children parentId
    const newParentId = catToDelete?.parentId || null;
    initialProductCategories.forEach((c) => {
      if (c.parentId === id) {
        c.parentId = newParentId;
      }
    });
  } catch (err) {
    console.warn("Could not mutate in-memory initialProductCategories on delete:", err);
  }

  try {
    const updatedCats = getLocalCategories().filter((c) => c.id !== id);
    saveAllLocalCategories(updatedCats);
  } catch (err) {
    console.warn("Could not mutate local categories on delete:", err);
  }

  return { success: true, reassignedCount };
};

/**
 * Find a category by ID, slug, or name (case-insensitive)
 */
export const findCategory = (
  identifier: string | null | undefined,
  categories: ProductCategoryItem[]
): ProductCategoryItem | undefined => {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  return categories.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.name.trim().toLowerCase() === clean ||
      c.slug?.trim().toLowerCase() === clean
  );
};

/**
 * Get category chain of ancestors from root down to this category.
 * e.g. for "Hoodie", returns [WinterCategory, MensCategory, HoodieCategory]
 */
export const getCategoryAncestors = (
  targetIdOrName: string | null | undefined,
  allCategories: ProductCategoryItem[]
): ProductCategoryItem[] => {
  if (!targetIdOrName) return [];
  const target = findCategory(targetIdOrName, allCategories);
  if (!target) return [];

  const chain: ProductCategoryItem[] = [target];
  const visited = new Set<string>([target.id]);
  let current = target;

  while (current.parentId) {
    const parent = allCategories.find((c) => c.id === current.parentId);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    chain.unshift(parent);
    current = parent;
  }

  return chain;
};

/**
 * Get category descendants (the category itself + all its children, grandchildren, etc.)
 */
export const getCategoryDescendants = (
  targetIdOrName: string | null | undefined,
  allCategories: ProductCategoryItem[]
): ProductCategoryItem[] => {
  if (!targetIdOrName) return [];
  const target = findCategory(targetIdOrName, allCategories);
  if (!target) return [];

  const descendants: ProductCategoryItem[] = [target];
  const queue: string[] = [target.id];
  const visited = new Set<string>([target.id]);

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = allCategories.filter((c) => c.parentId === parentId && !visited.has(c.id));
    for (const child of children) {
      visited.add(child.id);
      descendants.push(child);
      queue.push(child.id);
    }
  }

  return descendants;
};

/**
 * Get all matching lowercase category names for a category and its descendants.
 * e.g. for "Winter" -> ["winter", "mens", "hoodie"]
 */
export const getCategoryDescendantNames = (
  targetIdOrName: string | null | undefined,
  allCategories: ProductCategoryItem[]
): string[] => {
  if (!targetIdOrName || targetIdOrName === "All") {
    return [];
  }
  const descendants = getCategoryDescendants(targetIdOrName, allCategories);
  if (descendants.length === 0) {
    return [targetIdOrName.trim().toLowerCase()];
  }
  return descendants.map((d) => d.name.trim().toLowerCase());
};

/**
 * Get immediate child categories of a given parent category (or root categories if null)
 */
export const getCategoryChildren = (
  parentId: string | null | undefined,
  allCategories: ProductCategoryItem[]
): ProductCategoryItem[] => {
  if (!parentId || parentId === "root") {
    return allCategories.filter((c) => !c.parentId);
  }
  return allCategories.filter((c) => c.parentId === parentId);
};

/**
 * Check if candidateParentId is a descendant of candidateChildId (to prevent cyclical category hierarchies)
 */
export const isCategoryDescendantOf = (
  candidateChildId: string,
  candidateParentId: string,
  allCategories: ProductCategoryItem[]
): boolean => {
  if (candidateChildId === candidateParentId) return true;
  const descendants = getCategoryDescendants(candidateChildId, allCategories);
  return descendants.some((d) => d.id === candidateParentId);
};

export interface FormattedHierarchyItem {
  category: ProductCategoryItem;
  path: string;
  fullPath: string;
  label: string;
  depth: number;
}

/**
 * Formats categories into a sorted hierarchical list with indentation depth, formatted label, and breadcrumb path
 */
export const formatCategoryHierarchy = (
  allCategories: ProductCategoryItem[]
): FormattedHierarchyItem[] => {
  const result: FormattedHierarchyItem[] = [];
  const visited = new Set<string>();

  const traverse = (parentId: string | null, depth: number, parentPath: string) => {
    const children = allCategories.filter((c) => {
      if (parentId === null) {
        return !c.parentId;
      }
      return c.parentId === parentId;
    });

    // Sort by order then name
    children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);

      const currentPath = parentPath ? `${parentPath} > ${child.name}` : child.name;
      const label = depth === 0 ? child.name : `${"\u00A0\u00A0".repeat(depth)}↳ ${child.name}`;
      result.push({
        category: child,
        path: currentPath,
        fullPath: currentPath,
        label,
        depth,
      });

      traverse(child.id, depth + 1, currentPath);
    }
  };

  // 1. Traverse from root (parentId = null)
  traverse(null, 0, "");

  // 2. Catch any orphaned categories whose parentId doesn't exist
  for (const cat of allCategories) {
    if (!visited.has(cat.id)) {
      result.push({
        category: cat,
        path: cat.name,
        fullPath: cat.name,
        label: cat.name,
        depth: 0,
      });
    }
  }

  return result;
};



