import { GoogleGenAI } from "@google/genai";
import { splitTextIntoChunks, CHUNK_THRESHOLD_CHARS } from "./chunking";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// The official model specified in the locked stack
export const GEMINI_MODEL = "gemini-flash-latest";

/**
 * Helper to execute Gemini requests with automatic retries on 503 / 429 / high demand spikes
 */
async function generateContentWithRetry(
  prompt: string,
  maxRetries = 3,
  delayMs = 1500
): Promise<string> {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch (err: unknown) {
      lastError = err;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isTransient =
        errorMessage.includes("503") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED");

      if (isTransient && attempt < maxRetries) {
        console.warn(
          `[Gemini API] High demand spike (503/429). Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs * attempt}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

/**
 * Builds the exact prompt for document summarization
 */
export function buildSummaryPrompt(documentText: string): string {
  return `You are summarizing a document for someone deciding whether to open it.
Write a 3-5 sentence summary of the following document.
Be specific: name the document's actual subject, purpose, key parties/entities, and
any concrete outcome or ask it contains. Do NOT write generic filler like
"This document discusses..." — start directly with the substance.
If the document is a contract or agreement, name the type of agreement and the parties.

DOCUMENT TEXT:
"""
${documentText}
"""`;
}

/**
 * Builds the exact prompt for grounded document Q&A
 */
export function buildChatPrompt(
  documentContext: string,
  history: { role: string; content: string }[],
  question: string
): string {
  const conversationFormatted =
    history.length > 0
      ? history
          .map(
            (turn) =>
              `${turn.role === "assistant" ? "Assistant" : "User"}: ${turn.content}`
          )
          .join("\n")
      : "No previous conversation.";

  return `You are a helpful assistant answering questions about a specific document.
Answer ONLY using the document content and the conversation so far. If the answer
is not contained in the document, say clearly that the document doesn't cover it —
do not guess or use outside knowledge.

DOCUMENT CONTEXT:
"""
${documentContext}
"""

CONVERSATION SO FAR:
${conversationFormatted}

NEW QUESTION: ${question}`;
}

/**
 * Generates an executive summary for a document using Gemini.
 * Employs Map-Reduce if document exceeds safety threshold.
 * Gracefully handles temporary API capacity spikes.
 */
export async function generateDocumentSummary(
  text: string
): Promise<{ summary: string; wasChunked: boolean }> {
  if (!text || text.trim().length === 0) {
    return {
      summary: "This document contains no readable text content.",
      wasChunked: false,
    };
  }

  if (!ai) {
    console.warn("GEMINI_API_KEY is not configured. Returning fallback summary.");
    const preview = text.slice(0, 300).replace(/\s+/g, " ");
    return {
      summary: `[Preview]: ${preview}...`,
      wasChunked: false,
    };
  }

  const isLongDoc = text.length > CHUNK_THRESHOLD_CHARS;

  try {
    if (!isLongDoc) {
      // Standard path: passes full text directly into context window
      const prompt = buildSummaryPrompt(text);
      const summary = await generateContentWithRetry(prompt, 3, 1500);
      return { summary, wasChunked: false };
    }

    // Long document path: Map-Reduce summarization
    console.log(
      `[CHUNKING ACTIVATED] Document length (${text.length} chars) exceeds threshold (${CHUNK_THRESHOLD_CHARS} chars). Executing Map-Reduce summary.`
    );

    const chunks = splitTextIntoChunks(text, 8000, 200);
    console.log(`[CHUNKING] Split into ${chunks.length} chunks for map step.`);

    // Map step: summarize each chunk in 1-2 sentences
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const mapPrompt = `Provide a concise 1-2 sentence factual summary of the following document excerpt:
"""
${chunk.content}
"""`;

      try {
        const textRes = await generateContentWithRetry(mapPrompt, 2, 1000);
        if (textRes) {
          chunkSummaries.push(`[Section ${i + 1}]: ${textRes}`);
        }
      } catch (err) {
        console.warn(`[CHUNKING] Map step failed on chunk ${i}:`, err);
      }
    }

    // Reduce step: feed combined section summaries to produce final 3-5 sentence summary
    const combinedSummaries = chunkSummaries.join("\n\n");
    const reducePrompt = `You are summarizing a document for someone deciding whether to open it based on summaries of its sections.
Write a 3-5 sentence summary of the entire document.
Be specific: name the document's actual subject, purpose, key parties/entities, and
any concrete outcome or ask it contains. Do NOT write generic filler like
"This document discusses..." — start directly with the substance.

SECTION SUMMARIES:
"""
${combinedSummaries}
"""`;

    const finalSummary = await generateContentWithRetry(reducePrompt, 3, 1500);

    return {
      summary: finalSummary,
      wasChunked: true,
    };
  } catch (err) {
    console.error("Gemini summary error after retries:", err);
    // Graceful fallback so the PDF upload doesn't crash on high demand
    const fallbackSnippet = text.slice(0, 250).replace(/\s+/g, " ").trim();
    return {
      summary: `Document uploaded and indexed. Note: Gemini API was experiencing temporary peak traffic during upload. Excerpt preview: "${fallbackSnippet}..."`,
      wasChunked: false,
    };
  }
}

/**
 * Generates an answer to a user question grounded strictly in document context.
 */
export async function generateDocumentChatAnswer(
  documentContext: string,
  history: { role: string; content: string }[],
  question: string
): Promise<string> {
  if (!ai) {
    console.warn("GEMINI_API_KEY is not configured. Returning fallback chat response.");
    return `[Mock AI Chat - set GEMINI_API_KEY to enable live Gemini reasoning]: Grounded answer to "${question}".`;
  }

  try {
    const prompt = buildChatPrompt(documentContext, history, question);
    const answer = await generateContentWithRetry(prompt, 3, 1500);
    return answer;
  } catch (err) {
    console.error("Gemini chat error:", err);
    return "The AI service is currently experiencing high demand. Please try asking your question again in a few seconds.";
  }
}
