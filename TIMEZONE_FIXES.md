# Timezone Fixes Documentation

## Overview
This document outlines the timezone-related issues that were identified and fixed in the TikTok Dashboard application.

## Issues Identified

### 1. Inconsistent Timezone Handling
- Multiple components were using different approaches to handle timezones
- Some components hardcoded 'America/New_York' timezone
- Others used UTC or local time without proper timezone conversion

### 2. Date Range Calculations
- Date range calculations were inconsistent across different components
- Some used local time, others used UTC, leading to incorrect date boundaries
- Week and month calculations could be off by one day due to timezone differences

### 3. API Endpoints
- API endpoints had inconsistent timezone handling
- Database queries could return incorrect data due to timezone mismatches

## Solutions Implemented

### 1. Centralized Timezone Configuration
Created `src/app/lib/timezone.ts` with:
- Centralized timezone constant (`APP_TIMEZONE = 'America/New_York'`)
- Helper functions for consistent timezone operations
- Date range calculation utilities
- Debug helpers for troubleshooting

### 2. Standardized Timezone Functions
- `getCurrentTimeInAppTimezone()` - Get current time in app timezone
- `getDateInAppTimezone(date)` - Convert any date to app timezone
- `getTodayInAppTimezone()` - Get today's date in app timezone
- `getDateRangeForPeriod(period)` - Get date ranges for different periods
- `getCurrentWeekNumber()` - Get current ISO week number in app timezone

### 3. Updated Components
The following components were updated to use centralized timezone functions:
- `DateRangeSelector.tsx` - Date range selection and formatting
- `WeeklyStatsGrid.tsx` - Week calculations and date handling
- `fetchTopPosts.ts` - Date range calculations for API queries
- `today-posts/route.ts` - Today's posts API endpoint
- `weekly-accounts/route.ts` - Weekly accounts API endpoint

### 4. Environment Configuration
- Updated `next.config.ts` to ensure proper timezone environment variable
- Added experimental configuration for dayjs server components

### 5. Debug Component
Created `TimezoneDebug.tsx` component that displays:
- Current time in app timezone
- Current time in UTC
- Today, yesterday, week start/end dates
- Month start/end dates
- Current week number

## Usage Examples

### Getting Current Time in App Timezone
```typescript
import { getCurrentTimeInAppTimezone } from '../lib/timezone';

const now = getCurrentTimeInAppTimezone();
const today = now.format('YYYY-MM-DD');
```

### Getting Date Range for Period
```typescript
import { getDateRangeForPeriod } from '../lib/timezone';

const { from, to } = getDateRangeForPeriod('today');
// Returns: { from: '2025-01-27', to: '2025-01-28' }
```

### Converting Dates to App Timezone
```typescript
import { getDateInAppTimezone } from '../lib/timezone';

const date = getDateInAppTimezone('2025-01-27T10:00:00Z');
const formatted = date.format('MMM D, YYYY');
```

## Benefits

1. **Consistency**: All date/time operations now use the same timezone
2. **Accuracy**: Date boundaries are calculated correctly regardless of server timezone
3. **Maintainability**: Timezone logic is centralized and easy to modify
4. **Debugging**: Built-in debug component helps troubleshoot timezone issues
5. **Performance**: Reduced duplicate timezone calculations

## Testing

To verify the fixes:
1. Check that the TimezoneDebug component shows correct dates
2. Verify that "Today" and "Yesterday" filters work correctly
3. Ensure week and month calculations are accurate
4. Test date range filtering across different timezones

## Future Considerations

1. **User Timezone**: Consider allowing users to set their preferred timezone
2. **Daylight Saving**: The current implementation handles DST automatically via dayjs
3. **Internationalization**: Timezone functions can be extended for multiple locales
4. **Performance**: Consider caching timezone calculations for frequently used dates

## Troubleshooting

If timezone issues persist:
1. Check the TimezoneDebug component for current timezone information
2. Verify environment variables are set correctly
3. Check browser console for any timezone-related errors
4. Ensure dayjs plugins are properly loaded
5. Verify server timezone settings
