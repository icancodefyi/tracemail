"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Network,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { TriStateChip } from "@/components/ui/TriStateChip";

interface HopData {
  id: string;
  name: string;
  hopNumber: number;
  ip: string;
  role: string;
  grade: string;
  score: number;
  cipher: string;
  tlsVersion: string;
  certStatus: string;
  policy: string;
  verdict: "SECURE" | "VULNERABLE" | "NOT-OBSERVABLE";
  trafficVolume: string;
  isWeakest?: boolean;
  narrative: string;
}

export default function DeliveryGraphPage() {
  const { activeSession, loadSampleCapture } = useDashboard();
  const [selectedHopId, setSelectedHopId] = useState<string>("hop-2");

  if (!activeSession) {
    return (
      <EmptyState
        icon={<Network className="h-6 w-6 text-blue-600" />}
        title="No Delivery Chain Observable"
        description="Ingest a packet capture to map the cross-hop transit topology and expose where encryption breaks across intermediate relays."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Multi-Hop Sample",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Hop-by-hop cryptographic sealing analysis"
      />
    );
  }

  const hops: Record<string, HopData> = {
    "hop-1": {
      id: "hop-1",
      name: "mx1.corp.net",
      hopNumber: 1,
      ip: "198.51.100.10",
      role: "Internal Enterprise Ingress",
      grade: "Grade A-",
      score: 88,
      cipher: "TLS_AES_256_GCM_SHA384 (NIST Recommended)",
      tlsVersion: "TLS 1.3 (Strict)",
      certStatus: "Encrypted under TLS 1.3 (NOT-OBSERVABLE)",
      policy: "MTA-STS: enforce · DANE TLSA: Valid",
      verdict: "SECURE",
      trafficVolume: "1,420 msgs (100% Ingress)",
      narrative: "Internal perimeter gateway strictly accepts encrypted connections with modern AEAD cipher suites.",
    },
    "hop-2": {
      id: "hop-2",
      name: "relay-gw.partner.net",
      hopNumber: 2,
      ip: "198.51.100.14",
      role: "Partner Commercial Relay",
      grade: "Grade E",
      score: 42,
      cipher: "NONE (Unencrypted Cleartext Payload)",
      tlsVersion: "None (STARTTLS Stripped via MITM)",
      certStatus: "No Certificate Presented (Cleartext)",
      policy: "MTA-STS: None · DANE TLSA: Absent",
      verdict: "VULNERABLE",
      trafficVolume: "890 msgs (17.4% Leaked)",
      isWeakest: true,
      narrative: "Active adversary or misconfigured middlebox stripped the 250-STARTTLS keyword from downstream EHLO response, forcing sending MTA into unencrypted cleartext fallback.",
    },
    "hop-3": {
      id: "hop-3",
      name: "aspmx.l.google.com",
      hopNumber: 3,
      ip: "142.250.150.27",
      role: "Cloud Mailbox Egress (Google)",
      grade: "Grade A+",
      score: 98,
      cipher: "TLS_CHACHA20_POLY1305_SHA256",
      tlsVersion: "TLS 1.3 (Mandatory)",
      certStatus: "GTS Root R1 (Valid, Unrevoked)",
      policy: "MTA-STS: enforce · TLS-RPT Active",
      verdict: "SECURE",
      trafficVolume: "2,450 msgs (48% Volume)",
      narrative: "Direct cloud peering endpoint enforcing forward-secret TLS with active reporting daemons.",
    },
    "hop-4": {
      id: "hop-4",
      name: "mail.protection.outlook.com",
      hopNumber: 4,
      ip: "52.101.68.1",
      role: "Corporate Exchange Relay (M365)",
      grade: "Grade A",
      score: 92,
      cipher: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
      tlsVersion: "TLS 1.2 / 1.3",
      certStatus: "DigiCert Cloud CA (Valid)",
      policy: "MTA-STS: enforce · DANE TLSA: Active",
      verdict: "SECURE",
      trafficVolume: "1,220 msgs (24% Volume)",
      narrative: "Microsoft cloud boundary relay operating consistent cryptographic enforcement.",
    },
  };

  const selectedHop = hops[selectedHopId] || hops["hop-2"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Network className="h-3 w-3 text-blue-600" />
            The Differentiator · Stop 4 of 5
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Delivery Chain & Weakest-Link Exposure
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Internal mail servers may be A-grade, but confidential messages leak across external peer transit hops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <span>Share the Proof (Reports)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 10.3 Plain-English Banner above the Graph */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-rose-900 block text-sm">
            The weakest link in this delivery chain is Hop 2 (relay-gw.partner.net)
          </span>
          <p className="text-rose-800 mt-0.5 leading-relaxed">
            In packet #142, an adversary intercepted the 250-STARTTLS advertisement and stripped it. While your internal gateway maintains Grade A- security, <strong>17.4% of corporate messages transit in unencrypted cleartext</strong> through Hop 2.
          </p>
        </div>
      </div>

      {/* 10.1 The 4-Hop Chain Interactive Topology */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Interactive SVG Topology */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Transit Chain Visualizer (4 Hops)
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any hop circle to open its cryptographic inspection receipt.
              </p>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Direction: Left → Right
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative h-[380px] w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center p-4">
            <svg
              viewBox="0 0 700 340"
              className="h-full w-full select-none"
            >
              <defs>
                <marker
                  id="arrow-green"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrow-red"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Transit Edges */}
              {/* Edge 1 -> Google (Hop 3) */}
              <path
                d="M 160 170 Q 320 80 520 80"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                markerEnd="url(#arrow-green)"
              />
              <text x="340" y="70" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">
                TLS 1.3 (48%)
              </text>

              {/* Edge 1 -> Microsoft (Hop 4) */}
              <path
                d="M 160 170 L 520 170"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                markerEnd="url(#arrow-green)"
              />
              <text x="340" y="160" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">
                TLS 1.3 (24%)
              </text>

              {/* Edge 1 -> Weak Relay (Hop 2 - Weakest Link) */}
              <path
                d="M 160 170 Q 320 260 520 260"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                markerEnd="url(#arrow-red)"
              />
              <text x="340" y="280" fill="#fda4af" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                STRIPPED CLEARTEXT (17.4%)
              </text>

              {/* HOP NODES */}
              {/* Hop 1: Internal Enterprise Ingress */}
              <g
                transform="translate(160, 170)"
                onClick={() => setSelectedHopId("hop-1")}
                className="cursor-pointer"
              >
                <circle
                  r="46"
                  fill="#0f172a"
                  stroke={selectedHopId === "hop-1" ? "#60a5fa" : "#38bdf8"}
                  strokeWidth={selectedHopId === "hop-1" ? "4" : "2"}
                />
                <circle r="38" fill="#1e293b" />
                <text y="-8" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Hop 1 (Ingress)
                </text>
                <text y="8" fill="#93c5fd" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  mx1.corp.net
                </text>
                <text y="22" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Grade A- (88)
                </text>
              </g>

              {/* Hop 3: Google Workspace */}
              <g
                transform="translate(520, 80)"
                onClick={() => setSelectedHopId("hop-3")}
                className="cursor-pointer"
              >
                <circle
                  r="36"
                  fill="#064e3b"
                  stroke={selectedHopId === "hop-3" ? "#60a5fa" : "#10b981"}
                  strokeWidth={selectedHopId === "hop-3" ? "4" : "2"}
                />
                <text y="-5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  Hop 3 (Google)
                </text>
                <text y="9" fill="#a7f3d0" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  aspmx.google
                </text>
                <text y="21" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Grade A+ (98)
                </text>
              </g>

              {/* Hop 4: Microsoft M365 */}
              <g
                transform="translate(520, 170)"
                onClick={() => setSelectedHopId("hop-4")}
                className="cursor-pointer"
              >
                <circle
                  r="36"
                  fill="#064e3b"
                  stroke={selectedHopId === "hop-4" ? "#60a5fa" : "#10b981"}
                  strokeWidth={selectedHopId === "hop-4" ? "4" : "2"}
                />
                <text y="-5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  Hop 4 (M365)
                </text>
                <text y="9" fill="#a7f3d0" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  outlook.com
                </text>
                <text y="21" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Grade A (92)
                </text>
              </g>

              {/* Hop 2: WEAKEST LINK (relay-gw.partner.net) */}
              <g
                transform="translate(520, 260)"
                onClick={() => setSelectedHopId("hop-2")}
                className="cursor-pointer"
              >
                {/* Glowing alert ring */}
                <circle
                  r="48"
                  fill="#450a0a"
                  stroke="#f43f5e"
                  strokeWidth={selectedHopId === "hop-2" ? "4" : "2"}
                  className="animate-pulse"
                />
                <circle r="40" fill="#881337" />
                <text y="-10" fill="#fecdd3" fontSize="10" fontWeight="bold" textAnchor="middle">
                  HOP 2 (WEAKEST)
                </text>
                <text y="5" fill="#ffe4e6" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  relay-gw.partner
                </text>
                <text y="19" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                  GRADE E (42/100)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right 5 Cols: 10.2 Inline Hop Inspection Panel */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hop #{selectedHop.hopNumber} Inspection Receipt
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedHop.name}
              </h3>
            </div>
            <TriStateChip state={selectedHop.verdict} size="sm" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Role & Socket:</span>
              <span className="font-semibold text-slate-800">
                {selectedHop.role} ({selectedHop.ip}:25)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Negotiated Cipher:</span>
              <span className={`font-mono font-bold ${selectedHop.isWeakest ? "text-rose-600" : "text-emerald-700"}`}>
                {selectedHop.cipher}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Protocol Version:</span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedHop.tlsVersion}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">X.509 Certificate Chain:</span>
              <span className="font-mono text-slate-700">
                {selectedHop.certStatus}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Enforcement Policies:</span>
              <span className="font-mono text-slate-700">
                {selectedHop.policy}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Traffic Volume:</span>
              <span className="font-mono font-bold text-slate-800">
                {selectedHop.trafficVolume}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              Forensic Observation:
            </span>
            {selectedHop.narrative}
          </div>

          {selectedHop.isWeakest && (
            <Link
              href="/dashboard/findings?mx=relay-gw.partner.net"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-colors"
            >
              <span>Inspect Downgrade Rule Finding (SMS-ENF-002)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
