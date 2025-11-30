import { GoogleGenAI } from "@google/genai";

// Helper to safely get API key without crashing in environments where process is undefined
const getApiKey = (): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing process.env:", e);
  }
  return undefined;
};

export const getGiftSuggestion = async (interest: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "La conexión con los duendes (IA) no está disponible en este momento (Falta API Key).";
  }

  try {
    // Initialize AI client lazily to avoid top-level crashes
    const ai = new GoogleGenAI({ apiKey });
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