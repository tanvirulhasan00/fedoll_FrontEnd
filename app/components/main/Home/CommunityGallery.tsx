import React from "react";
import { FaInstagram } from "react-icons/fa6";

const GALLERY_ITEMS = [
  {
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    tag: "@tanvir.dhaka",
    look: "Casual Oxford Shirt & Chino Pants",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
    tag: "@zainab.style",
    look: "Export Quality Cotton Jacket",
  },
  {
    image:
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=600&q=80",
    tag: "@fahim_bd",
    look: "Classic Denim Trucker Jacket",
  },
  {
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
    tag: "@sara.daily",
    look: "Comfort Fit Heavyweight Hoodie",
  },
];

export default function CommunityGallery() {
  return (
    <section className="py-16 sm:py-20 border-t border-stone-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-700 mb-2">
              <FaInstagram className="size-4" />
              #FedollStyle
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Fedoll Community Style
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Tag @fedoll on Instagram or Facebook to get featured on our website.
            </p>
          </div>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-orange-700 hover:text-orange-800 transition"
          >
            Follow @fedoll on Instagram &rarr;
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GALLERY_ITEMS.map((item, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-stone-100 shadow-xs"
            >
              <img
                src={item.image}
                alt={item.look}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <span className="text-xs font-bold flex items-center gap-1 text-orange-400">
                  <FaInstagram /> {item.tag}
                </span>
                <span className="text-[11px] text-stone-200 mt-0.5 line-clamp-1">
                  {item.look}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
