import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateRoundIntro = async (roundNumber: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return `Round ${roundNumber}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, creepy, 5-10 word cryptic announcer line for the start of Round ${roundNumber} in a zombie survival game. Do not use quotes. Examples: "Fetch me their souls!", "The fog thickens...", "They are coming for you."`,
    });
    return response.text || `Round ${roundNumber} Begins`;
  } catch (e) {
    console.error("Gemini AI Error:", e);
    return `Round ${roundNumber} Begins`;
  }
};

export const generateGameOverMessage = async (roundReached: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "You Survived... until now.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a sarcastic or dark 1-sentence game over message for a player who died on Round ${roundReached}.`,
    });
    return response.text || "Game Over";
  } catch (e) {
    return "Game Over";
  }
};
