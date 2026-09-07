"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Share2,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Bot,
} from "lucide-react";
import { PdfViewer } from "@/components/PdfViewer";
import { CommentPanel } from "@/components/CommentPanel";
import { ChatPanel } from "@/components/ChatPanel";

interface PdfData {
  id: string;
  filename: string;
  summary: string | null;
  extractedText: string;
  shareToken: string;
  uploadedAt: string;
  downloadUrl?: string | null;
}

export default function OwnerPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pdf, setPdf] = useState<PdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "comments">("chat");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetch(`/api/pdfs/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to load document");
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
    }
  }, [id, status, router]);

  const handleCopyShareLink = () => {
    if (!pdf) return;
    const url = `${window.location.origin}/shared/${pdf.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (status === "loading" || loading) {
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
          <h3 className="text-lg font-bold text-white">Access Denied</h3>
          <p className="text-xs text-slate-400">{error || "Document not found"}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
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
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white truncate" title={pdf.filename}>
                {pdf.filename}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Guest Link</span>
            </button>
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
          {/* Left Column: PDF Viewer (7 cols on large screens) */}
          <div className="lg:col-span-7 h-[650px] sm:h-[750px]">
            <PdfViewer
              url={pdf.downloadUrl}
              filename={pdf.filename}
              extractedText={pdf.extractedText}
            />
          </div>

          {/* Right Column: Tabbed Chat & Comments (5 cols on large screens) */}
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
                <span>Notes & Comments</span>
              </button>
            </div>

            {/* Active Panel Component */}
            <div className="flex-1 min-h-0">
              {activeTab === "chat" ? (
                <ChatPanel pdfId={pdf.id} isOwner={true} />
              ) : (
                <CommentPanel
                  pdfId={pdf.id}
                  isOwner={true}
                  currentUserName={session?.user?.name || "Owner"}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Link Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">
              Share Document With Guests
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anyone with this link can view the document, chat with AI, and leave comments without creating an account.
            </p>

            <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${pdf.shareToken}`}
                className="w-full bg-transparent text-xs text-slate-300 px-2 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`/shared/${pdf.shareToken}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Open in Incognito / Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
