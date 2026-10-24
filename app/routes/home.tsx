import React, { useEffect } from "react";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import HeroSlider from "~/components/main/Home/HeroSlider";
import ValuePropsStrip from "~/components/main/Home/ValuePropsStrip";
import FeaturedCategories from "~/components/main/Home/FeaturedCategories";
import ProductShowcase from "~/components/main/Home/ProductShowcase";
import SpotlightSection from "~/components/main/Home/SpotlightSection";
import TestimonialsSection from "~/components/main/Home/TestimonialsSection";
import JournalPreviewSection from "~/components/main/Home/JournalPreviewSection";
import CommunityGallery from "~/components/main/Home/CommunityGallery";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { fetchHomeData, seedHomeData } from "~/redux/features/homeSlice";
import { fetchBlogs } from "~/redux/features/blogSlice";
import { fetchProducts, fetchProductCategories } from "~/redux/features/productSlice";
import { ArrowPathIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

const Home = () => {
  const dispatch = useAppDispatch();
  const { syncing, loading } = useAppSelector((state) => state.home);

  useEffect(() => {
    // Fetch all dynamic data from Firebase Firestore
    dispatch(fetchHomeData());
    dispatch(fetchBlogs());
    dispatch(fetchProducts());
    dispatch(fetchProductCategories());
  }, [dispatch]);

  const handleSyncFirebase = async () => {
    try {
      await dispatch(seedHomeData(true)).unwrap();
      toast.success("Home page data synchronized with Cloud Firestore!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync with Firebase");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Navigation Layer */}
      <Topbar />
      <Header />

      {/* Main Home Page Body */}
      <main className="flex-1">
        {/* Dynamic Hero Slider from Firebase */}
        <HeroSlider />

        {/* Value Propositions Trust Strip from Firebase */}
        <ValuePropsStrip />

        {/* Featured Categories Showcase from Firebase */}
        <FeaturedCategories />

        {/* Interactive Product Showcase & Quick View from Firebase */}
        <ProductShowcase />

        {/* Campaign Spotlight Banner with Promo Code from Firebase */}
        <SpotlightSection />

        {/* Customer Testimonials & Reviews from Firebase */}
        <TestimonialsSection />

        {/* Latest Journal Stories Preview from Firebase blogs */}
        <JournalPreviewSection />

        {/* Community #FedollStyle UGC Gallery */}
        <CommunityGallery />

        {/* Live Firebase Sync Floating Indicator / Utility Pill */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between border-t border-stone-200/60 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected to Cloud Firestore (Real-Time Database)</span>
          </div>

          <button
            type="button"
            onClick={handleSyncFirebase}
            disabled={syncing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-stone-50 hover:bg-stone-100 hover:text-orange-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh or re-sync all home datasets with Firebase"
          >
            <ArrowPathIcon
              className={`size-3.5 ${syncing ? "animate-spin text-orange-600" : ""}`}
            />
            <span>{syncing ? "Syncing..." : "Sync Home Data to Firebase"}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
