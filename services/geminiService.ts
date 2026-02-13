
import { GoogleGenAI } from "@google/genai";

/**
 * Transcribes audio and generates a summary using the Gemini model.
 * The API key is obtained exclusively from the environment variable process.env.API_KEY.
 */
export const transcribeAndSummarize = async (audioBase64: string, mimeType: string) => {
  // Directly initialize with process.env.API_KEY as per the guidelines.
  // The environment handles providing this value.
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
              text: "Act as an expert meeting scribe. Please provide a verbatim transcription followed by a highly structured summary including: # Executive Summary, ## Key Discussion Points, ## Decisions Made, and ### Action Items. Use Markdown for formatting.",
            },
          ],
        },
      ],
    });

    if (!response.text) {
      throw new Error("The AI response was empty.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    
    // If we get an authentication error, it's usually because the environment 
    // hasn't successfully injected the API key yet or the key is invalid.
    if (error.message?.includes('API key not set')) {
      throw new Error("The AI service is currently unavailable. Please check your connection or wait a moment for the system to initialize.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during transcription.");
  }
};
