"use client";

import React from "react";
import { PredictionResult } from "@/lib/types";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Target, ShieldCheck } from "lucide-react";

interface ScoreBadgeProps {
  prediction: PredictionResult;
}

export function ScoreBadge({ prediction }: ScoreBadgeProps) {
  const isPass = prediction.pass_fail_status === "Pass";

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-sm shadow-xl transition-all ${
      isPass
        ? "bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-900/90 border-emerald-500/30 shadow-emerald-500/5"
        : "bg-gradient-to-br from-rose-950/40 via-zinc-900/90 to-zinc-900/90 border-rose-500/30 shadow-rose-500/5"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-indigo-400" />
          Predictive Assessment
        </span>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
          isPass
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
        }`}>
          {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          <span>{isPass ? "PROJECTED PASS" : "ACADEMIC RISK / FAIL"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-white">
              {prediction.predicted_score.toFixed(1)}
            </span>
            <span className="text-zinc-500 text-sm font-medium">/ 100</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Passing Threshold: <span className="font-semibold text-zinc-200">{prediction.passing_threshold} pts</span>
          </p>
        </div>

        <div className="flex flex-col sm:items-end">
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${
            prediction.score_margin >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}>
            {prediction.score_margin >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {prediction.score_margin >= 0 ? "+" : ""}
              {prediction.score_margin.toFixed(1)} pts margin
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5">
            {prediction.score_margin >= 0 ? "Above passing boundary" : "Deficit to close for passing"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Ensemble Variance Reduced via Feature Sampling
        </span>
        <span className="font-mono text-zinc-500">B=100 Trees</span>
      </div>
    </div>
  );
}
