import {
  collection,
  doc,
  getDocs,
  setDoc,
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

export interface ProductItem {
  id: string;
  name: string;
  category: "Outerwear" | "Workwear" | "Denim" | "Knitwear" | "Essentials";
  price: number;
  originalPrice?: number;
  badge?: "New" | "Sale" | "Best Seller" | "Trending" | "Limited";
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
}

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

export interface SpotlightBanner {
  id: string;
  tag: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  discountCode?: string;
}

// Initial default datasets for seeding and instant offline/first-render fallback
export const initialHeroBanners: HeroBanner[] = [
  {
    id: "banner-1",
    badge: "Autumn / Winter 2026 Collection",
    title: "Sartorial Architecture & Functional Outerwear",
    subtitle:
      "Crafted from water-repellent gabardine and double-faced Italian twill. Designed for seamless urban transitions.",
    ctaText: "Explore Outerwear",
    ctaLink: "/blogs/art-of-layering-outerwear",
    secondaryCtaText: "View Lookbook",
    secondaryCtaLink: "/blogs",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
    accent: "orange",
  },
  {
    id: "banner-2",
    badge: "Limited Artisan Release",
    title: "14oz Japanese Selvedge Denim",
    subtitle:
      "Woven on vintage shuttle looms with closed-loop organic indigo. Heirloom durability made to record your personal journey.",
    ctaText: "Shop The Denim Capsule",
    ctaLink: "/blogs/sustainable-denim-longevity",
    secondaryCtaText: "Our Craft Story",
    secondaryCtaLink: "/blogs",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=85",
    accent: "stone",
  },
];

export const initialValueProps: ValueProp[] = [
  {
    id: "prop-1",
    icon: "TruckIcon",
    title: "Complimentary Express Delivery",
    description: "Free carbon-neutral courier shipping on all orders over $150.",
  },
  {
    id: "prop-2",
    icon: "ShieldCheckIcon",
    title: "Conscious Provenance",
    description: "100% certified organic cotton, zero-waste cutting, and ethical atelier mills.",
  },
  {
    id: "prop-3",
    icon: "ArrowPathRoundedSquareIcon",
    title: "30-Day Effortless Returns",
    description: "Try in the comfort of your home. Free return shipping and seamless exchanges.",
  },
  {
    id: "prop-4",
    icon: "SparklesIcon",
    title: "Sartorial Advisory",
    description: "Complimentary size, tailoring, and styling consultations with our stylists.",
  },
];

export const initialFeaturedCategories: FeaturedCategory[] = [
  {
    id: "cat-outerwear",
    name: "Architectural Outerwear",
    tagline: "Structured trenches, wool topcoats & overshirts",
    itemCount: "28 Styles",
    image:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    link: "/blogs/art-of-layering-outerwear",
  },
  {
    id: "cat-workwear",
    name: "Modern Workwear",
    tagline: "Unstructured suiting & kinetic stretch trousers",
    itemCount: "34 Styles",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
    link: "/blogs/modern-workwear-reimagined",
  },
  {
    id: "cat-denim",
    name: "Artisan Selvedge Denim",
    tagline: "14oz shuttle-loom raw and vintage rinses",
    itemCount: "19 Styles",
    image:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    link: "/blogs/sustainable-denim-longevity",
  },
  {
    id: "cat-knitwear",
    name: "Fine-Gauge Knitwear",
    tagline: "Superfine merino and brushed cashmere blends",
    itemCount: "22 Styles",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    link: "/blogs/the-minimalist-capsule-wardrobe",
  },
];

export const initialProducts: ProductItem[] = [
  {
    id: "prod-wool-coat",
    name: "Architectural Double-Faced Wool Coat",
    category: "Outerwear",
    price: 380,
    originalPrice: 460,
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 142,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Sculpted with dropped shoulders and hand-finished seams in 100% Italian virgin wool. Effortlessly layers over tailoring.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Charcoal", hex: "#374151" },
      { name: "Camel", hex: "#c29b62" },
      { name: "Black", hex: "#111827" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
  },
  {
    id: "prod-selvedge-jacket",
    name: "14oz Japanese Selvedge Chore Jacket",
    category: "Denim",
    price: 240,
    originalPrice: 285,
    badge: "Trending",
    rating: 4.8,
    reviewCount: 88,
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Woven on antique Toyoda looms with redline selvedge ID. Features reinforced copper hardware and dual utility pockets.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Raw Indigo", hex: "#1e3a8a" },
      { name: "Rinse Wash", hex: "#1e293b" },
    ],
    isFeatured: true,
    inStock: true,
  },
  {
    id: "prod-hybrid-blazer",
    name: "Unstructured Kinetic Stretch Blazer",
    category: "Workwear",
    price: 295,
    badge: "New",
    rating: 5.0,
    reviewCount: 64,
    images: [
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Engineered without shoulder pads or stiff chest canvas. Four-way stretch poly-wool ensures full movement from morning commutes to dinner.",
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
    name: "240 GSM Combed Organic Cotton Tee",
    category: "Essentials",
    price: 65,
    originalPrice: 80,
    badge: "Sale",
    rating: 4.9,
    reviewCount: 312,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Substantial, dense drape with double-needle ribbed collar that never sags. Pre-shrunk organic long-staple cotton.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Off-White", hex: "#f4f4f5" },
      { name: "Oat Beige", hex: "#e4d5b7" },
      { name: "Washed Black", hex: "#27272a" },
    ],
    isFeatured: false,
    isBestSeller: true,
    inStock: true,
  },
  {
    id: "prod-stretch-trouser",
    name: "Pleated Tapered Ergonomic Trousers",
    category: "Workwear",
    price: 185,
    originalPrice: 220,
    badge: "Trending",
    rating: 4.8,
    reviewCount: 96,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Deep single pleats offer generous thigh room tapering gently into a 7-inch leg opening. Wrinkle-resistant stretch twill.",
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
    name: "Water-Repellent Storm Gabardine Trench",
    category: "Outerwear",
    price: 420,
    badge: "New",
    rating: 4.9,
    reviewCount: 52,
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "High-density organic cotton gabardine treated with PFC-free water repellant. Storm flap, belted waist, and deep horn buttons.",
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
    name: "Extra-Fine 19.5 Micron Merino Crewneck",
    category: "Knitwear",
    price: 165,
    originalPrice: 195,
    badge: "Sale",
    rating: 4.8,
    reviewCount: 74,
    images: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Ultra-soft next-to-skin touch with natural temperature regulation. Ribbed hems with reinforced elastane retention.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Terracotta", hex: "#c2410c" },
      { name: "Midnight", hex: "#0f172a" },
      { name: "Oatmeal", hex: "#f5f5f4" },
    ],
    isFeatured: false,
    inStock: true,
  },
  {
    id: "prod-selvedge-jeans",
    name: "Classic Straight-Leg Selvedge Jeans",
    category: "Denim",
    price: 210,
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 178,
    images: [
      "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Unwashed rigid raw denim crafted to mold uniquely to your body over 6 months of daily wear. Made with organic Zimbabwean cotton.",
    sizes: ["30", "31", "32", "33", "34", "36"],
    colors: [
      { name: "Raw Indigo", hex: "#1e3a8a" },
      { name: "Ecru Natural", hex: "#fafaf9" },
    ],
    isFeatured: true,
    isBestSeller: true,
    inStock: true,
  },
];

export const initialTestimonials: TestimonialItem[] = [
  {
    id: "test-1",
    name: "Julian Sterling",
    role: "Architect & Partner",
    location: "Zurich, Switzerland",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "The Double-Faced Wool Coat is the best outerwear investment I've made in five years. The weight is substantial yet it moves with graceful fluidity. The stitching precision is indistinguishable from Savile Row bespoke.",
    productName: "Architectural Double-Faced Wool Coat",
  },
  {
    id: "test-2",
    name: "Clara Beaumont",
    role: "Design Director",
    location: "Paris, France",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "Fedoll gets proportions right. The kinetic stretch blazer feels like an unstructured cardigan yet commands respect in client presentations. Customer service and packaging are museum-grade.",
    productName: "Unstructured Kinetic Stretch Blazer",
  },
  {
    id: "test-3",
    name: "David Kim",
    role: "Creative Strategist",
    location: "New York, USA",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment:
      "The 14oz shuttle-loom selvedge jeans are extraordinary. The slub and chatter on the denim surface show real vintage loom craftsmanship. They have aged beautifully over 4 months.",
    productName: "14oz Japanese Selvedge Chore Jacket",
  },
];

export const initialSpotlightBanner: SpotlightBanner = {
  id: "spotlight-denim-capsule",
  tag: "Artisan Spotlight",
  title: "The Selvedge Denim & Technical Outerwear Initiative",
  description:
    "We partnered with multi-generational master weavers in Okayama and Biella to produce a numbered capsule of zero-waste heirloom essentials.",
  ctaText: "Shop The Capsule",
  ctaLink: "/blogs/sustainable-denim-longevity",
  image:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  discountCode: "FEDOLL2026",
};

/**
 * Fetch home page dynamic dataset from Firebase Firestore
 */
export const fetchHomeDataFromFirestore = async () => {
  try {
    // 1. Hero Banners
    const heroSnap = await getDocs(collection(db, "hero_banners"));
    const heroBanners: HeroBanner[] = heroSnap.empty
      ? initialHeroBanners
      : heroSnap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as HeroBanner));

    // 2. Categories
    const catSnap = await getDocs(collection(db, "featured_categories"));
    const featuredCategories: FeaturedCategory[] = catSnap.empty
      ? initialFeaturedCategories
      : catSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as FeaturedCategory)
        );

    // 3. Products
    const prodSnap = await getDocs(collection(db, "products"));
    const products: ProductItem[] = prodSnap.empty
      ? initialProducts
      : prodSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as ProductItem)
        );

    // 4. Testimonials
    const testSnap = await getDocs(collection(db, "testimonials"));
    const testimonials: TestimonialItem[] = testSnap.empty
      ? initialTestimonials
      : testSnap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as DocumentData) } as TestimonialItem)
        );

    // 5. Value Props
    const valSnap = await getDocs(collection(db, "value_props"));
    const valueProps: ValueProp[] = valSnap.empty
      ? initialValueProps
      : valSnap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) } as ValueProp));

    // If Firestore was empty, auto-seed in background
    if (prodSnap.empty || heroSnap.empty) {
      seedHomeDataToFirestore().catch(console.warn);
    }

    return {
      heroBanners,
      featuredCategories,
      products,
      testimonials,
      valueProps,
      spotlightBanner: initialSpotlightBanner,
    };
  } catch (error) {
    console.warn("Failed to fetch home data from Firestore, using initial fallback:", error);
    return {
      heroBanners: initialHeroBanners,
      featuredCategories: initialFeaturedCategories,
      products: initialProducts,
      testimonials: initialTestimonials,
      valueProps: initialValueProps,
      spotlightBanner: initialSpotlightBanner,
    };
  }
};

/**
 * Seed all Home collections into Firebase Firestore
 */
export const seedHomeDataToFirestore = async (force: boolean = false) => {
  // 1. Hero Banners
  for (const item of initialHeroBanners) {
    await setDoc(
      doc(db, "hero_banners", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  // 2. Value Props
  for (const item of initialValueProps) {
    await setDoc(
      doc(db, "value_props", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  // 3. Featured Categories
  for (const item of initialFeaturedCategories) {
    await setDoc(
      doc(db, "featured_categories", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  // 4. Products
  for (const item of initialProducts) {
    await setDoc(
      doc(db, "products", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  // 5. Testimonials
  for (const item of initialTestimonials) {
    await setDoc(
      doc(db, "testimonials", item.id),
      { ...item, updatedAt: serverTimestamp() },
      { merge: !force }
    );
  }

  // 6. Spotlight Banner
  await setDoc(
    doc(db, "spotlight_banners", initialSpotlightBanner.id),
    { ...initialSpotlightBanner, updatedAt: serverTimestamp() },
    { merge: !force }
  );

  return { success: true, message: "Home page data successfully seeded to Firebase!" };
};
