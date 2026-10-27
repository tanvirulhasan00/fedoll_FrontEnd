import React from "react";
import { useAppSelector } from "~/redux/hooks/hook";
import {
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathRoundedSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function ValuePropsStrip() {
  const { valueProps } = useAppSelector((state) => state.home);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "TruckIcon":
        return <TruckIcon className="size-6 text-orange-700" />;
      case "ShieldCheckIcon":
        return <ShieldCheckIcon className="size-6 text-orange-700" />;
      case "ArrowPathRoundedSquareIcon":
        return <ArrowPathRoundedSquareIcon className="size-6 text-orange-700" />;
      case "SparklesIcon":
      default:
        return <SparklesIcon className="size-6 text-orange-700" />;
    }
  };

  if (!valueProps || valueProps.length === 0) return null;

  return (
    <section className="hidden sm:block bg-stone-50 dark:bg-neutral-900 border-y border-stone-200/80 dark:border-neutral-800 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {valueProps.map((prop) => (
            <div
              key={prop.id}
              className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white dark:hover:bg-neutral-800/80 hover:shadow-xs transition duration-200"
            >
              <div className="size-11 rounded-full bg-orange-100/70 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
                {getIcon(prop.icon)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {prop.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
