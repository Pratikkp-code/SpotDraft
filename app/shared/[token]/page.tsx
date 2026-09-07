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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Document Unavailable</h3>
          <p className="text-xs text-slate-400">
            {error || "The link may have expired or is invalid."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Go to DocuMind Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate" title={pdf.filename}>
                {pdf.filename}
              </h1>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                Shared by <strong className="text-slate-300">{pdf.ownerName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-medium text-emerald-400">
              <Users className="w-3.5 h-3.5" />
              <span>Guest Collaboration Mode</span>
            </div>

            <Link
              href="/signup"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Summary Card at Top */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Executive Summary (Gemini 1.5 Flash)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed select-text">
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
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 mb-3">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "chat"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "comments"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
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
