import { GoogleGenAI } from "@google/genai";

export const getGiftSuggestion = async (prompt: string): Promise<string> => {
  // Safe check for API key to prevent runtime crashes if env is missing
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore env access errors
  }

  if (!apiKey) {
    return "⚠️ Para usar la IA, necesitas configurar una API KEY válida.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres un experto ayudante de Santa Claus. El usuario busca ideas de regalo.
      Contexto: "${prompt}".
      Dame 3 sugerencias de regalos originales, divertidas y breves (máximo 10 palabras por idea).
      Formato: Lista numerada.`,
    });

    return response.text || "No se pudieron generar ideas en este momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Santa está teniendo problemas técnicos (Error de IA). Inténtalo de nuevo.";
  }
};