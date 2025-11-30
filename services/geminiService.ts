import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
  // Safely attempt to access the API key. 
  // In some client-side environments, accessing 'process' directly might throw if not polyfilled.
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (error) {
  console.warn("Gemini API Client could not be initialized (Environment check).");
}

export const getGiftSuggestion = async (interest: string): Promise<string> => {
  if (!ai) return "La conexión con los duendes (IA) no está disponible en este momento.";

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