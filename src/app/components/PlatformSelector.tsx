"use client";
import React from 'react';

export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'all_platforms' | 'scheduled';

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
          <button
            onClick={() => onPlatformChange('facebook')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'facebook'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <img src="/fb.png" alt="Facebook" className="h-6 w-6" />
            <span className="font-medium">Facebook</span>
          </button>
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
            onClick={() => onPlatformChange('youtube')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'youtube'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <img src="/youtube.svg" alt="YouTube" className="h-6 w-6" />
            <span className="font-medium">YouTube</span>
          </button>
          <button
            onClick={() => onPlatformChange('all_platforms')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'all_platforms'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="font-medium">All Platforms</span>
          </button>
          <button
            onClick={() => onPlatformChange('scheduled')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              selectedPlatform === 'scheduled'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 0 002 2z" />
            </svg>
            <span className="font-medium">Scheduled</span>
          </button>
        </div>
      </div>
    </div>
  );
} 