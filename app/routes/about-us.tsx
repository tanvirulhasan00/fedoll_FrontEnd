import React, { useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/about-us";
import Topbar from "~/components/main/Home/Topbar";
import Header from "~/components/main/Home/Header";
import Footer from "~/components/main/Home/Footer";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { fetchAboutData, seedAboutData } from "~/redux/features/aboutSlice";
import {
  SparklesIcon,
  GlobeAmericasIcon,
  CubeTransparentIcon,
  HeartIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Fedoll - Architectural Sartorial Atelier" },
    {
      name: "description",
      content:
        "Learn about Fedoll's mission, heirloom tailoring principles, Okayama shuttle-loom denim, and Biella double-faced wool craftsmanship.",
    },
  ];
}

export default function AboutUsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, syncing } = useAppSelector((state) => state.about);

  useEffect(() => {
    dispatch(fetchAboutData());
  }, [dispatch]);

  const handleSyncFirebase = async () => {
    try {
      await dispatch(seedAboutData(true)).unwrap();
      toast.success("About Us data re-synchronized with Firebase Firestore!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to sync with Firebase");
    }
  };

  const getPillarIcon = (iconName: string) => {
    switch (iconName) {
      case "CubeTransparentIcon":
        return <CubeTransparentIcon className="size-6 text-orange-700" />;
      case "GlobeAmericasIcon":
        return <GlobeAmericasIcon className="size-6 text-orange-700" />;
      case "HeartIcon":
        return <HeartIcon className="size-6 text-orange-700" />;
      case "SparklesIcon":
      default:
        return <SparklesIcon className="size-6 text-orange-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Topbar />
      <Header />

      <main className="flex-1">
        {/* Editorial Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 via-orange-50/20 to-white border-b border-stone-200/60 py-16 sm:py-24">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-4">
                  <BuildingLibraryIcon className="size-4 text-orange-700" />
                  {data?.tagline || "Our Atelier & Philosophy"}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                  Architectural Precision. <br />
                  <span className="text-orange-700 italic font-serif">
                    Heirloom Longevity.
                  </span>
                </h1>
                <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
                  {data?.subtitle}
                </p>
              </div>

              {/* Live Firebase Cloud Firestore Status */}
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dynamic Cloud Firestore Content
                </div>
                <button
                  type="button"
                  onClick={handleSyncFirebase}
                  disabled={syncing || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:border-orange-500 hover:text-orange-700 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Resync data directly with Firebase"
                >
                  <ArrowPathIcon
                    className={`size-3.5 ${syncing ? "animate-spin text-orange-600" : ""}`}
                  />
                  {syncing ? "Syncing..." : "Sync with Firebase"}
                </button>
              </div>
            </div>

            {/* Hero Atelier Banner Image */}
            <div className="mt-12 relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 aspect-21/9 bg-stone-100">
              <img
                src={data?.heroImage}
                alt="Fedoll Atelier"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white text-xs sm:text-sm font-medium">
                The Okayama Shuttle Loom Studio & Biella Wool Atelier
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission & Craft Story */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
                The Founding Conviction
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
                {data?.missionHeading}
              </h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                {data?.missionParagraph1}
              </p>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                {data?.missionParagraph2}
              </p>

              <div className="pt-4 flex items-center gap-6">
                <div className="border-l-2 border-orange-700 pl-4">
                  <p className="text-2xl font-bold text-gray-900">2021</p>
                  <p className="text-xs text-gray-500">Founded in Okayama</p>
                </div>
                <div className="border-l-2 border-orange-700 pl-4">
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-xs text-gray-500">Synthetic Fillers</p>
                </div>
                <div className="border-l-2 border-orange-700 pl-4">
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-xs text-gray-500">Conscious Provenance</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200">
                <img
                  src={data?.atelierImage}
                  alt="Crafting garments"
                  className="w-full h-[460px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white border border-stone-200 p-4 rounded-2xl shadow-lg hidden sm:flex items-center gap-3 max-w-xs">
                <CheckBadgeIcon className="size-8 text-orange-700 shrink-0" />
                <p className="text-xs text-gray-700 font-semibold leading-tight">
                  Hand-inspected by master tailors before every delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* By The Numbers (Stats Strip) */}
        <section className="bg-stone-900 text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {data?.stats?.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition duration-300"
                >
                  <span className="text-4xl sm:text-5xl font-extrabold text-orange-500 font-serif">
                    {stat.value}
                  </span>
                  <h4 className="mt-3 text-base font-bold text-white">
                    {stat.label}
                  </h4>
                  <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Pillars / Values */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
              Our Foundations
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
              Four Tenets of Fedoll Craftsmanship
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              How our design philosophy governs every pattern cut, fabric grain,
              and stitch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data?.values?.map((val) => (
              <div
                key={val.id}
                className="p-8 rounded-3xl bg-stone-50/60 border border-stone-200/80 hover:bg-white hover:shadow-lg transition duration-300 flex items-start gap-5"
              >
                <div className="size-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                  {getPillarIcon(val.icon)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {val.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Milestone Timeline */}
        <section className="py-16 sm:py-20 bg-stone-50 border-y border-stone-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
                The Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
                Milestones in Sartorial Precision
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {data?.milestones?.map((m, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs relative"
                >
                  <span className="text-2xl font-black text-orange-700 font-serif">
                    {m.year}
                  </span>
                  <h4 className="mt-2 text-base font-bold text-gray-900 leading-snug">
                    {m.title}
                  </h4>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Atelier Team */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
                The Craftsmen & Leadership
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mt-2">
                Stewards of the Fedoll Atelier
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-md">
              Bringing together patternmakers, denim historians, and supply-chain
              pioneers committed to circular longevity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {data?.team?.map((member) => (
              <div
                key={member.id}
                className="group rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-4/5 overflow-hidden bg-stone-100">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {member.name}
                    </h3>
                    <p className="text-xs text-orange-700 font-semibold mt-0.5">
                      {member.role}
                    </p>
                    <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Physical Atelier & Concierge Details */}
        <section className="py-16 bg-stone-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                  Visit & Consult
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Our Flagship Atelier & Advisory Concierge
                </h2>
                <p className="text-stone-300 text-sm leading-relaxed max-w-lg">
                  Whether you are seeking bespoke sizing consultation, fabric care
                  advice, or an in-person atelier appointment, our stylists are
                  at your service.
                </p>

                <div className="pt-4 space-y-3 text-xs text-stone-300">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="size-5 text-orange-400 shrink-0" />
                    <span>{data?.contact?.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="size-5 text-orange-400 shrink-0" />
                    <Link
                      to={`mailto:${data?.contact?.email}`}
                      className="hover:underline"
                    >
                      {data?.contact?.email}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="size-5 text-orange-400 shrink-0" />
                    <span>{data?.contact?.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="size-5 text-orange-400 shrink-0" />
                    <span>{data?.contact?.hours}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                  <img
                    src={data?.craftImage}
                    alt="Atelier loom"
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6 text-center">
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-white uppercase tracking-wider">
                        Explore Our Finished Collections
                      </p>
                      <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs tracking-wide shadow-lg transition cursor-pointer"
                      >
                        <span>Shop The Storefront</span>
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </div>
                  </div>
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
