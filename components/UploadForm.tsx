"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, FileCheck, Sparkles } from "lucide-react";

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccess(false);

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20MB limit.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setStatusMessage("Extracting text and analyzing with Gemini...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/pdfs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload and process PDF");
      }

      setSuccess(true);
      setStatusMessage("Document processed and summarized successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected upload error occurred"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Upload PDF Document</h3>
          <p className="text-xs text-[#999999] mt-0.5">
            Indexed automatically for instant AI executive summary & grounded chat
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
          isDragging
            ? "border-[#0099ff] bg-[#0099ff]/5"
            : selectedFile
            ? "border-emerald-500/50 bg-emerald-950/10"
            : "border-[#262626] bg-[#090909] hover:border-[#0099ff]/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-[#0099ff]">
          {selectedFile ? <FileCheck className="w-6 h-6 text-emerald-400" /> : <Upload className="w-6 h-6" />}
        </div>

        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white truncate max-w-xs">
              {selectedFile.name}
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium text-white">
              Drag & drop your PDF contract or report here
            </p>
            <p className="text-[11px] text-[#999999]">
              Or click to browse files from your computer (Max 16MB)
            </p>
          </div>
        )}
      </div>

      {/* Action Submit */}
      {selectedFile && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-[#999999] hover:text-white transition-colors"
          >
            Clear Selection
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-2.5 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-semibold rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Upload & Generate AI Summary</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
