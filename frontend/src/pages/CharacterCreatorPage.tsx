import React, { useState } from 'react';
import { useGameStore, CharacterConfig } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { NeonText, AnimatedButton } from '../components';
import { CharacterViewer } from '../components/3d/CharacterViewer';
import { ArrowLeft, Save, RotateCw, RefreshCw, Shirt, Footprints, Smile } from 'lucide-react';

export function CharacterCreatorPage() {
  const navigate = useNavigate();
  const { user, updateCharacter } = useGameStore();
  const [saving, setSaving] = useState(false);

  // Local state for immediate feedback before saving
  const [config, setConfig] = useState<CharacterConfig>(user?.character || {
    skinColor: '#e0ac69',
    hairColor: '#4a3b2a',
    shirtColor: '#00d9ff',
    pantsColor: '#1a1a2e',
    shoesColor: '#333333',
    hairStyle: 'short',
    accessory: 'none',
    bodyType: 'athletic'
  });

  const [activeTab, setActiveTab] = useState<'body' | 'outfit' | 'style'>('body');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCharacter(config);
      const confirm = window.confirm("Mint this avatar configuration to your local identity vault?");
      if (confirm) {
          navigate('/wallet');
      }
    } catch (e: any) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* 3D Viewport - Takes full screen on mobile, 60% on desktop */}
      <div className="relative w-full md:w-3/5 h-[50vh] md:h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-black overflow-hidden">
        
        {/* The new High-Fidelity Character Renderer */}
        <CharacterViewer config={config} className="w-full h-full" animate={true} />
        
        {/* View Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2 z-10">
            <button 
                onClick={() => setConfig({
                    ...config,
                    skinColor: '#' + Math.floor(Math.random()*16777215).toString(16),
                    shirtColor: '#' + Math.floor(Math.random()*16777215).toString(16)
                })}
                className="p-2 rounded-full border border-gray-600 bg-black/50 backdrop-blur-sm hover:border-neon-pink transition-all"
            >
                <RefreshCw className="w-6 h-6 text-neon-pink" />
            </button>
        </div>

        <div className="absolute top-4 left-4 z-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ArrowLeft className="w-5 h-5" /> Back
            </button>
        </div>
      </div>

      {/* Customization Panel */}
      <div className="w-full md:w-2/5 h-[50vh] md:h-screen overflow-y-auto bg-dark-900 border-l border-neon-cyan/20 p-6">
        <div className="mb-6">
            <NeonText size="3xl" gradient={true} className="mb-2">Avatar Studio</NeonText>
            <p className="text-gray-400 text-sm">Design your sovereign digital identity.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
            {['body', 'outfit', 'style'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                        activeTab === tab 
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="space-y-6">
            {activeTab === 'body' && (
                <div className="space-y-6 animate-slide-up">
                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Skin Tone</label>
                        <div className="flex gap-3 flex-wrap">
                            {['#f8d9c6', '#e0ac69', '#8d5524', '#523422', '#281e18', '#7b9c73', '#6a7b9c'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setConfig({...config, skinColor: color})}
                                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${config.skinColor === color ? 'border-neon-cyan ring-2 ring-neon-cyan/30' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Body Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['slim', 'athletic', 'heavy'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setConfig({...config, bodyType: type as any})}
                                    className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                                        config.bodyType === type 
                                        ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' 
                                        : 'border-gray-700 bg-dark-800 text-gray-400'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'style' && (
                <div className="space-y-6 animate-slide-up">
                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Hair Style</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['short', 'long', 'mohawk', 'bald'].map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setConfig({...config, hairStyle: style as any})}
                                    className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                                        config.hairStyle === style 
                                        ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' 
                                        : 'border-gray-700 bg-dark-800 text-gray-400'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Hair Color</label>
                        <input 
                            type="color" 
                            value={config.hairColor}
                            onChange={(e) => setConfig({...config, hairColor: e.target.value})}
                            className="w-full h-10 rounded-lg cursor-pointer bg-dark-800 border border-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Accessories</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['none', 'glasses', 'headband'].map((acc) => (
                                <button
                                    key={acc}
                                    onClick={() => setConfig({...config, accessory: acc as any})}
                                    className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                                        config.accessory === acc 
                                        ? 'border-neon-pink bg-neon-pink/10 text-neon-pink' 
                                        : 'border-gray-700 bg-dark-800 text-gray-400'
                                    }`}
                                >
                                    {acc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'outfit' && (
                <div className="space-y-6 animate-slide-up">
                    <div>
                        <label className="block text-gray-400 text-sm mb-3 flex items-center gap-2">
                            <Shirt className="w-4 h-4" /> Shirt Color
                        </label>
                        <input 
                            type="color" 
                            value={config.shirtColor}
                            onChange={(e) => setConfig({...config, shirtColor: e.target.value})}
                            className="w-full h-10 rounded-lg cursor-pointer bg-dark-800 border border-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-3 flex items-center gap-2">
                            <Footprints className="w-4 h-4" /> Pants Color
                        </label>
                        <input 
                            type="color" 
                            value={config.pantsColor}
                            onChange={(e) => setConfig({...config, pantsColor: e.target.value})}
                            className="w-full h-10 rounded-lg cursor-pointer bg-dark-800 border border-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-3">Shoes Color</label>
                        <input 
                            type="color" 
                            value={config.shoesColor}
                            onChange={(e) => setConfig({...config, shoesColor: e.target.value})}
                            className="w-full h-10 rounded-lg cursor-pointer bg-dark-800 border border-gray-700"
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
            <AnimatedButton 
                variant="primary" 
                size="lg" 
                className="w-full flex justify-center items-center gap-2"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Encrypting...' : 'Save Identity'}
            </AnimatedButton>
            <p className="text-center text-xs text-gray-500 mt-4">
                This avatar will be used across all CivicVerse experiences.
            </p>
        </div>
      </div>
    </div>
  );
}
