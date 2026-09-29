"use client";

import React, { useState } from "react";
import { ChevronDown, Info, ShieldAlert, ShieldCheck } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  ciLow: number;
  ciHigh: number;
  grade: string;
  confidence?: number; // 0.0 to 1.0 (default e.g. 0.71 or calculated)
  size?: "hero" | "compact" | "card";
  className?: string;
  showWhyExpander?: boolean;
}

export function ScoreDisplay({
  score,
  ciLow,
  ciHigh,
  grade,
  confidence = 0.71,
  size = "hero",
  className = "",
  showWhyExpander = true,
}: ScoreDisplayProps) {
  const [whyOpen, setWhyOpen] = useState(false);

  // Grade color scheme
  const isHighGrade = grade.startsWith("Grade A") || score >= 80;
  const isMidGrade = grade.startsWith("Grade B") || (score >= 60 && score < 80);

  const gradeBadgeClass = isHighGrade
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isMidGrade
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  const roundedScore = Number(score).toFixed(1);
  const roundedLow = Number(ciLow).toFixed(1);
  const roundedHigh = Number(ciHigh).toFixed(1);
  const formattedConfidence = Number(confidence).toFixed(2);
  const spread = Math.abs(ciHigh - ciLow);

  if (size === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 font-mono ${className}`}>
        <span className="font-bold text-slate-900">{roundedScore}</span>
        <span className="text-xs text-slate-500">[{roundedLow}–{roundedHigh}]</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeBadgeClass}`}>
          {grade}
        </span>
        <span className="text-[11px] text-slate-400">conf {formattedConfidence}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Bayesian Cryptographic Posture Index
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-5xl font-black tracking-tight text-slate-900">
              {roundedScore}
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold text-slate-600">
                [{roundedLow} – {roundedHigh}]
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                95% CREDIBLE INTERVAL (CIR)
              </span>
            </div>
            <span
              className={`ml-2 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${gradeBadgeClass}`}
            >
              {isHighGrade ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              {grade}
            </span>
            <span className="text-xs font-mono text-slate-500">
              · Confidence: <strong className="text-slate-800">{formattedConfidence}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Callout & Why is the range wide */}
      {showWhyExpander && (
        <div className="mt-4 pt-1">
          <button
            onClick={() => setWhyOpen(!whyOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Why is the credible range [{roundedLow}–{roundedHigh}] ({spread.toFixed(1)} pts wide)?</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                whyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {whyOpen && (
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
              <p className="font-semibold text-slate-900 mb-1">
                Passive Observational Uncertainty (TLS 1.3 Encrypted Handshakes)
              </p>
              <p>
                Unlike invasive active scanners that connect directly to your server, Raven operates <strong>100% passively</strong> on network taps. Under <strong>TLS 1.3 (RFC 8446)</strong>, server certificates and chain extensions are encrypted on wire.
              </p>
              <p className="mt-1.5">
                Because passive taps cannot decrypt intermediate certificates without server private keys, certificate expiration and CRL status remain strictly <em>NOT-OBSERVABLE</em>. Raven mathematically reflects this honest limitation by widening the Bayesian interval, rather than guessing or feigning certainty.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
