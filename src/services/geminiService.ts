import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LeadAnalysis {
  leadType: 'Business' | 'Personal' | 'Spam' | 'Potential';
  urgency: 'Low' | 'Medium' | 'High';
  suggestedAction: string;
  category: string;
}

export const analyzeLead = async (phone: string, telegramBio: string): Promise<LeadAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this incoming lead from a phone call. 
      Phone: ${phone}
      Telegram Bio: ${telegramBio}
      
      Determine if this is a business lead, personal contact, potential client, or spam.
      Provide a suggested next action.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leadType: { type: Type.STRING, enum: ['Business', 'Personal', 'Spam', 'Potential'] },
            urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            suggestedAction: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ['leadType', 'urgency', 'suggestedAction', 'category']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return {
      leadType: 'Potential',
      urgency: 'Medium',
      suggestedAction: 'Wait for user callback',
      category: 'Uncategorized'
    };
  }
};
