import { useState } from "react";

const APP_URL = "https://fresh-friendly-face.lovable.app";

type Lang = "en" | "sv" | "ar" | "tr";

const MESSAGES: Record<Lang, { label: string; title: string; text: string }> = {
  en: {
    label: "English",
    title: "Haya Al-Salat — a peaceful Fajr companion",
    text: `Assalamu Alaikum! 🌙

I wanted to share Haya Al-Salat — a peaceful Fajr companion that gently wakes you before dawn with the beautiful recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj, so you begin your day with remembrance of Allah.

Try it here: ${APP_URL}`,
  },
  sv: {
    label: "Svenska",
    title: "Haya Al-Salat — en fridfull Fajr-följeslagare",
    text: `Assalamu Alaikum! 🌙

Jag vill dela Haya Al-Salat — en fridfull Fajr-följeslagare som väcker dig mjukt före gryningen med den vackra recitationen av Surat Al-Mu'minun av Mukhtar Al-Hajj, så att du börjar dagen med Allahs åminnelse.

Prova här: ${APP_URL}`,
  },
  ar: {
    label: "العربية",
    title: "حيّ على الصلاة — رفيق هادئ لصلاة الفجر",
    text: `السلام عليكم ورحمة الله وبركاته 🌙

أشارككم تطبيق حيّ على الصلاة — رفيق هادئ يوقظك برفق قبل الفجر بتلاوة عذبة لسورة المؤمنون بصوت الشيخ مختار الحاج، لتبدأ يومك بذكر الله.

جرّبه هنا: ${APP_URL}`,
  },
  tr: {
    label: "Türkçe",
    title: "Haya Al-Salat — huzurlu bir Fajr yoldaşı",
    text: `Esselamu Aleykum! 🌙

Haya Al-Salat'ı paylaşmak istedim — Muhtar El-Hac'ın güzel sesiyle Mü'minûn Sûresi tilavetiyle sizi Fajr'dan önce nazikçe uyandıran huzurlu bir yoldaş. Güne Allah'ı zikrederek başlarsınız.

Buradan deneyin: ${APP_URL}`,
  },
};

export function ShareApp() {
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const msg = MESSAGES[lang];

  const handleShare = async () => {
    const payload = { title: msg.title, text: msg.text, url: APP_URL };
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav && typeof nav.share === "function") {
        await nav.share(payload);
        setStatus("shared");
        return;
      }
      await nav.clipboard.writeText(msg.text);
      setStatus("copied");
    } catch (err) {
      // User cancelled share sheet — don't treat as error
      if ((err as Error)?.name === "AbortError") {
        setStatus("idle");
        return;
      }
      try {
        await navigator.clipboard.writeText(`${msg.text}`);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
    }
    setTimeout(() => setStatus("idle"), 2600);
  };

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5 backdrop-blur-sm">
      <h3 className="font-serif text-lg text-amber-100/90">Share Haya Al-Salat</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Send a heartfelt invitation to family and friends in their language.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Message language">
        {(Object.keys(MESSAGES) as Lang[]).map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={lang === code}
            onClick={() => setLang(code)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              lang === code
                ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {MESSAGES[code].label}
          </button>
        ))}
      </div>

      <pre
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-3 text-xs leading-relaxed text-amber-50/80 ring-1 ring-white/5"
      >
        {msg.text}
      </pre>

      <button
        type="button"
        onClick={handleShare}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500/90 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share the app
      </button>

      <p className="mt-2 min-h-[1.25rem] text-center text-xs text-muted-foreground" aria-live="polite">
        {status === "shared" && "Thank you for sharing 🤲"}
        {status === "copied" && "Message copied — paste it anywhere ✨"}
        {status === "error" && "Could not share. Please try again."}
      </p>
    </div>
  );
}
