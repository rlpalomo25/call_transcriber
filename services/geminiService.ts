
import { GoogleGenAI, Type } from "@google/genai";

export const transcribeAndSummarize = async (audioBase64: string, mimeType: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: No API key found in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
              text: "Please transcribe this meeting audio accurately. After the transcription, provide a detailed summary including: 1. Main Topics Discussed 2. Key Decisions 3. Action Items. Format with clear headings.",
            },
          ],
        },
      ],
    });

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE: The model returned an empty response.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini AI Processing Error:", error);
    // Pass through specific error messages for the UI to handle
    throw error;
  }
};

export const summarizeText = async (transcription: string) => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following meeting transcript into key points and a list of action items: \n\n ${transcription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actionItems: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["summary", "actionItems"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini AI Summarization Error:", error);
    throw error;
  }
};
