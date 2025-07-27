"use client";
import React, { useState } from "react";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface DateRange {
  startDate: string;
  endDate: string;
  period: string;
}

const PERIODS = [
  { label: "Today", value: 'today' },
  { label: "Yesterday", value: 'yesterday' },
  { label: "This Week", value: 'this_week' },
  { label: "This Month", value: 'this_month' },
  { label: "This Year", value: 'this_year' },
  { label: "Custom Range", value: 'custom_range' },
  { label: "Custom Single Date", value: 'custom_single' },
  { label: "All Time", value: 'all' },
];

interface DateRangeSelectorProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  currentRange: DateRange;
}

export default function DateRangeSelector({ onDateRangeChange, currentRange }: DateRangeSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState(currentRange.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(currentRange.endDate || '');
  const [customSingleDate, setCustomSingleDate] = useState('');

  const handlePeriodChange = (period: string) => {
    const now = dayjs().tz('America/New_York');
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
      case 'this_week':
        startDate = now.startOf('isoWeek').format('YYYY-MM-DD');
        endDate = now.endOf('isoWeek').format('YYYY-MM-DD');
        break;
      case 'this_month':
        startDate = now.startOf('month').format('YYYY-MM-DD');
        endDate = now.endOf('month').format('YYYY-MM-DD');
        break;
      case 'this_year':
        startDate = now.startOf('year').format('YYYY-MM-DD');
        endDate = now.endOf('year').format('YYYY-MM-DD');
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
        startDate = '2025-07-07'; // Start from July 7, 2025
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
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }
    
    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }
    
    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-white">Date Range</h3>
          <span className="text-slate-300 text-sm">
            {formatDateRange(currentRange.startDate, currentRange.endDate)}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={currentRange.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-slate-900 text-white border border-slate-500 rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
            >
              {PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                max={customEndDate || undefined}
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={customStartDate || undefined}
              />
              <button
                onClick={handleCustomRangeChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
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
                className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleCustomSingleChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
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