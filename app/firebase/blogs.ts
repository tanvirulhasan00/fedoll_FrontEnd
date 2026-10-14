import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
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
    title: "The Art of Layering: Transitioning Your Outerwear Through Changing Seasons",
    excerpt:
      "Mastering transitional dressing requires the right harmony of breathable textiles, structured tailoring, and adaptable silhouette layering.",
    category: "Outerwear & Style",
    coverImage:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Sophia Chen",
      role: "Creative Director",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "5 min read",
    publishedAt: "October 10, 2026",
    featured: true,
    views: 1420,
    likes: 89,
    tags: ["Outerwear", "Styling Guide", "Fall Fashion", "Layering"],
    content: `## The Philosophy of Layering

Transitional dressing has always separated genuine sartorial intuition from mere trend-following. As temperamental autumn breezes yield to brisk winter mornings, the instinct is often to reach for heavy, singular thermal shields. However, true comfort and aesthetic poise lie in the delicate discipline of layering.

When approached with intention, layering isn't simply adding bulk—it is an exercise in tactile dialogue, tonal harmony, and structural rhythm.

---

### 1. The Foundation: Micro-Textures Next to Skin
The cornerstone of any successful layered ensemble begins with what touches the skin. Opt for lightweight breathable cotton poplin, fine mercerized wool, or silk-blend crewnecks. 

- **Weight:** Keep your base layer under 180 GSM.
- **Silhouette:** Tailored cleanly against the torso without constriction.
- **Palette:** Warm off-white, oat beige, or slate charcoal.

> "A great outfit should look equally resolved whether you're standing in the brisk evening wind or shedding your outermost layer in an intimate café."

---

### 2. The Mid-Layer: Architecture and Contrast
Here is where personality enters. A tailored chore jacket, a lightweight boiled-wool overshirt, or an unstructured cardigan introduces dimensional depth. 

Pay attention to collar shapes: pair a grandad or mandarin collar shirt with an open-lapel chore coat to prevent bulky fabric clashing at the neckline.

---

### 3. The Climax: The Structured Outer Shell
Fedoll's outerwear collection focuses on water-repellent gabardines, double-faced twills, and architectural trench silhouettes. The outer coat must drape with deliberate ease, accommodating your mid-layers effortlessly without tugging at the armholes.

Key elements to evaluate:
1. **Shoulder Seam Placement:** Dropped or raglan shoulders provide the greatest versatility across diverse inner garments.
2. **Hemline Proportions:** Allow your longest piece to dictate the vertical silhouette, creating elongated lines.
3. **Movement:** Premium fabrics possess natural memory and weight, creating dynamic fluid motion as you walk.`,
  },
  {
    id: "sustainable-denim-longevity",
    slug: "sustainable-denim-longevity",
    title: "Sustainable Denim: Crafting Longevity in Contemporary Wardrobes",
    excerpt:
      "From raw Japanese selvedge to water-conserving organic cotton, discover why intentional denim craftsmanship endures far beyond fast-fashion cycles.",
    category: "Denim & Craft",
    coverImage:
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Marcus Vance",
      role: "Head of Textile Innovation",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "4 min read",
    publishedAt: "October 8, 2026",
    featured: false,
    views: 980,
    likes: 64,
    tags: ["Denim", "Sustainability", "Textiles", "Craftsmanship"],
    content: `## Redefining the True Value of Denim

Denim was born as utilitarian workwear: indestructible, functional, and built to age like a documented history of its wearer's labor. In recent decades, however, fast-fashion accelerated cycles reduced denim into disposable, heavily chemical-distressed novelty garments.

At Fedoll, we approach denim from a restorative perspective—anchoring our philosophy in long-staple organic cotton, closed-loop indigo dyeing, and shuttle-loom weaving.

---

### The Anatomy of Quality Selvedge
Selvedge denim—derived from "self-edge"—refers to fabric woven on vintage shuttle looms. These slower machines produce a tightly bound edge that will never fray or unravel.

- **Structural Density:** Shuttle looms generate unique cross-hatch irregularities called *chatter*, infusing every yard with bespoke character.
- **Natural Fades:** Unlike artificial sandblasting or toxic acid washing, authentic denim patinas organically over years of actual wear.
- **Water Conservation:** Closed-loop dye baths reduce fresh water consumption by over 78% compared to conventional industrial mills.

> "A great pair of jeans should not be bought for this season—it should be an heirloom of your daily journeys."

---

### Care Tips for Endless Longevity
1. **Wash Infrequently:** Spot clean minor marks with a damp cloth and mild pH-neutral soap.
2. **Cold Water Inversions:** When washing, turn the denim inside out and use cold cycles to preserve the deep indigo pigments.
3. **Line Dry Always:** Tumble dryers are the primary cause of fiber degradation and unwanted elastane breakage.`,
  },
  {
    id: "modern-workwear-reimagined",
    slug: "modern-workwear-reimagined",
    title: "Modern Workwear Reimagined: Balancing Polish with Uncompromised Comfort",
    excerpt:
      "How functional tailoring, ergonomic cuts, and hybrid stretch fabrics are redefining everyday executive and creative workwear.",
    category: "Workwear Essentials",
    coverImage:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Elena Rostova",
      role: "Senior Fashion Stylist",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "6 min read",
    publishedAt: "October 4, 2026",
    featured: false,
    views: 1150,
    likes: 72,
    tags: ["Workwear", "Tailoring", "Executive Style", "Comfort"],
    content: `## The Modern Workplace Wardrobe Shift

The strict dichotomy between rigid corporate uniforms and weekend leisure wear has dissolved. Today's dynamic professionals command apparel that moves effortlessly between boardrooms, design studios, and international departures.

Modern workwear is no longer about stifling pads and suffocating collars. It is about ergonomic precision and effortless authority.

---

### The Three Pillars of Hybrid Workwear

#### 1. Unstructured Suiting
Traditional suiting relished canvas horsehair chest pieces and rigid shoulder pads. Our contemporary blazers discard the excess armor, retaining razor-sharp lapels while providing the kinetic freedom of a cardigan.

#### 2. Technical Performance Textiles
We incorporate micro-weave poly-wool blends engineered with four-way mechanical stretch, crease resistance, and ambient moisture management. You step off a 6-hour flight looking as pristine as when you boarded.

#### 3. Smart Modular Separates
Forget rigid two-piece constraints. Modern workwear thrives on interchangeable modules:
- Pleated stretch trousers paired with minimalist fine-gauge knitwear.
- Structured overshirts serving as contemporary alternatives to traditional sports coats.
- Clean leather sneakers or refined chelsea boots anchoring the ensemble.

> "True polish today is characterized by confidence and comfort. When you feel physically unrestricted, your mind operates at peak clarity."`,
  },
  {
    id: "garment-care-and-preservation",
    slug: "garment-care-and-preservation",
    title: "Care & Preservation: How to Make Your Quality Garments Last Decades",
    excerpt:
      "Extending the lifespan of fine wools, structured cottons, and technical outerwear isn't complicated—it's an essential ritual of conscious ownership.",
    category: "Garment Care",
    coverImage:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Tanvirul Hasan",
      role: "Lead Product Specialist",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "4 min read",
    publishedAt: "September 28, 2026",
    featured: false,
    views: 820,
    likes: 58,
    tags: ["Maintenance", "Eco-Care", "Wardrobe", "Wool & Cotton"],
    content: `## The Ritual of Wardrobe Stewardship

Fast fashion conditioned us to treat clothing as consumable, perishable goods. But when you invest in high-grade craftsmanship, caring for your clothes becomes an immensely rewarding daily ritual.

Proper maintenance can easily quadruple the usable life of fine fabrics while saving energy, water, and tailoring costs.

---

### Essential Rules for Garment Preservation

#### Rule 1: The Power of Steaming vs. Heavy Pressing
Direct, high-heat dry irons crush delicate natural wool fibers and leave unsightly sheen on cottons. A garment steamer relaxes wrinkles using gentle moisture, sanitizing the textile while plumping up individual weave fibers.

#### Rule 2: Invest in Proper Hangers
Wire hangers from dry cleaners are wardrobe enemies—they stretch collar bands and leave unsightly dimples on structured shoulders.
- Use wide-shoulder contoured wooden hangers for blazers and coats.
- Use cedar blocks or aromatic lavender sachets to naturally deter moths without synthetic chemical smells.

#### Rule 3: Brush, Don't Wash
Wool and heavy cotton outerwear possess natural self-cleaning resilience. A natural bristle garment brush removes daily street dust, pollen, and microscopic debris before they embed into yarns.

> "Taking 60 seconds to brush your coat after returning home is the single most effective habit for keeping outer garments in showroom condition."`,
  },
  {
    id: "the-minimalist-capsule-wardrobe",
    slug: "the-minimalist-capsule-wardrobe",
    title: "The 2026 Minimalist Capsule: 10 Versatile Pieces for Infinite Looks",
    excerpt:
      "Curate a high-impact wardrobe foundation that eliminates morning decision fatigue while elevating your signature everyday aesthetic.",
    category: "Capsule Wardrobe",
    coverImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Amara Bennett",
      role: "Fashion Editor",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    readTime: "7 min read",
    publishedAt: "September 22, 2026",
    featured: false,
    views: 1890,
    likes: 135,
    tags: ["Capsule", "Minimalism", "Smart Shopping", "Versatility"],
    content: `## The Joy of Intentional Subtraction

Decision fatigue is a quiet drain on everyday creative energy. Opening a stuffed closet where "nothing feels right" is an experience all too familiar. The capsule wardrobe offers a liberating antidote: owning fewer items of exceptionally higher quality, each purposefully selected to harmonize with every other piece.

Here is the ultimate 10-piece foundation curated for the discerning 2026 aesthetic.

---

### The Core 10 Checklist

1. **The Architectural Overcoat:** Tailored in rich charcoal or camel with clean lines and minimal external hardware.
2. **The Relaxed Oxford Button-Down:** Heavyweight 100% organic cotton with a soft, roll-point collar.
3. **The Fine-Gauge Merino Crewneck:** Ultra-soft, breathable, and suitable under blazers or over tees.
4. **The Heavyweight Pristine Tee:** 240 GSM organic combed cotton with structured ribbed collar.
5. **The Unstructured Single-Breasted Blazer:** Soft natural shoulders in dark navy or deep espresso.
6. **The Tapered Selvedge Denim:** Clean raw or rinse wash without artificial fading.
7. **The Tailored Pleated Chino:** Relaxed seat tapering subtly toward the ankle in warm stone.
8. **The Minimalist Leather Sneaker:** Clean monochromatic white or ecru silhouette.
9. **The Goodyear-Welted Chelsea Boot:** Weather-resistant calfskin leather with durable rubber soles.
10. **The Canvas Weekend Holdall:** Vegetable-tanned leather accents and waterproof interior lining.

---

### The Exponential Combination Formula
With these 10 cohesive elements, you can generate more than 40 distinct combinations suitable for casual weekends, client presentations, evening dinners, and long-weekend travels.

> "Elegance is not about being noticed; it is about being remembered for quiet, effortless cohesion."`,
  },
];

