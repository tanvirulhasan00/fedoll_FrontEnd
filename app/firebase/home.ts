import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface HeroBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  image: string;
  accent: string;
}

export interface ValueProp {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface FeaturedCategory {
  id: string;
  name: string;
  tagline: string;
  itemCount: string;
  image: string;
  link: string;
}

import {
  fetchProductsFromFirestore,
  getLocalProducts,
  normalizeGoogleDriveImageUrl,
  type ProductItem,
} from "./products";

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  comment: string;
  productName: string;
}

export type SpotlightBadgeColor =
  | "orange"
  | "amber"
  | "emerald"
  | "blue"
  | "rose"
  | "purple"
  | "stone";

export type SpotlightThemeStyle =
  | "dark-stone"
  | "gradient-sunset"
  | "gradient-ocean"
  | "gradient-emerald"
  | "gradient-royal"
  | "clean-light";

export interface SpotlightBanner {
  id: string;
  tag: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  discountCode?: string;
  discountPercent?: string;
  badgeColor?: SpotlightBadgeColor;
  themeStyle?: SpotlightThemeStyle;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  isActive?: boolean;
  order?: number;
  updatedAt?: any;
}

/**
 * Convert a database ProductItem into a HeroBanner slide for the hero slider section
 */
export function convertProductToHeroBanner(
  product: ProductItem,
  index: number = 0
): HeroBanner {
  let badgeText = "Featured Product • Bangladesh";
  if (product.badge) {
    badgeText = `${product.badge} • Bangladesh`;
  } else if (product.isNewArrival) {
    badgeText = `New Arrival • ${product.category || "Collection"}`;
  } else if (product.isBestSeller) {
    badgeText = `Best Seller • ${product.category || "Collection"}`;
  } else if (product.category) {
    badgeText = `${product.category} Collection • Bangladesh`;
  }

  const rawImage =
    (product.images && product.images.length > 0 && product.images[0]) || "";
  const primaryImage =
    rawImage ||
    (index % 2 === 0
      ? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85"
      : "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=85");

  const formattedPrice =
    typeof product.price === "number" && product.price > 0
      ? ` • ৳${product.price.toLocaleString()}`
      : "";

  const ctaText = `Shop Now${formattedPrice}`;
  const ctaLink = `/products/${product.id}`;

  const secondaryCtaText = product.category
    ? `Explore ${product.category}`
    : "View All Products";
  const secondaryCtaLink = product.category
    ? `/products?category=${encodeURIComponent(product.category)}`
    : "/products";

  return {
    id: `hero-prod-${product.id}`,
    badge: badgeText,
    title: product.name,
    subtitle:
      product.description ||
      "Crafted for comfort, durability, and daily elegance. Fast delivery all across Bangladesh with Cash on Delivery and bKash.",
    ctaText,
    ctaLink,
    secondaryCtaText,
    secondaryCtaLink,
    image: normalizeGoogleDriveImageUrl(primaryImage),
    accent: index % 2 === 0 ? "orange" : "stone",
  };
}

// Initial datasets in BDT (Bangladeshi Taka) and clear, easy English
export const initialHeroBanners: HeroBanner[] = [
  {
    id: "banner-1",
    badge: "Winter 2026 Collection • Bangladesh",
    title: "Premium Everyday Clothing Made with Quality Fabrics",
    subtitle:
      "Crafted for comfort, style, and long-lasting wear. Fast delivery all across Bangladesh with Cash on Delivery and bKash.",
    ctaText: "Shop Jackets & Coats",
    ctaLink: "/products?category=Outerwear",
    secondaryCtaText: "Read Our Story",
    secondaryCtaLink: "/about-us",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
    accent: "orange",
  },
  {
    id: "banner-2",
    badge: "Special Denim Release",
    title: "14oz Heavyweight Selvedge Denim Jackets & Jeans",
    subtitle:
      "Made on vintage shuttle looms using 100% natural cotton. Durable clothing designed to look better the more you wear it.",
    ctaText: "Explore Denim",
    ctaLink: "/products?category=Denim",
    secondaryCtaText: "All Products",
    secondaryCtaLink: "/products",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=85",
    accent: "stone",
  },
];

