import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Centralized timezone configuration
export const APP_TIMEZONE = 'America/New_York';

// Helper functions for consistent timezone handling
export function getCurrentTimeInAppTimezone() {
  return dayjs().tz(APP_TIMEZONE);
}

export function getDateInAppTimezone(date: string | Date | dayjs.Dayjs) {
  return dayjs(date).tz(APP_TIMEZONE);
}

export function getTodayInAppTimezone() {
  return getCurrentTimeInAppTimezone().format('YYYY-MM-DD');
}

export function getYesterdayInAppTimezone() {
  return getCurrentTimeInAppTimezone().subtract(1, 'day').format('YYYY-MM-DD');
}

export function getWeekStartInAppTimezone() {
  return getCurrentTimeInAppTimezone().startOf('isoWeek').format('YYYY-MM-DD');
}

export function getWeekEndInAppTimezone() {
  return getCurrentTimeInAppTimezone().endOf('isoWeek').format('YYYY-MM-DD');
}

export function getMonthStartInAppTimezone() {
  return getCurrentTimeInAppTimezone().startOf('month').format('YYYY-MM-DD');
}

export function getMonthEndInAppTimezone() {
  return getCurrentTimeInAppTimezone().endOf('month').format('YYYY-MM-DD');
}

// Date range helpers for different periods
export function getDateRangeForPeriod(period: 'today' | 'yesterday' | '3days' | '7days' | 'month' | 'all') {
  const now = getCurrentTimeInAppTimezone();
  let from: string | null = null;
  let to: string | null = null;
  
  switch (period) {
    case 'today':
      // For today, we want the full day in the app timezone
      // Start at 00:00:00 in app timezone and end at 23:59:59.999 in app timezone
      from = now.startOf('day').toISOString();
      to = now.endOf('day').toISOString();
      break;
    case 'yesterday':
      // For yesterday, we want the full previous day in the app timezone
      from = now.subtract(1, 'day').startOf('day').toISOString();
      to = now.subtract(1, 'day').endOf('day').toISOString();
      break;
    case '3days':
      // Past 3 days: from 3 days ago start of day to end of today
      from = now.subtract(2, 'day').startOf('day').toISOString();
      to = now.endOf('day').toISOString();
      break;
    case '7days':
      // Past 7 days: from 7 days ago start of day to end of today
      from = now.subtract(6, 'day').startOf('day').toISOString();
      to = now.endOf('day').toISOString();
      break;
    case 'month':
      // This month: from start of month to end of month
      from = now.startOf('month').toISOString();
      to = now.endOf('month').toISOString();
      break;
    case 'all':
    default:
      from = null;
      to = null;
  }
  
  return { from, to };
}

// Week number helper
export function getCurrentWeekNumber() {
  return getCurrentTimeInAppTimezone().isoWeek();
}

// Debug helper for timezone information
export function getTimezoneDebugInfo() {
  const now = getCurrentTimeInAppTimezone();
  return {
    appTimezone: APP_TIMEZONE,
    currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
    currentTimeISO: now.toISOString(),
    currentTimeUTC: now.utc().format('YYYY-MM-DD HH:mm:ss'),
    today: getTodayInAppTimezone(),
    yesterday: getYesterdayInAppTimezone(),
    weekStart: getWeekStartInAppTimezone(),
    weekEnd: getWeekEndInAppTimezone(),
    monthStart: getMonthStartInAppTimezone(),
    monthEnd: getMonthEndInAppTimezone(),
    weekNumber: getCurrentWeekNumber()
  };
}
