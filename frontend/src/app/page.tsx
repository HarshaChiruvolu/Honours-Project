"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { StudentInputForm } from "@/components/StudentInputForm";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ShapWaterfallChart } from "@/components/ShapWaterfallChart";
import { RetrievedTopicsCard } from "@/components/RetrievedTopicsCard";
import { RemediationRoadmap } from "@/components/RemediationRoadmap";
import { RemediationChat } from "@/components/RemediationChat";
import { CourseMaterialsViewer } from "@/components/CourseMaterialsViewer";
import { StudentInput, AnalyzeResponse } from "@/lib/types";
import { analyzeStudent } from "@/lib/api";
import { Sparkles, Binary, Database, Cpu, MessageSquare, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);

  const handleAnalyze = async (input: StudentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeStudent(input);
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to connect to the backend microservice at http://localhost:8000"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-zinc-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Outcome Badge */}
          <div className="lg:col-span-5 space-y-6">
            <StudentInputForm onSubmit={handleAnalyze} isLoading={isLoading} />

            {analysis && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ScoreBadge prediction={analysis.prediction} />
              </div>
            )}

            {/* Quick Chat Toggle Button */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Interactive Curriculum Tutor
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Ask grounded questions to Gemini 3.8
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                {showChat ? "Hide Tutor" : "Open Tutor"}
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic XAI & RAG Results */}
          <div className="lg:col-span-7 space-y-6">
            {showChat && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <RemediationChat studentContext={analysis} />
              </div>
            )}

            {analysis ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* 1. SHAP Waterfall Chart */}
                <ShapWaterfallChart explainability={analysis.explainability} />

                {/* 2. Vector Retrieval Matches */}
                <RetrievedTopicsCard topics={analysis.retrieved_curriculum} />

                {/* 3. Adaptive Remediation Roadmap & Problems */}
                <RemediationRoadmap remediation={analysis.remediation} />
              </div>
            ) : (
              /* Empty State: System Architecture Guide */
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Cpu className="w-8 h-8" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    Diagnostic AI Pipeline Ready
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Adjust the student features on the left or click a demo preset (e.g.{" "}
                    <span className="text-rose-400 font-semibold">At-Risk</span>) to execute the end-to-end
                    Random Forest, TreeSHAP, ChromaDB, and LangChain pipeline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-4 border-t border-zinc-800/80">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <Binary className="w-3.5 h-3.5" />
                      <span>1. TreeSHAP XAI</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Decomposes predictions into exact additive feature deficits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Database className="w-3.5 h-3.5" />
                      <span>2. ChromaDB RAG</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Queries 384-d latent vectors to match specific deficits.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>3. LangChain GenAI</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Synthesizes deterministic recovery roadmaps via Gemini 3.8.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Materials & Reference Knowledge Base (PDF, Markdown, Text RAG) */}
        <div className="pt-4">
          <CourseMaterialsViewer />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-4 text-center text-xs text-zinc-500">
        <p>B.Tech Honours Project • Indian Institute of Information Technology (IIIT) Kottayam</p>
      </footer>
    </div>
  );
}
