"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Logo from "../Logo.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#090909] text-white selection:bg-[#0099ff]/30 selection:text-[#0099ff]">
      <div className="w-full max-w-md space-y-8 bg-[#141414] p-8 rounded-2xl border border-[#262626] shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-black mb-2 shadow-md">
            <Image
              src={Logo}
              alt="Klyro logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="text-xs text-[#999999]">
            Sign in to access your document workspace
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#999999] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#090909] border border-[#262626] rounded-xl text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#999999] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#090909] border border-[#262626] rounded-xl text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black rounded-full text-xs font-semibold shadow-lg shadow-white/5 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#999999]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#0099ff] hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
