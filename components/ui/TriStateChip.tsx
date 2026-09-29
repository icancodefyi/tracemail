"use client";

import React from "react";
import { CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";

export type TriStateType = "SECURE" | "VULNERABLE" | "NOT-OBSERVABLE";

interface TriStateChipProps {
  state: TriStateType | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function TriStateChip({
  state,
  size = "md",
  showIcon = true,
  className = "",
}: TriStateChipProps) {
  const normalized = (state || "").toUpperCase() as TriStateType;

  const config = {
    SECURE: {
      label: "SECURE",
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    VULNERABLE: {
      label: "VULNERABLE",
      icon: <AlertOctagon className="h-3 w-3 text-rose-600 shrink-0" />,
      classes: "bg-rose-50 text-rose-700 border-rose-200",
    },
    "NOT-OBSERVABLE": {
      label: "NOT-OBSERVABLE",
      icon: <HelpCircle className="h-3 w-3 text-slate-500 shrink-0" />,
      classes:
        "bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_4px,#f1f5f9_4px,#f1f5f9_8px)] text-slate-700 border-slate-300",
    },
  };

  const current = config[normalized] || config["NOT-OBSERVABLE"];
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono font-bold tracking-tight select-none ${sizeClasses} ${current.classes} ${className}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
}
