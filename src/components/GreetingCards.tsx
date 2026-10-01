import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import octoberCard from "@/assets/october-greeting-card.jpeg.asset.json";

const CARD_TITLE = "It’s October again";
const CARD_FILENAME = "haya-al-salat-october-greeting.jpeg";

export function GreetingCards() {
  const [status, setStatus] = useState<"idle" | "shared" | "downloaded" | "error">("idle");

  const getCardFile = async () => {
    const response = await fetch(octoberCard.url);
    if (!response.ok) throw new Error("The greeting card could not be loaded.");
    return new File([await response.blob()], CARD_FILENAME, { type: "image/jpeg" });
  };

  const shareCard = async () => {
    try {
      const file = await getCardFile();
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: CARD_TITLE,
          text: "Wishing you a peaceful and beautiful October.",
          files: [file],
        });
        setStatus("shared");
      } else if (navigator.share) {
        await navigator.share({ title: CARD_TITLE, url: new URL(octoberCard.url, window.location.origin).href });
        setStatus("shared");
      } else {
        await navigator.clipboard.writeText(new URL(octoberCard.url, window.location.origin).href);
        setStatus("shared");
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setStatus("error");
    }
  };

  const downloadCard = async () => {
    try {
      const file = await getCardFile();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = CARD_FILENAME;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setStatus("downloaded");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section aria-labelledby="greeting-cards-title">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Share a kind thought</p>
          <h2 id="greeting-cards-title" className="font-display text-xl">Greeting Cards</h2>
        </div>
        <span className="text-xs text-muted-foreground">October</span>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <img
          src={octoberCard.url}
          alt="Warm autumn greeting card reading It’s October again, with coffee, leaves, and a journal"
          className="aspect-[3/4] w-full object-cover"
          loading="lazy"
        />
        <div className="flex items-center justify-between gap-3 p-3">
          <p className="min-w-0 text-sm font-medium text-card-foreground">{CARD_TITLE}</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="icon" variant="outline" onClick={downloadCard} aria-label="Download October greeting card" title="Download card">
              <Download />
            </Button>
            <Button type="button" size="icon" onClick={shareCard} aria-label="Share October greeting card" title="Share card">
              <Share2 />
            </Button>
          </div>
        </div>
      </article>

      <p className="mt-2 min-h-4 text-center text-xs text-muted-foreground" aria-live="polite">
        {status === "shared" && "Greeting card ready to share."}
        {status === "downloaded" && "Greeting card downloaded."}
        {status === "error" && "The card could not be shared. Please try again."}
      </p>
    </section>
  );
}