import { action } from "./_generated/server";
import { v } from "convex/values";

const apiKey = process.env.GEMINI_API_KEY;

export const generateAudioAction = action({
  args: { input: v.string(), voice: v.string() },
  handler: async (_, { voice, input }) => {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your Convex environment variables.");
    }

    const geminiVoice = voice || "Aoede"; 

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Revision": "2026-05-20",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: input }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: geminiVoice
                }
              }
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts) {
      const audioPart = data.candidates[0].content.parts.find((p: any) => p.inlineData);
      if (audioPart) {
        const base64Audio = audioPart.inlineData.data;
        const binaryString = atob(base64Audio);
        const dataLength = binaryString.length;
        
        // Create WAV header for 24kHz, 16-bit mono PCM
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        const sampleRate = 24000;

        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + dataLength, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // Byte rate
        view.setUint16(32, 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, dataLength, true);

        const combined = new Uint8Array(44 + dataLength);
        combined.set(new Uint8Array(header), 0);
        for (let i = 0; i < dataLength; i++) {
          combined[44 + i] = binaryString.charCodeAt(i);
        }
        return combined.buffer;
      }
    }

    throw new Error("Failed to extract audio from Gemini response");
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
