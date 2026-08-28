import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ThresholdBadgeProps {
  count: number;
  threshold: number;
  type?: "project" | "staff";
}

export const ThresholdBadge: React.FC<ThresholdBadgeProps> = ({
  count,
  threshold,
  type = "project",
}) => {
  const isAboveThreshold = count > threshold;
  const isAtThreshold = count === threshold;
  const labelText = type === "project" ? "project" : "staff";

  // Build the dynamic tooltip text
  const tooltipText = isAboveThreshold
    ? `Exceeds ${labelText} limit (> ${threshold})`
    : isAtThreshold
      ? `At max ${labelText} limit (= ${threshold})`
      : `Within target limit (< ${threshold})`;

  return (
    <div className="relative group/tooltip inline-flex items-center justify-center">
      {/* 1. Above Threshold (Exceeded) -> Rose / Red */}
      {isAboveThreshold && (
        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs hover:scale-105 hover:bg-rose-100 transition-all cursor-pointer select-none">
          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{count}</span>
        </span>
      )}

      {/* 2. Exactly At Threshold (Warning) -> Amber / Yellow */}
      {isAtThreshold && (
        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs hover:scale-105 hover:bg-amber-100 transition-all cursor-pointer select-none">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
          <span>{count}</span>
        </span>
      )}

      {/* 3. Below Threshold (Optimal) -> Emerald / Green */}
      {!isAboveThreshold && !isAtThreshold && (
        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/80 shadow-2xs hover:scale-105 hover:bg-emerald-100/80 transition-all cursor-pointer select-none">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{count}</span>
        </span>
      )}

      {/* Modern Custom Tooltip Popup */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:flex flex-col items-center z-50 pointer-events-none whitespace-nowrap">
        <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md border border-slate-800">
          {tooltipText}
        </div>
        {/* Tooltip Arrow Indicator */}
        <div className="w-2 h-2 -mt-1 rotate-45 bg-slate-900 border-r border-b border-slate-800" />
      </div>
    </div>
  );
};
