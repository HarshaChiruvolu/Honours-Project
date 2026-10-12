"use client";

import React from "react";
import { ExplainResult } from "@/lib/types";
import { Info, BarChart3, HelpCircle, ArrowRight } from "lucide-react";

interface ShapWaterfallChartProps {
  explainability: ExplainResult;
}

export function ShapWaterfallChart({ explainability }: ShapWaterfallChartProps) {
  const maxAbsShap = Math.max(
    ...explainability.feature_impacts.map((f) => Math.abs(f.shap_value)),
    8.0
  );

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Local Explainability (TreeSHAP)</h2>
            <p className="text-xs text-zinc-400">Additive feature decomposition for this individual student</p>
          </div>
        </div>

        {/* Global Baseline Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-xs">
          <span className="text-zinc-400">Cohort Mean E[f(X)]:</span>
          <span className="font-mono font-bold text-indigo-400">{explainability.base_value} pts</span>
        </div>
      </div>

      {/* Mathematical Axiom Equation Ribbon */}
      <div className="mb-5 px-3.5 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-mono">
          <span className="text-indigo-400 font-semibold">f(x)</span>
          <span>=</span>
          <span>E[f(X)]</span>
          <span className="text-zinc-500">+</span>
          <span className="text-emerald-400">Σ φ_i</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Efficiency Axiom Guaranteed (Sum of SHAP values = Prediction - Base)
        </div>
      </div>

      {/* Feature Attribution Horizontal Bars */}
      <div className="space-y-3.5">
        {explainability.feature_impacts.map((item) => {
          const isNegative = item.shap_value < 0;
          const barWidthPercent = Math.min(100, (Math.abs(item.shap_value) / maxAbsShap) * 100);

          return (
            <div key={item.feature} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-200">{item.display_name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-semibold ${
                    isNegative ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {item.shap_value >= 0 ? "+" : ""}
                    {item.shap_value.toFixed(2)} pts
                  </span>
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                    isNegative
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {item.impact_category}
                  </span>
                </div>
              </div>

              {/* Centered zero-axis comparative bar */}
              <div className="grid grid-cols-2 gap-1 h-3.5 bg-zinc-950/80 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                {/* Left (Negative) Column */}
                <div className="flex justify-end">
                  {isNegative && (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="h-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-l-full shadow-sm shadow-rose-500/40"
                    />
                  )}
                </div>
                {/* Right (Positive) Column */}
                <div className="flex justify-start">
                  {!isNegative && (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-r-full shadow-sm shadow-emerald-500/40"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic Trigger Footnote */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-start gap-2 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-zinc-200">Diagnostic-Triggered Pipeline:</strong> The features identified in red
          represent specific individual deficits. These exact deficits are translated into dense vector queries
          to retrieve corresponding course modules from ChromaDB.
        </p>
      </div>
    </div>
  );
}
