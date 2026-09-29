"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Hash,
  FileCode,
  CheckCircle2,
  PlaySquare,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Finding } from "./DashboardContext";
import { RuleChip } from "@/components/ui/RuleChip";
import { TriStateChip } from "@/components/ui/TriStateChip";

interface EvidenceDrawerProps {
  finding: Finding | null;
  onClose: () => void;
}

export function EvidenceDrawer({ finding, onClose }: EvidenceDrawerProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!finding) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getRemediation = (ruleId: string) => {
    if (ruleId.includes("ENF-002")) {
      return "Configure Postfix 'smtp_tls_security_level = dane' or 'verify' to mandate encrypted handshakes and reject cleartext stripping fallbacks.";
    }
    if (ruleId.includes("CIPH")) {
      return "Disable 3DES, RC4, and CBC-mode ciphers in your MTA configuration. Restrict TLS cipher suite list to modern AEAD ciphers (AES-256-GCM, CHACHA20-POLY1305).";
    }
    if (ruleId.includes("KEY")) {
      return "Upgrade RSA host keys to minimum 2048-bit (recommend 3072-bit or Ed25519) to comply with NIST SP 800-52r2 guidance.";
    }
    if (ruleId.includes("RADAR")) {
      return "Audit intermediary firewall / deep packet inspection (DPI) appliances suppressing STARTTLS capability advertisement on Port 25 transit.";
    }
    return "Enforce strict transport layer security with valid MTA-STS policy published on HTTPS well-known endpoint.";
  };

  const getFalsePositiveExplanation = (ruleId: string) => {
    if (ruleId.includes("ENF-002")) {
      return "Could fire if an internal middlebox or antivirus mail scanner legitimately proxies inbound mail while re-encrypting on an isolated egress segment.";
    }
    if (ruleId.includes("CIPH")) {
      return "Could occur during legacy client fallback if the remote partner system strictly negotiates backward-compatible ciphers only.";
    }
    return "Could occur during maintenance windows or network re-routing when mail flows transit temporary staging relays.";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                finding.severity === "CRITICAL"
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : finding.severity === "HIGH"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {finding.severity}
            </span>
            <RuleChip ruleId={finding.ruleId} />
            <TriStateChip state={finding.state} size="sm" />
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close evidence drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & One-Line Summary */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              OBSERVED ON HOP: {finding.mxHost}
            </span>
            <h2 id="drawer-title" className="text-xl font-bold text-slate-900">
              {finding.ruleTitle}
            </h2>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {finding.summary}
            </p>
          </div>

          {/* Remediation Action Card */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
              <span>Recommended Operator Action:</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed font-mono">
              {getRemediation(finding.ruleId)}
            </p>
          </div>

          {/* Provenance Tuple (Core requirement: Packet #, byte offset, flow ID) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-blue-600" />
              Court-Grade Provenance Coordinates
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Flow Identifier:</span>
                <span className="font-mono font-semibold text-slate-900 break-all">
                  {finding.provenance.flowId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Frame / Packet Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  Packet #{finding.provenance.packetNo}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Wire Byte Offset:</span>
                <span className="font-mono font-black text-rose-600">
                  {finding.provenance.byteOffset}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">TLS Record Index:</span>
                <span className="font-mono font-semibold text-slate-900">
                  Record #{finding.provenance.tlsRecordIdx}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Capture Timestamp:</span>
                <span className="font-mono text-slate-700">
                  {finding.provenance.timestamp}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Target MTA Host:</span>
                <span className="font-mono font-bold text-slate-800">
                  {finding.mxHost}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Hex / ASCII Packet Inspector */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-blue-600" />
              Raw Wire Packet Inspection (Highlighted Bytes)
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase mb-1">
                  Hex Byte Stream:
                </span>
                <p className="text-amber-400 font-medium break-all select-all leading-relaxed">
                  {finding.provenance.hexSnippet}
                </p>
              </div>
              <div className="border-t border-slate-800 pt-2.5">
                <span className="text-[10px] text-slate-500 block uppercase mb-1">
                  Decoded Protocol ASCII:
                </span>
                <p className="text-emerald-400 font-bold break-all select-all">
                  {finding.provenance.asciiSnippet}
                </p>
              </div>
            </div>
          </div>

          {/* Why this fired / Why this might be a false positive (FR Credibility Moment) */}
          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Why This Rule Fired
              </span>
              <p className="text-emerald-800 leading-snug text-[11px]">
                Deterministic state machine detected an unencrypted transition after positive capability negotiation or outright cleartext payload transmission.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                Potential False Positive
              </span>
              <p className="text-slate-600 leading-snug text-[11px]">
                {getFalsePositiveExplanation(finding.ruleId)}
              </p>
            </div>
          </div>

          {/* RFC / NIST Citation & Span Seal */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Formal Protocol Citation
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                CVSS: {finding.cvss.toFixed(1)} · Conf: {(finding.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-700 italic">
              &quot;{finding.clause}&quot;
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="truncate pr-2">Seal: {finding.provenance.spanHash}</span>
              <button
                onClick={() => copyToClipboard(finding.provenance.spanHash)}
                className="text-blue-600 hover:underline shrink-0"
              >
                {copiedHash ? "Copied!" : "Copy Receipt"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          <Link
            href={`/dashboard/replay?finding=${finding.id}&flow=${finding.provenance.flowId}`}
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <PlaySquare className="h-4 w-4" />
            Replay Frame #{finding.provenance.packetNo}
          </Link>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </>
  );
}
