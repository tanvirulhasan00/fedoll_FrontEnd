import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "next-themes";
import ErrorPage from "./components/main/Utilities/ErrorPage";
import { ReduxProvider } from "~/redux/ReduxProvider";
import { Toaster } from "~/components/ui/sonner";
import StoreSettingsSync from "~/components/main/Utilities/StoreSettingsSync";
import {
  defaultStoreSettings,
  fetchStoreSettings,
  normalizeGoogleDriveImageUrl,
} from "~/firebase";

const DEFAULT_FAVICON =
  normalizeGoogleDriveImageUrl(defaultStoreSettings.faviconUrl) ||
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23ea580c'/%3E%3Cpath d='M20 11c-1.5-1.5-6.5-1.5-7.5 1s9 3.5 8 7-7 3-9 1' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

export async function loader() {
  const settings = await fetchStoreSettings();
  return { settings };
}

/**
 * Prevent React Router from re-fetching root store settings on standard page navigations.
 * Settings are cached and persistent; skipping this eliminates the blocking server roundtrip
 * and makes client-side page transitions instantaneous.
 */
export function shouldRevalidate({
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (!formMethod || formMethod === "GET") {
    return false;
  }
  return defaultShouldRevalidate;
}

/**
 * Sleek top-of-viewport loading bar for immediate visual feedback during route changes
 */
function NavigationProgressBar() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  if (!isNavigating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
    >
      <div className="h-0.5 sm:h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 shadow-xs shadow-orange-500/50 animate-pulse" />
    </div>
  );
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: DEFAULT_FAVICON },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="silkendrift-theme"
        >
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ReduxProvider>
      <NavigationProgressBar />
      <StoreSettingsSync initialSettings={loaderData?.settings} />
      <Outlet />
      <Toaster position="top-right" richColors />
    </ReduxProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status: number | undefined;
  let title = "Oops!";
  let message = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? "404" : `Error ${error.status}`;
    message =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || message;
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  return (
    <ErrorPage status={status} title={title} message={message} stack={stack} />
  );
}
