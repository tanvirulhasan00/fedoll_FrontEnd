import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: BlogAuthor;
  readTime: string;
  publishedAt: string;
  featured?: boolean;
  views?: number;
  likes?: number;
  createdAt?: string;
}

export const initialBlogs: BlogItem[] = [
  {
    id: "art-of-layering-outerwear",
    slug: "art-of-layering-outerwear",
    title: "How to Layer Clothes for Bangladesh Winters: Easy Styling Tips",
    excerpt:
      "Simple and practical ways to stay warm during Dhaka's cool mornings and evenings without wearing bulky or uncomfortable clothes.",
    category: "Winter Styling",
    coverImage:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Sophia Chen",
      role: "Lead Fashion Stylist",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "4 min read",
    publishedAt: "January 10, 2026",
    featured: true,
    views: 1420,
    likes: 89,
    tags: ["Winter Style", "Layering Tips", "Everyday Wear", "Jackets"],
    content: `## Dressing Smart for Bangladesh Winters

Winter in Bangladesh is short, pleasant, and breezy. Unlike freezing western countries, we don't need heavy thermal parkas. What we need is smart layering—putting together light and medium layers that you can easily take off as the sun warms up in the afternoon.

Here is a simple, practical guide to layering your everyday outfits.

---

### 1. Start with a Breathable Cotton Base
Always start with pure cotton close to your skin. A light cotton crewneck t-shirt or a relaxed casual shirt will absorb sweat and let your skin breathe throughout the day.

- **Best fabric:** 100% combed cotton or light knitwear.
- **Good colors:** Off-white, soft beige, olive green, or black.

> "A great layered outfit looks complete whether you keep your jacket on during a cool morning drive or take it off at your desk."

---

### 2. Add an Easy Mid-Layer
When temperatures drop below 20°C in December and January, add an open overshirt, a denim chore jacket, or a lightweight cardigan.

- **Style tip:** Wear your overshirt open over a plain white tee for an effortless weekend look.
- **Mix textures:** Pair a smooth cotton shirt with a textured knit sweater.

---

### 3. Finish with a Structured Long Coat or Trench
When heading out in the evening or attending winter weddings and rooftop dinners, a double-layer wool coat or water-resistant trench coat gives you an instantly clean, elevated appearance.`,
  },
  {
    id: "sustainable-denim-longevity",
    slug: "sustainable-denim-longevity",
    title: "Why Good Selvedge Denim Jeans Last for Years: A Simple Guide",
    excerpt:
      "Learn what makes authentic shuttle-loom denim so strong, how it molds to your body, and why it is worth investing in.",
    category: "Denim Care",
    coverImage:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Marcus Vance",
      role: "Denim Specialist",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "4 min read",
    publishedAt: "January 6, 2026",
    featured: false,
    views: 980,
    likes: 64,
    tags: ["Selvedge Jeans", "Durable Denim", "Care Guide", "Cotton"],
    content: `## What Makes Real Denim Different?

Most cheap jeans you find today are mixed with a lot of cheap plastic polyester and thin stretchy elastane. They lose their shape after a month and start tearing at the seams.

At Fedoll, we use pure, heavyweight cotton denim woven on traditional shuttle looms. This creates clean, closed edges (known as 'selvedge') that will never unravel.

---

### Why People Love 100% Cotton Selvedge
1. **It molds to your shape:** Over 2 to 3 months of daily wear, the denim naturally bends to your body shape and movements.
2. **Natural fading:** As you wear it, the deep indigo dye fades naturally in areas like your knees and pockets, creating a custom vintage look.
3. **Double durability:** Thick 14oz cotton handles bike rides, daily commuting, and years of regular washing.

> "Buy one great pair of jeans that lasts 5 years instead of buying disposable pants every few months."`,
  },
  {
    id: "modern-workwear-reimagined",
    slug: "modern-workwear-reimagined",
    title: "Comfortable Office Wear for Warm & Busy Days in Dhaka",
    excerpt:
      "How to choose breathable stretch fabrics and smart casual pieces so you stay cool in traffic and look sharp in office meetings.",
    category: "Office & Workwear",
    coverImage:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Elena Rostova",
      role: "Patternmaker & Stylist",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "5 min read",
    publishedAt: "December 28, 2025",
    featured: false,
    views: 1150,
    likes: 72,
    tags: ["Workwear", "Office Style", "Comfortable Suits", "Dhaka Life"],
    content: `## Dressing for Work in Dhaka's Weather

Working in Dhaka means dealing with morning traffic, air-conditioned offices, and humid afternoons. Traditional stiff suits with thick shoulder pads can feel like torture.

Modern workwear is all about combining formal neatness with real physical comfort.

---

### 3 Rules for Everyday Office Comfort

#### 1. Unpadded & Lightweight Blazers
Choose blazers without stiff canvas chest padding. Fedoll's work blazers use a soft 4-way stretch blend that moves easily when you type on your laptop or drive.

#### 2. Pleated Stretch Trousers
Slim, tight formal pants are uncomfortable for long sitting hours. Front single pleats give your thighs extra breathing room while tapering neatly at the ankle.

#### 3. High-Quality Solid T-Shirts & Polos
Pairing a clean off-white or charcoal t-shirt under a dark navy blazer creates a modern, smart-casual executive look suitable for startup offices and client calls.`,
  },
  {
    id: "garment-care-and-preservation",
    slug: "garment-care-and-preservation",
    title: "How to Wash and Care for Your Premium Clothes at Home",
    excerpt:
      "Simple, easy steps to keep your cotton t-shirts, jackets, and trousers looking new and smelling fresh in Bangladesh's weather.",
    category: "Garment Care",
    coverImage:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Tanvirul Hasan",
      role: "Founder, Fedoll",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "4 min read",
    publishedAt: "December 20, 2025",
    featured: false,
    views: 820,
    likes: 58,
    tags: ["Washing Tips", "Clothes Care", "Home Tips", "Long Lasting"],
    content: `## Taking Care of Your Favorite Clothes

Good clothing is an investment. In Bangladesh, dust and humidity can be challenging, but taking care of your clothes is actually very easy when you follow a few basic habits.

---

### 3 Golden Rules for Garment Care

#### Rule 1: Wash in Cold Water and Turn Inside Out
Hot water breaks down natural cotton fibers and fades dark dyes. Always turn your t-shirts and jeans inside out before washing in cold water.

#### Rule 2: Air Dry in the Shade
Direct hot sun can bleach dark colors over time and make cotton fabrics stiff. Hang your shirts and pants in a shaded, well-ventilated spot on the balcony or rooftop.

#### Rule 3: Use a Steamer Instead of a Super-Hot Dry Iron
Heavy dry irons can scorch delicate fibers and leave shiny marks on dark fabrics. A hand steamer gently relaxes wrinkles with moist steam while freshening up the textile.`,
  },
  {
    id: "the-minimalist-capsule-wardrobe",
    slug: "the-minimalist-capsule-wardrobe",
    title: "The 10-Item Capsule Wardrobe: Look Great Every Single Day",
    excerpt:
      "How to choose 10 versatile everyday pieces that you can easily mix and match for office, weekend hangouts, and events.",
    category: "Wardrobe Tips",
    coverImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Amara Bennett",
      role: "Style Editor",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "5 min read",
    publishedAt: "December 15, 2025",
    featured: false,
    views: 1890,
    likes: 135,
    tags: ["Capsule Wardrobe", "Smart Dressing", "Minimal Style", "Everyday"],
    content: `## Stop Wasting Time Deciding What to Wear

Do you ever open your closet full of clothes and feel like you have nothing to wear? Having too many random, low-quality clothes causes decision fatigue.

A capsule wardrobe solves this: you keep fewer, better items where every piece matches with everything else.

---

### The 10 Essential Pieces:
1. **The Classic Dark Overcoat or Trench Jacket**
2. **The Crisp Oxford White Button-Down Shirt**
3. **The Heavyweight Off-White Cotton T-Shirt**
4. **The Charcoal Grey Crewneck T-Shirt**
5. **The Unstructured Navy Work Blazer**
6. **The Straight-Fit Raw Selvedge Denim Jeans**
7. **The Warm Stone Pleated Chino Pants**
8. **The Casual Selvedge Denim Chore Jacket**
9. **The Clean White Minimalist Sneakers**
10. **The Classic Leather Loafers or Chelsea Boots**

---

### How to Mix & Match:
With these 10 items, you can create over 30 clean, sophisticated outfit combinations for meetings, casual Fridays, weekend dinners, and travel.`,
  },
];