export const initialValueProps: ValueProp[] = [
  {
    id: "prop-1",
    icon: "TruckIcon",
    title: "Fast Delivery in Bangladesh",
    description: "2-3 days delivery across Dhaka and all 64 districts. Use voucher FREEDELIVERY for free delivery.",
  },
  {
    id: "prop-2",
    icon: "ShieldCheckIcon",
    title: "100% Quality Guaranteed",
    description: "Premium pure cotton, fine wools, and solid stitching tested for daily durability.",
  },
  {
    id: "prop-3",
    icon: "ArrowPathRoundedSquareIcon",
    title: "7-Day Easy Exchange",
    description: "Got the wrong size? Enjoy quick and hassle-free size exchanges anywhere in Bangladesh.",
  },
  {
    id: "prop-4",
    icon: "SparklesIcon",
    title: "Cash on Delivery & bKash",
    description: "Pay conveniently via Cash on Delivery, bKash, Nagad, or credit/debit card.",
  },
];

export const initialFeaturedCategories: FeaturedCategory[] = [
  {
    id: "cat-outerwear",
    name: "Jackets & Winter Coats",
    tagline: "Warm wool topcoats, casual jackets & lightweight windbreakers",
    itemCount: "28 Items",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    link: "/products?category=Outerwear",
  },
  {
    id: "cat-workwear",
    name: "Office & Smart Casual Wear",
    tagline: "Comfortable stretch blazers and formal tailored trousers",
    itemCount: "34 Items",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    link: "/products?category=Workwear",
  },
  {
    id: "cat-denim",
    name: "Heavyweight Selvedge Denim",
    tagline: "14oz durable raw denim jeans and chore jackets",
    itemCount: "19 Items",
    image:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    link: "/products?category=Denim",
  },
  {
    id: "cat-knitwear",
    name: "T-Shirts & Soft Sweaters",
    tagline: "Heavy 240 GSM organic cotton tees and merino knitwear",
    itemCount: "22 Items",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    link: "/products?category=Knitwear",
  },
];

// Product pricing in Bangladeshi Taka (BDT) with easy English product names & details
export const initialProducts: ProductItem[] = [
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
    ],
    description:
      "Warm, premium quality double-layer wool coat with a relaxed modern fit. Perfect for winter evenings in Dhaka and trips outside.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Charcoal Grey", hex: "#374151" },
      { name: "Warm Camel", hex: "#c29b62" },
      { name: "Classic Black", hex: "#111827" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
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
    ],
    description:
      "Made with genuine 14oz shuttle-loom selvedge denim. Solid brass buttons and deep utility pockets that hold your phone and wallet.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Deep Indigo", hex: "#1e3a8a" },
      { name: "Washed Black", hex: "#1e293b" },
    ],
    isFeatured: true,
    inStock: true,
  },
  {
    id: "prod-hybrid-blazer",
    name: "Comfort Stretch Work Blazer",
    category: "Workwear",
    price: 3950,
    badge: "New",
    rating: 5.0,
    reviewCount: 64,
    images: [
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "A lightweight, unpadded blazer made with 4-way stretch fabric. Looks sharp for office meetings and feels as easy as a cardigan.",
    sizes: ["38R", "40R", "42R", "44R"],
    colors: [
      { name: "Slate Grey", hex: "#4b5563" },
      { name: "Midnight Navy", hex: "#0f172a" },
    ],
    isFeatured: true,
    isNewArrival: true,
    inStock: true,
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
      "Thick, high-grade combed cotton fabric with a reinforced collar that never loosens. Pre-shrunk and durable for daily wear.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Off-White", hex: "#f4f4f5" },
      { name: "Oat Beige", hex: "#e4d5b7" },
      { name: "Jet Black", hex: "#27272a" },
    ],
    isFeatured: false,
    isBestSeller: true,
    inStock: true,
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
      "Smart formal pants with front pleats and flexible waist stretch. Comfortable for long office hours and driving in traffic.",
    sizes: ["30", "32", "34", "36"],
    colors: [
      { name: "Warm Stone", hex: "#d6cfc7" },
      { name: "Dark Olive", hex: "#3f4a3c" },
      { name: "Charcoal", hex: "#374151" },
    ],
    isFeatured: true,
    inStock: true,
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
      "Tough organic cotton gabardine with light rain resistance. Features a storm flap, belt tie, and solid buttons.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Khaki Sage", hex: "#8a8b79" },
      { name: "Deep Navy", hex: "#172554" },
    ],
    isFeatured: true,
    isNewArrival: true,
    inStock: true,
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
      "Ultra-soft, itch-free fine wool sweater. Light enough to wear under a jacket yet warm enough for cool winter nights.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Terracotta Brown", hex: "#c2410c" },
      { name: "Midnight Blue", hex: "#0f172a" },
      { name: "Oatmeal", hex: "#f5f5f4" },
    ],
    isFeatured: false,
    inStock: true,
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
      "Pure rigid cotton denim that shapes to your body naturally over time. Double-stitched for maximum longevity and everyday comfort.",
    sizes: ["30", "31", "32", "33", "34", "36"],
    colors: [
      { name: "Raw Indigo", hex: "#1e3a8a" },
      { name: "Natural Ecru", hex: "#fafaf9" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
  },
];

