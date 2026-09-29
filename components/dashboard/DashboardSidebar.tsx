"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ShieldCheck,
  Network,
  Search,
  FileText,
  PlaySquare,
  Bot,
  Crosshair,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  HelpCircle,
  Shield,
  Layers,
  Lock,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isAirGapped } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);
  const [modulesExpanded, setModulesExpanded] = useState(true);

  // Golden Path: 5 sequential stops per user workflow
  const goldenPathItems = [
    {
      step: "1",
      label: "Ingest PCAP",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "START",
    },
    {
      step: "2",
      label: "Posture Answer",
      href: "/dashboard/posture",
      icon: ShieldCheck,
      badge: "SCORE",
    },
    {
      step: "3",
      label: "Forensic Findings",
      href: "/dashboard/findings",
      icon: Search,
      badge: "FIX",
    },
    {
      step: "4",
      label: "Delivery Graph",
      href: "/dashboard/graph",
      icon: Network,
      badge: "HOPS",
    },
    {
      step: "5",
      label: "Audit Reports",
      href: "/dashboard/reports",
      icon: FileText,
      badge: "PROOF",
    },
  ];

  // Advanced items: Replay, Lens, Integrity, Ask live behind advanced
  const advancedNavItems = [
    {
      label: "Incident Replay",
      href: "/dashboard/replay",
      icon: PlaySquare,
      badge: "FRAME",
    },
    {
      label: "Attack Lens",
      href: "/dashboard/lens",
      icon: Crosshair,
      badge: "FORECAST",
    },
    {
      label: "Integrity Manifest",
      href: "/dashboard/integrity",
      icon: Fingerprint,
      badge: "SHA256",
    },
    {
      label: "Ask RAG Assistant",
      href: "/dashboard/ask",
      icon: Bot,
      badge: "RAG",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-white transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Top Header: Logo + Collapse/Expand button */}
      <div className="flex h-18 items-center justify-between px-5 border-b border-border/60">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/raven_logo.svg"
              alt="Raven SecureMailScope"
              width={140}
              height={36}
              className="h-8 w-auto transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <div className="h-9 w-9 rounded-xl bg-primary-soft flex items-center justify-center text-primary font-black text-lg">
              R
            </div>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Golden Path Section (5 Steps) */}
        <div>
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Audit Workflow (5 Stops)
            </div>
          )}

          <nav className="space-y-1">
            {goldenPathItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Advanced Section: Replay, Lens, Integrity, Ask live behind 'advanced' */}
        <div className="border-t border-slate-100 pt-3">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setModulesExpanded(!modulesExpanded)}
              className="flex w-full items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <span>Advanced Forensics (4)</span>
              {modulesExpanded ? (
                <Minus className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </button>
          )}

          {(modulesExpanded || collapsed) && (
            <nav className="space-y-1 mt-1">
              {advancedNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? "bg-slate-900 text-white font-bold shadow-xs"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            active
                              ? "bg-slate-800 text-slate-200"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Expandable Module Tree (Like in sidebarinspo.png) */}
        {!collapsed && (
          <div className="border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={() => setModulesExpanded(!modulesExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                MTA Inspection Rules
              </span>
              {modulesExpanded ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>

            {modulesExpanded && (
              <div className="mt-1 space-y-0.5 pl-6 pr-2 text-xs text-slate-500">
                <Link
                  href="/dashboard/findings?module=SMS-PROTO"
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  SMS-PROTO (STARTTLS State)
                </Link>
                <Link
                  href="/dashboard/findings?module=SMS-CIPH"
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  SMS-CIPH (Cipher & Sweet32)
                </Link>
                <Link
                  href="/dashboard/findings?module=SMS-X509"
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  SMS-X509 (Cert Validation)
                </Link>
                <Link
                  href="/dashboard/findings?module=SMS-ENF"
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  SMS-ENF (MTA-STS & DANE)
                </Link>
                <Link
                  href="/dashboard/findings?module=SMS-RADAR"
                  className="block rounded-lg px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  SMS-RADAR (Downgrade Radar)
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: Air-Gapped Sovereign Card (matching sidebarinspo.png) */}
      <div className="p-3.5 border-t border-border/60">
        {!collapsed ? (
          <div className="rounded-2xl border border-border/80 bg-surface-soft p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-heading">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Air-Gapped Node
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              {isAirGapped
                ? "100% offline mode active. Passive ingestion with zero external egress."
                : "DNS-enriched mode. Querying DNSSEC & MTA-STS policy daemons."}
            </p>
            <Link
              href="/dashboard/integrity"
              className="inline-flex w-full items-center justify-center rounded-xl border border-primary px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
            >
              Verify SHA-256 Manifest
            </Link>
          </div>
        ) : (
          <Link
            href="/dashboard/integrity"
            className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl border border-primary/40 text-primary hover:bg-primary-soft transition-colors"
            title="Air-Gapped Sovereign Node - Verify Manifest"
          >
            <Lock className="h-4 w-4" />
          </Link>
        )}

        {/* Footer Link: Usages Guide / RFC Reference */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <Link
            href="/#faq"
            className={`flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors ${
              collapsed ? "justify-center" : "px-2"
            }`}
            title="Usage Guide & RFC Specifications"
          >
            <HelpCircle className="h-4 w-4 text-slate-400" />
            {!collapsed && <span>Usages Guide & RFCs</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
