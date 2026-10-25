import React from "react";
import { useAppSelector } from "~/redux/hooks/hook";
import { StarIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";

export default function TestimonialsSection() {
  const { testimonials } = useAppSelector((state) => state.home);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-stone-50 dark:bg-neutral-900/60 border-y border-stone-200/80 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-orange-500">
            Customer Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mt-2">
            Loved by Customers Across Bangladesh
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
            Real reviews from people wearing SilkenDrift clothes in Dhaka, Chittagong,
            Sylhet, and all across Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test) => (
            <div
              key={test.id}
              className="flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-neutral-800/80 border border-gray-200/90 dark:border-neutral-700/80 shadow-xs hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex gap-1 text-amber-500">
                  {[...Array(test.rating)].map((_, i) => (
                    <StarIcon key={i} className="size-4 fill-current" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 dark:text-neutral-300 text-sm leading-relaxed italic">
                  "{test.comment}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="size-11 rounded-full object-cover ring-2 ring-orange-600/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {test.name}
                      </h4>
                      <CheckBadgeIcon className="size-4 text-emerald-600" title="Verified Buyer" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {test.role} • {test.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
