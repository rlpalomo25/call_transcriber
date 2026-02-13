
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Transcribes audio and generates a summary using the Gemini model.
 * The API key is sourced directly from process.env.API_KEY.
 */
export const transcribeAndSummarize = async (audioBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64,
              },
            },
            {
              text: "Please transcribe this meeting audio accurately. After the transcription, provide a detailed summary including: 1. Main Topics Discussed 2. Key Decisions 3. Action Items. Format the output with clear Markdown headings.",
            },
          ],
        },
      ],
    });

    if (!response.text) {
      throw new Error("The AI returned an empty response. Please try a longer recording.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Re-throw with a more user-friendly message if possible
    throw new Error(error.message || "An unexpected error occurred during AI processing.");
  }
};
