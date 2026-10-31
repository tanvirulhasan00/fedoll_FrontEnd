import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  loadStoreSettings,
  setStoreSettings,
} from "~/redux/features/storeSettingsSlice";
import {
  type StoreGeneralSettings,
} from "~/firebase";

export const DEFAULT_FAVICON = "/favicon.ico";

function setFaviconHref(targetHref: string) {
  if (typeof document === "undefined") return;

  const existingIcons = document.querySelectorAll<HTMLLinkElement>(
    "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
  );

  if (existingIcons.length > 0) {
    existingIcons.forEach((link) => {
      if (link.getAttribute("href") !== targetHref && link.href !== targetHref) {
        link.href = targetHref;
      }
    });
  } else {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = targetHref;
    document.head.appendChild(link);
  }
}

/**
 * Dynamically synchronizes store settings, including setting the browser favicon
 * from the local public folder asset or custom URL.
 */
export function updateBrowserFavicon(rawUrl?: string | null) {
  if (typeof document === "undefined") return;

  // Enforce local public favicon over Google Drive URLs
  if (
    !rawUrl ||
    !rawUrl.trim() ||
    rawUrl.includes("drive.google.com") ||
    rawUrl.includes("googleusercontent.com") ||
    rawUrl.includes("favicon.ico")
  ) {
    setFaviconHref(DEFAULT_FAVICON);
    return;
  }

  const primaryUrl = rawUrl.trim();
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    setFaviconHref(primaryUrl);
  };
  img.onerror = () => {
    setFaviconHref(DEFAULT_FAVICON);
  };
  img.src = primaryUrl;
}

export default function StoreSettingsSync({
  initialSettings,
}: {
  initialSettings?: StoreGeneralSettings;
}) {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.storeSettings);

  // Synchronize initial settings if provided from loader
  useEffect(() => {
    if (initialSettings) {
      dispatch(setStoreSettings(initialSettings));
    } else {
      dispatch(loadStoreSettings());
    }
  }, [dispatch, initialSettings]);

  // Synchronize document favicon whenever the favicon URL changes
  useEffect(() => {
    updateBrowserFavicon(settings?.faviconUrl);
  }, [settings?.faviconUrl]);

  return null;
}
