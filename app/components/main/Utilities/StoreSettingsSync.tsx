import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import {
  loadStoreSettings,
  setStoreSettings,
} from "~/redux/features/storeSettingsSlice";
import {
  defaultStoreSettings,
  normalizeGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  type StoreGeneralSettings,
} from "~/firebase";

export const DEFAULT_FAVICON =
  normalizeGoogleDriveImageUrl(defaultStoreSettings.faviconUrl, 64) ||
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23ea580c'/%3E%3Cpath d='M20 11c-1.5-1.5-6.5-1.5-7.5 1s9 3.5 8 7-7 3-9 1' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

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
 * from a Google Drive share link or custom URL in real time.
 */
export function updateBrowserFavicon(rawUrl?: string | null) {
  if (typeof document === "undefined") return;

  if (!rawUrl || !rawUrl.trim()) {
    setFaviconHref(DEFAULT_FAVICON);
    return;
  }

  const fileId = extractGoogleDriveFileId(rawUrl);
  // If it's a Google Drive link, the direct lh3 CDN endpoint with =w64 provides instant HTTP 200 + CORS
  const primaryUrl = fileId
    ? `https://lh3.googleusercontent.com/d/${fileId}=w64`
    : normalizeGoogleDriveImageUrl(rawUrl, 64).trim();

  const fallbackUrl = fileId
    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w64`
    : "";

  // Pre-load icon to verify image validity before swapping the browser tab icon
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    setFaviconHref(primaryUrl);
  };
  img.onerror = () => {
    if (fallbackUrl) {
      const fallbackImg = new Image();
      fallbackImg.referrerPolicy = "no-referrer";
      fallbackImg.onload = () => {
        setFaviconHref(fallbackUrl);
      };
      fallbackImg.onerror = () => {
        setFaviconHref(DEFAULT_FAVICON);
      };
      fallbackImg.src = fallbackUrl;
    } else {
      setFaviconHref(DEFAULT_FAVICON);
    }
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
