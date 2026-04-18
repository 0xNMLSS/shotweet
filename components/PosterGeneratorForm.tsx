"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type PosterSuccess = {
  ok: true;
  asset: {
    downloadUrl: string;
    filename: string;
  };
};

type PosterError = {
  ok: false;
  message: string;
};

export default function PosterGeneratorForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [loadingPhase, setLoadingPhase] = useState<"tweet" | "render">("tweet");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (status !== "loading") return;
    setLoadingPhase("tweet");
    const id = window.setTimeout(() => setLoadingPhase("render"), 600);
    return () => window.clearTimeout(id);
  }, [status]);

  const resetToIdle = () => {
    setStatus("idle");
    setErrorMessage("");
  };

  const generateAnother = () => {
    setStatus("idle");
    setErrorMessage("");
    setPreviewSrc("");
    setDownloadUrl("");
    setFilename("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await res.json()) as PosterSuccess | PosterError;

      if (!res.ok || !data.ok) {
        const message =
          "message" in data && data.message
            ? data.message
            : "Failed to render poster.";
        setErrorMessage(message);
        setStatus("error");
        return;
      }

      setPreviewSrc(data.asset.downloadUrl);
      setDownloadUrl(data.asset.downloadUrl);
      setFilename(data.asset.filename);
      setStatus("success");
    } catch {
      setErrorMessage("Failed to render poster.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-6">
        <div className="inline-block w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Generated poster"
            className="w-full rounded-xl border border-zinc-800"
            src={previewSrc}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a
            className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-zinc-950"
            download={filename}
            href={downloadUrl}
          >
            Download PNG
          </a>
          <button
            className="text-sm font-medium text-sky-400 underline underline-offset-4"
            onClick={generateAnother}
            type="button"
          >
            Generate another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        aria-label="Tweet URL"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 disabled:opacity-60"
        disabled={status === "loading"}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://x.com/username/status/1234567890"
        type="url"
        value={url}
      />

      {status === "loading" && (
        <div className="flex items-center gap-3 text-zinc-400">
          <span
            aria-hidden
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-sky-500"
          />
          <span>
            {loadingPhase === "tweet"
              ? "Loading tweet..."
              : "Rendering poster..."}
          </span>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          Generate
        </button>
        {status === "error" && (
          <button
            className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-200"
            onClick={resetToIdle}
            type="button"
          >
            Try again
          </button>
        )}
      </div>
    </form>
  );
}
