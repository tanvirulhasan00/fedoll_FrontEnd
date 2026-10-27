import { GoogleGenAI, Type } from "@google/genai";

export interface GenerateBlogOptions {
  topic: string;
  tone?: "editorial" | "casual" | "informative" | "trendsetter";
  category?: string;
  targetLength?: "quick" | "standard" | "comprehensive";
  focusKeywords?: string;
  apiKey?: string;
}

export interface GeneratedBlogResult {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: string;
  content: string;
  coverImage?: string;
  suggestedPreset?: string;
}

const CATEGORY_LIST = [
  "Winter Styling",
  "Denim Care",
  "Office & Workwear",
  "Garment Care",
  "Wardrobe Tips",
  "Seasonal Trends",
  "Fabrics & Craft",
  "Bespoke Tailoring",
  "Summer Essentials",
  "Casual Streetwear",
];

const PRESET_MAPPING: Record<string, string> = {
  "winter styling":
    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
  "denim care":
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
  "office & workwear":
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
  "garment care":
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  "wardrobe tips":
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  "bespoke tailoring":
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80",
  "summer essentials":
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  "casual streetwear":
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Clean and parse JSON response from Gemini
 */
function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Generate a complete journal article using Google Gemini AI
 */
export async function generateBlogWithGemini(
  options: GenerateBlogOptions
): Promise<GeneratedBlogResult> {
  const {
    topic,
    tone = "editorial",
    category,
    targetLength = "standard",
    focusKeywords,
    apiKey,
  } = options;

  const resolvedApiKey =
    apiKey?.trim() ||
    (typeof process !== "undefined"
      ? process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY
      : "");

  if (!resolvedApiKey) {
    throw new Error(
      "Gemini API key is missing. Please provide your Gemini API key in .env (as GEMINI_API_KEY) or in the AI generation dialog."
    );
  }

  const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

  const lengthGuidelines =
    targetLength === "quick"
      ? "Keep the article concise (~350-450 words, estimated 2-3 min read), focusing on quick takeaways."
      : targetLength === "comprehensive"
      ? "Provide an in-depth, thorough guide (~800-1100 words, estimated 6-8 min read) with detailed breakdowns, fabric specifications, and styling scenarios."
      : "Provide a balanced, highly engaging article (~550-700 words, estimated 4-5 min read) with clear actionable styling tips.";

  const toneGuideline =
    tone === "casual"
      ? "Warm, approachable, conversational, like advice from a stylish friend."
      : tone === "informative"
      ? "Educational, practical, grounded in garment construction, textiles, and everyday care."
      : tone === "trendsetter"
      ? "Forward-looking, bold, highlighting high-street aesthetics and statement pairings."
      : "Sophisticated, editorial, and inspiring, suited for a premium contemporary apparel brand journal.";

  const systemInstruction = `You are the lead fashion journalist and editorial director for Fedoll (SilkenDrift), an elevated lifestyle brand known for premium fabrics, thoughtful tailoring, and weather-smart urban dressing.

CRITICAL FORMATTING MANDATES:
You MUST format the 'content' field as rich, magazine-grade GitHub-Flavored Markdown.
The 'content' field CANNOT be plain text. It MUST include all of the following elements:
1. Major Section Headings (## Title)
2. Subheadings for each tip or principle (### Subtitle)
3. Bulleted lists (- Fabric recommendations, - Styling rules, - Outfit pairings)
4. At least one elegant blockquote (> "...") highlighting a timeless styling philosophy
5. Section dividers (---) between major sections
6. At least 1 or 2 embedded editorial photos using Markdown image syntax:
   ![Descriptive photo caption](https://images.unsplash.com/...)
   Use relevant fashion URLs from:
   - Linen / Summer: https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80
   - Winter / Layering: https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80
   - Denim / Casual: https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1000&q=80
   - Atelier / Tailoring: https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80
   - Capsule Wardrobe: https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80
   - Streetwear & Lifestyle: https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80

Category options: ${CATEGORY_LIST.join(", ")}.`;

  const prompt = `Write a publication-ready fashion editorial article about:
Topic: "${topic}"
Tone: ${toneGuideline}
Length: ${lengthGuidelines}
${category ? `Preferred Category: ${category}` : ""}
${focusKeywords ? `Focus Keywords / Details: ${focusKeywords}` : ""}

REQUIRED CONTENT STRUCTURE FOR THE 'content' FIELD:
## Introduction & The Style Philosophy
[Engaging 2-3 paragraph introductory hook explaining the scenario, weather, and aesthetic]

![Editorial Fashion Imagery](Choose from provided URLs)

---

### 1. The Core Principle & Fabric Guide
[Detailed breakdown of textiles, breathability, and structure]
- **Key Fabric:** [Details]
- **Color Palette:** [Curated color combinations]
- **Fit Recommendation:** [Silhouettes and sizing advice]

> "[An inspiring, stylish quote summarizing the essence of this outfit/principle]"

---

### 2. Everyday Pairing & Outfit Construction
[Step-by-step outfit combinations, footwear, and subtle accessories]
- **Casual Setting:** [How to wear it on relaxed weekends]
- **Elevated / Workwear Setting:** [How to sharpen the look for office or evenings]

---

### 3. Longevity & Garment Care Tips
[Practical advice to ensure the garments last and retain their shape/color]
- Washing in cold water and gentle cycles
- Proper drying and garment steaming tips

---

### The Final Touch
[An empowering concluding thought celebrating personal confidence and effortless style]`;


  // Prioritize ultra-fast & resilient Gemini models with automatic fallback
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slug: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              readTime: { type: Type.STRING },
              content: {
                type: Type.STRING,
                description:
                  "Comprehensive, publication-ready fashion article in rich GitHub-Flavored Markdown. MUST include headings (##, ###), blockquotes (>), bulleted lists (-), dividers (---), and embedded markdown images (![alt](url)). MUST NOT be plain text.",
              },
              suggestedPreset: { type: Type.STRING },
            },
            required: [
              "title",
              "slug",
              "excerpt",
              "category",
              "tags",
              "readTime",
              "content",
            ],
          },
        },
      });

      const rawText = response.text || "";
      if (!rawText) {
        throw new Error("Received empty response from Gemini API.");
      }

      const parsed = cleanAndParseJSON(rawText);

      // Resolve cover image from preset or category
      const presetKey = (parsed.suggestedPreset || parsed.category || "").toLowerCase();
      let coverImage = PRESET_MAPPING[presetKey];
      if (!coverImage) {
        for (const [key, url] of Object.entries(PRESET_MAPPING)) {
          if (presetKey.includes(key) || key.includes(presetKey)) {
            coverImage = url;
            break;
          }
        }
      }
      if (!coverImage) {
        coverImage = PRESET_MAPPING["wardrobe tips"];
      }

      return {
        title: parsed.title || topic,
        slug:
          parsed.slug ||
          topic
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-"),
        excerpt: parsed.excerpt || "",
        category: parsed.category || category || "Wardrobe Tips",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["Fashion", "Style Guide"],
        readTime: parsed.readTime || "4 min read",
        content: parsed.content || "",
        coverImage,
        suggestedPreset: parsed.suggestedPreset,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini generation with ${model} failed, trying fallback if available:`, err?.message || err);
    }
  }

  throw new Error(
    lastError?.message || "Failed to generate blog content with Gemini. Please check your API key and connection."
  );
}
