"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  CornerDownRight,
  User,
  Clock,
  ShieldCheck,
} from "lucide-react";

export interface CommentItem {
  id: string;
  pdfId: string;
  authorUserId: string | null;
  authorName: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

interface CommentPanelProps {
  pdfId?: string;
  shareToken?: string;
  isOwner?: boolean;
  currentUserName?: string;
}

export function CommentPanel({
  pdfId,
  shareToken,
  isOwner = false,
  currentUserName,
}: CommentPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const apiEndpoint = isOwner
    ? `/api/pdfs/${pdfId}/comments`
    : `/api/shared/${shareToken}/comments`;

  // Initialize guest name from localStorage
  useEffect(() => {
    if (!isOwner) {
      const stored = localStorage.getItem("documind_guest_name");
      if (stored) {
        setGuestName(stored);
      }
    }
  }, [isOwner]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Initial load and polling every 4 seconds
  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 4000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      localStorage.setItem("documind_guest_name", nameInput.trim());
      setGuestName(nameInput.trim());
      setShowNameModal(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (!isOwner && !guestName) {
      setShowNameModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          parentId: replyToId,
          authorName: isOwner ? currentUserName || "Document Owner" : guestName,
        }),
      });

      if (res.ok) {
        setNewContent("");
        setReplyToId(null);
        await fetchComments();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Group comments into root comments and threaded replies
  const { rootComments, repliesMap } = useMemo(() => {
    const roots: CommentItem[] = [];
    const replies: Record<string, CommentItem[]> = {};

    for (const c of comments) {
      if (!c.parentId) {
        roots.push(c);
      } else {
        if (!replies[c.parentId]) replies[c.parentId] = [];
        replies[c.parentId].push(c);
      }
    }

    return { rootComments: roots, repliesMap: replies };
  }, [comments]);

  return (
    <div className="flex flex-col h-full bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-[#090909] border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-white">Collaboration Notes</h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#262626] text-[#999999]">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[350px] max-h-[500px]">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-[#0099ff]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-8 h-8 mb-2 text-[#999999] opacity-40" />
            <p className="text-xs text-[#999999]">No comments yet.</p>
            <p className="text-[11px] text-[#555555] mt-1">
              Start the discussion or ask a question about this document.
            </p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <CommentCard
                comment={comment}
                onReply={(id) => setReplyToId(id)}
                isReplyTarget={replyToId === comment.id}
              />

              {/* Threaded Replies */}
              {repliesMap[comment.id]?.map((reply) => (
                <div key={reply.id} className="pl-6 border-l-2 border-[#262626] ml-3">
                  <CommentCard comment={reply} isReply />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Guest Name Notification */}
      {!isOwner && guestName && (
        <div className="px-4 py-1.5 bg-[#090909]/60 border-t border-[#262626] flex items-center justify-between text-[11px] text-[#999999]">
          <span>
            Posting as: <strong className="text-[#0099ff]">{guestName}</strong>
          </span>
          <button
            onClick={() => setShowNameModal(true)}
            className="text-[10px] text-[#555555] hover:text-white underline"
          >
            Change name
          </button>
        </div>
      )}

      {/* Reply Banner */}
      {replyToId && (
        <div className="px-4 py-1.5 bg-[#0099ff]/10 border-t border-[#0099ff]/20 flex items-center justify-between text-[11px] text-[#0099ff]">
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" /> Replying to comment
          </span>
          <button
            onClick={() => setReplyToId(null)}
            className="text-[#0099ff] hover:text-white font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handlePostComment} className="p-3 bg-[#090909] border-t border-[#262626]">
        <div className="flex items-end gap-2 bg-[#141414] border border-[#262626] rounded-xl p-2 focus-within:border-[#0099ff] focus-within:ring-1 focus-within:ring-[#0099ff] transition-all">
          <textarea
            rows={2}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={
              replyToId
                ? "Write a reply..."
                : isOwner
                ? "Add an owner note or question..."
                : "Leave a comment or observation..."
            }
            className="w-full bg-transparent text-xs text-white placeholder-[#555555] resize-none focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handlePostComment(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={submitting || !newContent.trim()}
            className="p-2 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black rounded-full transition-colors shrink-0 cursor-pointer"
            title="Send Comment (Cmd+Enter)"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>

      {/* Guest Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 bg-[#090909]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-semibold text-white">
              Enter Your Display Name
            </h4>
            <p className="text-xs text-[#999999]">
              Provide your name so other collaborators know who left this comment.
            </p>
            <form onSubmit={handleSaveName} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3.5 py-2 bg-[#090909] border border-[#262626] rounded-xl text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff]"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="px-3 py-1.5 text-xs text-[#999999] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-full"
                >
                  Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  isReply = false,
  isReplyTarget = false,
}: {
  comment: CommentItem;
  onReply?: (id: string) => void;
  isReply?: boolean;
  isReplyTarget?: boolean;
}) {
  const formattedTime = new Date(comment.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isOwnerBadge = Boolean(comment.authorUserId);

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isReplyTarget
          ? "border-[#0099ff]/50 bg-[#0099ff]/5"
          : isReply
          ? "border-[#262626]/60 bg-[#090909]/40"
          : "border-[#262626] bg-[#090909]/70"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
              isOwnerBadge
                ? "bg-[#0099ff]/20 text-[#0099ff] border border-[#0099ff]/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "G"}
          </div>
          <span className="text-xs font-semibold text-white">
            {comment.authorName}
          </span>
          {isOwnerBadge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#0099ff]/10 border border-[#0099ff]/20 text-[#0099ff] flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> Owner
            </span>
          )}
        </div>

        <span className="text-[10px] text-[#555555] flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formattedTime}
        </span>
      </div>

      <p className="text-xs text-[#999999] leading-relaxed whitespace-pre-wrap select-text">
        {comment.content}
      </p>

      {onReply && !isReply && (
        <div className="mt-2 pt-1 flex justify-end">
          <button
            onClick={() => onReply(comment.id)}
            className="text-[11px] text-[#555555] hover:text-[#0099ff] flex items-center gap-1 transition-colors"
          >
            <CornerDownRight className="w-3 h-3" /> Reply
          </button>
        </div>
      )}
    </div>
  );
}
