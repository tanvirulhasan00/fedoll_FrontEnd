import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { normalizeGoogleDriveImageUrl } from "./products";

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
      role: "Founder & Managing Director",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      bio: "Born and raised in Bangladesh. Tanvir leads Fedoll's fabric sourcing, product quality checks, and customer experience from Dhaka.",
    },
    {
      id: "member-2",
      name: "Mahfuzur Rahman",
      role: "Head of Patternmaking & Tailoring",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      bio: "With over 12 years of experience in export garment tailoring, Mahfuzur ensures every piece offers a comfortable, natural fit for everyday wear.",
    },
    {
      id: "member-3",
      name: "Nusrat Jahan",
      role: "Lead Apparel Designer & Stylist",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      bio: "Fashion graduate from Dhaka, curating versatile silhouettes and breathable fabrics made specifically for local climates.",
    },
    {
      id: "member-4",
      name: "Arif Hossain",
      role: "Operations & Logistics Manager",
      avatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
      bio: "Oversees inventory flow, order fulfillment, and nationwide courier partner coordination across all 64 districts.",
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
  try {
    const docRef = doc(db, "about_page", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as AboutData;
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
    console.warn("Failed to fetch about data from Firestore, using cached/initial dataset:", error);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_ABOUT_KEY);
        if (raw) return JSON.parse(raw) as AboutData;
      } catch {}
    }
    return memoryCachedAboutData || initialAboutData;
  }
};

/**
 * Automatically syncs real staff accounts from Cloud Firestore 'users' collection into the team list
 */
export const syncRealStaffToTeamMembers = async (): Promise<TeamMember[]> => {
  memoryCachedAboutData = null;
  try {
    const usersCol = collection(db, "users");
    const snap = await getDocs(usersCol);

    const staffAccounts: TeamMember[] = [];

    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const u = d.data();
        const role = (u.role || "").toLowerCase().trim();
        if (role === "admin" || role === "manager" || role === "salesman") {
          const isTanvir =
            u.email?.toLowerCase().includes("tanvir") ||
            u.displayName?.toLowerCase().includes("tanvir");

          const memberName = isTanvir
            ? "Tanvirul Hasan"
            : (u.displayName || u.email?.split("@")[0] || "Team Member");

          let memberRole = "Fashion & Garments Specialist";
          if (role === "admin") {
            memberRole = isTanvir
              ? "Founder & Managing Director"
              : "Executive Administrator";
          } else if (role === "manager") {
            memberRole = "Operations & Logistics Manager";
          } else if (role === "salesman") {
            memberRole = "Client Styling & Customer Experience";
          }

          let memberBio =
            "Dedicated to crafting export-quality apparel and providing exceptional service across Bangladesh.";
          if (isTanvir) {
            memberBio =
              "Born and raised in Bangladesh. Tanvir oversees Fedoll's fabric sourcing, product quality checks, and nationwide customer experience from Dhaka.";
          } else if (role === "admin") {
            memberBio =
              "Manages digital atelier operations, quality auditing, and customer satisfaction.";
          } else if (role === "manager") {
            memberBio =
              "Oversees inventory flow, order fulfillment, and nationwide courier partner coordination.";
          }

          staffAccounts.push({
            id: `staff_${d.id}`,
            name: memberName,
            role: memberRole,
            avatar:
              u.photoURL ||
              (isTanvir
                ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
                : role === "manager"
                ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
                : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"),
            bio: memberBio,
          });
        }
      });
    }

    const complementaryArtisans: TeamMember[] = [
      {
        id: "member-artisan-1",
        name: "Mahfuzur Rahman",
        role: "Head of Patternmaking & Tailoring",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        bio: "With over 12 years of experience in export garment tailoring, Mahfuzur ensures every piece offers a comfortable, natural fit for everyday wear.",
      },
      {
        id: "member-artisan-2",
        name: "Nusrat Jahan",
        role: "Lead Apparel Designer & Stylist",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        bio: "Fashion graduate from Dhaka, curating versatile silhouettes and breathable fabrics made specifically for local climates.",
      },
    ];

    const existingNames = new Set(staffAccounts.map((s) => s.name.toLowerCase()));
    const finalTeam = [...staffAccounts];

    for (const artisan of complementaryArtisans) {
      if (!existingNames.has(artisan.name.toLowerCase())) {
        finalTeam.push(artisan);
      }
    }

    await saveTeamMembersToFirestore(finalTeam);
    return finalTeam;
  } catch (err) {
    console.warn("Could not sync real staff to team members:", err);
    throw err;
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

/**
 * Save updated team members list to Cloud Firestore with cache synchronization
 */
export const saveTeamMembersToFirestore = async (
  team: TeamMember[]
): Promise<{ success: boolean; team: TeamMember[] }> => {
  memoryCachedAboutData = null;
  const docRef = doc(db, "about_page", "main");

  // Normalize image URLs (convert Google Drive share links to high-speed CDN URLs)
  const normalizedTeam: TeamMember[] = team.map((member) => ({
    ...member,
    name: member.name.trim(),
    role: member.role.trim(),
    bio: member.bio.trim(),
    avatar: normalizeGoogleDriveImageUrl(member.avatar.trim()) || member.avatar.trim(),
  }));

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...initialAboutData,
        team: normalizedTeam,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        team: normalizedTeam,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // If updateDoc fails because doc was missing, fallback to setDoc with merge
    await setDoc(
      docRef,
      {
        team: normalizedTeam,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Update in-browser cache
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ABOUT_KEY);
      if (raw) {
        const existing = JSON.parse(raw) as AboutData;
        existing.team = normalizedTeam;
        memoryCachedAboutData = existing;
        localStorage.setItem(LOCAL_STORAGE_ABOUT_KEY, JSON.stringify(existing));
      } else {
        const full: AboutData = {
          ...initialAboutData,
          team: normalizedTeam,
        };
        memoryCachedAboutData = full;
        localStorage.setItem(LOCAL_STORAGE_ABOUT_KEY, JSON.stringify(full));
      }
    } catch {}
  }

  return { success: true, team: normalizedTeam };
};

/**
 * Real-time listener for About Us data changes (including team updates)
 */
export const subscribeToAboutDataFromFirestore = (
  callback: (data: AboutData) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    const docRef = doc(db, "about_page", "main");
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AboutData;
          memoryCachedAboutData = data;
          try {
            localStorage.setItem(LOCAL_STORAGE_ABOUT_KEY, JSON.stringify(data));
          } catch {}
          callback(data);
        } else {
          callback(initialAboutData);
        }
      },
      (error) => {
        console.warn("Realtime about data subscription error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not set up realtime about data subscription:", err);
    return () => {};
  }
};
