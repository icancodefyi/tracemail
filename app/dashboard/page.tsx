"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Shield,
  Lock,
  HardDrive,
  ArrowRight,
  FolderOpen,
  Sparkles,
  FileCode,
  FileCheck,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";

export default function IngestPage() {
  const {
    activeSession,
    sessions,
    switchSession,
    pipelineRunning,
    pipelineSteps,
    currentStepIndex,
    pipelineLogs,
    uploadCapture,
    loadSampleCapture,
    isUploading,
  } = useDashboard();

  const [dragOver, setDragOver] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleScenarios = [
    {
      id: "stripped",
      title: "STARTTLS Stripping Downgrade",
      desc: "MITM intercepts 250-STARTTLS and suppresses it; mail falls back to cleartext.",
      expected: "SMS-ENF-002 (Critical)",
    },
    {
      id: "sweet32",
      title: "Sweet32 & Weak 3DES Ciphers",
      desc: "Legacy TLS 1.0/1.1 negotiation with 64-bit block size vulnerable to birthday attack.",
      expected: "SMS-CIPH-002 (High)",
    },
    {
      id: "weak-key",
      title: "Factorable RSA Key Length",
      desc: "MTA accepts 1024-bit RSA key exchange; violates modern NIST SP 800-52r2 mandate.",
      expected: "SMS-KEY-001 (High)",
    },
    {
      id: "no-tls",
      title: "Opportunistic No-TLS Cleartext",
      desc: "Transit server skips opportunistic encryption completely on Port 25.",
      expected: "SMS-ENF-002 (Critical)",
    },
    {
      id: "unused",
      title: "Advertised but Unused STARTTLS",
      desc: "Server offers 250-STARTTLS, but sending client immediately transmits MAIL FROM in plaintext.",
      expected: "SMS-RADAR-001 (High)",
    },
  ];

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadCapture(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadCapture(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Front Door Headline */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
          <Shield className="h-3 w-3 text-blue-600" />
          The Front Door · Stop 1 of 5
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Packet Capture Ingestion
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 leading-relaxed">
          Audit your email encryption without sending a single packet. Drop a PCAP trace or try a pre-recorded capture to watch the deterministic evaluation engine prove cryptographic posture.
        </p>
      </div>

      {/* Main Front Door Card: Dropzone + Try Sample + 3 Trust Lines */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all bg-slate-50/50 ${
            dragOver
              ? "border-blue-500 bg-blue-50/40 ring-4 ring-blue-100"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pcap,.pcapng,.cap"
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-blue-600 mb-4 shadow-xs">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Drag & drop raw packet capture here
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Accepts <code className="font-mono font-bold text-slate-800">.pcap</code>,{" "}
            <code className="font-mono font-bold text-slate-800">.pcapng</code>, or{" "}
            <code className="font-mono font-bold text-slate-800">.cap</code> network traces.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || pipelineRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              Browse Local Files
            </button>

            {/* Try with Sample Capture Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
                disabled={isUploading || pipelineRunning}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                Try with a Sample Capture
              </button>

              {sampleMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-84 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Built-In Corpus Scenario
                  </div>
                  <div className="space-y-1">
                    {sampleScenarios.map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={async () => {
                          setSampleMenuOpen(false);
                          await loadSampleCapture(sc.id);
                        }}
                        className="w-full text-left rounded-xl p-2.5 transition-colors hover:bg-slate-50 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {sc.title}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {sc.expected}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-snug">
                          {sc.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Three Trust Lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">100% Passive</span>
              <span className="text-slate-500 text-[11px]">No active probe packets sent</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Air-Gapped Sovereign</span>
              <span className="text-slate-500 text-[11px]">Zero telemetry egress or phone-home</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Fully Local Execution</span>
              <span className="text-slate-500 text-[11px]">Nothing leaves this machine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2: The Wait (Turn dead time into trust) */}
      {(pipelineRunning || pipelineLogs.length > 0) && (
        <div className="space-y-4">
          <ProgressStepper
            steps={pipelineSteps}
            currentStepIndex={currentStepIndex}
          />

          {/* Telemetry Output Log */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <FileCode className="h-3.5 w-3.5 text-blue-400" />
                Deterministic Telemetry Stream
              </span>
              <span className="text-emerald-400">STATUS: AIR-GAPPED VERIFIED</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {pipelineLogs.map((log, i) => (
                <div key={i} className="text-[11px] text-slate-300">
                  <span className="text-blue-400 font-semibold">{log.slice(0, 11)}</span>
                  <span className="text-slate-200">{log.slice(11)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Evaluated Session Result & Golden Path Handoff */}
      {activeSession && !pipelineRunning && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Capture Analyzed
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {activeSession.filename}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                SHA-256: {activeSession.hash.slice(0, 36)}... · {activeSession.flows} flow(s)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/posture"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <span>Read the Answer (Posture)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard/findings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Know What to Fix ({activeSession.findingsCount.critical + activeSession.findingsCount.high + activeSession.findingsCount.medium} findings)</span>
              </Link>
            </div>
          </div>

          {/* Quick Score Preview */}
          <ScoreDisplay
            score={activeSession.score}
            ciLow={activeSession.ciLow}
            ciHigh={activeSession.ciHigh}
            grade={activeSession.grade}
            confidence={0.78}
          />
        </div>
      )}

      {/* Ingested Captures History Table */}
      {sessions.length > 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Ingested Capture History ({sessions.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900">{s.filename}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">
                      {s.flows} flow(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.score >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : s.score >= 60
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {s.grade} ({s.score}/100)
                  </span>
                  {s.id !== activeSession?.id && (
                    <button
                      onClick={() => switchSession(s.id)}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Switch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
