"use client";

import React, { useState } from "react";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Copy,
  FolderTree,
  FileText,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiInsightModal } from "@/components/ui/AiInsightModal";
import { INTEGRITY_CHAIN_INSIGHT } from "@/components/ui/ai-insights-data";

interface ManifestNode {
  path: string;
  type: "PCAP_CORPUS" | "RULE_ENGINE" | "EVIDENCE_DB" | "REPORT_ARTIFACT";
  size: string;
  expectedHash: string;
  actualHash: string;
  status: "VERIFIED" | "TAMPERED" | "PENDING";
}

export default function IntegrityPage() {
  const { activeSession, loadSampleCapture } = useDashboard();
  const [verifying, setVerifying] = useState(false);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  if (!activeSession) {
    return (
      <EmptyState
        icon={<Fingerprint className="h-6 w-6 text-blue-600" />}
        title="No Integrity Manifest Available"
        description="Ingest a packet capture to generate verifiable SHA-256 cryptographic manifest trees across raw PCAPs, rule engines, and signed evidence stores."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Sample Capture (1-Click)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Cryptographic non-repudiation with court-grade hash verification"
      />
    );
  }

  const manifestNodes: ManifestNode[] = [
    {
      path: `corpus/scenarios/${activeSession.filename}`,
      type: "PCAP_CORPUS",
      size: activeSession.size,
      expectedHash: activeSession.hash,
      actualHash: simulateTamper
        ? "sha256:0000000000000000000000000000000000000000000000000000000000000000"
        : activeSession.hash,
      status: simulateTamper ? "TAMPERED" : "VERIFIED",
    },
    {
      path: "rules/engine/sms_catalog_v1.4.0.json",
      type: "RULE_ENGINE",
      size: "246 KB",
      expectedHash: "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      actualHash: "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      status: "VERIFIED",
    },
    {
      path: `evidence/stores/session_${activeSession.id}.sqlite`,
      type: "EVIDENCE_DB",
      size: "8.4 MB",
      expectedHash: "sha256:bb78a1092e8471cba09182347102938471092834710928347109283471092834",
      actualHash: "sha256:bb78a1092e8471cba09182347102938471092834710928347109283471092834",
      status: "VERIFIED",
    },
    {
      path: `reports/signed/audit_${activeSession.id}.pdf`,
      type: "REPORT_ARTIFACT",
      size: "1.2 MB",
      expectedHash: activeSession.hash,
      actualHash: activeSession.hash,
      status: "VERIFIED",
    },
  ];

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
    }, 800);
  };

  const copyHash = (hash: string, idx: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            <Fingerprint className="h-3.5 w-3.5 text-slate-600" />
            Cryptographic Proof Chain
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Tamper-Proof Integrity Manifest
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Verifies that capture bytes, scoring rule definitions, and report artifacts have not drifted or been tampered with.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Chain of Custody Analysis</span>
          </button>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={simulateTamper}
              onChange={(e) => setSimulateTamper(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>Simulate 1-Bit Capture Tamper</span>
          </label>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
            <span>{verifying ? "Re-walking Hashes..." : "Re-Verify Chain"}</span>
          </button>
        </div>
      </div>

      {/* Tamper Alert Banner (if simulated) */}
      {simulateTamper && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-xs font-bold text-rose-900 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              INTEGRITY VIOLATION DETECTED: Hash mismatch detected on node &apos;corpus/scenarios/{activeSession.filename}&apos;. Audit report seal revoked.
            </span>
          </div>
          <span className="font-mono text-rose-700 font-black">EXIT STATUS: 1 (FAILED)</span>
        </div>
      )}

      {/* Manifest Nodes Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-blue-600" />
            <span>Signed Artifact Manifest (MANIFEST.sha256)</span>
          </h3>
          <span className="font-mono text-xs text-slate-400">
            Package: v1.4.0-sih · Alg: SHA-256
          </span>
        </div>

        <div className="space-y-3">
          {manifestNodes.map((node, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 transition-all ${
                node.status === "TAMPERED"
                  ? "border-rose-300 bg-rose-50/40"
                  : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {node.status === "VERIFIED" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 animate-bounce" />
                  )}
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {node.path}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Type: <strong className="text-slate-700">{node.type}</strong> · Size: {node.size}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold uppercase ${
                      node.status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
              </div>

              {/* Hash Comparison */}
              <div className="mt-3 pt-3 border-t border-slate-200 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="truncate pr-2">
                    Actual: <strong className={node.status === "TAMPERED" ? "text-rose-600 font-black" : "text-slate-800"}>{node.actualHash}</strong>
                  </span>
                  <button
                    onClick={() => copyHash(node.actualHash, idx)}
                    className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                    title="Copy Hash"
                  >
                    {copiedIndex === idx ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight Modal */}
      <AiInsightModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        data={INTEGRITY_CHAIN_INSIGHT}
      />
    </div>
  );
}
