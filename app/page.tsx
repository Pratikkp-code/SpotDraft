import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Sparkles, MessageSquare, Users, ShieldCheck, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-between selection:bg-[#0099ff]/30 selection:text-[#0099ff]">
      {/* Navbar */}
      <header className="border-b border-[#262626] bg-[#090909]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">DocuMind</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-medium text-[#999999] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-white/5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-xs font-medium text-[#999999] mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#0099ff]" />
          Powered by Gemini 1.5 Flash Map-Reduce Engine
        </div>

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-poster-xl text-white mb-6 leading-[0.95]">
          PDF Intelligence & <br />
          <span className="text-[#0099ff]">
            Real-Time Collaboration
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#999999] max-w-2xl mb-10 leading-relaxed font-normal">
          Upload any contract or report to extract grounded summaries, ask multi-turn questions with context memory, and share interactive links with guests.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10"
          >
            Start Analyzing Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#141414] hover:bg-[#1c1c1c] text-white border border-[#262626] font-medium text-sm transition-all"
          >
            Existing Member
          </Link>
        </div>

        {/* Atmosphere Feature Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          {/* Violet Atmosphere Tile */}
          <div className="p-8 rounded-[30px] bg-gradient-to-br from-[#6a4cf5]/30 via-[#141414] to-[#141414] border border-[#262626] relative overflow-hidden group hover:border-[#6a4cf5]/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Smart Summaries</h3>
            <p className="text-xs text-[#999999] leading-relaxed">
              Targeted 3-5 sentence executive insights generated via map-reduce chunking for complex agreements.
            </p>
          </div>

          {/* Magenta Atmosphere Tile */}
          <div className="p-8 rounded-[30px] bg-gradient-to-br from-[#d44df0]/30 via-[#141414] to-[#141414] border border-[#262626] relative overflow-hidden group hover:border-[#d44df0]/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mb-6">
              <MessageSquare className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Grounded AI Chat</h3>
            <p className="text-xs text-[#999999] leading-relaxed">
              Multi-turn reasoning strictly anchored to document text with memory of previous questions.
            </p>
          </div>

          {/* Sunset Orange Atmosphere Tile */}
          <div className="p-8 rounded-[30px] bg-gradient-to-br from-[#ff7a3d]/30 via-[#141414] to-[#141414] border border-[#262626] relative overflow-hidden group hover:border-[#ff7a3d]/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mb-6">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Guest Sharing</h3>
            <p className="text-xs text-[#999999] leading-relaxed">
              Generate instant share tokens for guests to view, chat, and comment without requiring an account.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-8 text-center text-xs text-[#999999]">
        DocuMind — Enterprise-grade PDF Intelligence and Collaboration
      </footer>
    </div>
  );
}
