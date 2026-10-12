"use client";

import React, { useState } from "react";
import { StudentInput } from "@/lib/types";
import { Sliders, Sparkles, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";

interface StudentInputFormProps {
  onSubmit: (input: StudentInput) => void;
  isLoading: boolean;
}

const PRESETS: Record<string, StudentInput> = {
  atRisk: {
    gender: "Male",
    study_hours_per_week: 12.0,
    attendance_rate: 62.5,
    past_exam_scores: 52.0,
    parental_education_level: "High School",
    internet_access_at_home: "Yes",
    extracurricular_activities: "No",
  },
  borderline: {
    gender: "Female",
    study_hours_per_week: 22.0,
    attendance_rate: 74.0,
    past_exam_scores: 61.0,
    parental_education_level: "Bachelors",
    internet_access_at_home: "Yes",
    extracurricular_activities: "Yes",
  },
  highAchiever: {
    gender: "Female",
    study_hours_per_week: 36.0,
    attendance_rate: 94.0,
    past_exam_scores: 88.0,
    parental_education_level: "Masters",
    internet_access_at_home: "Yes",
    extracurricular_activities: "Yes",
  },
};

export function StudentInputForm({ onSubmit, isLoading }: StudentInputFormProps) {
  const [formData, setFormData] = useState<StudentInput>(PRESETS.atRisk);

  const handleChange = (field: keyof StudentInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      setFormData(PRESETS[presetKey]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Student Diagnostic Profile</h2>
            <p className="text-xs text-zinc-400">Configure academic metrics for ML inference</p>
          </div>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset("atRisk")}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            At-Risk
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("borderline")}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Borderline
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("highAchiever")}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            High Achiever
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sliders Grid */}
        <div className="space-y-4">
          {/* Study Hours */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-medium text-zinc-300">Weekly Self-Study Time</label>
              <span className="font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {formData.study_hours_per_week} hrs/week
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={formData.study_hours_per_week}
              onChange={(e) => handleChange("study_hours_per_week", parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>0 hrs (Deficit risk)</span>
              <span>30 hrs</span>
              <span>60 hrs</span>
            </div>
          </div>

          {/* Attendance */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-medium text-zinc-300">Lecture Attendance Rate</label>
              <span className="font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {formData.attendance_rate.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.attendance_rate}
              onChange={(e) => handleChange("attendance_rate", parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>0%</span>
              <span>75% (IIIT Min)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Past Exam Scores */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-medium text-zinc-300">Previous Exam Scores Average</label>
              <span className="font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {formData.past_exam_scores.toFixed(1)} / 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.past_exam_scores}
              onChange={(e) => handleChange("past_exam_scores", parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>0 (Critical Deficit)</span>
              <span>60 (Pass Threshold)</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Parental Edu</label>
            <select
              value={formData.parental_education_level}
              onChange={(e) => handleChange("parental_education_level", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="High School">High School</option>
              <option value="Bachelors">Bachelors</option>
              <option value="Masters">Masters</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Home Internet</label>
            <select
              value={formData.internet_access_at_home}
              onChange={(e) => handleChange("internet_access_at_home", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Extracurriculars</label>
            <select
              value={formData.extracurricular_activities}
              onChange={(e) => handleChange("extracurricular_activities", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Computing SHAP & Grounded Remediation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Diagnostic Analysis & Adaptive RAG</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