export const initialTestimonials: TestimonialItem[] = [
  {
    id: "test-1",
    name: "Farhan Ahmed",
    role: "Software Engineer",
    location: "Gulshan, Dhaka",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "The wool long coat exceeded my expectations. The fabric is heavy, warm, and the finish looks very high-end. Delivered to my home in Gulshan in less than 24 hours.",
    productName: "Double-Layer Wool Long Coat",
  },
  {
    id: "test-2",
    name: "Nusrat Jahan",
    role: "Architect",
    location: "Dhanmondi, Dhaka",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "Finding genuine, comfortable blazers in Bangladesh used to be tough. SilkenDrift's stretch blazer is super light and easy to wear all day during client meetings.",
    productName: "Comfort Stretch Work Blazer",
  },
  {
    id: "test-3",
    name: "Tanvir Hasan",
    role: "Creative Director",
    location: "Nasirabad, Chittagong",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "The 14oz selvedge denim jacket is top quality. Heavy pure cotton, solid brass buttons, and looks fantastic with tees. Cash on delivery was smooth.",
    productName: "14oz Selvedge Denim Chore Jacket",
  },
];

export const initialSpotlightBanners: SpotlightBanner[] = [
  {
    id: "spotlight-denim-capsule",
    tag: "Special Offer • Bangladesh",
    title: "Premium Selvedge Denim & Winter Coats",
    description:
      "Order online today and enjoy 15% discount with voucher SILKENDRIFT2026. Use voucher FREEDELIVERY for free courier delivery all across Bangladesh.",
    ctaText: "Shop The Collection",
    ctaLink: "/products?category=Denim",
    secondaryCtaText: "Explore Outerwear",
    secondaryCtaLink: "/products?category=Outerwear",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    discountCode: "SILKENDRIFT2026",
    discountPercent: "15% OFF",
    badgeColor: "orange",
    themeStyle: "dark-stone",
    isActive: true,
    order: 1,
  },
  {
    id: "spotlight-winter-trench",
    tag: "Flash Campaign • Outerwear Drop",
    title: "Hand-Tailored Wool Trench & Overcoats",
    description:
      "Designed for sharp modern tailoring and winter defense. Engineered with luxury double-layer wool and horn buttons. Limited seasonal run.",
    ctaText: "Shop Outerwear",
    ctaLink: "/products?category=Outerwear",
    secondaryCtaText: "View Lookbook",
    secondaryCtaLink: "/blogs",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
    discountCode: "WINTER2026",
    discountPercent: "20% OFF",
    badgeColor: "amber",
    themeStyle: "gradient-sunset",
    isActive: true,
    order: 2,
  },
  {
    id: "spotlight-heritage-rmg",
    tag: "Artisan Heritage • Dhaka Atelier",
    title: "Export-Certified Heavyweight Knitwear",
    description:
      "Every knitwear and denim piece is sewn in ethical Bangladeshi facilities by generational craft masters. 100% natural organic cotton.",
    ctaText: "Discover Knitwear",
    ctaLink: "/products?category=Knitwear",
    secondaryCtaText: "Our Story",
    secondaryCtaLink: "/about-us",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    discountCode: "FREEDELIVERY",
    discountPercent: "FREE SHIPPING",
    badgeColor: "emerald",
    themeStyle: "gradient-ocean",
    isActive: true,
    order: 3,
  },
];

