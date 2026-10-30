import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface AboutStat {
  label: string;
  value: string;
  description: string;
}

export interface AboutValue {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface AboutData {
  tagline: string;
  title: string;
  subtitle: string;
  missionHeading: string;
  missionParagraph1: string;
  missionParagraph2: string;
  heroImage: string;
  atelierImage: string;
  craftImage: string;
  stats: AboutStat[];
  values: AboutValue[];
  team: TeamMember[];
  milestones: Milestone[];
  contact: {
    address: string;
    email: string;
    phone: string;
    hours: string;
  };
}

export const initialAboutData: AboutData = {
  tagline: "Our Story & Promise",
  title: "Quality Clothing Made for Bangladesh.",
  subtitle:
    "We make premium everyday clothing with simple designs, comfortable fabrics, and long-lasting quality right here in Bangladesh.",
  missionHeading: "Honest Quality Clothing Without the Luxury Markup",
  missionParagraph1:
    "SilkenDrift was started in 2021 with a simple belief: you shouldn't have to pay high imported prices to get world-class clothing. Bangladesh already makes the best garments for the world's top brands—we wanted to bring that same export-standard quality directly to people living here.",
  missionParagraph2:
    "We use pure cotton, strong selvedge denim, and warm wool fabrics. Every jacket, shirt, and pair of pants is carefully stitched, thoroughly quality-checked, and backed by a 7-day easy exchange guarantee.",
  heroImage:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
  atelierImage:
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  craftImage:
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
  stats: [
    {
      value: "100%",
      label: "Pure & Honest Fabrics",
      description: "Breathable natural cotton, durable denim, and itch-free soft wool.",
    },
    {
      value: "64",
      label: "Districts Delivery",
      description: "Fast courier delivery with Cash on Delivery and bKash across Bangladesh.",
    },
    {
      value: "25,000+",
      label: "Happy Customers",
      description: "Men and women wearing SilkenDrift clothing in Dhaka, Chittagong, and beyond.",
    },
    {
      value: "7 Days",
      label: "Easy Size Exchanges",
      description: "Simple, friendly return and exchange service if you need a different size.",
    },
  ],
  values: [
    {
      id: "val-1",
      icon: "CubeTransparentIcon",
      title: "Comfortable Modern Fit",
      description:
        "Designed for real everyday life in Bangladesh. Roomy shoulders, flexible waists, and clean lines that look sharp at work or hangouts.",
    },
    {
      id: "val-2",
      icon: "SparklesIcon",
      title: "Durable, Washable Fabrics",
      description:
        "Fabrics tested to handle our local weather. They stay soft, resist shrinking, and maintain their deep color after many washes.",
    },
    {
      id: "val-3",
      icon: "GlobeAmericasIcon",
      title: "Fair & Transparent Pricing",
      description:
        "Direct-to-consumer prices in Bangladeshi Taka without middlemen or inflated boutique markups.",
    },
    {
      id: "val-4",
      icon: "HeartIcon",
      title: "Friendly Local Support",
      description:
        "Our support team is based in Dhaka. Call, message, or WhatsApp us anytime for sizing or order advice.",
    },
  ],
  team: [
    {
      id: "member-1",
      name: "Tanvirul Hasan",
      role: "Founder & Lead Product Specialist",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      bio: "Born and raised in Bangladesh. Tanvir leads SilkenDrift's fabric sourcing, product quality checks, and customer experience.",
    },
    {
      id: "member-2",
      name: "Sophia Chen",
      role: "Head of Design & Styling",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      bio: "Fashion graduate with 8 years of experience creating minimal, elegant everyday silhouettes that are effortless to style.",
    },
    {
      id: "member-3",
      name: "Marcus Vance",
      role: "Denim & Fabric Specialist",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "Textile engineer specializing in shuttle-loom selvedge denim and natural organic dyes that look better with age.",
    },
    {
      id: "member-4",
      name: "Elena Rostova",
      role: "Senior Patternmaker",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      bio: "Master tailor dedicated to crafting flexible, comfortable fits that move naturally with your body throughout the day.",
    },
  ],
  milestones: [
    {
      year: "2021",
      title: "SilkenDrift Starts in Dhaka",
      description:
        "We launched our first batch of handcrafted selvedge denim jeans and cotton chore jackets in Bangladesh.",
    },
    {
      year: "2023",
      title: "Signature Winter Collection",
      description:
        "Introduced our popular double-layer wool coats and lightweight all-weather trench jackets.",
    },
    {
      year: "2024",
      title: "Countrywide 64-District Courier Network",
      description:
        "Partnered with top local couriers to provide reliable Cash on Delivery to every district in Bangladesh.",
    },
    {
      year: "2026",
      title: "Dhaka Studio & Online Flagship",
      description:
        "Opening our design studio and showroom in Banani/Gulshan while expanding our modern web shopping experience.",
    },
  ],
  contact: {
    address: "SilkenDrift Studio, House 18, Road 11, Block D, Banani / Gulshan, Dhaka 1213, Bangladesh",
    email: "support@silkendrift.com",
    phone: "+880 1700-123456",
    hours: "Saturday – Thursday: 10:00 AM – 08:00 PM (BST)",
  },
};

let memoryCachedAboutData: AboutData | null = null;
const LOCAL_STORAGE_ABOUT_KEY = "silkendrift_about_page_cache_v1";

/**
 * Fetch About Us content from Cloud Firestore with memory and local cache
 */
export const fetchAboutDataFromFirestore = async (): Promise<AboutData> => {
  if (memoryCachedAboutData) {
    return memoryCachedAboutData;
  }

  // Try loading from localStorage immediately in browser
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ABOUT_KEY);
      if (raw) {
        memoryCachedAboutData = JSON.parse(raw) as AboutData;
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(db, "about_page", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as AboutData;
      if (
        data.subtitle?.includes("discipline of modern architecture") ||
        data.missionParagraph1?.includes("Okayama") ||
        data.contact?.phone?.includes("+81") ||
        !data.contact?.phone?.includes("+880")
      ) {
        await seedAboutDataToFirestore(true);
        memoryCachedAboutData = initialAboutData;
        return initialAboutData;
      }
      memoryCachedAboutData = data;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_ABOUT_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
      return data;
    }

    await seedAboutDataToFirestore();
    memoryCachedAboutData = initialAboutData;
    return initialAboutData;
  } catch (error) {
    console.warn("Failed to fetch about data from Firestore, using initial dataset:", error);
    return memoryCachedAboutData || initialAboutData;
  }
};

/**
 * Seed or update About Us content in Cloud Firestore
 */
export const seedAboutDataToFirestore = async (force: boolean = false) => {
  memoryCachedAboutData = null;
  const docRef = doc(db, "about_page", "main");
  await setDoc(
    docRef,
    {
      ...initialAboutData,
      updatedAt: serverTimestamp(),
    },
    { merge: !force }
  );

  return { success: true, message: "About Us data successfully saved to Firebase Firestore!" };
};
