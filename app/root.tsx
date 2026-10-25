import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
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
