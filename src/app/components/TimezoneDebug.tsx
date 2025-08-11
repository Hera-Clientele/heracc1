"use client";
import React, { useState, useEffect } from 'react';
import { getTimezoneDebugInfo } from '../lib/timezone';

export default function TimezoneDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const info = getTimezoneDebugInfo();
    setDebugInfo(info);
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
      >
        {isVisible ? 'Hide' : 'Show'} Timezone Debug
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md text-xs">
          <h3 className="font-bold mb-2 text-blue-300">Timezone Debug Info</h3>
          <div className="space-y-1">
            <div><span className="text-gray-400">App Timezone:</span> {debugInfo.appTimezone}</div>
            <div><span className="text-gray-400">Current Time:</span> {debugInfo.currentTime}</div>
            <div><span className="text-gray-400">Current Time (ISO):</span> {debugInfo.currentTimeISO}</div>
            <div><span className="text-gray-400">Current Time (UTC):</span> {debugInfo.currentTimeUTC}</div>
            <div><span className="text-gray-400">Today:</span> {debugInfo.today}</div>
            <div><span className="text-gray-400">Yesterday:</span> {debugInfo.yesterday}</div>
            <div><span className="text-gray-400">Week Start:</span> {debugInfo.weekStart}</div>
            <div><span className="text-gray-400">Week End:</span> {debugInfo.weekEnd}</div>
            <div><span className="text-gray-400">Month Start:</span> {debugInfo.monthStart}</div>
            <div><span className="text-gray-400">Month End:</span> {debugInfo.monthEnd}</div>
            <div><span className="text-gray-400">Week Number:</span> {debugInfo.weekNumber}</div>
          </div>
        </div>
      )}
    </div>
  );
}
