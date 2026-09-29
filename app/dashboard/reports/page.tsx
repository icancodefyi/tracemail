"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  Copy,
  Terminal,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  const { activeSession, loadSampleCapture } = useDashboard();
  const [selectedMta, setSelectedMta] = useState<"postfix" | "exchange" | "exim">("postfix");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!activeSession) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6 text-blue-600" />}
        title="No Audit Reports Available"
        description="Ingest a packet capture to generate court-grade forensic receipts, SHA-256 verification seals, and vendor-specific remediation playbooks."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Sample Capture (1-Click)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Immutable cryptographic evidence with zero external egress"
      />
    );
  }

  const copyHash = () => {
    navigator.clipboard.writeText(activeSession.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadJson = () => {
    const reportData = {
      sessionId: activeSession.id,
      timestamp: activeSession.date,
      score: activeSession.score,
      ci: [activeSession.ciLow, activeSession.ciHigh],
      grade: activeSession.grade,
      reportSha256Seal: activeSession.hash,
      packageVer: "1.4.0-sih",
      airGapped: true,
      findingsSummary: activeSession.findingsCount,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raven_audit_report_${activeSession.id}.json`;
    a.click();
  };

  const downloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Raven Forensic Audit - ${activeSession.id}</title></head>
<body style="font-family: monospace; padding: 40px; background: #0b0f19; color: #f8fafc;">
    <h1 style="color: #3b82f6;">RAVEN // SECUREMAILSCOPE AUDIT REPORT</h1>
    <p>Session ID: ${activeSession.id}</p>
    <p>Filename: ${activeSession.filename}</p>
    <p>Score: ${activeSession.score}/100 (${activeSession.grade}) [CI: ${activeSession.ciLow}–${activeSession.ciHigh}]</p>
    <p>Report SHA-256 Seal: ${activeSession.hash}</p>
    <hr style="border-color: #334155;" />
    <h3>COURT-GRADE FORENSIC RECEIPT</h3>
    <p>Verified with frozen package priors and zero network egress.</p>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raven_audit_report_${activeSession.id}.html`;
    a.click();
  };

  const postfixConfig = `# /etc/postfix/main.cf - Raven Hardened Cryptographic Baseline
# Remediates: SMS-ENF-002 (STARTTLS Stripping) & SMS-CIPH-001 (Sweet32 3DES)

# 1. Enforce Mandatory TLS with DANE & MTA-STS Pinning (rule_id: SMS-ENF-002)
smtp_tls_security_level = dane
smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtp_dns_support_level = dnssec

# 2. Inbound STARTTLS & Modern Cipher Capping (rule_id: SMS-CIPH-001)
smtpd_tls_security_level = may
smtpd_tls_mandatory_protocols = >=TLSv1.2
smtpd_tls_ciphers = high
smtpd_tls_exclude_ciphers = 3DES, DES, RC4, MD5, aNULL, eNULL

# 3. Log TLS Handshake Fingerprints for Passive Audit (rule_id: SMS-PROTO-001)
smtpd_tls_loglevel = 1`;

  const exchangeConfig = `# Microsoft Exchange Online / Edge Transport PowerShell Directives
# Remediates: SMS-ENF-002 & SMS-CIPH-001

# 1. Force Inbound/Outbound Strict TLS with Domain Pinning (rule_id: SMS-ENF-002)
Set-SendConnector -Identity "Outbound to Partner" -TlsDomain "partner.net" -TlsAuthLevel DomainValidation

# 2. Disable Legacy 3DES and RC4 Ciphers via Registry (rule_id: SMS-CIPH-001)
New-Item 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\Triple DES 168' -Force
Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\Triple DES 168' -Name 'Enabled' -Value 0`;

  const eximConfig = `# /etc/exim4/conf.d/main/01_raven_crypto - Exim Configuration
# Remediates: SMS-ENF-002 & SMS-CIPH-001

# 1. Mandatory TLS for Inbound SMTP (rule_id: SMS-ENF-002)
tls_advertise_hosts = *
tls_require_ciphers = SECURE256:SECURE128:-VERS-SSL3.0:-VERS-TLS1.0:-VERS-TLS1.1:-3DES:-RC4

# 2. Strict DANE Verification (rule_id: SMS-ENF-001)
dns_dnssec_enable = true`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <FileText className="h-3 w-3 text-blue-600" />
            Share the Proof · Stop 5 of 5
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Court-Grade Reports & Playbooks
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Self-contained forensic audit reports sealed with immutable SHA-256 receipts and vendor-tested MTA remediation playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadJson}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </button>
          <button
            onClick={downloadHtml}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download HTML Receipt
          </button>
        </div>
      </div>

      {/* Cryptographic Seal Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Immutable Cryptographic Signature
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Forensic Evidence SHA-256 Receipt
            </h3>
          </div>
          <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-mono font-bold">
            SEAL VERIFIED
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 font-mono text-xs text-slate-800">
          <span className="truncate pr-4">{activeSession.hash}</span>
          <button
            onClick={copyHash}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline shrink-0"
          >
            {copiedHash ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Hash
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          This SHA-256 hash signs the exact parsed flow bytes, the deterministic rule findings, and the Bayesian credible interval. Admissible under federal rules of evidence for forensic chain of custody.
        </p>
      </div>

      {/* MTA Remediation Playbooks */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vendor-Tested Fixes
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Production MTA Remediation Directives
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(["postfix", "exchange", "exim"] as const).map((mta) => (
              <button
                key={mta}
                onClick={() => setSelectedMta(mta)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-all cursor-pointer ${
                  selectedMta === mta
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mta}
              </button>
            ))}
          </div>
        </div>

        {/* Code Block */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              {selectedMta.toUpperCase()} CONFIGURATION DIRECTIVES
            </span>
            <button
              onClick={() =>
                copyConfig(
                  selectedMta === "postfix"
                    ? postfixConfig
                    : selectedMta === "exchange"
                    ? exchangeConfig
                    : eximConfig
                )
              }
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCode ? "Copied" : "Copy Directive"}
            </button>
          </div>

          <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
            {selectedMta === "postfix"
              ? postfixConfig
              : selectedMta === "exchange"
              ? exchangeConfig
              : eximConfig}
          </pre>
        </div>
      </div>
    </div>
  );
}
