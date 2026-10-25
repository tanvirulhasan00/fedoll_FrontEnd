import React, { useEffect, useMemo } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/blogs";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchBlogs,
  setSelectedCategory,
  setSearchQuery,
  seedBlogs,
  toggleLikeBlog,
} from "~/redux/features/blogSlice";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  HeartIcon,
  EyeIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Style & Care Guides | SilkenDrift Bangladesh" },
    {
      name: "description",
      content:
        "Read helpful fashion advice, clothing care tips for Bangladeshi weather, and everyday style guides by SilkenDrift.",
    },
  ];
}

const DEFAULT_PRESET_CATEGORIES = [
  "All",
  "Winter Styling",
  "Denim Care",
  "Office & Workwear",
  "Garment Care",
  "Wardrobe Tips",
];

export default function BlogsPage() {
  const dispatch = useAppDispatch();
  const { blogs, loading, selectedCategory, searchQuery, seeding } =
    useAppSelector((state) => state.blogs);

  const displayCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_PRESET_CATEGORIES);
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  useEffect(() => {
    dispatch(fetchBlogs());
  }, [dispatch]);

  const handleSyncFirebase = async () => {
    try {
      await dispatch(seedBlogs(true)).unwrap();
      await dispatch(fetchBlogs()).unwrap();
      toast.success("Synchronized successfully with Firebase Firestore!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync with Firebase");
    }
  };

  const handleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleLikeBlog(id));
    toast.success("Liked! Thanks for your appreciation.");
  };

  // Filtered blogs based on Category & Search
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesCategory =
        selectedCategory === "All" || blog.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.tags.some((t) => t.toLowerCase().includes(q)) ||
        blog.author.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  // Top featured blog (highlighted if on 'All' and no search query)
  const featuredBlog = useMemo(() => {
    if (selectedCategory !== "All" || searchQuery) return null;
    return blogs.find((b) => b.featured) || blogs[0] || null;
  }, [blogs, selectedCategory, searchQuery]);

  const remainingBlogs = useMemo(() => {
    if (!featuredBlog) return filteredBlogs;
    return filteredBlogs.filter((b) => b.id !== featuredBlog.id);
  }, [filteredBlogs, featuredBlog]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans">
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Editorial Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 via-orange-50/20 to-white dark:from-neutral-900 dark:via-neutral-900/40 dark:to-neutral-950 border-b border-stone-200/60 dark:border-neutral-800 py-16 md:py-24">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-semibold uppercase tracking-wider mb-4">
                  <SparklesIcon className="size-4 text-orange-600 dark:text-orange-400" />
                  SilkenDrift Fashion Journal
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Everyday Style <br />
                  <span className="text-orange-700 dark:text-orange-500 italic font-serif">
                    & Care Guides
                  </span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-neutral-400 leading-relaxed">
                  Simple, practical styling tips, weather-friendly clothing care guides,
                  and smart wardrobe essentials made for life in Bangladesh.
                </p>
              </div>

              {/* Firebase Status & Re-sync */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full shadow-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Cloud Firestore Database
                </div>
                <button
                  type="button"
                  onClick={handleSyncFirebase}
                  disabled={seeding || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-700 dark:hover:text-orange-400 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Reseed or refresh data directly with Firebase"
                >
                  <ArrowPathIcon
                    className={`size-3.5 ${seeding ? "animate-spin text-orange-600" : ""}`}
                  />
                  {seeding ? "Syncing..." : "Sync with Firebase"}
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="mt-10 pt-8 border-t border-stone-200/80 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {displayCategories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => dispatch(setSelectedCategory(cat))}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer ${
                        active
                          ? "bg-gray-900 dark:bg-orange-600 text-white shadow-sm"
                          : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Field */}
              <div className="relative w-full lg:w-72">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  placeholder="Search articles, tags, authors..."
                  className="w-full pl-10 pr-9 py-2 rounded-full text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => dispatch(setSearchQuery(""))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  >
                    <XMarkIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shadow-xs animate-pulse"
                >
                  <div className="h-52 bg-gray-200 dark:bg-neutral-800" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-800 rounded" />
                    <div className="h-6 w-5/6 bg-gray-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded" />
                    <div className="pt-4 flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gray-200 dark:bg-neutral-800" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-neutral-800 rounded" />
                        <div className="h-2 w-20 bg-gray-200 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-stone-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-stone-300 dark:border-neutral-800">
              <div className="size-16 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                No matching stories found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
                We couldn't find any articles matching "{searchQuery}" in{" "}
                {selectedCategory}. Try resetting your search terms.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setSelectedCategory("All"));
                    dispatch(setSearchQuery(""));
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-orange-600 rounded-lg hover:bg-black dark:hover:bg-orange-700 transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Hero Article */}
              {featuredBlog && (
                <div className="group relative rounded-3xl border border-stone-200 dark:border-neutral-800 bg-stone-50/60 dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 relative overflow-hidden h-72 sm:h-96 lg:h-auto min-h-[320px]">
                      <img
                        src={featuredBlog.coverImage}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 left-4 bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                        <SparklesIcon className="size-3.5" />
                        Featured Story
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3">
                          <span>{featuredBlog.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-neutral-400 font-normal">
                            <ClockIcon className="size-3.5" />
                            {featuredBlog.readTime}
                          </span>
                        </div>

                        <Link to={`/blogs/${featuredBlog.id}`}>
                          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition leading-snug">
                            {featuredBlog.title}
                          </h2>
                        </Link>

                        <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                          {featuredBlog.excerpt}
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-stone-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={featuredBlog.author.avatar}
                            alt={featuredBlog.author.name}
                            className="size-11 rounded-full object-cover ring-2 ring-orange-600/20"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {featuredBlog.author.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                              {featuredBlog.publishedAt}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/blogs/${featuredBlog.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400 group-hover:translate-x-1 transition"
                        >
                          Read Article <ArrowRightIcon className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of Remaining Blogs */}
              <div>
                {featuredBlog && remainingBlogs.length > 0 && (
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Recent Dispatches
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-neutral-400">
                      Showing {remainingBlogs.length} articles
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {remainingBlogs.map((blog) => (
                    <article
                      key={blog.id}
                      className="group flex flex-col rounded-2xl border border-gray-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Card Cover */}
                      <div className="relative h-56 overflow-hidden bg-stone-100 dark:bg-neutral-800">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xs text-gray-900 dark:text-neutral-200 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                          {blog.category}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleLike(e, blog.id)}
                          className="absolute top-3 right-3 size-8 rounded-full bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:text-red-500 hover:scale-110 transition shadow-xs cursor-pointer"
                          title="Like this story"
                        >
                          {(blog.likes || 0) > 0 ? (
                            <HeartSolidIcon className="size-4 text-red-500" />
                          ) : (
                            <HeartIcon className="size-4" />
                          )}
                        </button>
                      </div>

                      {/* Card Body */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400 mb-2.5">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="size-3.5" />
                              {blog.readTime}
                            </span>
                            <span>•</span>
                            <span>{blog.publishedAt}</span>
                          </div>

                          <Link to={`/blogs/${blog.id}`}>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-400 transition line-clamp-2 leading-snug">
                              {blog.title}
                            </h3>
                          </Link>

                          <p className="mt-2.5 text-sm text-gray-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {blog.excerpt}
                          </p>

                          {/* Tags */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] font-medium bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 px-2.5 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={blog.author.avatar}
                              alt={blog.author.name}
                              className="size-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                                {blog.author.name}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                                {blog.author.role}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1">
                              <EyeIcon className="size-3.5" />
                              {blog.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <HeartSolidIcon className="size-3.5 text-rose-500" />
                              {blog.likes || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quality Promises Banner */}
        <section className="bg-stone-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-700/20 text-orange-500 flex items-center justify-center shrink-0">
                  <CheckBadgeIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold">100% Export Quality</h4>
                  <p className="mt-1 text-sm text-stone-400 leading-relaxed">
                    Every garment is crafted using export-grade cotton, strong stitching,
                    and premium dyes that do not fade easily.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-700/20 text-orange-500 flex items-center justify-center shrink-0">
                  <SparklesIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Made for BD Weather</h4>
                  <p className="mt-1 text-sm text-stone-400 leading-relaxed">
                    Designed specifically for high humidity, heat, and mild winters
                    across Dhaka and other districts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-orange-700/20 text-orange-500 flex items-center justify-center shrink-0">
                  <HeartIcon className="size-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Nationwide Support</h4>
                  <p className="mt-1 text-sm text-stone-400 leading-relaxed">
                    Easy exchanges, fast doorstep delivery across all 64 districts,
                    and friendly local customer service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
