import { action } from "./_generated/server";

export const debugApiKey = action({
  args: {},
  handler: async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    return `Length: ${key ? key.length : 0}, Starts with: ${key ? key.substring(0, 5) : 'N/A'}, Ends with: ${key ? key.substring(key.length - 5) : 'N/A'}`;
  },
});
