"use client";
import React, { useState } from "react";
import { getCurrentTimeInAppTimezone, getDateInAppTimezone } from '../lib/timezone';

export interface DateRange {
  startDate: string;
  endDate: string;
  period: string;
}

const PERIODS = [
  { label: "Today", value: 'today' },
  { label: "Yesterday", value: 'yesterday' },
  { label: "Last 7 days", value: 'last_7_days' },
  { label: "Last 30 days", value: 'last_30_days' },
  { label: "This month", value: 'this_month' },
  { label: "Last month", value: 'last_month' },
  { label: "Last 3 months", value: 'last_3_months' },
  { label: "Last 6 months", value: 'last_6_months' },
  { label: "This year", value: 'this_year' },
  { label: "Last year", value: 'last_year' },
  { label: "Custom Range", value: 'custom_range' },
  { label: "Custom Single Date", value: 'custom_single' },
  { label: "All time", value: 'all' },
];

interface PlatformDateRangeSelectorProps {
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'all_platforms';
  onDateRangeChange: (dateRange: DateRange) => void;
  currentRange: DateRange;
  earliestDataDate?: string;
}

export default function PlatformDateRangeSelector({ 
  platform, 
  onDateRangeChange, 
  currentRange, 
  earliestDataDate 
}: PlatformDateRangeSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState(currentRange.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(currentRange.endDate || '');
  const [customSingleDate, setCustomSingleDate] = useState('');


  const platformColors = {
    tiktok: 'from-black to-gray-800',
    instagram: 'from-pink-800 to-purple-700',
    facebook: 'from-blue-800 to-blue-700',
    all_platforms: 'from-gray-700 to-slate-600'
  };

  const platformIcons = {
    tiktok: '🎵',
    instagram: '📸',
    facebook: '📘',
    all_platforms: '🌐'
  };

  const handlePeriodChange = (period: string) => {
    const now = getCurrentTimeInAppTimezone();
    let startDate = '';
    let endDate = '';

    switch (period) {
      case 'today':
        startDate = now.format('YYYY-MM-DD');
        endDate = now.format('YYYY-MM-DD');
        break;
      case 'yesterday':
        startDate = now.subtract(1, 'day').format('YYYY-MM-DD');
        endDate = now.subtract(1, 'day').format('YYYY-MM-DD');
        break;
      case 'last_7_days':
        startDate = now.subtract(7, 'days').format('YYYY-MM-DD');
        endDate = now.format('YYYY-MM-DD');
        break;
      case 'last_30_days':
        startDate = now.subtract(30, 'days').format('YYYY-MM-DD');
        endDate = now.format('YYYY-MM-DD');
        break;
      case 'this_month':
        startDate = now.startOf('month').format('YYYY-MM-DD');
        endDate = now.endOf('month').format('YYYY-MM-DD');
        break;
      case 'last_month':
        startDate = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        endDate = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        break;
      case 'last_3_months':
        startDate = now.subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
        endDate = now.endOf('month').format('YYYY-MM-DD');
        break;
      case 'last_6_months':
        startDate = now.subtract(6, 'months').startOf('month').format('YYYY-MM-DD');
        endDate = now.endOf('month').format('YYYY-MM-DD');
        break;
      case 'this_year':
        startDate = now.startOf('year').format('YYYY-MM-DD');
        endDate = now.endOf('year').format('YYYY-MM-DD');
        break;
      case 'last_year':
        startDate = now.subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
        endDate = now.subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
        break;
      case 'custom_range':
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        }
        break;
      case 'custom_single':
        if (customSingleDate) {
          startDate = customSingleDate;
          endDate = customSingleDate;
        }
        break;
      case 'all':
      default:
        startDate = earliestDataDate || '2025-07-07';
        endDate = now.format('YYYY-MM-DD');
        break;
    }

    onDateRangeChange({ startDate, endDate, period });
  };

  const handleCustomRangeChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange({ startDate: customStartDate, endDate: customEndDate, period: 'custom_range' });
    }
  };

  const handleCustomSingleChange = () => {
    if (customSingleDate) {
      onDateRangeChange({ startDate: customSingleDate, endDate: customSingleDate, period: 'custom_single' });
    }
  };



  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'All Time';
    
    const start = getDateInAppTimezone(startDate);
    const end = getDateInAppTimezone(endDate);
    
    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }
    
    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }
    
    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  };

  return (
    <div className={`bg-gradient-to-r ${platformColors[platform]} border border-slate-600 rounded-xl p-4 shadow-lg`}>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{platformIcons[platform]}</div>
          <h3 className="text-lg font-semibold text-white">
            {platform === 'all_platforms' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)} Date Range
          </h3>
          <span className="text-slate-200 text-sm">
            {formatDateRange(currentRange.startDate, currentRange.endDate)}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={currentRange.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-slate-900 text-white border border-slate-500 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[160px]"
            >
              {PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Custom Range Date Inputs */}
          {currentRange.period === 'custom_range' && (
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                max={customEndDate || undefined}
              />
              <span className="text-slate-300 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={customStartDate || undefined}
              />
              <button
                onClick={handleCustomRangeChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* Custom Single Date Input */}
          {currentRange.period === 'custom_single' && (
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
              <input
                type="date"
                value={customSingleDate}
                onChange={(e) => setCustomSingleDate(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleCustomSingleChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
