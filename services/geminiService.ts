
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartInventoryInsights = async (items: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes itens de estoque e forneça 3 insights estratégicos em português (ex: itens parados, riscos de validade, sugestões de reposição): ${JSON.stringify(items)}`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar insights no momento.";
  }
};

export const autoCategorize = async (productName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira uma categoria única para o produto: "${productName}". Responda apenas com o nome da categoria.`,
      config: {
        maxOutputTokens: 20,
      }
    });
    return response.text?.trim() || "Geral";
  } catch (error) {
    return "Geral";
  }
};
