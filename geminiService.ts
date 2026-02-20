
import { GoogleGenAI, Type } from "@google/genai";
import { Feature, Priority, Status, System } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestFeatures = async (productDescription: string): Promise<Partial<Feature>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following product description, suggest 5 high-impact features with estimates (cost, story points 1-21, logical requestor name, logical program names (can be multiple), target system [must be one of: TOM, EOM, C3], and a placeholder jira#): "${productDescription}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: Object.values(Priority) },
            estimatedCost: { type: Type.NUMBER },
            points: { type: Type.NUMBER },
            owner: { type: Type.STRING, description: "The name of the requestor for this feature." },
            programs: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of programs associated with this feature."
            },
            system: { type: Type.STRING, enum: Object.values(System) },
            jiraNumber: { type: Type.STRING },
            durationDays: { type: Type.NUMBER }
          },
          required: ["name", "description", "priority", "estimatedCost", "points", "owner", "programs", "system", "jiraNumber"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return [];
  }
};
