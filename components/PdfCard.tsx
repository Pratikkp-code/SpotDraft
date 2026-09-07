"use client";

import Link from "next/link";
import { FileText, MessageSquare, MessagesSquare, ArrowUpRight, Share2, Calendar } from "lucide-react";
import React, { useState } from "react";

export interface PdfCardProps {
  id: string;
  filename: string;
  summary: string | null;
  uploadedAt: string | Date;
  shareToken: string;
  commentCount?: number;
  chatCount?: number;
  onShareClick?: (shareToken: string, filename: string) => void;
}

export function PdfCard({
  id,
  filename,
  summary,
  uploadedAt,
  shareToken,
  commentCount = 0,
  chatCount = 0,
  onShareClick,
}: PdfCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShareClick) {
      onShareClick(shareToken, filename);
    } else {
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5">
      <div>
        {/* Header with Title and Share button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors" title={filename}>
                {filename}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            title="Copy share link"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-400 transition-colors shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mt-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
          <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1">
            <span>Executive Summary</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {summary || "Summary generation in progress or text unavailable."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <MessagesSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{commentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{chatCount}</span>
          </div>
        </div>

        <Link
          href={`/pdf/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Open Document</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {copied && (
        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-lg animate-in fade-in">
          Link copied!
        </div>
      )}
    </div>
  );
}
