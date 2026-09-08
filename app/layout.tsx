import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Klyro | PDF Intelligence & Collaboration",
  description:
    "AI-powered document intelligence, smart summaries, grounded chat with memory, and real-time collaborative commenting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#090909] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
