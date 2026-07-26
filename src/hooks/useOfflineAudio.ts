import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_NAME = "haya-recitation-v1";

type Status = "checking" | "not-cached" | "downloading" | "cached" | "error";

export function useOfflineAudio(url: string) {
  const [status, setStatus] = useState<Status>("checking");
  const [progress, setProgress] = useState(0);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Check cache on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof caches === "undefined") {
        setStatus("not-cached");
        return;
      }
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (cancelled) return;
        if (match) {
          const blob = await match.blob();
          if (cancelled) return;
          const bUrl = URL.createObjectURL(blob);
          blobUrlRef.current = bUrl;
          setLocalUrl(bUrl);
          setStatus("cached");
        } else {
          setStatus("not-cached");
        }
      } catch {
        if (!cancelled) setStatus("not-cached");
      }
    })();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [url]);

  const download = useCallback(async () => {
    if (typeof caches === "undefined") {
      setStatus("error");
      return;
    }
    setStatus("downloading");
    setProgress(0);
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok || !res.body) throw new Error("fetch failed");
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.round((received / total) * 100));
        }
      }
      const blob = new Blob(chunks as BlobPart[], {
        type: res.headers.get("content-type") || "audio/mpeg",
      });
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        url,
        new Response(blob, {
          headers: {
            "Content-Type": blob.type,
            "Content-Length": String(blob.size),
          },
        })
      );
      const bUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = bUrl;
      setLocalUrl(bUrl);
      setProgress(100);
      setStatus("cached");
    } catch {
      setStatus("error");
    }
  }, [url]);

  const clear = useCallback(async () => {
    if (typeof caches === "undefined") return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setLocalUrl(null);
      setProgress(0);
      setStatus("not-cached");
    } catch {
      /* ignore */
    }
  }, [url]);

  return { status, progress, localUrl, download, clear };
}
