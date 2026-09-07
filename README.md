# DocuMind — PDF Intelligence & Collaboration System

DocuMind is an enterprise-grade document intelligence and real-time collaboration application. Built on Next.js 14+ (App Router), Prisma, PostgreSQL (Supabase), Supabase Storage, and Google Gemini Flash (`gemini-flash-latest`), it transforms static PDF agreements and reports into interactive, summarized, and conversational workspaces that can be shared with guest reviewers without mandatory accounts.

---

## 🚀 Live App & Walkthrough

- **Live Deployment:** [Deployed on Vercel](https://spotdraft-documind.vercel.app) *(or your Vercel deployment URL)*
- **Video Walkthrough:** [Loom / Demo Walkthrough](https://loom.com)

---

## 🛠 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 14+ (App Router, TypeScript) | Unified frontend and backend API route handlers |
| **Authentication** | NextAuth.js (Credentials Provider) | Session JWTs with server-side middleware protection |
| **Password Hashing** | `bcryptjs` | Salted 12-round hashing, zero native C++ runtime issues |
| **Database & ORM** | Prisma ORM + PostgreSQL (Supabase) | Type-safe relational schema with cascading relations |
| **File Storage** | Supabase Storage (Bucket `pdfs`) | Private storage with signed access URLs |
| **PDF Extraction** | `pdf-parse` (v1.1.1) | Direct buffer text extraction |
| **AI LLM** | Google Gemini API (`gemini-flash-latest`) | Official `@google/genai` SDK for summaries and grounded Q&A |
| **Styling** | Tailwind CSS + Lucide Icons | Dark slate theme, glassmorphism, responsive desktop/mobile |
| **Deployment** | Vercel (App) + Supabase (DB & Storage) | Production-ready zero-cost free-tier deployment |

---

## ⚙️ Setup & Run Locally

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd SpotDraft
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your credentials:
```bash
cp .env.example .env
```

### 3. Setup Database Schema
Run Prisma migrations to create the schema on your PostgreSQL instance:
```bash
npx prisma db push
# or: npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Description | Where to Get |
|---|---|---|
| `DATABASE_URL` | Pooled connection string to Supabase PostgreSQL | Supabase Project Settings -> Database -> Connection String (Pooled) |
| `DIRECT_URL` | Direct connection string for Prisma migrations | Supabase Project Settings -> Database -> Connection String (Direct) |
| `NEXTAUTH_SECRET` | 32+ character random string for signing session JWTs | Generate via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL | `http://localhost:3000` (dev) or your Vercel URL (prod) |
| `GEMINI_API_KEY` | Google Gemini API Key | [Google AI Studio](https://aistudio.google.com/) (free) |
| `SUPABASE_URL` | Supabase Project URL | Supabase Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged key for storage access | Supabase Project Settings -> API -> `service_role` (secret) |
| `RESEND_API_KEY` | Optional: transactional email key for share notifications | [Resend](https://resend.com) |

---

## 🧠 AI Approach & Architecture

### 1. Executive Summary
- **Model:** `gemini-flash-latest` (Gemini 1.5/2.0 Flash)
- **Prompt Strategy:** Instructs Gemini to provide a 3-5 sentence substantive overview naming the document type, purpose, key entities, and concrete obligations or outcomes. Disallows generic introductory filler like *"This document discusses..."*.
- **Execution:** Performed synchronously upon upload, with visual progress indicator.

### 2. Conversational Grounding & Memory
- **Memory Buffer:** Automatically extracts and includes the last **5 turns** of conversation history for the viewer (`(pdfId, viewerId)`), maintaining seamless continuity for follow-up questions (e.g. *"What about section 3?"* or *"Who signed it?"*).
- **Strict Grounding:** Bounded prompt instructing Gemini:
  > *"Answer ONLY using the document content and the conversation so far. If the answer is not contained in the document, say clearly that the document doesn't cover it — do not guess or use outside knowledge."*

### 3. Long Document Strategy (Map-Reduce & Retrieval)
- **Standard Mode (< 700,000 characters):** Gemini Flash's 1M-token context window ingests complete document text directly, ensuring zero loss of cross-sectional nuance.
- **Large Document Mode (> 700,000 characters):**
  - **Summary (Map-Reduce):** Document is split into ~8,000-character overlapping chunks on paragraph boundaries. In the **Map step**, each chunk is summarized into 1-2 factual sentences. In the **Reduce step**, all section summaries are synthesized into the final 3-5 sentence executive summary.
  - **Chat (Keyword Retrieval):** Splits document into indexed chunks, computes TF-IDF/keyword overlap scores matching the user's question, and injects the top ~5 most relevant excerpts into the grounded prompt alongside conversation memory.
  - System logs `[CHUNKING ACTIVATED]` whenever this threshold is triggered.

---

## 👥 Frictionless Guest Collaboration

- **Public Token Access:** Document owners generate a secure `shareToken` (`/shared/[token]`).
- **No Mandatory Sign-Up:** Guests access the complete document viewer and AI Q&A immediately.
- **Anonymous Identity:** Guests are prompted for a lightweight display name when commenting, and assigned an anonymous `viewerId` stored in `localStorage` so their conversational AI history remains isolated and private.
- **Live Polling:** Comments auto-refresh every 4 seconds without requiring heavy WebSocket infrastructure.
- **Threaded Discussions:** Support for nested replies to specific comments.

---

## 🔒 Security & Privacy Pass

- **Authorization Enforcement:** Every `/api/pdfs/**` route strictly asserts `session.user.id === pdf.ownerId`.
- **Public Route Isolation:** `/api/shared/[token]/**` routes strictly query by `shareToken`, never expose user credentials, and restrict write actions exclusively to comments and chat.
- **Zero Client Leakage:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only ever accessed in server-side handlers (`app/api/**` and `lib/**`), never exported or prefixed with `NEXT_PUBLIC_`.
- **XSS Protection:** Comments are rendered via native React string interpolation without raw HTML injection.
- **Git Hygiene:** Local `.env` and environment overrides are strictly excluded in `.gitignore`.

---

## ⚖️ Known Trade-Offs & Future Enhancements

1. **Synchronous Upload Processing:** Upload, text extraction, and AI summarization are currently performed synchronously within the request handler for MVP simplicity. In high-volume production, an asynchronous queue (e.g. Inngest, BullMQ, or AWS SQS) with webhook notifications would handle very large multi-megabyte PDFs.
2. **Comment Synchronization:** Uses 4-second HTTP polling to keep discussions current. Full WebSockets or Supabase Realtime channels would provide sub-second push updates.
3. **Semantic Embeddings:** A keyword frequency scoring retrieval engine is included for chunk retrieval without requiring Postgres extensions. When `pgvector` is enabled on Supabase, `gemini-embedding-001` vectors can be stored in the `PdfChunk` table.
