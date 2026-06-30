
import React, { useState } from 'react';
import { Card } from './Card';
import { generateVeoVideo } from '../services/geminiService';

interface VeoGeneratorProps {
    spotName: string;
}

export function VeoGenerator({ spotName }: VeoGeneratorProps) {
    const [image, setImage] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [prompt, setPrompt] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data URL prefix for API
                setImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image) return;

        try {
            // Check/Prompt API Key first
            const aiStudio = (window as any).aistudio;
            if (aiStudio) {
                const hasKey = await aiStudio.hasSelectedApiKey();
                if (!hasKey) {
                    await aiStudio.openSelectKey();
                }
            }

            setLoading(true);
            setStatus("Initializing VEO-3.1...");
            
            const cleanBase64 = image.split(',')[1];
            
            setStatus("Computing Hydrodynamics...");
            const url = await generateVeoVideo(cleanBase64, prompt);
            
            setVideoUrl(url);
            setStatus("Sim_Complete.");
        } catch (e) {
            console.error(e);
            setStatus("Sim_Failed: " + (e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 h-full">
            <Card className="h-full flex flex-col">
                <div className="flex items-center mb-4 border-b border-tac-gray pb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Drone_Sim_Feed // Veo</h3>
                </div>

                <div className="flex-grow space-y-4">
                    {!videoUrl ? (
                        <>
                            <div className="border border-dashed border-tac-gray p-8 text-center hover:bg-tac-gray/10 transition-colors relative group">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {image ? (
                                    <div className="relative">
                                        <img src={image} alt="Preview" className="max-h-48 mx-auto border border-tac-green" />
                                        <div className="absolute inset-0 bg-tac-green/10 pointer-events-none"></div>
                                    </div>
                                ) : (
                                    <div className="text-tac-tan">
                                        <p className="text-sm font-mono mb-2">[ UPLOAD_TARGET_IMG ]</p>
                                        <p className="text-[10px] opacity-70">TAP_TO_SELECT</p>
                                    </div>
                                )}
                                {/* Crosshairs */}
                                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-tac-green"></div>
                                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-tac-green"></div>
                                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-tac-green"></div>
                                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-tac-green"></div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-tac-tan uppercase">Sim_Parameters</label>
                                <input 
                                    type="text" 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. perfect barrels, sunny"
                                    className="w-full bg-black border border-tac-gray text-tac-green text-xs p-2 focus:border-tac-green outline-none font-mono uppercase"
                                />
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={!image || loading}
                                className={`w-full py-3 font-bold font-mono uppercase tracking-wider border transition-all
                                    ${!image || loading 
                                        ? 'border-tac-gray text-gray-600 cursor-not-allowed' 
                                        : 'border-tac-green text-tac-green hover:bg-tac-green hover:text-black'
                                    }`}
                            >
                                {loading ? 'PROCESSING...' : 'EXECUTE_SIMULATION'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                             <div className="aspect-video bg-black border border-tac-gray relative">
                                <div className="absolute top-2 left-2 text-[9px] text-red-500 font-bold z-10">REC</div>
                                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover opacity-90" />
                                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>
                            </div>
                            <button 
                                onClick={() => { setVideoUrl(null); setStatus(""); }}
                                className="w-full py-2 border border-tac-tan text-tac-tan hover:bg-tac-tan hover:text-black text-xs font-mono uppercase"
                            >
                                RESET_FEED
                            </button>
                        </div>
                    )}

                    {status && (
                        <div className="text-center border-t border-tac-gray pt-2">
                             <p className="text-[9px] font-mono text-tac-green animate-pulse">{status}</p>
                             {loading && <div className="mt-2 w-full h-0.5 bg-tac-gray overflow-hidden"><div className="h-full bg-tac-green animate-slide-up w-1/2 mx-auto"></div></div>}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
