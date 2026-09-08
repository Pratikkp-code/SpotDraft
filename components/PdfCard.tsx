"use client";

import Link from "next/link";
import { FileText, MessageSquare, Share2, Clock, Sparkles, Bot, ArrowRight } from "lucide-react";
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
    <div className="group flex flex-col justify-between bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] hover:border-[#333333] rounded-2xl p-5 shadow-lg transition-all duration-200">
      <div className="space-y-3">
        {/* Card Top Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#0099ff]" />
            </div>
            <div className="min-w-0">
              <h3
                className="text-xs font-semibold text-white truncate group-hover:text-[#0099ff] transition-colors"
                title={filename}
              >
                {filename}
              </h3>
              <span className="text-[10px] text-[#999999] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>
          </div>

          <button
            onClick={handleShare}
            title="Share Document Link"
            className="p-1.5 rounded-full bg-[#090909] border border-[#262626] text-[#999999] hover:text-white hover:border-[#0099ff]/50 transition-all shrink-0 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Summary Preview */}
        <div className="bg-[#090909] border border-[#262626] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#0099ff] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Insight</span>
          </div>
          <p className="text-xs text-[#999999] line-clamp-3 leading-relaxed">
            {summary || "AI executive summary processing..."}
          </p>
        </div>
      </div>

      {/* Card Footer Badges & Action */}
      <div className="pt-4 mt-4 border-t border-[#262626] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] text-[#999999]">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {commentCount}
          </span>
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            {chatCount}
          </span>
        </div>

        <Link
          href={`/pdf/${id}`}
          className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-medium rounded-full transition-all flex items-center gap-1 shadow-sm"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3 h-3" />
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
