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

const systemInstruction = `You are SOTA-AI, a military-grade surf ballistics analyzer for the Ventura and Southern California coast, USA. 
Your mission is to analyze oceanographic data to determine surfability with extreme precision.

Tactical Doctrine:
1. **Point Break Hazards**: Ventura and Santa Barbara breaks feature cobblestone reefs and strong rip currents. High tides can swamp out some breaks, while very low tides can expose rocky hazards.
2. **Wind Vector**: 
   - Offshore (Wind blowing TO ocean, generally Northeast or East) = Clean/Groomed Face/High Quality.
   - Onshore (Wind blowing TO land, generally West or Northwest) = Choppy/Unorganized.
3. **Swell Angle**: 
   - Deep West/Northwest swells are ideal for point breaks like Rincon and C-Street.
   - Southern swells work best for Malibu breaks.

Output must be a strict JSON object adhering to the schema. Tone: Military/Technical.`;

// 1. Structured Analysis using Gemini 3.5 Flash (supporting JSON schema and robust reasoning)
export const generateSurfAnalysis = async (conditions: Conditions): Promise<AIAnalysis> => {
  if (!process.env.API_KEY) return generateLocalSurfAnalysis(conditions);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `SITREP REQUEST: Analyze surf conditions.
  DATA:
  [WAVE]: H: ${conditions.waveHeight.toFixed(2)}m | T: ${conditions.wavePeriod.toFixed(1)}s | Dir: ${conditions.waveDirection}°
  [WIND]: Spd: ${conditions.windSpeed.toFixed(2)}m/s | Dir: ${conditions.windDirection}°
  [TIDE]: Lvl: ${conditions.currentTide.toFixed(2)}m | Phase: ${conditions.tidePhase}
  
  Determine vectors between Swell Direction and Wind Direction to calculate surface quality. 
  Cross-reference Tide Level with rocky reefs and point-break safety protocols.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', // Using 3.5 Flash for fast and accurate JSON schema output
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
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

function generateLocalSurfAnalysis(conditions: Conditions): AIAnalysis {
    const waveScore = Math.min(3.2, conditions.waveHeight * 2.1);
    const periodScore = Math.min(3.0, conditions.wavePeriod / 5);
    const windPenalty = Math.min(2.2, conditions.windSpeed / 4);
    const tideAdjustment = conditions.currentTide < 0.5 ? -1.0 : conditions.tidePhase === 'rising' ? 0.7 : 0.2;
    const surfScore = clampScore(waveScore + periodScore + 3.2 - windPenalty + tideAdjustment);
    const safety = localSafetyAssessment(conditions);
    const skillLevel = surfScore >= 7.5 ? 'Intermediate' : surfScore >= 5 ? 'Novice' : 'Advanced';
    const timing = conditions.tidePhase === 'rising' ? 'Rising tide window active' : `${conditions.tidePhase} tide; monitor local hazards`;

    return {
        surfScore,
        safety,
        skillLevel,
        timing,
        description: `Open-data local assessment: ${conditions.waveHeight.toFixed(1)}m at ${conditions.wavePeriod.toFixed(0)}s with ${conditions.windSpeed.toFixed(1)}m/s wind. ${safety.details}`,
    };
}

function localSafetyAssessment(conditions: Conditions): AIAnalysis['safety'] {
    if (conditions.waveHeight >= 2.5 || conditions.windSpeed >= 10) {
        return {
            level: 'RED',
            details: 'High energy or strong wind. Advanced operators only.',
        };
    }

    if (conditions.currentTide < 0.5 || conditions.waveHeight >= 1.8 || conditions.windSpeed >= 7) {
        return {
            level: 'YELLOW',
            details: 'Moderate hazard profile. Check bottom exposure and rip current behavior.',
        };
    }

    return {
        level: 'GREEN',
        details: 'Manageable open-data hazard profile. Confirm conditions visually before entry.',
    };
}

function clampScore(value: number): number {
    return Math.max(0, Math.min(10, Number(value.toFixed(1))));
}

// 2. Local Intel (News/Grounding) using Search (with robust fallback on permission issues)
export const generateLocalIntel = async (region: string): Promise<LocalIntelData> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        // Try with googleSearch first
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Search for current marine warnings, high surf advisories, swell updates, or beach closures for ${region}, California today. Summarize any potential hazards or weather events in 2-3 bullet points.`,
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
        } catch (searchError: any) {
            console.warn("Search grounding failed, retrying without search tool:", searchError);
            // Fallback to generating based on pretrained localized intelligence
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Based on your tactical oceanographic knowledge of the ${region} region in California, summarize typical marine hazards, reef/beach break dynamics, rip currents, or local conditions that a surfer should monitor today. Provide 2-3 precise bullet points.`,
            });

            const text = response.text || "No current intel reports available.";
            return {
                summary: text,
                sources: []
            };
        }

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
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
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
                    rating: "N/A" // Maps tool chunks don't always return rating directly in this format
                }));

            return {
                text: response.text || "No nearby recon data available.",
                places: places
            };
        } catch (mapsError) {
            console.warn("Maps grounding failed, retrying without maps tool:", mapsError);
            // Fallback: Use standard generation for Ventura/SoCal recommendations
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: "Recommend 3 legendary surf shops, board rentals, or surf-friendly cafes in Ventura, California or Santa Barbara County. Provide very brief descriptions and titles.",
            });

            return {
                text: response.text || "No nearby recon data available.",
                places: [
                    { title: "Ventura Surf Shop", uri: "https://maps.google.com/?q=Ventura+Surf+Shop", rating: "4.8" },
                    { title: "Waveline Surf Shop", uri: "https://maps.google.com/?q=Waveline+Surf+Shop+Ventura", rating: "4.7" },
                    { title: "Rincon Designs Surf Shop", uri: "https://maps.google.com/?q=Rincon+Designs+Carpinteria", rating: "4.8" }
                ]
            };
        }
    } catch (error) {
        console.error("Maps Grounding Error:", error);
        throw new Error("Recon satellite unavailable.");
    }
};

// 4. Generate Video (Veo)
export const generateVeoVideo = async (imageBase64: string, promptText: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: promptText || 'Cinematic slow motion of a perfect wave breaking at this surf spot, photorealistic, 4k.', 
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
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
