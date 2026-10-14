import React from "react";
import { Link } from "react-router";
import { useAppSelector } from "~/redux/hooks/hook";
import { ClockIcon, ArrowRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";

export default function JournalPreviewSection() {
  const { blogs } = useAppSelector((state) => state.blogs);

  // Take the 3 top or latest stories
  const previewBlogs = blogs.slice(0, 3);

  if (!previewBlogs || previewBlogs.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 mb-2">
            <BookOpenIcon className="size-4" />
            Editorial Publications
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            From The Fedoll Journal
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            Insights on contemporary tailoring, sustainable textile chemistry,
            and timeless wardrobe preservation from our atelier.
          </p>
        </div>

        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800 transition"
        >
          <span>View All Journal Stories</span>
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {previewBlogs.map((blog) => (
          <article
            key={blog.id}
            className="group flex flex-col rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Image */}
            <div className="relative h-52 overflow-hidden bg-stone-100">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-gray-900 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                {blog.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {blog.readTime}
                  </span>
                  <span>•</span>
                  <span>{blog.publishedAt}</span>
                </div>

                <Link to={`/blogs/${blog.id}`}>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-700 transition line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                </Link>

                <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="size-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-gray-800">
                    {blog.author.name}
                  </span>
                </div>

                <Link
                  to={`/blogs/${blog.id}`}
                  className="text-xs font-semibold text-orange-700 group-hover:translate-x-0.5 transition"
                >
                  Read &rarr;
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
