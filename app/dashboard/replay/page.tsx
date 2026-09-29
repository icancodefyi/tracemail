"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  PlaySquare,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertTriangle,
  Download,
  FileCode,
  Volume2,
  VolumeX,
  Server,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { AiInsightModal } from "@/components/ui/AiInsightModal";
import { REPLAY_FRAME_INSIGHTS } from "@/components/ui/ai-insights-data";

interface PacketEvent {
  step: number;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  action: string;
  detail: string;
  storyNarration: string;
  direction: "left-to-right" | "right-to-left";
  packetPayloadPreview: string;
  hex: string;
  ascii: string;
  isCritical?: boolean;
  ruleId?: string;
  why?: string;
  originalServerWire?: string;
  tamperedClientWire?: string;
}

const REPLAY_EVENTS: PacketEvent[] = [
  {
    step: 1,
    time: "00:00.000",
    source: "198.51.100.10:48210 (Client MTA)",
    destination: "198.51.100.14:25 (Partner MX)",
    protocol: "TCP",
    action: "SYN-ACK 3-Way Handshake",
    direction: "left-to-right",
    packetPayloadPreview: "[TCP SYN, SEQ=0, DPORT=25]",
    detail: "Connection established over TCP Port 25 (Standard SMTP transit).",
    storyNarration:
      "The corporate mail server initiates contact with the remote gateway by performing a standard 3-way TCP handshake over Port 25. At this moment, only raw transport is established; no encryption exists yet.",
    hex: "00 1a 4a 12 b4 80 52 54 00 12 34 56 08 00 45 00 00 3c ... [TCP SYN, SEQ=0]",
    ascii: "[TCP 3-Way Handshake Connection Established on Port 25]",
  },
  {
    step: 2,
    time: "00:00.042",
    source: "198.51.100.14:25 (Partner MX)",
    destination: "198.51.100.10:48210 (Client MTA)",
    protocol: "SMTP",
    action: "Service Ready Banner (220)",
    direction: "right-to-left",
    packetPayloadPreview: "220 relay-gw.partner.net ESMTP Postfix",
    detail: "Server presents: '220 relay-gw.partner.net ESMTP Postfix'",
    storyNarration:
      "The remote mail server greets our client with '220 Service Ready'. It announces it is running ESMTP Postfix and waiting for our server's introduction.",
    hex: "32 32 30 20 72 65 6c 61 79 2d 67 77 2e 70 61 72 74 6e 65 72 2e 6e 65 74",
    ascii: "220 relay-gw.partner.net ESMTP Postfix\r\n",
  },
  {
    step: 3,
    time: "00:00.088",
    source: "198.51.100.10:48210 (Client MTA)",
    destination: "198.51.100.14:25 (Partner MX)",
    protocol: "SMTP",
    action: "Client Greeting (EHLO)",
    direction: "left-to-right",
    packetPayloadPreview: "EHLO mail.corp.net",
    detail: "Client introduces hostname: 'EHLO mail.corp.net'",
    storyNarration:
      "Our mail server introduces itself with 'EHLO mail.corp.net', requesting the remote gateway to advertise supported security extensions and encryption protocols.",
    hex: "45 48 4c 4f 20 6d 61 69 6c 2e 63 6f 72 70 2e 6e 65 74 0d 0a",
    ascii: "EHLO mail.corp.net\r\n",
  },
  {
    step: 4,
    time: "00:00.140",
    source: "Hop 2 (Adversary MITM Proxy 203.0.113.88)",
    destination: "198.51.100.10:48210 (Client MTA)",
    protocol: "SMTP / MITM",
    action: "CRITICAL: STARTTLS STRIPPED",
    direction: "right-to-left",
    packetPayloadPreview: "250-PIPELINE (STARTTLS REMOVED)",
    detail:
      "Server 250 response intercepted. Adversary in the middle strips 250-STARTTLS keyword before forwarding to client.",
    storyNarration:
      "CRITICAL INCIDENT: The destination server legitimately offered STARTTLS encryption support. However, Hop 2 is an active adversary sitting directly on the transit link. The attacker intercepted the packet in mid-transit, deleted '250-STARTTLS', recalculated the TCP checksum, and forwarded the modified packet to our server. Our mail server was deceived into assuming encryption is not supported.",
    hex: "32 35 30 2d 50 49 50 45 4c 49 4e 45 0d 0a 32 35 30 2d 53 49 5a 45 20 33 35 38 38 30 30 30 0d 0a",
    ascii: "250-PIPELINE\r\n250-SIZE 3588000\r\n [STARTTLS REMOVED BY MITM PROXY]",
    isCritical: true,
    ruleId: "SMS-ENF-002",
    why: "Active downgrade attack suppresses encryption opportunity, tricking sending MTA into sending in unencrypted plaintext.",
    originalServerWire: "250-STARTTLS\r\n250-PIPELINE\r\n250-SIZE 3588000\r\n250 8BITMIME",
    tamperedClientWire: "250-PIPELINE\r\n250-SIZE 3588000\r\n250 8BITMIME",
  },
  {
    step: 5,
    time: "00:00.210",
    source: "198.51.100.10:48210 (Client MTA)",
    destination: "198.51.100.14:25 (Partner MX)",
    protocol: "SMTP",
    action: "Cleartext Fallback: MAIL FROM",
    direction: "left-to-right",
    packetPayloadPreview: "MAIL FROM:<cfo@corp.net>",
    detail: "Client MTA falls back to unencrypted transmission: 'MAIL FROM:<cfo@corp.net>'",
    storyNarration:
      "DECEIVED INTO CLEARTEXT: Because our client was deceived by the suppressed encryption offer, it falls back to transmitting the sender identity 'MAIL FROM:<cfo@corp.net>' in unencrypted cleartext ASCII. Any passive wiretap on the transit route can observe this payload.",
    hex: "4d 41 49 4c 20 46 52 4f 4d 3a 3c 63 66 6f 40 63 6f 72 70 2e 6e 65 74 3e 0d 0a",
    ascii: "MAIL FROM:<cfo@corp.net>\r\n [CLEARTEXT TRANSMISSION]",
    isCritical: true,
    ruleId: "SMS-ENF-002",
    why: "Confidential credentials and corporate communications exposed in unencrypted transit.",
  },
  {
    step: 6,
    time: "00:00.280",
    source: "198.51.100.14:25 (Partner MX)",
    destination: "198.51.100.10:48210 (Client MTA)",
    protocol: "SMTP",
    action: "Recipient Ok: RCPT TO Confirmed",
    direction: "right-to-left",
    packetPayloadPreview: "250 2.1.5 Ok recipient confirmed",
    detail: "Server acknowledges: '250 2.1.5 Ok recipient confirmed'",
    storyNarration:
      "The destination server acknowledges the recipient address with '250 Ok'. The transaction is now locked into unencrypted cleartext mode. All subsequent message headers and email body contents will transit the wire without TLS cryptographic sealing.",
    hex: "32 35 30 20 32 2e 31 2e 35 20 4f 6b 0d 0a",
    ascii: "250 2.1.5 Ok\r\n",
  },
];

