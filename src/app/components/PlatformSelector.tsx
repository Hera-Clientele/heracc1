"use client";
import React from 'react';

export type Platform = 'tiktok' | 'instagram';

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

export default function PlatformSelector({ selectedPlatform, onPlatformChange }: PlatformSelectorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => onPlatformChange('tiktok')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'tiktok'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <img src="/tiktok-1.svg" alt="TikTok" className="h-6 w-6" />
            <span className="font-medium">TikTok</span>
          </button>
          <button
            onClick={() => onPlatformChange('instagram')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'instagram'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <img src="/ig.svg" alt="Instagram" className="h-6 w-6" />
            <span className="font-medium">Instagram</span>
          </button>
        </div>
      </div>
    </div>
  );
} 