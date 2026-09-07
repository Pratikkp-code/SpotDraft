export const CHUNK_THRESHOLD_CHARS = 700000;
export const DEFAULT_CHUNK_SIZE = 8000;
export const DEFAULT_CHUNK_OVERLAP = 200;

export interface DocumentChunk {
  index: number;
  content: string;
}

/**
 * Splits document text into overlapping chunks on paragraph boundaries.
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
): DocumentChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk,
        });

        // Retain overlap from end of previous chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + "\n\n" + trimmedPara;
      } else {
        // Single paragraph larger than chunkSize — hard split into sub-segments
        let remaining = trimmedPara;
        while (remaining.length > 0) {
          const part = remaining.slice(0, chunkSize);
          chunks.push({
            index: chunkIndex++,
            content: part,
          });
          remaining = remaining.slice(chunkSize - overlap);
          if (remaining.length <= overlap) break;
        }
        currentChunk = "";
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      content: currentChunk.trim(),
    });
  }

  return chunks;
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do",
  "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
  "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it",
  "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
  "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
  "yours", "yourself", "yourselves"
]);

/**
 * Scores and retrieves the top-K most relevant chunks using keyword frequency overlap.
 */
export function retrieveTopChunks(
  query: string,
  chunks: { index: number; content: string }[],
  topK = 5
): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  // Tokenize and clean query
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  if (queryTokens.length === 0) {
    return chunks.slice(0, topK);
  }

  const queryTokenSet = new Set(queryTokens);

  // Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.content.toLowerCase();
    let score = 0;

    for (const token of queryTokenSet) {
      // Count frequency
      const regex = new RegExp(`\\b${token}\\b`, "g");
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    return { chunk, score };
  });

  // Sort descending by score, tie-breaking by earlier chunk index
  scoredChunks.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunk.index - b.chunk.index;
  });

  // Take top K
  const selected = scoredChunks.slice(0, topK).map((item) => item.chunk);

  // Re-order selected chunks chronologically so context is coherent
  selected.sort((a, b) => a.index - b.index);

  return selected;
}
