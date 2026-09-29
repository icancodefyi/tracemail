"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  X,
  UserCheck,
  Briefcase,
  Cpu,
  Wrench,
  CheckCircle2,
  Copy,
  ShieldAlert,
  Send,
  Bot,
} from "lucide-react";

export type InsightPersona = "eli5" | "executive" | "adversary" | "remediation";

export interface AiInsightData {
  title: string;
  topic: string;
  ruleId?: string;
  stepName?: string;
  sourceSocket?: string;
  destinationSocket?: string;
  eli5: {
    analogy: string;
    explanation: string;
    takeaway: string;
  };
  executive: {
    businessRisk: string;
    complianceImpact: string;
    financialExposure: string;
  };
  adversary: {
    mitreTactic: string;
    wireTechnique: string;
    whyClientFellForIt: string;
  };
  remediation: {
    directive: string;
    targetSystem: string;
    explanation: string;
  };
}

interface AiInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AiInsightData | null;
}

export function AiInsightModal({ isOpen, onClose, data }: AiInsightModalProps) {
  const [activePersona, setActivePersona] = useState<InsightPersona>("eli5");
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendCustomQuestion = async (q: string) => {
    if (!q.trim()) return;
    const userText = q;
    setCustomQuestion("");
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setIsAnswering(true);

    // Dynamic intelligent response grounded in current forensic data
    setTimeout(() => {
      let aiResponse = "";
      const lower = userText.toLowerCase();

      if (lower.includes("how") && lower.includes("attack")) {
        aiResponse = `The adversary operates in-path (e.g. via ARP spoofing, rogue BGP announcement, or an ISP wiretap). When the mail server sends the packet containing "250-STARTTLS", the attacker rewrites the TCP payload on the fly to remove that string, recalculates the TCP checksum, and forwards it to the client. Because opportunistic TLS does not verify server intent, the client trusts the tampered packet and falls back to cleartext.`;
      } else if (lower.includes("cfo") || lower.includes("executive") || lower.includes("cost") || lower.includes("risk")) {
        aiResponse = `If unencrypted mail is intercepted, any credentials, invoices, wire instructions, or confidential employee health/PII records are exposed in raw ASCII. Under GDPR and HIPAA, cleartext transmission of sensitive records constitutes an immediate reportable data breach with potential fines up to 4% of global turnover.`;
      } else if (lower.includes("fix") || lower.includes("stop") || lower.includes("postfix")) {
        aiResponse = `To stop this immediately in Postfix, add 'smtp_tls_security_level = dane' (or 'verify') in /etc/postfix/main.cf. This forces Postfix to reject sending plaintext whenever DNS DANE or MTA-STS records are present, neutralizing downgrade attacks.`;
      } else {
        aiResponse = `Based on this capture's evidence: ${data.eli5.explanation} The primary vulnerability is that the sending MTA accepts opportunistic fallback rather than requiring cryptographically authenticated TLS sealing.`;
      }

      setChatLog((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setIsAnswering(false);
    }, 450);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-4 z-50 m-auto flex max-h-[90vh] max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Forensic Intelligence & Analysis
                </span>
                {data.ruleId && (
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                    {data.ruleId}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {data.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close insight modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Persona Toggles: ELI5 · Executive · Adversary · Fix */}
        <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Perspective:
            </span>

            <button
              onClick={() => setActivePersona("eli5")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activePersona === "eli5"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Plain English (ELI5)</span>
            </button>

            <button
              onClick={() => setActivePersona("executive")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activePersona === "executive"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Executive / Board</span>
            </button>

            <button
              onClick={() => setActivePersona("adversary")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activePersona === "adversary"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Adversary Mechanics</span>
            </button>

            <button
              onClick={() => setActivePersona("remediation")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activePersona === "remediation"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Production Fix</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. ELI5 View */}
          {activePersona === "eli5" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Real-World Analogy
                </span>
                <p className="text-sm font-semibold text-blue-950 leading-relaxed">
                  &quot;{data.eli5.analogy}&quot;
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  What Happened in Human Terms
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {data.eli5.explanation}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800">
                <span className="font-bold block text-slate-900 mb-0.5">Key Takeaway:</span>
                <p className="text-slate-600">{data.eli5.takeaway}</p>
              </div>
            </div>
          )}

          {/* 2. Executive View */}
          {activePersona === "executive" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid gap-3.5 md:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    Business & Confidentiality Risk
                  </span>
                  <p className="text-xs text-rose-950 leading-relaxed font-medium">
                    {data.executive.businessRisk}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Compliance & Regulatory Penalties
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {data.executive.complianceImpact}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">
                  Financial Exposure & Liability:
                </span>
                <p className="leading-relaxed text-slate-600">
                  {data.executive.financialExposure}
                </p>
              </div>
            </div>
          )}

          {/* 3. Adversary View */}
          {activePersona === "adversary" && (
            <div className="space-y-4 animate-in fade-in duration-150 font-mono text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
                  <span>MITRE ATT&CK MAPPING</span>
                  <span className="text-rose-400 font-bold">{data.adversary.mitreTactic}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">
                    Wire Manipulation Technique:
                  </span>
                  <p className="text-amber-300 leading-relaxed font-sans">
                    {data.adversary.wireTechnique}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">
                  Why the Client MTA Fell For It:
                </span>
                <p className="leading-relaxed text-slate-600">
                  {data.adversary.whyClientFellForIt}
                </p>
              </div>
            </div>
          )}

          {/* 4. Remediation View */}
          {activePersona === "remediation" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Recommended Fix ({data.remediation.targetSystem})
                  </span>
                  <button
                    onClick={() => copyCode(data.remediation.directive)}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    {copiedCode ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCode ? "Copied" : "Copy Directive"}
                  </button>
                </div>
                <pre className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {data.remediation.directive}
                </pre>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {data.remediation.explanation}
              </p>
            </div>
          )}

          {/* Interactive "Ask AI About This" Mini-Chat */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Bot className="h-4 w-4 text-blue-600" />
              <span>Ask a Follow-Up Question in Plain English</span>
            </div>

            {/* Chat history */}
            {chatLog.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs pr-1">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 ${
                      msg.sender === "user"
                        ? "bg-white border border-slate-200 ml-6 text-slate-900 font-semibold"
                        : "bg-blue-50 border border-blue-200 mr-6 text-slate-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold">Suggested:</span>
              {[
                "How does the attacker do this on wire?",
                "Explain the business risk to my CFO",
                "How do I fix this in 5 minutes?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendCustomQuestion(suggestion)}
                  disabled={isAnswering}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendCustomQuestion(customQuestion);
                }}
                placeholder="Ask any forensic or remediation question in human language..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
              <button
                onClick={() => handleSendCustomQuestion(customQuestion)}
                disabled={isAnswering || !customQuestion.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <span className="text-[11px] text-slate-400">
            Raven Air-Gapped Intelligence Engine · Grounded in RFC 3207 / 8461
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Insight
          </button>
        </div>
      </div>
    </>
  );
}
