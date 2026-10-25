import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "~/redux/hooks/hook";
import { loadStoreSettings } from "~/redux/features/storeSettingsSlice";
import { normalizeGoogleDriveImageUrl } from "~/firebase";

/**
 * Dynamically synchronizes store settings, including setting the browser favicon
 * from a Google Drive share link or custom URL in real time.
 */
export function updateBrowserFavicon(rawUrl?: string | null) {
  if (typeof document === "undefined") return;

  const resolvedFavicon = rawUrl ? normalizeGoogleDriveImageUrl(rawUrl).trim() : "";
  const targetHref = resolvedFavicon || "/favicon.ico";

  // Check for existing icon links
  const existingIcons = document.querySelectorAll<HTMLLinkElement>(
    "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
  );

  if (existingIcons.length > 0) {
    existingIcons.forEach((link) => {
      link.href = targetHref;
    });
  } else {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = targetHref;
    document.head.appendChild(link);
  }
}

export default function StoreSettingsSync() {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.storeSettings);

  // Fetch latest settings from Firestore on application load
  useEffect(() => {
    dispatch(loadStoreSettings());
  }, [dispatch]);

  // Synchronize document favicon whenever the favicon URL changes
  useEffect(() => {
    updateBrowserFavicon(settings?.faviconUrl);
  }, [settings?.faviconUrl]);

  return null;
}
