"use client";

import React from "react";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface PipelineStep {
  id: string;
  name: string;
  detail?: string;
  status: StepStatus;
  resultBadge?: string;
}

interface ProgressStepperProps {
  steps: PipelineStep[];
  currentStepIndex: number;
  className?: string;
}

export function ProgressStepper({
  steps,
  currentStepIndex,
  className = "",
}: ProgressStepperProps) {
  return (
    <div className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Cryptographic Pipeline Execution
          </h4>
          <p className="text-[11px] text-slate-500">
            Real-time deterministic forensic stages (Air-gapped Scapy + RFC rule engine)
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          <span>Stage {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100 font-mono text-xs">
        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const isRunning = step.status === "running";
          const isFailed = step.status === "failed";
          const isPending = step.status === "pending";

          return (
            <div
              key={step.id || idx}
              className={`flex items-center justify-between py-2.5 transition-colors ${
                isRunning ? "bg-blue-50/40 px-2 rounded-lg" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center shrink-0">
                  {isDone && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  {isRunning && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {isFailed && (
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  )}
                  {isPending && (
                    <Circle className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>

                <div>
                  <span
                    className={`font-semibold ${
                      isRunning
                        ? "text-blue-900"
                        : isDone
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.name}
                  </span>
                  {step.detail && (
                    <span className="ml-2 text-[11px] text-slate-500 font-normal">
                      · {step.detail}
                    </span>
                  )}
                </div>
              </div>

              {step.resultBadge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    step.resultBadge.toLowerCase().includes("stripped") ||
                    step.resultBadge.toLowerCase().includes("cleartext") ||
                    step.resultBadge.toLowerCase().includes("refused")
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {step.resultBadge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