/**
 * Fetch all blogs from Cloud Firestore
 */
export const fetchBlogsFromFirestore = async (): Promise<BlogItem[]> => {
  const blogCol = collection(db, "blogs");
  const snap = await getDocs(blogCol);

  if (snap.empty) {
    // If empty, auto-seed and return initial blogs
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
      readTime: data.readTime || "5 min read",
      publishedAt: data.publishedAt || "October 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    });
  });

  return blogs;
};

/**
 * Fetch a single blog from Firestore by document ID or slug
 */
export const fetchBlogByIdOrSlugFromFirestore = async (
  idOrSlug: string
): Promise<BlogItem | null> => {
  if (!idOrSlug) return null;

  // 1. Try directly by document ID
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
      readTime: data.readTime || "5 min read",
      publishedAt: data.publishedAt || "October 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    };
  }

  // 2. Query by slug
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
      readTime: data.readTime || "5 min read",
      publishedAt: data.publishedAt || "October 2026",
      featured: Boolean(data.featured),
      views: data.views || 0,
      likes: data.likes || 0,
    };
  }

  // 3. Fallback to initialBlogs matching
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
    const blogCol = collection(db, "blogs");
    const existingSnap = await getDocs(blogCol);

    if (!force && existingSnap.size >= initialBlogs.length) {
      return {
        success: true,
        count: existingSnap.size,
        message: `Firestore already contains ${existingSnap.size} blogs.`,
      };
    }

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
        { merge: true }
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