export const initialSpotlightBanner: SpotlightBanner = initialSpotlightBanners[0];

/**
 * Merge Firestore documents with initial presets so that there is never a flash
 * where the slider collapses into a single static banner.
 */
export const mergeWithDefaultBanners = (
  fetched: SpotlightBanner[]
): SpotlightBanner[] => {
  if (!fetched || fetched.length === 0) return initialSpotlightBanners;

  // If only 1 banner exists in DB (legacy state from before multi-banner feature),
  // merge the remaining preset banners so the slider has multiple slides and never glitches
  if (fetched.length < 2) {
    const existingIds = new Set(fetched.map((b) => b.id));
    const missing = initialSpotlightBanners.filter((b) => !existingIds.has(b.id));
    const merged = [...fetched, ...missing].map((b, idx) => ({
      ...b,
      order: typeof b.order === "number" ? b.order : idx + 1,
      isActive: b.isActive !== false,
    }));
    merged.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return merged;
  }

  const result = fetched.map((b, idx) => ({
    ...b,
    order: typeof b.order === "number" ? b.order : idx + 1,
    isActive: b.isActive !== false,
  }));
  result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return result;
};

/**
 * Fetch all spotlight campaign banners from Firebase Firestore
 */
export const fetchSpotlightBannersFromFirestore = async (): Promise<SpotlightBanner[]> => {
  try {
    const bannerSnap = await getDocs(collection(db, "spotlight_banners"));
    if (bannerSnap.empty) {
      seedSpotlightBannersToFirestore(false).catch(() => {});
      return initialSpotlightBanners;
    }
    const banners = bannerSnap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as DocumentData) } as SpotlightBanner)
    );
    const merged = mergeWithDefaultBanners(banners);
    if (banners.length < 2) {
      seedSpotlightBannersToFirestore(false).catch(() => {});
    }
    return merged;
  } catch (err) {
    console.warn("Failed to fetch spotlight banners from Firestore, using fallback:", err);
    return initialSpotlightBanners;
  }
};

/**
 * Real-time listener for spotlight banners from Firebase Firestore
 */
export const subscribeToSpotlightBannersFromFirestore = (
  callback: (banners: SpotlightBanner[]) => void
) => {
  try {
    const q = query(collection(db, "spotlight_banners"));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          seedSpotlightBannersToFirestore(false).catch(() => {});
          callback(initialSpotlightBanners);
          return;
        }
        const banners = snapshot.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as SpotlightBanner)
        );
        const merged = mergeWithDefaultBanners(banners);
        if (banners.length < 2) {
          seedSpotlightBannersToFirestore(false).catch(() => {});
        }
        callback(merged);
      },
      (error) => {
        console.warn("Error subscribing to spotlight banners:", error);
        callback(initialSpotlightBanners);
      }
    );
  } catch (err) {
    console.warn("Failed to setup spotlight banner listener:", err);
    callback(initialSpotlightBanners);
    return () => {};
  }
};

/**
 * Create or update a spotlight campaign banner in Firestore
 */
export const saveSpotlightBannerToFirestore = async (banner: SpotlightBanner) => {
  const bannerId = banner.id || `spotlight-${Date.now()}`;
  const bannerRef = doc(db, "spotlight_banners", bannerId);
  const dataToSave = {
    ...banner,
    id: bannerId,
    order: typeof banner.order === "number" ? banner.order : 1,
    isActive: banner.isActive !== false,
    updatedAt: serverTimestamp(),
  };
  await setDoc(bannerRef, dataToSave, { merge: true });
  return { success: true, id: bannerId };
};

/**
 * Delete a spotlight banner from Firestore
 */
export const deleteSpotlightBannerFromFirestore = async (bannerId: string) => {
  const bannerRef = doc(db, "spotlight_banners", bannerId);
  await deleteDoc(bannerRef);
  return { success: true };
};

/**
 * Seed or restore default spotlight banners to Firestore
 */
