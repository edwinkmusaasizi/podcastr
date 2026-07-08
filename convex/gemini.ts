import { action } from "./_generated/server";
import { v } from "convex/values";

const apiKey = process.env.GEMINI_API_KEY;

export const generateAudioAction = action({
  args: { input: v.string(), voice: v.string() },
  handler: async (_, { voice, input }) => {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your Convex environment variables.");
    }

    // Map OpenAI voices to Gemini voices if needed, or just use the voice string
    // Gemini 3.1 Flash TTS voices: "Kore", "Puck", "Charon", "Fenrir", "Aoede", etc.
    // For now, we'll try to use the provided voice or default to a Gemini voice.
    const geminiVoice = voice || "Aoede"; 

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-tts-preview",
          input: input,
          response_format: {
            type: "audio",
          },
          generation_config: {
            speech_config: [
              { voice_name: geminiVoice }
            ]
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // The Gemini API response structure for TTS needs to be verified.
    // Usually, it returns base64 encoded audio in the candidates.
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const audioPart = data.candidates[0].content.parts.find((p: any) => p.inline_data);
      if (audioPart) {
        const base64Audio = audioPart.inline_data.data;
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    }

    throw new Error("Failed to extract audio from Gemini response");
  },
});