/**
 * Fetch all blogs from Cloud Firestore
 */
export const fetchBlogsFromFirestore = async (): Promise<BlogItem[]> => {
  const blogCol = collection(db, "blogs");
  const snap = await getDocs(blogCol);

  if (snap.empty) {
    await seedBlogsToFirestore();
    return initialBlogs;
  }

  const blogs: BlogItem[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    blogs.push({
      id: docSnap.id,
      slug: data.slug || docSnap.id,
      title: data.title || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      coverImage: data.coverImage || "",
      category: data.category || "Style",
      tags: data.tags || [],
      author: data.author || {
        name: "Fedoll Editorial",
        role: "Staff Writer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      readTime: data.readTime || "4 min read",
      publishedAt: data.publishedAt || "January 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    });
  });

  const hasOldBlogContent = blogs.some(
    (b) =>
      b.title.includes("The Architecture of Modern Layering") ||
      b.excerpt.includes("Okayama") ||
      b.excerpt.includes("Sartorial")
  );
  if (hasOldBlogContent) {
    seedBlogsToFirestore(true).catch(console.warn);
    return initialBlogs;
  }

  return blogs;
};

/**
 * Fetch a single blog from Firestore by document ID or slug
 */
export const fetchBlogByIdOrSlugFromFirestore = async (
  idOrSlug: string
): Promise<BlogItem | null> => {
  if (!idOrSlug) return null;

  const docRef = doc(db, "blogs", idOrSlug);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      slug: data.slug || snap.id,
      title: data.title || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      coverImage: data.coverImage || "",
      category: data.category || "Style",
      tags: data.tags || [],
      author: data.author || {
        name: "Fedoll Editorial",
        role: "Staff Writer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      readTime: data.readTime || "4 min read",
      publishedAt: data.publishedAt || "January 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    };
  }

  const blogCol = collection(db, "blogs");
  const q = query(blogCol, where("slug", "==", idOrSlug));
  const querySnap = await getDocs(q);

  if (!querySnap.empty) {
    const matchDoc = querySnap.docs[0];
    const data = matchDoc.data();
    return {
      id: matchDoc.id,
      slug: data.slug || matchDoc.id,
      title: data.title || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      coverImage: data.coverImage || "",
      category: data.category || "Style",
      tags: data.tags || [],
      author: data.author || {
        name: "Fedoll Editorial",
        role: "Staff Writer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      readTime: data.readTime || "4 min read",
      publishedAt: data.publishedAt || "January 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    };
  }

  const fallback = initialBlogs.find(
    (b) => b.id === idOrSlug || b.slug === idOrSlug
  );
  return fallback || null;
};

/**
 * Seed initial 5 blogs to Firestore
 */
export const seedBlogsToFirestore = async (force: boolean = false): Promise<{
  success: boolean;
  count: number;
  message: string;
}> => {
  try {
    let seededCount = 0;
    for (const blog of initialBlogs) {
      const docRef = doc(db, "blogs", blog.id);
      await setDoc(
        docRef,
        {
          ...blog,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: !force }
      );
      seededCount++;
    }

    return {
      success: true,
      count: seededCount,
      message: `Successfully seeded ${seededCount} blogs into Firestore.`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to seed blogs to Firestore:", error);
    throw new Error(error.message || "Failed to seed blogs to Firestore.");
  }
};