export const seedSpotlightBannersToFirestore = async (force: boolean = false) => {
  for (const item of initialSpotlightBanners) {
    await setDoc(
      doc(db, "spotlight_banners", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }
  return { success: true, count: initialSpotlightBanners.length };
};

/**
 * Fetch home page dynamic dataset from Firebase Firestore
 */
export const fetchHomeDataFromFirestore = async () => {
  try {
    const catSnap = await getDocs(collection(db, "featured_categories"));
    const featuredCategories: FeaturedCategory[] = catSnap.empty
      ? initialFeaturedCategories
      : catSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as FeaturedCategory)
        );

    // Fetch products using the unified products fetcher (handles Firestore + cache + variants)
    let products: ProductItem[] = [];
    try {
      products = await fetchProductsFromFirestore();
    } catch (err) {
      console.warn("fetchProductsFromFirestore failed inside fetchHomeDataFromFirestore:", err);
    }

    // Direct fallback if fetchProductsFromFirestore returned empty
    if (!products || products.length === 0) {
      const prodSnap = await getDocs(collection(db, "products"));
      if (!prodSnap.empty) {
        products = prodSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as ProductItem)
        );
      }
    }

    // Build hero slider slideshow: fetch products from DB and show two products in random order.
    let heroBanners: HeroBanner[] = initialHeroBanners;
    if (products && products.length > 0) {
      const candidates = products.filter((p) => p.images && p.images.length > 0);
      const pool = candidates.length > 0 ? candidates : products;
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(2, shuffled.length));
      heroBanners = selected.map((p, idx) => convertProductToHeroBanner(p, idx));
    }

    const testSnap = await getDocs(collection(db, "testimonials"));
    const testimonials: TestimonialItem[] = testSnap.empty
      ? initialTestimonials
      : testSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as TestimonialItem)
        );

    const valSnap = await getDocs(collection(db, "value_props"));
    const valueProps: ValueProp[] = valSnap.empty
      ? initialValueProps
      : valSnap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as ValueProp));

    const spotlightBanners = await fetchSpotlightBannersFromFirestore();

    return {
      heroBanners,
      featuredCategories,
      products: products || [],
      testimonials,
      valueProps,
      spotlightBanner: spotlightBanners[0] || initialSpotlightBanner,
      spotlightBanners: spotlightBanners.length > 0 ? spotlightBanners : initialSpotlightBanners,
    };
  } catch (error) {
    console.warn("Failed to fetch home data from Firestore, using initial fallback:", error);
    let fallbackBanners = initialHeroBanners;
    let fallbackProducts: ProductItem[] = [];
    if (typeof window !== "undefined") {
      try {
        const local = getLocalProducts();
        if (local && local.length > 0) {
          fallbackProducts = local;
          const candidates = local.filter((p) => p.images && p.images.length > 0);
          const pool = candidates.length > 0 ? candidates : local;
          const shuffled = [...pool].sort(() => 0.5 - Math.random());
          fallbackBanners = shuffled.slice(0, Math.min(2, shuffled.length)).map((p, idx) =>
            convertProductToHeroBanner(p, idx)
          );
        }
      } catch {
        // use initialHeroBanners
      }
    }
    return {
      heroBanners: fallbackBanners,
      featuredCategories: initialFeaturedCategories,
      products: fallbackProducts,
      testimonials: initialTestimonials,
      valueProps: initialValueProps,
      spotlightBanner: initialSpotlightBanner,
      spotlightBanners: initialSpotlightBanners,
    };
  }
};

/**
 * Seed all Home collections into Firebase Firestore
 */
export const seedHomeDataToFirestore = async (force: boolean = false) => {
  for (const item of initialHeroBanners) {
    await setDoc(
      doc(db, "hero_banners", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  for (const item of initialValueProps) {
    await setDoc(
      doc(db, "value_props", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  for (const item of initialFeaturedCategories) {
    await setDoc(
      doc(db, "featured_categories", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  for (const item of initialTestimonials) {
    await setDoc(
      doc(db, "testimonials", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  for (const item of initialSpotlightBanners) {
    await setDoc(
      doc(db, "spotlight_banners", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  return { success: true, message: "Home page data in BDT successfully saved to Firebase!" };
};
