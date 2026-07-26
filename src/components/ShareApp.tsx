import { useState } from "react";

const APP_URL = "https://fresh-friendly-face.lovable.app";

type Lang = "en" | "sv" | "ar";

const MESSAGES: Record<Lang, { label: string; title: string; text: string }> = {
  en: {
    label: "English",
    title: "Haya Al-Salat — a peaceful Fajr companion",
    text: `Assalamu Alaikum! 🌙

I made a peaceful Fajr companion called Haya Al-Salat. It gently wakes you before dawn with Surat Al-Mu'minun by Mukhtar Al-Hajj and shows local prayer times.

Try it here: ${APP_URL}

If it blesses your morning, please share it with others. 🤲

Jazakum Allahu Khairan!`,
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

      <div className="mt-3 grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(MESSAGES.en.text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2.5 text-sm font-medium text-[#25D366] ring-1 ring-[#25D366]/30 transition hover:bg-[#25D366]/25"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.33c.001-5.45 4.434-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.134 1.585 5.929L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(MESSAGES.en.text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#229ED9]/15 px-4 py-2.5 text-sm font-medium text-[#229ED9] ring-1 ring-[#229ED9]/30 transition hover:bg-[#229ED9]/25"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.697.065-1.226-.46-1.901-.9-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Share on Telegram
        </a>
      </div>

      <p className="mt-2 min-h-[1.25rem] text-center text-xs text-muted-foreground" aria-live="polite">
        {status === "shared" && "Thank you for sharing 🤲"}
        {status === "copied" && "Message copied — paste it anywhere ✨"}
        {status === "error" && "Could not share. Please try again."}
      </p>
    </div>
  );
}
