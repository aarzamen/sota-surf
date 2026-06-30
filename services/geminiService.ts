
import { GoogleGenAI, Type } from "@google/genai";
import { Conditions, AIAnalysis, LocalIntelData, NearbyPlace } from '../types';

// Schema for the structured analysis
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    surfScore: { type: Type.NUMBER, description: "A precise score from 0.0 to 10.0 based on complex vector analysis." },
    safety: { 
      type: Type.OBJECT, 
      properties: {
        level: { type: Type.STRING, description: "Risk level: 'GREEN', 'YELLOW', 'RED', or 'BLACK' (Experts Only)" },
        details: { type: Type.STRING, description: "Tactical safety assessment." }
      },
      required: ['level', 'details']
    },
    skillLevel: { type: Type.STRING, description: "Required operator skill: 'Novice', 'Intermediate', 'Advanced', 'Elite'." },
    timing: { type: Type.STRING, description: "Optimal execution window (24h)." },
    description: { type: Type.STRING, description: "Executive summary of conditions." }
  },
  required: ["surfScore", "safety", "skillLevel", "timing", "description"]
};

const systemInstruction = `You are SOTA-AI, a military-grade surf ballistics analyzer for Okinawa, Japan. 
Your mission is to analyze oceanographic data to determine surfability with extreme precision.

Tactical Doctrine:
1. **Reef Hazard**: Okinawa breaks are shallow reef. >1.5m swell + >8s period = Extreme Danger for non-locals.
2. **Wind Vector**: 
   - Offshore (Wind blowing TO ocean) = Clean/High Quality.
   - Onshore (Wind blowing TO land) = Choppy/Poor.
3. **Tide Intel**: 
   - Low tide (< 1.2m at most spots) = DRY REEF. Unsurfable/Dangerous.
   - Mid-High tide is generally required.

Output must be a strict JSON object adhering to the schema. Tone: Military/Technical.`;

// 1. Structured Analysis using Gemini 3.0 Pro
export const generateSurfAnalysis = async (conditions: Conditions): Promise<AIAnalysis> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `SITREP REQUEST: Analyze surf conditions.
  DATA:
  [WAVE]: H: ${conditions.waveHeight.toFixed(2)}m | T: ${conditions.wavePeriod.toFixed(1)}s | Dir: ${conditions.waveDirection}°
  [WIND]: Spd: ${conditions.windSpeed.toFixed(2)}m/s | Dir: ${conditions.windDirection}°
  [TIDE]: Lvl: ${conditions.currentTide.toFixed(2)}m | Phase: ${conditions.tidePhase}
  
  Determine vectors between Swell Direction and Wind Direction to calculate surface quality. 
  Cross-reference Tide Level with shallow reef safety protocols.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using 3.0 Pro for complex reasoning
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Analysis sub-system failure.");
  }
};

// 2. Local Intel (News/Grounding) using Search
export const generateLocalIntel = async (region: string): Promise<LocalIntelData> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Search for current marine warnings, typhoon updates, jellyfish alerts, or surf reports for ${region}, Okinawa today. Summarize any potential hazards or weather events in 2-3 bullet points.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const text = response.text || "No current intel reports available.";
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
                return { title: chunk.web.title, url: chunk.web.uri };
            }
            return null;
        }).filter(Boolean) as { title: string, url: string }[] || [];

        return {
            summary: text,
            sources: sources
        };

    } catch (error) {
        console.error("Intel Error:", error);
        return { summary: "Intel network offline. Unable to fetch live news.", sources: [] };
    }
}

// 3. Nearby Places (Maps Grounding)
export const generateNearbyPlaces = async (lat: number, lon: number): Promise<{ text: string, places: NearbyPlace[] }> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "List 3 popular surf shops or cafes nearby. Provide their rating and a very brief reason to visit.",
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: lat, longitude: lon }
                    }
                }
            },
        });

        // Extract grounding chunks for clean links
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const places: NearbyPlace[] = chunks
            .filter((c: any) => c.maps?.title && c.maps?.uri)
            .map((c: any) => ({
                title: c.maps.title,
                uri: c.maps.uri,
                rating: "N/A" // Maps tool chunks don't always return rating directly in this format, depends on response text
            }));

        return {
            text: response.text || "No nearby recon data available.",
            places: places
        };
    } catch (error) {
        console.error("Maps Grounding Error:", error);
        throw new Error("Recon satellite unavailable.");
    }
};

// 4. Generate Video (Veo)
export const generateVeoVideo = async (imageBase64: string, promptText: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    // Ensure we have a fresh instance with the key (though global env usually persists)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: promptText || 'Cinematic slow motion of a perfect wave breaking at this surf spot, photorealistic, 4k.', 
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/png', // Assuming PNG or JPEG, Veo is flexible but explicit is good.
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation completed but no URI returned.");

        // Fetch the actual video bytes
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) throw new Error("Failed to download generated video.");
        
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Veo Error:", error);
        throw error;
    }
}
