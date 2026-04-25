"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${text.slice(0, 12)}…`;

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={copy}
      title={text}
      className="font-mono text-xs text-foreground/50 hover:text-foreground"
    >
      {copied ? "Copied!" : short}
    </button>
  );
}
