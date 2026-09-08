"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Loader2,
  Users,
  MessageSquare,
  Bot,
  ArrowRight,
  Shield,
} from "lucide-react";
import { PdfViewer } from "@/components/PdfViewer";
import { CommentPanel } from "@/components/CommentPanel";
import { ChatPanel } from "@/components/ChatPanel";

interface SharedPdfData {
  id: string;
  filename: string;
  summary: string | null;
  uploadedAt: string;
  shareToken: string;
  ownerName: string;
  downloadUrl?: string | null;
  extractedText?: string;
}

export default function SharedGuestPdfPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;

  const [pdf, setPdf] = useState<SharedPdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "comments">("chat");

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Shared document not found");
        }
        return res.json();
      })
      .then((data) => {
        setPdf(data.pdf);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="min-h-screen bg-[#090909] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Document Unavailable</h3>
          <p className="text-xs text-[#999999]">
            {error || "The link may have expired or is invalid."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-semibold rounded-full"
          >
            Go to DocuMind Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col selection:bg-[#0099ff]/30 selection:text-[#0099ff]">
      {/* Top Navbar */}
      <header className="border-b border-[#262626] bg-[#090909]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate" title={pdf.filename}>
                {pdf.filename}
              </h1>
              <span className="text-[11px] text-[#999999] flex items-center gap-1">
                Shared by <strong className="text-white">{pdf.ownerName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-[11px] font-medium text-emerald-400">
              <Users className="w-3.5 h-3.5" />
              <span>Guest Collaboration Mode</span>
            </div>

            <Link
              href="/signup"
              className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#1c1c1c] text-white border border-[#262626] rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Summary — Gradient Spotlight Card */}
        <div className="bg-gradient-to-br from-[#6a4cf5]/20 via-[#141414] to-[#d44df0]/10 border border-[#262626] rounded-[30px] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-[#0099ff] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Executive Summary (Gemini 1.5 Flash)</span>
          </div>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed select-text">
            {pdf.summary || "Summary generation in progress."}
          </p>
        </div>

        {/* Side-by-side or Stacked Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: PDF Viewer */}
          <div className="lg:col-span-7 h-[650px] sm:h-[750px]">
            <PdfViewer
              url={pdf.downloadUrl}
              filename={pdf.filename}
              extractedText={pdf.extractedText}
            />
          </div>

          {/* Right Column: Tabbed Chat & Comments */}
          <div className="lg:col-span-5 flex flex-col h-[650px] sm:h-[750px]">
            {/* Panel Tabs */}
            <div className="flex items-center bg-[#141414] p-1 rounded-full border border-[#262626] mb-3">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-full transition-all ${
                  activeTab === "chat"
                    ? "bg-[#1c1c1c] text-white shadow-md"
                    : "text-[#999999] hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-full transition-all ${
                  activeTab === "comments"
                    ? "bg-[#1c1c1c] text-white shadow-md"
                    : "text-[#999999] hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Guest Comments</span>
              </button>
            </div>

            {/* Active Panel Component */}
            <div className="flex-1 min-h-0">
              {activeTab === "chat" ? (
                <ChatPanel shareToken={pdf.shareToken} isOwner={false} />
              ) : (
                <CommentPanel shareToken={pdf.shareToken} isOwner={false} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
