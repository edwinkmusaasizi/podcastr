import { action } from "./_generated/server";
import { v } from "convex/values";

const apiKey = process.env.GEMINI_API_KEY;

export const generateAudioAction = action({
  args: { input: v.string(), voice: v.string() },
  handler: async (_, { voice, input }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set. Please add it to your Convex environment variables.");
    }

    // Map the Gemini frontend voices to ElevenLabs Free Tier Premade Voice IDs
    const voiceMap: { [key: string]: string } = {
      Aoede: "EXAVITQu4vr4xnSDxMaL",   // Sarah
      Kore: "FGY2WhTYpPnrIDTdsKH5",    // Laura
      Puck: "IKne3meq5aSn9XLyUdCD",    // Charlie
      Charon: "JBFqnCBsd6RMkjVDRZzb",  // George
      Fenrir: "CwhRBWXzGAHq8TQ4Fs17",  // Roger
    };

    const voiceId = voiceMap[voice] || "EXAVITQu4vr4xnSDxMaL";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return buffer;
  },
});

export const generateThumbnailAction = action({
  args: { prompt: v.string() },
  handler: async (_, { prompt }) => {
    // Using Pollinations.ai for image generation as it is free, 
    // requires no API key, and doesn't need billing info.
    const response = await fetch(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`
    );

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return buffer;
  },
});
