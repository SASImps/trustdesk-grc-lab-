import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) {
    throw new Error("Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment/settings.");
  }
  return genAI.getGenerativeModel({ model: modelName });
};

export async function analyzeRisk(riskDescription: string) {
  try {
    const model = getGeminiModel();
    const prompt = `As a cybersecurity risk analyst, analyze the following risk and provide a JSON response with:
    1. Impact score (1-10)
    2. Probability score (1-10)
    3. Suggested mitigation strategy
    4. Regulatory compliance category (e.g., SOC2, ISO27001, HIPAA)
    
    Risk: ${riskDescription}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { error: "Failed to parse analysis results" };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
