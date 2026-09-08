"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  History,
  HelpCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  pdfId?: string;
  shareToken?: string;
  isOwner?: boolean;
}

export function ChatPanel({ pdfId, shareToken, isOwner = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputQuestion, setInputQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [guestViewerId, setGuestViewerId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or retrieve anonymous viewer ID for guest
  useEffect(() => {
    if (!isOwner) {
      let vid = localStorage.getItem("documind_guest_vid");
      if (!vid) {
        vid = `guest_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
        localStorage.setItem("documind_guest_vid", vid);
      }
      setGuestViewerId(vid);
    }
  }, [isOwner]);

  const apiEndpoint = isOwner
    ? `/api/pdfs/${pdfId}/chat`
    : `/api/shared/${shareToken}/chat`;

  const fetchHistory = useCallback(async () => {
    if (!isOwner && !guestViewerId) return;

    try {
      const url = isOwner
        ? apiEndpoint
        : `${apiEndpoint}?viewerId=${encodeURIComponent(guestViewerId)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoading(false);
    }
  }, [isOwner, guestViewerId, apiEndpoint]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, generating]);

  const handleSendMessage = async (questionText?: string) => {
    const question = questionText || inputQuestion;
    if (!question.trim() || generating) return;

    setInputQuestion("");
    setGenerating(true);

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: question.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          ...(!isOwner ? { viewerId: guestViewerId } : {}),
        }),
      });

      const data = await res.json();

      if (res.ok && data.assistantMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
      } else {
        throw new Error(data.error || "Failed to generate answer");
      }
    } catch (err: unknown) {
      const errorMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error answering your question: ${
          err instanceof Error ? err.message : "Please try again."
        }`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setGenerating(false);
    }
  };

  const starterSuggestions = [
    "What is the primary purpose of this document?",
    "Who are the key parties or entities mentioned?",
    "Are there any specific deadlines, terms, or obligations?",
  ];

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-[#090909] border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 text-[#0099ff] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">AI Document Intelligence</h3>
            <p className="text-[10px] text-[#999999]">
              Grounded in document • Memory of last 5 turns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#0099ff] font-mono">
          <History className="w-3 h-3" />
          <span>Memory Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[#0099ff]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center text-[#0099ff]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Ask Anything About This PDF</h4>
              <p className="text-[11px] text-[#999999] max-w-xs mt-1">
                Gemini answers strictly based on the extracted content and maintains memory of follow-up questions.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#999999] block px-1">
                Suggested questions:
              </span>
              {starterSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-full bg-[#090909] border border-[#262626] hover:border-[#0099ff]/40 hover:bg-[#141414] text-xs text-[#999999] hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#0099ff] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-white/10 text-[#0099ff] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white text-black"
                    : "bg-[#090909] border border-[#262626] text-white/90 shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap select-text">{msg.content}</p>
              </div>

              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-[#1c1c1c] text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {generating && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-white/10 text-[#0099ff] flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-[#090909] border border-[#262626] text-[#999999] flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0099ff]" />
              <span>Analyzing document context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-[#090909] border-t border-[#262626]"
      >
        <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-full px-3 py-2 focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff] transition-all">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={generating}
            placeholder="Ask a question or follow up on previous answers..."
            className="w-full bg-transparent text-xs text-white placeholder-[#555555] focus:outline-none"
          />
          <button
            type="submit"
            disabled={generating || !inputQuestion.trim()}
            className="p-1.5 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black rounded-full transition-colors shrink-0 cursor-pointer"
            title="Submit question"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
