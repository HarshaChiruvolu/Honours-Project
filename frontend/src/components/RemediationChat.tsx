"use client";

import React, { useState } from "react";
import { ChatMessage, ChatResponse } from "@/lib/types";
import { sendChatMessage } from "@/lib/api";
import { MessageSquare, Send, Sparkles, BookOpen, Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface RemediationChatProps {
  studentContext?: any;
}

export function RemediationChat({ studentContext }: RemediationChatProps) {
  // Extract predicted score and tier
  const predictedScore = studentContext?.prediction?.predicted_score ?? studentContext?.predicted_score;
  const isPass =
    studentContext?.prediction?.pass_fail_status?.toLowerCase() === "pass" ||
    studentContext?.pass_fail_status?.toLowerCase() === "pass";

  const getTierInfo = () => {
    if (predictedScore === undefined || predictedScore === null) {
      return {
        label: "Curriculum Grounded",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        prompts: [
          "Why does recursion cause a stack overflow?",
          "Why use post-order traversal to delete a binary tree?",
          "Compare MergeSort vs QuickSort space complexity",
        ],
      };
    }
    if (predictedScore < 50 || !isPass) {
      return {
        label: `Calibrated: At-Risk Mode (${predictedScore.toFixed(1)}/100)`,
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        prompts: [
          "What is a base case in simple terms?",
          "Why do dangling pointers crash the program?",
          "How does the call stack work?",
        ],
      };
    }
    if (predictedScore < 75) {
      return {
        label: `Calibrated: Gap-Bridging Mode (${predictedScore.toFixed(1)}/100)`,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        prompts: [
          "Why does recursion cause a stack overflow?",
          "Why use post-order traversal to delete a binary tree?",
          "Compare MergeSort vs QuickSort space complexity",
        ],
      };
    }
    return {
      label: `Calibrated: Honors Mode (${predictedScore.toFixed(1)}/100)`,
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      prompts: [
        "How does Tail-Call Optimization achieve O(1) stack space?",
        "Contrast pointer-chasing vs array cache miss latency",
        "Prove Master Theorem bounds for divide & conquer",
      ],
    };
  };

  const tier = getTierInfo();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Academic Tutor at IIIT Kottayam. I can answer any questions regarding recursion, memory models, pointers, or sorting algorithms grounded in your course notes. What would you like to review?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSources, setLastSources] = useState<string[]>([]);

  const quickPrompts = tier.prompts;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(
        textToSend,
        updatedMessages,
        studentContext
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
      setLastSources(response.grounded_sources || []);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection error. Please verify the backend is running at http://localhost:8000.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-[580px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Grounded Course Tutor</h2>
            <p className="text-xs text-zinc-400">Interactive Q&A backed by ChromaDB & Gemini 3.8</p>
          </div>
        </div>

        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${tier.className}`}>
          {tier.label}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";

          return (
            <div
              key={idx}
              className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20 whitespace-pre-wrap text-xs"
                    : "bg-zinc-950/80 border border-zinc-800 text-zinc-200 rounded-bl-none"
                }`}
              >
                {isUser ? m.content : <MarkdownRenderer content={m.content} />}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Consulting lecture notes & synthesizing response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sources Ribbon */}
      {lastSources.length > 0 && (
        <div className="py-2 px-3 rounded-lg bg-zinc-950/90 border border-zinc-800/80 mb-3 flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-zinc-300 shrink-0">Sources:</span>
          <div className="flex flex-wrap gap-1.5 truncate">
            {lastSources.map((src, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question on your curriculum..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
