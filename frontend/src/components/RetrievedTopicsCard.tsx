"use client";

import React, { useState } from "react";
import { RetrievedCurriculumChunk } from "@/lib/types";
import { BookOpen, Database, ChevronDown, ChevronUp, CheckCheck } from "lucide-react";

interface RetrievedTopicsCardProps {
  topics: RetrievedCurriculumChunk[];
}

export function RetrievedTopicsCard({ topics }: RetrievedTopicsCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Diagnostic-Triggered Vector Retrieval</h2>
            <p className="text-xs text-zinc-400">Curriculum chunks matched via Cosine Proximity in ChromaDB</p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
          Top-2 Concepts
        </div>
      </div>

      <div className="space-y-3">
        {topics.map((topic, idx) => {
          const isExpanded = expandedIndex === idx;
          const simScore = Math.max(0, Math.min(100, (topic.similarity_score * 100)));

          return (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden transition-all"
            >
              <div
                onClick={() => toggleExpand(idx)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{topic.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Section: {topic.section}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {simScore.toFixed(1)}%
                    </span>
                    <span className="block text-[10px] text-zinc-500">Cosine Similarity</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-800/80 bg-zinc-900/30">
                  <div className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    {topic.excerpt}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Injected into LangChain Prompt Context Window for Zero Hallucination</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
