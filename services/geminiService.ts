import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getGiftSuggestion = async (interest: string): Promise<string> => {
  if (!ai) return "Por favor configura la API Key para usar la IA.";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Give me 3 creative and distinct Christmas gift ideas for someone who likes "${interest}". Keep it short, bullet points, in Spanish.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No se pudieron generar ideas en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hubo un error al consultar a los duendes mágicos (IA).";
  }
};
