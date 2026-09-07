"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UploadForm } from "@/components/UploadForm";
import { PdfCard } from "@/components/PdfCard";
import {
  FileText,
  Search,
  Plus,
  LogOut,
  Loader2,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface PdfItem {
  id: string;
  filename: string;
  summary: string | null;
  uploadedAt: string;
  shareToken: string;
  _count?: {
    comments: number;
    chatMessages: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    token: string;
    filename: string;
  }>({
    isOpen: false,
    token: "",
    filename: "",
  });
  const [copied, setCopied] = useState(false);

  // Fetch PDFs from API
  const fetchPdfs = useCallback(async (query = "") => {
    try {
      const res = await fetch(`/api/pdfs?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPdfs(data.pdfs || []);
      }
    } catch (err) {
      console.error("Failed to fetch PDFs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPdfs(searchQuery);
    }
  }, [status, router, fetchPdfs, searchQuery]);

  const handleShareClick = (shareToken: string, filename: string) => {
    setShareModal({
      isOpen: true,
      token: shareToken,
      filename,
    });
    setCopied(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared/${shareModal.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (status === "loading" || (status === "authenticated" && loading && pdfs.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-bold text-base sm:text-lg text-white tracking-tight">
              DocuMind
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">
                {session?.user?.name || "Member"}
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {session?.user?.email}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Document Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse, search, analyze, and collaborate on your PDF documents
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showUpload ? "Close Upload" : "Upload Document"}</span>
            </button>
          </div>
        </div>

        {/* Upload Form Section (collapsible) */}
        {showUpload && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <UploadForm
              onUploadSuccess={() => {
                fetchPdfs(searchQuery);
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* PDF Documents Grid */}
        {pdfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pdfs.map((pdf) => (
              <PdfCard
                key={pdf.id}
                id={pdf.id}
                filename={pdf.filename}
                summary={pdf.summary}
                uploadedAt={pdf.uploadedAt}
                shareToken={pdf.shareToken}
                commentCount={pdf._count?.comments || 0}
                chatCount={pdf._count?.chatMessages || 0}
                onShareClick={handleShareClick}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? "No matching documents found" : "No documents yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No documents matched "${searchQuery}". Try a different keyword.`
                : "Upload your first PDF agreement or report to generate instant AI summaries and start collaborating."}
            </p>
            {!showUpload && !searchQuery && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Document
              </button>
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Share Collaboration Link
              </h3>
              <button
                onClick={() =>
                  setShareModal({ isOpen: false, token: "", filename: "" })
                }
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Anyone with this link can view <strong className="text-slate-200">{shareModal.filename}</strong>, participate in comments, and query AI chat without needing to create an account.
            </p>

            <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareModal.token}`}
                className="w-full bg-transparent text-xs text-slate-300 px-2 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
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
                href={`/shared/${shareModal.token}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Open in Guest Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() =>
                  setShareModal({ isOpen: false, token: "", filename: "" })
                }
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
