"use client";

import React, { useState } from "react";
import { RemediationPlan } from "@/lib/types";
import { Calendar, CheckSquare, HelpCircle, Lightbulb, Sparkles, BookCheck, Clock } from "lucide-react";

interface RemediationRoadmapProps {
  remediation: RemediationPlan;
}

export function RemediationRoadmap({ remediation }: RemediationRoadmapProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDifficultyBadge = (difficulty: string) => {
    const d = (difficulty || "").toLowerCase();
    if (d.includes("easy")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (d.includes("hard") || d.includes("adv")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const currentDayData = remediation.roadmap.find((r) => r.day === activeDay) || remediation.roadmap[0];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Adaptive Remediation Plan</h2>
            <p className="text-xs text-zinc-400">Synthesized via LangChain LCEL & Google Gemini 3.8</p>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
          Grounded Output
        </span>
      </div>

      {/* Diagnostic Summary Callout */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-zinc-950/40 border border-purple-500/20">
        <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          Diagnostic Summary & Prescription
        </h4>
        <p className="text-xs text-zinc-200 leading-relaxed">
          {remediation.diagnostic_summary}
        </p>
      </div>

      {/* 3-Day Recovery Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            3-Day Adaptive Recovery Roadmap
          </h3>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentDayData?.allocated_hours || 2.5} hrs planned
          </span>
        </div>

        {/* Day Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {remediation.roadmap.map((dayPlan) => {
            const isSelected = dayPlan.day === activeDay;
            return (
              <button
                key={dayPlan.day}
                type="button"
                onClick={() => setActiveDay(dayPlan.day)}
                className={`py-2 px-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <div className="text-[11px] font-bold">Day {dayPlan.day}</div>
                <div className="text-[10px] truncate opacity-90">{dayPlan.focus_topic}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Checklist */}
        {currentDayData && (
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex justify-between items-baseline">
              <h4 className="text-sm font-semibold text-white">
                {currentDayData.focus_topic}
              </h4>
              <span className="text-xs font-mono font-medium text-indigo-400">
                {currentDayData.allocated_hours} Hours Allocated
              </span>
            </div>

            <ul className="space-y-2 pt-1">
              {currentDayData.action_items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Targeted Diagnostic Practice Problems */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
          <BookCheck className="w-3.5 h-3.5 text-indigo-400" />
          Targeted Diagnostic Practice Problems
        </h3>

        <div className="space-y-4">
          {remediation.practice_problems.map((prob) => {
            const hasHint = revealedHints[prob.id];
            const hasSol = revealedSolutions[prob.id];

            return (
              <div
                key={prob.id}
                className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300">{prob.topic}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyBadge(prob.difficulty)}`}>
                    {prob.difficulty}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {prob.question}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleHint(prob.id)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-amber-400 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{hasHint ? "Hide Hint" : "Reveal Hint"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSolution(prob.id)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-400 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <BookCheck className="w-3.5 h-3.5" />
                    <span>{hasSol ? "Hide Expected Solution" : "Reveal Approach"}</span>
                  </button>
                </div>

                {hasHint && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <strong>Conceptual Hint:</strong> {prob.hint}
                  </div>
                )}

                {hasSol && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <strong>Expected Approach & Complexity:</strong> {prob.expected_approach}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
