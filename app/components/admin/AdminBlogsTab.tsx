import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router";
import {
  BookOpenIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  TagIcon,
  UserCircleIcon,
  PhotoIcon,
  DocumentTextIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { toast } from "sonner";
import { Spinner } from "~/components/ui/spinner";
import {
  type BlogItem,
  saveBlogToFirestore,
  deleteBlogFromFirestore,
  seedBlogsToFirestore,
  slugifyBlogTitle,
} from "~/firebase";

// Curated high-res fashion editorial stock imagery presets for 1-click selection
const COVER_IMAGE_PRESETS = [
  {
    label: "Winter Layering",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Selvedge Denim",
    url: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Executive Workwear",
    url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Garment Atelier",
    url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Capsule Wardrobe",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Linen Tailoring",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  },
];

const DEFAULT_CATEGORIES = [
  "Winter Styling",
  "Denim Care",
  "Office & Workwear",
  "Garment Care",
  "Wardrobe Tips",
  "Seasonal Trends",
  "Fabrics & Craft",
  "Bespoke Tailoring",
];

const TAG_SUGGESTIONS = [
  "Winter Style",
  "Layering Tips",
  "Selvedge Jeans",
  "Durable Denim",
  "Office Style",
  "Dhaka Life",
  "Clothes Care",
  "Cotton",
  "Capsule Wardrobe",
  "Minimal Style",
  "Linen",
  "Tailoring",
];

interface AdminBlogsTabProps {
  blogs: BlogItem[];
  onRefresh: () => void;
}

export const AdminBlogsTab: React.FC<AdminBlogsTabProps> = ({
  blogs,
  onRefresh,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState<"all" | "featured" | "standard">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalTab, setModalTab] = useState<"editor" | "preview">("editor");

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Winter Styling");
  const [customCategory, setCustomCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [authorName, setAuthorName] = useState("SilkenDrift Editorial");
  const [authorRole, setAuthorRole] = useState("Lead Fashion Stylist");
  const [authorAvatar, setAuthorAvatar] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  );
  const [readTime, setReadTime] = useState("4 min read");
  const [publishedAt, setPublishedAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  // Textarea Ref for inserting Markdown tags
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Distinct Categories across all blogs
  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  // Key KPI Metrics
  const stats = useMemo(() => {
    const total = blogs.length;
    const featuredCount = blogs.filter((b) => b.featured).length;
    const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
    const totalLikes = blogs.reduce((sum, b) => sum + (b.likes || 0), 0);
    const categoriesCount = new Set(blogs.map((b) => b.category)).size;
    return { total, featuredCount, totalViews, totalLikes, categoriesCount };
  }, [blogs]);

  // Filtered List
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (selectedCategory !== "all" && b.category !== selectedCategory) {
        return false;
      }
      if (filterFeatured === "featured" && !b.featured) {
        return false;
      }
      if (filterFeatured === "standard" && b.featured) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchExcerpt = b.excerpt.toLowerCase().includes(q);
        const matchAuthor = b.author?.name?.toLowerCase().includes(q);
        const matchCat = b.category.toLowerCase().includes(q);
        const matchTags = b.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchExcerpt && !matchAuthor && !matchCat && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [blogs, selectedCategory, filterFeatured, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBlog(null);
    setTitle("");
    setSlug("");
    setCategory("Winter Styling");
    setCustomCategory("");
    setExcerpt("");
    setContent(
      `## Introduction\n\nWrite your engaging introduction here explaining why this style guide or clothing advice is helpful for Bangladesh weather.\n\n---\n\n### 1. Key Style Principle\nShare practical fashion tips, color palettes, and fabric recommendations.\n\n> "A great outfit should look effortlessly put together and feel comfortable from morning to evening."\n\n### 2. Fabric & Everyday Care\nExplain how to take care of garments made from cotton, denim, or knitwear.`
    );
    setCoverImage(COVER_IMAGE_PRESETS[0].url);
    setAuthorName("Tanvirul Hasan");
    setAuthorRole("Lead Fashion Stylist");
    setAuthorAvatar(
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    );
    setReadTime("4 min read");
    setPublishedAt(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
    setFeatured(false);
    setTags(["Winter Style", "Layering Tips", "Dhaka Life"]);
    setTagInput("");
    setAutoSlug(true);
    setModalTab("editor");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (blog: BlogItem) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug || blog.id);
    if (DEFAULT_CATEGORIES.includes(blog.category)) {
      setCategory(blog.category);
      setCustomCategory("");
    } else {
      setCategory("other");
      setCustomCategory(blog.category);
    }
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setCoverImage(blog.coverImage);
    setAuthorName(blog.author?.name || "SilkenDrift Editorial");
    setAuthorRole(blog.author?.role || "Staff Writer");
    setAuthorAvatar(
      blog.author?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    );
    setReadTime(blog.readTime || "4 min read");
    setPublishedAt(blog.publishedAt || "January 2026");
    setFeatured(Boolean(blog.featured));
    setTags(Array.isArray(blog.tags) ? [...blog.tags] : []);
    setTagInput("");
    setAutoSlug(false);
    setModalTab("editor");
    setIsModalOpen(true);
  };

  // Title Change with Auto-Slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugifyBlogTitle(val));
    }
  };

  // Auto-calculate reading time based on 200 wpm
  const handleCalculateReadTime = () => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 180));
    const calculated = `${mins} min read`;
    setReadTime(calculated);
    toast.info(`Calculated: ~${words} words → ${calculated}`);
  };

  // Tags Management
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#/, "");
    if (!clean) return;
    if (tags.includes(clean)) {
      toast.info(`Tag "${clean}" already added.`);
      return;
    }
    setTags([...tags, clean]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Insert Markdown Template
  const handleInsertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 50);
  };

  // Save / Publish Blog
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Article Title is required.");
      return;
    }

    const finalSlug = slug.trim() ? slugifyBlogTitle(slug) : slugifyBlogTitle(title);
    if (!finalSlug) {
      toast.error("Valid URL slug is required.");
      return;
    }

    const finalCategory =
      category === "other"
        ? customCategory.trim() || "Style"
        : category;

    if (!excerpt.trim()) {
      toast.error("Article summary / excerpt is required.");
      return;
    }

    if (!content.trim()) {
      toast.error("Article content is required.");
      return;
    }

    setIsSaving(true);
    try {
      const blogPayload: BlogItem = {
        id: editingBlog ? editingBlog.id : finalSlug,
        slug: finalSlug,
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: finalCategory,
        coverImage:
          coverImage.trim() ||
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
        author: {
          name: authorName.trim() || "SilkenDrift Editorial",
          role: authorRole.trim() || "Staff Writer",
          avatar:
            authorAvatar.trim() ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        },
        readTime: readTime.trim() || "4 min read",
        publishedAt:
          publishedAt.trim() ||
          new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        featured,
        tags: tags.length > 0 ? tags : ["Style Guide"],
        views: editingBlog?.views || 10,
        likes: editingBlog?.likes || 1,
      };

      await saveBlogToFirestore(blogPayload);

      toast.success(
        editingBlog
          ? `Article "${title}" updated successfully!`
          : `Article "${title}" published live!`
      );
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save article.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Featured Status directly from list
  const handleToggleFeatured = async (blog: BlogItem) => {
    try {
      const nextFeatured = !blog.featured;
      await saveBlogToFirestore({ ...blog, featured: nextFeatured });
      toast.success(
        `"${blog.title}" is ${nextFeatured ? "now featured" : "unfeatured"}.`
      );
      onRefresh();
    } catch {
      toast.error("Could not toggle featured status.");
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (blog: BlogItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete article "${blog.title}"?`
    );
    if (!confirmed) return;

    try {
      await deleteBlogFromFirestore(blog.id);
      toast.success(`Deleted article "${blog.title}".`);
      onRefresh();
    } catch {
      toast.error("Could not delete article.");
    }
  };

  // Reset seed articles
  const handleResetSeedData = async () => {
    const confirmed = window.confirm(
      "Restore the initial 5 lifestyle guides to Firestore? Existing custom articles will not be removed."
    );
    if (!confirmed) return;

    try {
      await seedBlogsToFirestore(true);
      toast.success("Default lifestyle guides refreshed in Firestore.");
      onRefresh();
    } catch {
      toast.error("Failed to seed default guides.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="size-6 text-orange-600" />
            <span>Journal &amp; Blog Editorial Management</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Create, edit, curate, and publish style guides, clothing care advice, and fashion editorials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/blogs"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-bold text-gray-700 dark:text-neutral-200 transition"
          >
            <EyeIcon className="size-3.5 text-orange-600" />
            <span>Live Journal</span>
            <ArrowTopRightOnSquareIcon className="size-3" />
          </Link>

          <button
            type="button"
            onClick={handleResetSeedData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-600 dark:text-neutral-300 transition cursor-pointer"
            title="Restore default 5 style guides in Firestore"
          >
            <ArrowPathIcon className="size-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block">
            Total Articles
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Published in atelier</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Featured Stories
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
            <StarSolidIcon className="size-5" />
            <span>{stats.featuredCount}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Homepage &amp; hero highlights</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Total Readership
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
            <EyeIcon className="size-5 text-emerald-600" />
            <span>{stats.totalViews.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Article page impressions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Reader Likes
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
            <HeartIcon className="size-5 text-rose-500" />
            <span>{stats.totalLikes.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Community appreciations</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Active Topics
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {stats.categoriesCount}
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Distinct styling themes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200/80 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
          >
            <option value="all">All Topics &amp; Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Featured Status Dropdown */}
          <select
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value as any)}
            className="px-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-orange-600 cursor-pointer"
          >
            <option value="all">All Editorial Tiers</option>
            <option value="featured">Featured Stories Only</option>
            <option value="standard">Standard Articles Only</option>
          </select>

          {(selectedCategory !== "all" || filterFeatured !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setFilterFeatured("all");
                setSearchQuery("");
              }}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline px-2 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, author, tag, excerpt..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      {/* Articles List / Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 space-y-3">
          <BookOpenIcon className="size-12 text-stone-300 dark:text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-neutral-200">
            No journal articles match your query
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
            Try resetting your search filters or click &quot;Write New Article&quot; to publish your first editorial piece.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-md hover:bg-orange-700 transition cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            <span>Write New Article</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => (
            <article
              key={blog.id}
              className="group flex flex-col bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200/80 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200"
            >
              {/* Cover Image Container */}
              <div className="relative h-48 w-full bg-stone-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback image if broken
                    (e.target as HTMLImageElement).src =
                      COVER_IMAGE_PRESETS[0].url;
                  }}
                />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-[11px] font-bold text-gray-900 dark:text-white shadow-xs">
                    {blog.category}
                  </span>
                  {blog.featured && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs flex items-center gap-1">
                      <StarSolidIcon className="size-3" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>

                {/* Read time pill */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  <span>{blog.readTime || "4 min"}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 font-mono text-[10px] bg-stone-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                      /{blog.slug}
                    </span>
                    <span>{blog.publishedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {blog.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 text-[10px] font-medium text-gray-600 dark:text-neutral-300"
                        >
                          #{tag}
                        </span>
                      ))}
                      {blog.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{blog.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Bar: Author & Controls */}
                <div className="pt-3 border-t border-stone-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                  {/* Author preview */}
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={blog.author?.avatar}
                      alt={blog.author?.name}
                      className="size-6 rounded-full object-cover shrink-0 ring-1 ring-stone-200 dark:ring-neutral-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-800 dark:text-neutral-200 block truncate leading-tight">
                        {blog.author?.name}
                      </span>
                      <span className="text-[9px] text-gray-400 block truncate leading-tight">
                        {blog.author?.role}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle Featured */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(blog)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        blog.featured
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600"
                          : "border-stone-200 dark:border-neutral-700 text-gray-400 hover:text-amber-500"
                      }`}
                      title={blog.featured ? "Unfeature article" : "Feature on Homepage"}
                    >
                      <StarSolidIcon className="size-3.5" />
                    </button>

                    {/* Storefront View */}
                    <Link
                      to={`/blogs/${blog.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-orange-600 hover:bg-stone-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="View live article"
                    >
                      <ArrowTopRightOnSquareIcon className="size-3.5" />
                    </Link>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(blog)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs font-bold transition cursor-pointer"
                      title="Edit article details"
                    >
                      <PencilSquareIcon className="size-3.5 text-orange-600" />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteBlog(blog)}
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Delete article"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ======================================================================
          ADD / EDIT ARTICLE MODAL
          ====================================================================== */}
      <Transition appear show={isModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-sans"
          onClose={() => setIsModalOpen(false)}
        >
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 text-left align-middle shadow-2xl transition-all border border-stone-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-neutral-900">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-orange-600/10 text-orange-600 flex items-center justify-center">
                        <BookOpenIcon className="size-5" />
                      </div>
                      <div>
                        <DialogTitle
                          as="h3"
                          className="text-base font-bold text-gray-900 dark:text-white leading-tight"
                        >
                          {editingBlog ? "Edit Journal Article" : "Create New Journal Article"}
                        </DialogTitle>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                          {editingBlog
                            ? `Updating "${editingBlog.title}"`
                            : "Publish fresh lifestyle advice, fabric guides, and styling tips"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sub-tab switcher: Editor vs Preview */}
                      <div className="flex items-center rounded-xl bg-stone-200/80 dark:bg-neutral-800 p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setModalTab("editor")}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                            modalTab === "editor"
                              ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs"
                              : "text-gray-600 dark:text-neutral-400 hover:text-gray-900"
                          }`}
                        >
                          Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalTab("preview")}
                          className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                            modalTab === "preview"
                              ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs"
                              : "text-gray-600 dark:text-neutral-400 hover:text-gray-900"
                          }`}
                        >
                          Storefront Preview
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <XMarkIcon className="size-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleSaveBlog} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {modalTab === "editor" ? (
                      <>
                        {/* Section 1: Title, Slug & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                          {/* Title */}
                          <div className="sm:col-span-8 space-y-1.5">
                            <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                              Article Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={title}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              placeholder="e.g. How to Layer Clothes for Bangladesh Winters"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                            />
                          </div>

                          {/* Category */}
                          <div className="sm:col-span-4 space-y-1.5">
                            <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                              Category / Topic <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600 cursor-pointer"
                            >
                              {DEFAULT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              <option value="other">+ Custom Category...</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom Category input if chosen */}
                        {category === "other" && (
                          <div className="space-y-1.5 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40">
                            <label className="text-xs font-bold text-orange-900 dark:text-orange-300 block">
                              Custom Topic Name
                            </label>
                            <input
                              type="text"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="e.g. Monsoon Care, Leather Craft"
                              className="w-full px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </div>
                        )}

                        {/* URL Slug & Read Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                          <div className="sm:col-span-7 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                                URL Slug <span className="text-rose-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setSlug(slugifyBlogTitle(title));
                                  setAutoSlug(true);
                                  toast.info("Slug auto-generated from title.");
                                }}
                                className="text-[10px] text-orange-600 hover:underline cursor-pointer"
                              >
                                Auto-generate
                              </button>
                            </div>
                            <div className="flex items-center rounded-xl border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800/80 px-3 py-1.5">
                              <span className="text-[11px] font-mono text-gray-400 select-none">
                                /blogs/
                              </span>
                              <input
                                type="text"
                                required
                                value={slug}
                                onChange={(e) => {
                                  setSlug(e.target.value);
                                  setAutoSlug(false);
                                }}
                                placeholder="article-url-slug"
                                className="w-full pl-1 bg-transparent text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                                Read Time
                              </label>
                              <button
                                type="button"
                                onClick={handleCalculateReadTime}
                                className="text-[10px] text-orange-600 hover:underline cursor-pointer"
                              >
                                Auto-calculate
                              </button>
                            </div>
                            <input
                              type="text"
                              value={readTime}
                              onChange={(e) => setReadTime(e.target.value)}
                              placeholder="e.g. 4 min read"
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </div>

                          <div className="sm:col-span-2 flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={featured}
                                onChange={(e) => setFeatured(e.target.checked)}
                                className="size-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-gray-800 dark:text-neutral-200">
                                Featured
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Summary / Excerpt */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 block">
                            Article Summary / Excerpt <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Brief 1-2 sentence hook for storefront preview cards, social shares, and SEO meta description..."
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600 resize-none"
                          />
                        </div>

                        {/* Cover Image URL + Quick Presets */}
                        <div className="space-y-2 p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200/80 dark:border-neutral-700/80">
                          <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <PhotoIcon className="size-4 text-orange-600" />
                            <span>Cover Image URL</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <input
                              type="url"
                              required
                              value={coverImage}
                              onChange={(e) => setCoverImage(e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className="flex-1 w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                            {coverImage && (
                              <img
                                src={coverImage}
                                alt="Cover preview"
                                className="size-10 rounded-lg object-cover ring-1 ring-stone-300 dark:ring-neutral-700 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                          </div>

                          {/* Quick Curated Stock Image Presets */}
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-gray-400 block mb-1.5">
                              Quick Curated Editorial Covers:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {COVER_IMAGE_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setCoverImage(preset.url)}
                                  className={`px-2 py-1 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                                    coverImage === preset.url
                                      ? "bg-orange-600 text-white border-orange-600"
                                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-stone-300 dark:border-neutral-700 hover:border-orange-500"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Author Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200/80 dark:border-neutral-700/80">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-neutral-300">
                              Author Name
                            </label>
                            <input
                              type="text"
                              value={authorName}
                              onChange={(e) => setAuthorName(e.target.value)}
                              placeholder="e.g. Tanvirul Hasan"
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-neutral-300">
                              Author Role / Title
                            </label>
                            <input
                              type="text"
                              value={authorRole}
                              onChange={(e) => setAuthorRole(e.target.value)}
                              placeholder="e.g. Lead Fashion Stylist"
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-neutral-300">
                              Author Avatar URL
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={authorAvatar}
                                onChange={(e) => setAuthorAvatar(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-600"
                              />
                              {authorAvatar && (
                                <img
                                  src={authorAvatar}
                                  alt="Avatar"
                                  className="size-7 rounded-full object-cover shrink-0 ring-1 ring-stone-300 dark:ring-neutral-700"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tags Management */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <TagIcon className="size-4 text-orange-600" />
                            <span>Article Tags &amp; Keywords</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 text-xs font-semibold"
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="hover:text-rose-600"
                                >
                                  <XMarkIcon className="size-3" />
                                </button>
                              </span>
                            ))}

                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  handleAddTag(tagInput);
                                }
                              }}
                              placeholder={
                                tags.length === 0
                                  ? "Type tag and press Enter (e.g. Winter Style)..."
                                  : "Add more..."
                              }
                              className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none px-1"
                            />
                          </div>

                          {/* Suggested Tags */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
                            <span className="font-semibold">Quick add:</span>
                            {TAG_SUGGESTIONS.filter((s) => !tags.includes(s))
                              .slice(0, 6)
                              .map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleAddTag(s)}
                                  className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 text-gray-700 dark:text-neutral-300 transition cursor-pointer"
                                >
                                  +{s}
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Rich Markdown Content Editor */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-800 dark:text-neutral-200 flex items-center gap-1.5">
                              <DocumentTextIcon className="size-4 text-orange-600" />
                              <span>Article Content (Markdown Supported)</span>
                              <span className="text-rose-500">*</span>
                            </label>

                            <span className="text-[10px] font-mono text-gray-400">
                              {content.length} chars | ~
                              {content.trim().split(/\s+/).filter(Boolean).length} words
                            </span>
                          </div>

                          {/* Markdown Formatting Toolbar */}
                          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-t-xl bg-stone-100 dark:bg-neutral-800 border-t border-x border-stone-300 dark:border-neutral-700 text-xs">
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("## ", "\n")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 font-bold text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Heading 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("### ", "\n")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 font-bold text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Heading 3"
                            >
                              H3
                            </button>
                            <div className="h-4 w-px bg-stone-300 dark:bg-neutral-600 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("**", "**")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 font-extrabold text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("*", "*")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 italic text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("> \"", "\"")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 font-serif italic text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Blockquote"
                            >
                              Quote
                            </button>
                            <div className="h-4 w-px bg-stone-300 dark:bg-neutral-600 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("- ", "\n")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Bullet List"
                            >
                              • List
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertMarkdown("\n---\n\n")}
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 font-mono text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Divider"
                            >
                              --- Line
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleInsertMarkdown(
                                  "![Image description](",
                                  "https://images.unsplash.com/...)"
                                )
                              }
                              className="px-2 py-1 rounded hover:bg-white dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 cursor-pointer"
                              title="Image Link"
                            >
                              Image
                            </button>
                          </div>

                          <textarea
                            ref={contentTextareaRef}
                            rows={14}
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your article in Markdown..."
                            className="w-full px-4 py-3 rounded-b-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs leading-relaxed text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                          />
                        </div>
                      </>
                    ) : (
                      /* STOREFRONT PREVIEW TAB */
                      <div className="space-y-8 max-w-2xl mx-auto py-4">
                        {/* Article Header Preview */}
                        <div className="space-y-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-bold">
                              {category === "other" ? customCategory : category}
                            </span>
                            {featured && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center gap-1">
                                <StarSolidIcon className="size-3" />
                                <span>Featured Story</span>
                              </span>
                            )}
                          </div>

                          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            {title || "Untitled Article"}
                          </h1>

                          <p className="text-sm text-gray-600 dark:text-neutral-300 max-w-xl mx-auto italic">
                            {excerpt || "Article summary will appear here..."}
                          </p>

                          {/* Author & Meta */}
                          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-neutral-400 pt-2 border-y border-stone-100 dark:border-neutral-800 py-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={authorAvatar}
                                alt={authorName}
                                className="size-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-gray-800 dark:text-neutral-200">
                                {authorName}
                              </span>
                              <span className="text-gray-400">• {authorRole}</span>
                            </div>
                            <span>•</span>
                            <span>{publishedAt || "Today"}</span>
                            <span>•</span>
                            <span>{readTime}</span>
                          </div>
                        </div>

                        {/* Cover Image */}
                        {coverImage && (
                          <div className="rounded-2xl overflow-hidden shadow-lg h-64 sm:h-80 bg-stone-100 dark:bg-neutral-800">
                            <img
                              src={coverImage}
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Rendered Body Preview */}
                        <div className="space-y-5 text-gray-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed">
                          {content.split("\n\n").map((block, idx) => {
                            const trimmed = block.trim();
                            if (!trimmed) return null;

                            if (trimmed.startsWith("## ")) {
                              return (
                                <h2
                                  key={idx}
                                  className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white pt-4 border-t border-stone-200 dark:border-neutral-800"
                                >
                                  {trimmed.replace(/^##\s+/, "")}
                                </h2>
                              );
                            }
                            if (trimmed.startsWith("### ")) {
                              return (
                                <h3
                                  key={idx}
                                  className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pt-2"
                                >
                                  {trimmed.replace(/^###\s+/, "")}
                                </h3>
                              );
                            }
                            if (trimmed.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={idx}
                                  className="border-l-4 border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-r-xl italic font-serif text-base"
                                >
                                  {trimmed.replace(/^>\s+/, "").replace(/^"(.*)"$/, "$1")}
                                </blockquote>
                              );
                            }
                            if (trimmed === "---") {
                              return (
                                <hr
                                  key={idx}
                                  className="my-6 border-stone-200 dark:border-neutral-800"
                                />
                              );
                            }
                            if (trimmed.startsWith("- ")) {
                              const items = trimmed.split("\n");
                              return (
                                <ul
                                  key={idx}
                                  className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-neutral-300"
                                >
                                  {items.map((it, i) => (
                                    <li key={i}>{it.replace(/^-\s+/, "")}</li>
                                  ))}
                                </ul>
                              );
                            }
                            return (
                              <p key={idx} className="leading-relaxed">
                                {trimmed}
                              </p>
                            );
                          })}
                        </div>

                        {/* Tags Preview */}
                        {tags.length > 0 && (
                          <div className="pt-6 border-t border-stone-200 dark:border-neutral-800 flex flex-wrap gap-2">
                            {tags.map((t) => (
                              <span
                                key={t}
                                className="px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-300"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modal Footer Controls */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-neutral-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Spinner className="size-4 text-white animate-spin" />
                            <span>Saving Article...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="size-4" />
                            <span>{editingBlog ? "Save Updates" : "Publish Article Live"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminBlogsTab;
