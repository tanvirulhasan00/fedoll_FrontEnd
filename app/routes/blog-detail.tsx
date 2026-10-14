import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/blog-detail";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  fetchBlogById,
  fetchBlogs,
  toggleLikeBlog,
  clearSelectedBlog,
} from "~/redux/features/blogSlice";
import {
  ClockIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  EyeIcon,
  BookmarkIcon,
  SparklesIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Article | Fedoll Journal" },
    {
      name: "description",
      content:
        "Deep-dive sartorial insight from the Fedoll design studio and textile atelier.",
    },
  ];
}

// Markdown-like block renderer for rich article typography
function ArticleBodyRenderer({ content }: { content: string }) {
  const sections = useMemo(() => {
    return content.split("\n\n");
  }, [content]);

  return (
    <div className="space-y-6 text-gray-700 leading-relaxed font-sans text-base sm:text-lg">
      {sections.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-10 mb-4 pt-4 border-t border-gray-100"
            >
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-3"
            >
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }

        if (trimmed.startsWith("#### ")) {
          return (
            <h4
              key={index}
              className="text-lg sm:text-xl font-semibold text-gray-900 mt-6 mb-2"
            >
              {trimmed.replace(/^####\s+/, "")}
            </h4>
          );
        }

        if (trimmed === "---") {
          return (
            <hr
              key={index}
              className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent"
            />
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={index}
              className="my-8 pl-6 border-l-4 border-orange-600 bg-orange-50/40 p-6 rounded-r-2xl italic text-gray-800 text-lg sm:text-xl font-serif"
            >
              {trimmed.replace(/^>\s+/, "").replace(/^"(.*)"$/, "$1")}
            </blockquote>
          );
        }

        // Bullet lists
        if (trimmed.includes("\n- ") || trimmed.startsWith("- ")) {
          const items = trimmed
            .split("\n")
            .filter((l) => l.trim().startsWith("- "))
            .map((l) => l.trim().replace(/^- /, ""));

          return (
            <ul key={index} className="my-4 space-y-2.5 pl-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-orange-600 mt-2.5 shrink-0" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                </li>
              ))}
            </ul>
          );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
          return (
            <ol key={index} className="my-4 space-y-2.5 pl-2 list-none">
              {items.map((item, i) => {
                const match = item.match(/^(\d+)\.\s*(.*)$/);
                const num = match ? match[1] : `${i + 1}`;
                const text = match ? match[2] : item;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-stone-100 text-stone-800 text-xs font-bold shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: text
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                      }}
                    />
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph with bold / italic replacement
        return (
          <p
            key={index}
            className="leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
            }}
          />
        );
      })}
    </div>
  );
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);

  const { selectedBlog, detailLoading, detailError, blogs } = useAppSelector(
    (state) => state.blogs
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchBlogById(id));
    }
    // Also ensure blogs catalog is loaded for recommended section
    if (blogs.length === 0) {
      dispatch(fetchBlogs());
    }

    return () => {
      dispatch(clearSelectedBlog());
    };
  }, [id, dispatch, blogs.length]);

  const handleLike = () => {
    if (selectedBlog) {
      dispatch(toggleLikeBlog(selectedBlog.id));
      toast.success("Article liked!");
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Article link copied to clipboard!");
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      toast.error("Could not copy link to clipboard.");
    }
  };

  // 3 Recommended blogs excluding current
  const relatedBlogs = useMemo(() => {
    if (!selectedBlog) return [];
    return blogs
      .filter((b) => b.id !== selectedBlog.id)
      .slice(0, 3);
  }, [blogs, selectedBlog]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Breadcrumbs Navigation */}
        <div className="bg-stone-50 border-b border-stone-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <nav className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
              <Link to="/" className="hover:text-gray-900 transition">
                Home
              </Link>
              <ChevronRightIcon className="size-3.5 text-gray-400 shrink-0" />
              <Link to="/blogs" className="hover:text-gray-900 transition">
                Journal
              </Link>
              {selectedBlog && (
                <>
                  <ChevronRightIcon className="size-3.5 text-gray-400 shrink-0" />
                  <span className="text-gray-900 font-medium truncate">
                    {selectedBlog.title}
                  </span>
                </>
              )}
            </nav>

            <Link
              to="/blogs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-800 transition shrink-0 ml-4"
            >
              <ArrowLeftIcon className="size-3.5" /> All Stories
            </Link>
          </div>
        </div>

        {detailLoading ? (
          /* Loading state */
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 animate-pulse space-y-8">
            <div className="h-6 w-32 bg-gray-200 rounded-full" />
            <div className="h-12 w-5/6 bg-gray-200 rounded-xl" />
            <div className="h-6 w-3/4 bg-gray-200 rounded" />
            <div className="h-96 w-full bg-gray-200 rounded-3xl" />
            <div className="space-y-4 pt-6">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        ) : detailError || !selectedBlog ? (
          /* Error / Not found state */
          <div className="max-w-xl mx-auto px-4 py-24 text-center">
            <div className="size-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <SparklesIcon className="size-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Article Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The article you are trying to view might have been moved or removed.
            </p>
            <div className="mt-6">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
              >
                <ArrowLeftIcon className="size-4" /> Return to Journal
              </Link>
            </div>
          </div>
        ) : (
          <article className="pb-20">
            {/* Header Content */}
            <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-6">
                {selectedBlog.category}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                {selectedBlog.title}
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-600 font-normal leading-relaxed">
                {selectedBlog.excerpt}
              </p>

              {/* Author & Meta Bar */}
              <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedBlog.author.avatar}
                    alt={selectedBlog.author.name}
                    className="size-12 rounded-full object-cover ring-2 ring-orange-600/30"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {selectedBlog.author.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {selectedBlog.author.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="size-4 text-gray-400" />
                    {selectedBlog.publishedAt}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="size-4 text-gray-400" />
                    {selectedBlog.readTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <EyeIcon className="size-4 text-gray-400" />
                    {selectedBlog.views || 0} views
                  </span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 my-10">
              <div className="relative overflow-hidden rounded-3xl shadow-xl border border-stone-200 bg-stone-100">
                <img
                  src={selectedBlog.coverImage}
                  alt={selectedBlog.title}
                  className="w-full max-h-[540px] object-cover"
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-400 italic">
                Fedoll Atelier Sartorial Archive • Photograph & Documentation
              </p>
            </div>

            {/* Main Article Body */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <ArticleBodyRenderer content={selectedBlog.content} />

              {/* Tags Section */}
              <div className="mt-12 pt-8 border-t border-stone-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">
                  Tagged in:
                </span>
                {selectedBlog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 px-3 py-1.5 rounded-full transition cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Engagement & Share Floating / Sticky Bar */}
              <div className="mt-10 p-5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 transition shadow-xs text-sm font-semibold cursor-pointer"
                  >
                    <HeartSolidIcon className="size-4 text-red-500" />
                    <span>{selectedBlog.likes || 0} Likes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-700 transition shadow-xs text-sm font-semibold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="size-4 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <ShareIcon className="size-4" />
                        <span>Share Article</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <BookmarkIcon className="size-4 text-orange-600" />
                  Saved in Fedoll Architecture Archive
                </div>
              </div>

              {/* Author Bio Card */}
              <div className="mt-14 p-8 rounded-3xl bg-gradient-to-br from-stone-50 to-orange-50/30 border border-stone-200 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <img
                  src={selectedBlog.author.avatar}
                  alt={selectedBlog.author.name}
                  className="size-20 rounded-full object-cover ring-4 ring-white shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedBlog.author.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      Author
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 font-medium mt-0.5">
                    {selectedBlog.author.role} at Fedoll
                  </p>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    Dedicated to dissecting the nuances of technical textile
                    fabrication, zero-waste garment construction, and contemporary
                    outerwear silhouettes.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Stories Section */}
            {relatedBlogs.length > 0 && (
              <section className="mt-20 pt-16 border-t border-stone-200 bg-stone-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Continue Reading
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        More thoughtful perspectives from our editorial journal
                      </p>
                    </div>

                    <Link
                      to="/blogs"
                      className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:text-orange-800 transition"
                    >
                      View All Stories <ChevronRightIcon className="size-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {relatedBlogs.map((b) => (
                      <article
                        key={b.id}
                        className="group flex flex-col rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="relative h-48 overflow-hidden bg-stone-100">
                          <img
                            src={b.coverImage}
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-900 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                            {b.category}
                          </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-gray-500 mb-2">
                              {b.readTime} • {b.publishedAt}
                            </div>
                            <Link to={`/blogs/${b.id}`}>
                              <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-700 transition line-clamp-2">
                                {b.title}
                              </h3>
                            </Link>
                            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                              {b.excerpt}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-800">
                              By {b.author.name}
                            </span>
                            <Link
                              to={`/blogs/${b.id}`}
                              className="text-xs font-semibold text-orange-700 hover:underline"
                            >
                              Read &rarr;
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
