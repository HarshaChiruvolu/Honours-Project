import React from "react";
import { GraduationCap, Sparkles, Binary, Database } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20 text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Explainable Adaptive Learning System
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Honours Prototype
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Department of Computer Science & Engineering • IIIT Kottayam
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
            <span>Random Forest & TreeSHAP</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>ChromaDB Vector RAG</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>LangChain & Gemini 3.8</span>
          </div>
        </div>
      </div>
    </header>
  );
}
