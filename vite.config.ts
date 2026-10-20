import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: [
      "@headlessui/react",
      "@heroicons/react/24/outline",
      "@heroicons/react/24/solid",
      "@reduxjs/toolkit",
      "clsx",
      "cn",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
      "firebase/analytics",
      "lucide-react",
      "next-themes",
      "react-aria-components",
      "react-icons/fa",
      "react-icons/fa6",
      "react-redux",
      "sonner",
    ],
  },
});

