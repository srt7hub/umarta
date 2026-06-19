"use client";

import { useState } from "react";

export function EventLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/event/${token}`;

  async function copy() {
    const full = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <span className="text-sm text-stone-500">Ссылка для клиента:</span>
      <a
        href={path}
        target="_blank"
        className="text-sm font-medium text-brand-700 hover:text-brand-800 truncate"
      >
        {path}
      </a>
      <button
        onClick={copy}
        className="ml-auto rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
      >
        {copied ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}
