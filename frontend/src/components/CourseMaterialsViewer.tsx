"use client";

import React, { useState, useEffect, useRef } from "react";
import { CourseMaterial, DocumentUploadResponse } from "@/lib/types";
import { fetchCourseMaterials, uploadCourseMaterial, deleteCourseMaterial } from "@/lib/api";
import {
  BookOpen,
  Upload,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Layers,
  Database,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function CourseMaterialsViewer() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCourseMaterials();
      setMaterials(data);
    } catch (err: any) {
      console.error("Error loading course materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleFileUpload = async (file: File) => {
    const validExtensions = [".pdf", ".md", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadStatus({
        type: "error",
        message: `Unsupported file format. Please upload PDF (.pdf), Markdown (.md), or Plain Text (.txt) files.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const res: DocumentUploadResponse = await uploadCourseMaterial(file);
      setUploadStatus({
        type: "success",
        message: `Indexed "${res.filename}" into ChromaDB! Created ${res.chunks_created} semantic chunks ready for RAG.`,
      });
      await loadMaterials();
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to process and index the document.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to remove "${filename}" from the vector index?`)) return;

    try {
      await deleteCourseMaterial(filename);
      setUploadStatus({
        type: "success",
        message: `Removed "${filename}" from the active knowledge base.`,
      });
      await loadMaterials();
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to delete document.",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const totalChunks = materials.reduce((acc, m) => acc + (m.total_chunks || 0), 0);

  const getTypeBadge = (type: string) => {
    const t = type.toUpperCase();
    if (t === "PDF") {
      return {
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: <FileText className="w-3.5 h-3.5 text-rose-400" />,
      };
    }
    if (t === "MARKDOWN" || t === "MD") {
      return {
        badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        icon: <FileCode className="w-3.5 h-3.5 text-indigo-400" />,
      };
    }
    return {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <File className="w-3.5 h-3.5 text-amber-400" />,
    };
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Course Knowledge Base & Reference Materials
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                RAG Sources
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Curriculum documents, notes, and textbooks actively referenced by the AI Tutor and Diagnostic plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{totalChunks}</span> Chunks Indexed
          </span>

          <button
            type="button"
            onClick={loadMaterials}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Refresh Knowledge Base"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.005]"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-200">
              {isUploading
                ? "Extracting text, computing dense embeddings & indexing into ChromaDB..."
                : "Click or drag & drop course notes, textbooks, or syllabus files here"}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Supports <strong className="text-zinc-400">PDF (.pdf)</strong>, <strong className="text-zinc-400">Markdown (.md)</strong>, and <strong className="text-zinc-400">Plain Text (.txt)</strong> up to 30MB
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {uploadStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            uploadStatus.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{uploadStatus.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setUploadStatus(null)}
            className="text-zinc-400 hover:text-white text-xs font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Active Course Reference Sources ({materials.length})
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading vector store index...
          </div>
        ) : materials.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800">
            No course materials indexed yet. Upload a syllabus PDF or note above to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials.map((mat) => {
              const typeMeta = getTypeBadge(mat.file_type);

              return (
                <div
                  key={mat.filename}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-colors"
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${typeMeta.badge}`}>
                        {typeMeta.icon}
                        {mat.file_type}
                      </span>

                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          mat.is_default
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {mat.is_default ? "University Core" : "Custom Upload"}
                      </span>
                    </div>

                    {/* Title & Filename */}
                    <h4 className="text-xs font-semibold text-white line-clamp-1" title={mat.title}>
                      {mat.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono line-clamp-1 mt-0.5" title={mat.filename}>
                      {mat.filename}
                    </p>

                    {/* Section Tags */}
                    {mat.sections && mat.sections.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {mat.sections.slice(0, 3).map((sec, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 truncate max-w-[150px]"
                            title={sec}
                          >
                            {sec}
                          </span>
                        ))}
                        {mat.sections.length > 3 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500">
                            +{mat.sections.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-300">{mat.total_chunks} chunks</span>
                      <span>•</span>
                      <span>{formatBytes(mat.size_bytes)}</span>
                    </div>

                    {!mat.is_default && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mat.filename);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
