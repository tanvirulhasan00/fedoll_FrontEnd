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
import { useAppDispatch } from "~/redux/hooks/hook";
import {
  fetchHomeData,
  setSpotlightBanners,
  setHomeProducts,
} from "~/redux/features/homeSlice";
import { fetchBlogs, setBlogs } from "~/redux/features/blogSlice";
import {
  fetchProducts,
  fetchProductCategories,
  setProductCategories,
  setProducts,
} from "~/redux/features/productSlice";
import {
  subscribeToCategoriesFromFirestore,
  subscribeToSpotlightBannersFromFirestore,
  subscribeToProductsFromFirestore,
  subscribeToBlogsFromFirestore,
} from "~/firebase";

const Home = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Fetch all dynamic data from Firebase Firestore
    dispatch(fetchHomeData());
    dispatch(fetchBlogs());
    dispatch(fetchProducts());
    dispatch(fetchProductCategories());

    // Subscribe to realtime category updates
    const unsubscribeCategories = subscribeToCategoriesFromFirestore((liveCats) => {
      dispatch(setProductCategories(liveCats));
    });

    // Subscribe to realtime campaign spotlight banners
    const unsubscribeSpotlight = subscribeToSpotlightBannersFromFirestore((liveBanners) => {
      dispatch(setSpotlightBanners(liveBanners));
    });

    // Subscribe to realtime product catalog updates
    const unsubscribeProducts = subscribeToProductsFromFirestore((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        dispatch(setProducts(liveProducts));
        dispatch(setHomeProducts(liveProducts));
      }
    });

    // Subscribe to realtime style journal articles
    const unsubscribeBlogs = subscribeToBlogsFromFirestore((liveBlogs) => {
      if (liveBlogs && liveBlogs.length > 0) {
        dispatch(setBlogs(liveBlogs));
      }
    });

    return () => {
      unsubscribeCategories();
      unsubscribeSpotlight();
      unsubscribeProducts();
      unsubscribeBlogs();
    };
  }, [dispatch]);

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

        {/* Community #SilkenDriftStyle UGC Gallery */}
        <CommunityGallery />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
