import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Minimal system prompt — stable foundation.
 * Θα επεκταθεί σε brand-aware prompt στο επόμενο στάδιο.
 */
export const baseSystemPrompt = `
You are ToldPrint AI, a helpful assistant. 
Always answer clearly and concisely.
Do not hallucinate — use only the information provided.
If you don't know something, say so.
`;
