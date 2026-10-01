import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import octoberCard from "@/assets/october-greeting-card.jpeg.asset.json";
import coffeeCard from "@/assets/greeting-cards/coffee-moment.jpg.asset.json";

type Card = { id: string; title: string; text: string; url: string; filename: string; alt: string };

const CARDS: Card[] = [
  {
    id: "october",
    title: "It’s October again",
    text: "Wishing you a peaceful and beautiful October.",
    url: octoberCard.url,
    filename: "haya-al-salat-october-greeting.jpeg",
    alt: "Warm autumn greeting card reading It’s October again, with coffee, leaves, and a journal",
  },
  {
    id: "coffee",
    title: "A calm coffee moment",
    text: "Wishing you a calm and blessed day ☕",
    url: coffeeCard.url,
    filename: "haya-al-salat-coffee-moment.jpg",
    alt: "Cappuccino with latte art on a wooden table next to a laptop",
  },
];

export function GreetingCards() {
  const [status, setStatus] = useState<"idle" | "shared" | "downloaded" | "error">("idle");

  const getFile = async (card: Card) => {
    const response = await fetch(card.url);
    if (!response.ok) throw new Error("The greeting card could not be loaded.");
    return new File([await response.blob()], card.filename, { type: "image/jpeg" });
  };

  const shareCard = async (card: Card) => {
    try {
      const file = await getFile(card);
      const href = new URL(card.url, window.location.origin).href;
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: card.title, text: card.text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: card.title, url: href });
      } else {
        await navigator.clipboard.writeText(href);
      }
      setStatus("shared");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setStatus("error");
    }
  };

  const downloadCard = async (card: Card) => {
    try {
      const file = await getFile(card);
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = card.filename;
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
        <span className="text-xs text-muted-foreground">{CARDS.length} cards</span>
      </div>

      <div className="space-y-4">
        {CARDS.map((card) => (
          <article key={card.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <img src={card.url} alt={card.alt} className="aspect-[3/4] w-full object-cover" loading="lazy" />
            <div className="flex items-center justify-between gap-3 p-3">
              <p className="min-w-0 text-sm font-medium text-card-foreground">{card.title}</p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="icon" variant="outline" onClick={() => downloadCard(card)} aria-label={`Download ${card.title}`} title="Download card">
                  <Download />
                </Button>
                <Button type="button" size="icon" onClick={() => shareCard(card)} aria-label={`Share ${card.title}`} title="Share card">
                  <Share2 />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-2 min-h-4 text-center text-xs text-muted-foreground" aria-live="polite">
        {status === "shared" && "Greeting card ready to share."}
        {status === "downloaded" && "Greeting card downloaded."}
        {status === "error" && "The card could not be shared. Please try again."}
      </p>
    </section>
  );
}
