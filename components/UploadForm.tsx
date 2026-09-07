"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            Upload Document
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            PDF documents up to 20MB. AI will automatically summarize and index.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3 mb-4 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-950/20"
            : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white max-w-xs truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <p className="text-xs text-indigo-400 mt-2 font-medium">
              Click &apos;Upload & Summarize&apos; to begin
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Drag and drop your PDF here, or{" "}
              <span className="text-indigo-400 underline underline-offset-4">
                browse files
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports agreements, reports, whitepapers, manuals
            </p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage || "Processing..."}</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload & Summarize</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