export default function ReplayPage() {
  const { activeSession } = useDashboard();
  const [currentStep, setCurrentStep] = useState<number>(4); // Default to the critical moment
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeEvent = REPLAY_EVENTS.find((e) => e.step === currentStep) || REPLAY_EVENTS[3];

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= REPLAY_EVENTS.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Audio Speech Narration handler
  const toggleSpeechNarration = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Audio narration is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeEvent.storyNarration);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const aiInsightData = REPLAY_FRAME_INSIGHTS[currentStep] || REPLAY_FRAME_INSIGHTS[4];

  return (
    <div className="space-y-6">
      {/* Title & Section Tag */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <PlaySquare className="h-3 w-3 text-blue-600" />
            Forensics · Frame-by-Frame Protocol Inspection
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Forensic Incident Replay
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Step-by-step wire analysis of in-path STARTTLS stripping observed during SMTP transit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Forensic Analysis</span>
          </button>

          <button
            onClick={() => alert("Exporting forensic session frame sequence as verified evidence package...")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export WebM Artifact</span>
          </button>
        </div>
      </div>

      {/* Capture Trace Context Badge */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Capture Source:</span>
          {activeSession ? (
            <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
              {activeSession.filename} ({activeSession.flows} flow · {activeSession.grade})
            </span>
          ) : (
            <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
              corpus/scenarios/stripped.pcap (Benchmark Scenario)
            </span>
          )}
        </div>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
        >
          Ingest Custom PCAP →
        </Link>
      </div>

      {/* Main Simulation Stage Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* 1. CLEAN 3-PARTY NETWORK TOPOLOGY (Matching Platform Design) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-5">
          {/* Header inside topology container */}
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Port 25 SMTP Transit Chain
            </span>
            <div className="font-mono text-slate-500">
              Frame <strong className="text-slate-900 font-bold">#{currentStep}</strong> of 6 · Offset <strong className="text-slate-900">0x00004F2A</strong> · <strong className="text-blue-700">{activeEvent.time}</strong>
            </div>
          </div>

          {/* 3 Node Cards in clean enterprise layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left Node: Corporate Client MTA */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 mb-2">
                <Server className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Sender MTA (Client)</span>
              <strong className="text-xs font-bold text-slate-900 mt-0.5">mail.corp.net</strong>
              <span className="text-[11px] font-mono text-slate-500">198.51.100.10:48210</span>
              <span className="mt-2 inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                Grade A- (88/100)
              </span>
            </div>

            {/* Center Node: In-Path Relay (Hop 2) */}
            <div
              className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all shadow-2xs ${
                currentStep >= 4
                  ? "border-rose-300 bg-rose-50/50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg mb-2 ${
                  currentStep >= 4
                    ? "bg-rose-100 border border-rose-300 text-rose-700"
                    : "bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${currentStep >= 4 ? "text-rose-700" : "text-slate-400"}`}>
                {currentStep === 4 ? "Adversary In-Path Proxy" : "In-Path Relay (Hop 2)"}
              </span>
              <strong className="text-xs font-bold text-slate-900 mt-0.5">
                relay-gw.partner.net
              </strong>
              <span className="text-[11px] font-mono text-slate-500">203.0.113.88:25</span>
              <span
                className={`mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                  currentStep >= 4 ? "bg-rose-100 border border-rose-300 text-rose-800" : "bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                {currentStep >= 4 ? "STRIPPED CLEARTEXT" : "Grade E (42/100)"}
              </span>
            </div>

            {/* Right Node: Remote Destination MX */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 mb-2">
                <Server className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Destination MX Gateway</span>
              <strong className="text-xs font-bold text-slate-900 mt-0.5">mx1.partner.net</strong>
              <span className="text-[11px] font-mono text-slate-500">198.51.100.14:25</span>
              <span className="mt-2 inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                ESMTP Postfix 3.7
              </span>
            </div>
          </div>

          {/* Clean In-Flight Packet Track */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                {activeEvent.direction === "left-to-right" ? (
                  <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
                )}
                Direction: <strong className="text-slate-900">{activeEvent.direction === "left-to-right" ? "Client → Destination" : "Destination → Client"}</strong>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Protocol: <strong className="text-slate-800">{activeEvent.protocol}</strong>
              </span>
            </div>

            {/* Active Packet Banner */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border text-xs font-mono ${
              activeEvent.isCritical
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-slate-500">Wire Payload:</span>
                <span className="font-bold">{activeEvent.packetPayloadPreview}</span>
              </div>
              <div>
                {currentStep === 4 ? (
                  <span className="inline-flex items-center rounded bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                    ADVERSARY MODIFIED IN-FLIGHT
                  </span>
                ) : currentStep === 5 ? (
                  <span className="inline-flex items-center rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    CLEARTEXT FALLBACK CONFIRMED
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">Normal Wire Transit</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. WALKTHROUGH & PLAIN-ENGLISH ANALYSIS PANEL */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Protocol Walkthrough
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Step {currentStep} of 6: {activeEvent.action}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeechNarration}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{isSpeaking ? "Stop Audio" : "Listen to Audio"}</span>
              </button>

              <button
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Plain-English Briefing</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {activeEvent.storyNarration}
          </p>
        </div>

        {/* 3. PLAYER CONTROLS & TIMELINE SCRUBBER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-y border-slate-100 py-3.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset to frame 1"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep <= 1}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
              title="Previous frame"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              title={isPlaying ? "Pause simulation" : "Play live simulation"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.min(REPLAY_EVENTS.length, prev + 1))}
              disabled={currentStep >= REPLAY_EVENTS.length}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
              title="Next frame"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <span className="font-mono text-xs font-semibold text-slate-700 ml-2">
              Frame {currentStep} of {REPLAY_EVENTS.length} · {activeEvent.time}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1">Speed:</span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  speed === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* 4. INTERACTIVE STEPPER TILES */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          {REPLAY_EVENTS.map((event) => {
            const isCurrent = event.step === currentStep;
            const isPast = event.step < currentStep;

            return (
              <button
                key={event.step}
                onClick={() => {
                  setCurrentStep(event.step);
                  setIsPlaying(false);
                }}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  isCurrent
                    ? event.isCritical
                      ? "border-rose-400 bg-rose-50/60 ring-2 ring-rose-200"
                      : "border-blue-500 bg-blue-50/60 ring-2 ring-blue-200"
                    : event.isCritical
                    ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50"
                    : isPast
                    ? "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                    : "border-slate-200/60 bg-slate-50/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-mono text-[10px] text-slate-400">#{event.step} · {event.time}</span>
                  {event.isCritical && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 truncate w-full">
                  {event.action}
                </div>
                <div className="font-mono text-[10px] text-slate-500 truncate w-full mt-0.5">
                  {event.protocol}
                </div>
              </button>
            );
          })}
        </div>

        {/* 5. WIRE TAMPERING COMPARISON (STEP 4) */}
        {currentStep === 4 && activeEvent.originalServerWire && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                In-Path Wire Tampering Evidence Diff
              </span>
              <span className="font-mono text-[11px] font-bold text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded">
                Rule: SMS-ENF-002
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-xs font-mono">
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-1">
                  1. Server Sent from Port 25:
                </span>
                <pre className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeEvent.originalServerWire}
                </pre>
              </div>

              <div className="rounded-lg border border-rose-200 bg-white p-3.5 space-y-1">
                <div className="flex items-center justify-between border-b border-rose-100 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                    2. Client Received After Hop 2 Relay:
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    - 250-STARTTLS (STRIPPED)
                  </span>
                </div>
                <pre className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeEvent.tamperedClientWire}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 6. RAW WIRE PACKET INSPECTOR */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left: Frame Technical Details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                Frame #{activeEvent.step} Technical Summary
              </span>
              {activeEvent.isCritical && (
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-2xs">
                  VULNERABILITY
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activeEvent.action}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                {activeEvent.detail}
              </p>
            </div>

            {activeEvent.isCritical && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Rule Citation: {activeEvent.ruleId}</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {activeEvent.why}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Source Socket:</span>
                <span className="font-mono font-medium text-slate-800">{activeEvent.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Destination Socket:</span>
                <span className="font-mono font-medium text-slate-800">{activeEvent.destination}</span>
              </div>
            </div>
          </div>

          {/* Right: Dual Hex / ASCII Wire Stream (Clean Dev Tools Style) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-blue-400" />
                Raw Wire Frame (Offset 0x00004F2A)
              </span>
              <span>Port 25</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase mb-1">
                Hex Byte Stream:
              </span>
              <p className="text-amber-400/90 leading-relaxed break-all select-all font-mono text-[11px]">
                {activeEvent.hex}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase mb-1">
                Decoded ASCII Stream:
              </span>
              <p className={activeEvent.isCritical ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {activeEvent.ascii}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Forensic Insight Modal */}
      <AiInsightModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        data={aiInsightData}
      />
    </div>
  );
}
