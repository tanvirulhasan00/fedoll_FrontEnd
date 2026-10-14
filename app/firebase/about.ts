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
  tagline: "Our Atelier & Philosophy",
  title: "Architectural Precision. Heirloom Longevity.",
  subtitle:
    "We design clothing with the discipline of modern architecture: prioritizing purposeful tactile materials, ergonomic movement, and uncompromising durability.",
  missionHeading: "Rejecting Disposable Trends in Favor of Sartorial Permanence",
  missionParagraph1:
    "Fedoll was conceived in 2021 as a reaction against accelerated fashion cycles and synthetic disposability. We observed wardrobes filled with garments that lost their shape after five washes, engineered to become obsolete.",
  missionParagraph2:
    "Our approach is fundamentally restorative: partnering directly with master shuttle-loom weavers in Okayama and historical double-faced wool mills in Biella. We believe every seam should be intentional, and every piece should gracefully document decades of its wearer's life.",
  heroImage:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
  atelierImage:
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  craftImage:
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
  stats: [
    {
      value: "100%",
      label: "Organic & Traceable",
      description: "GOTS-certified organic cotton and ethically shorn Italian virgin wools.",
    },
    {
      value: "40+",
      label: "Years of Heritage",
      description: "Artisan mill partners operating antique shuttle looms and bespoke looms.",
    },
    {
      value: "18,000+",
      label: "Global Patrons",
      description: "Discerning architects, stylists, and creatives in 38 world capitals.",
    },
    {
      value: "0%",
      label: "Virgin Plastic Policy",
      description: "Plastic-free horn hardware, corozo buttons, and 100% compostable mailers.",
    },
  ],
  values: [
    {
      id: "val-1",
      icon: "CubeTransparentIcon",
      title: "Kinetic Cut Architecture",
      description:
        "Every garment pattern is tested on human bodies in motion. We engineer ergonomic gussets, dropped shoulders, and single-pleat articulation for unrestricted ease.",
    },
    {
      id: "val-2",
      icon: "SparklesIcon",
      title: "Tactile Textile Integrity",
      description:
        "We source only long-staple organic cottons, 19.5-micron superfine merinos, and water-repellent dense storm gabardines that age with distinguished patina.",
    },
    {
      id: "val-3",
      icon: "GlobeAmericasIcon",
      title: "Circular Responsibility",
      description:
        "Closed-loop indigo dye baths reduce water consumption by 78%. We provide free repairs and conscious garment stewardship guides for all patrons.",
    },
    {
      id: "val-4",
      icon: "HeartIcon",
      title: "Artisan Fair Living",
      description:
        "Our tailors and textile weavers receive living wages and work in sunlit, safe studio environments respecting multi-generational craft culture.",
    },
  ],
  team: [
    {
      id: "member-1",
      name: "Sophia Chen",
      role: "Co-Founder & Creative Director",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      bio: "Trained at Central Saint Martins and Savile Row. Sophia sculpts Fedoll's silhouettes with a balance of structural authority and relaxed poise.",
    },
    {
      id: "member-2",
      name: "Tanvirul Hasan",
      role: "Co-Founder & Head of Operations",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      bio: "Leads technical supply-chain traceability, digital experience engineering, and direct ethical partnerships with our textile mills.",
    },
    {
      id: "member-3",
      name: "Marcus Vance",
      role: "Head of Textile Innovation",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "3rd-generation denim weaver with 15 years in Okayama specializing in low-tension shuttle loom dynamics and closed-loop indigo chemistry.",
    },
    {
      id: "member-4",
      name: "Elena Rostova",
      role: "Master Patternmaker & Senior Stylist",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      bio: "Expert in unstructured tailoring and hybrid executive ergonomics, ensuring garments transition seamlessly from morning flights to evening galas.",
    },
  ],
  milestones: [
    {
      year: "2021",
      title: "The First Vintage Shuttle Loom",
      description:
        "Fedoll was established with a single vintage shuttle loom in Kurashiki, weaving our inaugural 14oz redline selvedge capsule.",
    },
    {
      year: "2023",
      title: "Italian Wool Atelier Partnership",
      description:
        "Formed an exclusive collaboration with family-owned mills in Biella to develop our double-faced architectural wool outerwear line.",
    },
    {
      year: "2024",
      title: "Zero-Waste Pattern Certification",
      description:
        "Achieved 94% textile cutting efficiency through algorithmic nesting, cutting fabric scraps into recycled acoustic insulation.",
    },
    {
      year: "2026",
      title: "Global Sartorial Journal & Expansion",
      description:
        "Serving patrons in over 38 countries with localized carbon-neutral express courier delivery and concierge tailoring advice.",
    },
  ],
  contact: {
    address: "Fedoll Atelier, 123 Fashion District, New York, NY 10018",
    email: "concierge@fedoll.com",
    phone: "+1 (800) 123-4567",
    hours: "Monday – Friday: 09:00 AM – 06:00 PM EST",
  },
};

/**
 * Fetch About Us content from Cloud Firestore
 */
export const fetchAboutDataFromFirestore = async (): Promise<AboutData> => {
  try {
    const docRef = doc(db, "about_page", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as AboutData;
    }

    // Auto seed if document doesn't exist
    await seedAboutDataToFirestore();
    return initialAboutData;
  } catch (error) {
    console.warn("Failed to fetch about data from Firestore, using initial dataset:", error);
    return initialAboutData;
  }
};

/**
 * Seed or update About Us content in Cloud Firestore
 */
export const seedAboutDataToFirestore = async (force: boolean = false) => {
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
