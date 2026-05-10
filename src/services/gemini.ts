import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function auditContract(contractText: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Audit the following vendor contract against NIST AI 100-1 and GDPR standards. 
    Provide a risk score (0-100), a concise analysis of data privacy and safety clauses, and a list of specific findings.
    
    Contract text:
    ${contractText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          findings: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["riskScore", "analysis", "findings"]
      },
    },
  });

  return JSON.parse(response.text);
}

export async function assessAISafety(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this LLM prompt for safety, bias, and potential PII leak according to NIST AI RMF guidelines.
    Return a risk rating (Low, Medium, High) and remediation steps.
    
    Prompt:
    ${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskRating: { type: Type.STRING },
          remediation: { type: Type.STRING },
          piiFound: { type: Type.BOOLEAN }
        },
        required: ["riskRating", "remediation", "piiFound"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateGRCSolution(company: string, domain: string, context: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a Senior GRC Analyst. Provide a detailed risk assessment and policy guidance for ${company} in the domain of ${domain}.
    The analyst has provided the following context: ${context}
    
    Return a structured response with:
    1. A formal policy statement.
    2. A list of 5 specific controls to implement.
    3. A risk impact analysis.
    4. Compliance mapping to relevant standards (GDPR, SOC2, NIST).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          policy: { type: Type.STRING },
          controls: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          riskImpact: { type: Type.STRING },
          complianceMapping: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                standard: { type: Type.STRING },
                requirement: { type: Type.STRING }
              },
              required: ["standard", "requirement"]
            }
          }
        },
        required: ["policy", "controls", "riskImpact", "complianceMapping"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function gradeScenario(scenario: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a GRC Auditor. Grade the following user-submitted risk scenario and control mapping: ${scenario}
    
    Provide:
    1. A percentage score (0-100).
    2. Detailed critique of their reasoning.
    3. Three 'Blind Spots' they missed.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          critique: { type: Type.STRING },
          blindSpots: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["score", "critique", "blindSpots"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateCriticalThinkingTest(scenario: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this GRC scenario: ${scenario}, generate a 3-question critical thinking test to challenge the analyst.
    Questions should be complex and scenario-based.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctIndex", "explanation"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });
  return JSON.parse(response.text);
}
