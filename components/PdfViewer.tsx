"use client";

import React, { useState } from "react";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from "lucide-react";

interface PdfViewerProps {
  url?: string | null;
  filename: string;
  extractedText?: string;
}

export function PdfViewer({ url, filename, extractedText }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"viewer" | "text">(
    url ? "viewer" : "text"
  );

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs" title={filename}>
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("viewer")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                viewMode === "viewer"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Document
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                viewMode === "text"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Extracted Text
            </button>
          </div>

          {/* Zoom controls for viewer */}
          {viewMode === "viewer" && url && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 px-1 font-mono">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {url && (
            <a
              href={url}
              download={filename}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Download Original PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-950 relative overflow-auto min-h-[450px] sm:min-h-[600px]">
        {viewMode === "viewer" ? (
          url ? (
            <div
              className="w-full h-full flex items-center justify-center p-2"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <iframe
                src={`${url}#toolbar=0`}
                title={filename}
                className="w-full h-[750px] rounded-xl border border-slate-800 bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-semibold text-white">
                  Inline PDF Preview
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Storage URL is generating or file is stored locally. You can switch to the &quot;Extracted Text&quot; tab above to review the complete indexed content.
                </p>
              </div>
              <button
                onClick={() => setViewMode("text")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                View Extracted Text
              </button>
            </div>
          )
        ) : (
          <div className="p-6">
            <div className="max-w-3xl mx-auto bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                  Document Text Extracted by pdf-parse
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {extractedText ? `${extractedText.length.toLocaleString()} characters` : "0 characters"}
                </span>
              </div>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {extractedText || "No text could be extracted from this document."}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
