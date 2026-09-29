"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";

interface RuleChipProps {
  ruleId: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function RuleChip({ ruleId, onClick, href, className = "" }: RuleChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ruleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const badgeContent = (
    <span
      className={`group inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer ${className}`}
      onClick={onClick}
      title={`Rule ${ruleId} — Click to inspect`}
    >
      <span>{ruleId}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
        title="Copy rule ID"
        aria-label={`Copy ${ruleId}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600" />
        ) : (
          <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
        )}
      </button>
    </span>
  );

  if (href) {
    return <Link href={href}>{badgeContent}</Link>;
  }

  return badgeContent;
}
