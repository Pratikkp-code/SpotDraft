// Import directly from the core library file to prevent pdf-parse's index.js
// from running its debug test suite during Next.js build evaluation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromPdf(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  info?: Record<string, unknown>;
}> {
  try {
    const data = await pdf(buffer);
    const cleanedText = (data.text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\u0000/g, "")
      .trim();

    return {
      text: cleanedText,
      numpages: data.numpages || 1,
      info: data.info,
    };
  } catch (error: unknown) {
    console.error("PDF text extraction error:", error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
