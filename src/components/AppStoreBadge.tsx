import { useEffect, useState } from "react";

const APP_STORE_URL = "https://apps.apple.com/app/haya-al-salat/id6798356413";

export function AppStoreBadge() {
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));
  }, []);

  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download Haya Al-Salat on the App Store"
      className="inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 text-white shadow-lg ring-1 ring-white/10 transition hover:scale-[1.02] hover:bg-black/90 active:scale-[0.98]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.84-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <div className="text-left leading-none">
        <p className="text-[10px] font-medium opacity-80">Download on the</p>
        <p className="text-lg font-semibold tracking-tight">App Store</p>
      </div>
      {isIos && (
        <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium">
          iOS
        </span>
      )}
    </a>
  );
}
