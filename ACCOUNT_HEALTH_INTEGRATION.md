# Account Health Integration

This document describes how the `hera_account_health` table is integrated into the account-level analytics.

## Overview

The account health system provides real-time health metrics for social media accounts, including:
- 7-day average views
- Yesterday's views
- Engagement rates
- Follower counts and growth
- Shadowban detection
- Failed post tracking
- Last successful post dates

## Components

### 1. API Endpoint (`/api/account-health`)

**Purpose**: Fetches account health data from the `hera_account_health` table

**Parameters**:
- `platform`: The social media platform ('tiktok' or 'instagram')
- `clientId`: The client ID to filter accounts
- `username`: (Optional) Specific username to filter

**Response**:
```json
{
  "health": [
    {
      "account_id": "uuid",
      "platform": "tiktok",
      "username": "example_user",
      "client_id": 1,
      "views_7d_avg": 1500.5,
      "views_yesterday": 1200,
      "engagement_rate": 0.025,
      "total_followers": 50000,
      "follower_growth_7d": 150,
      "shadowban_flag": false,
      "failed_post_streak": 0,
      "last_successful_post": "2024-01-15"
    }
  ],
  "count": 1,
  "platform": "tiktok",
  "clientId": "1"
}
```

### 2. AccountAnalyticsModal Component

**Purpose**: Displays detailed account health metrics in a modal

**Features**:
- Shows all health metrics in a grid layout
- Color-coded indicators for shadowban status and failed posts
- Loading states for better UX
- Error handling with fallback values

**Health Metrics Displayed**:
- 7-Day Average Views
- Yesterday's Views
- Engagement Rate
- Total Followers
- Follower Growth (7d)
- Failed Post Streak
- Last Successful Post
- Shadowban Status

### 3. UnifiedAccountsCard Component

**Purpose**: Shows account information in the main accounts table

**Features**:
- Account profile information (username, display name, category)
- Account status indicators (Active, Inactive, etc.)
- Basic metrics (followers, total views, posts, average views)
- Analytics button to open detailed health metrics modal
- **Note**: Health data is NOT displayed in the main table - only in the modal

**Table Columns**:
- Account (profile info + Analytics button)
- Status (account status)
- Followers
- Total Views
- Posts
- Avg Views

## Data Flow

1. **User opens analytics modal** → `fetchAccountHealth()` is called
2. **API request** → `/api/account-health` endpoint is called with platform, clientId, and username
3. **Database query** → Direct SELECT from `hera_account_health` table
4. **Data transformation** → Raw data is mapped to the frontend interface
5. **UI update** → Health metrics are displayed in the modal

## Error Handling

- **API errors**: Fallback to empty health data
- **Missing data**: Default values (0, false, null) are used
- **Timeouts**: 10-second timeout with graceful degradation
- **Loading states**: Users see loading indicators while data is fetched

## Database Schema

The `hera_account_health` table contains pre-calculated health metrics:

```sql
CREATE VIEW public.hera_account_health AS
-- Complex view that calculates:
-- - 7-day view averages
-- - Yesterday's views
-- - Engagement rates
-- - Follower growth
-- - Shadowban detection
-- - Failed post tracking
-- - Last post dates
```

## Testing

Use the `TEST_HERA_ACCOUNT_HEALTH.sql` file to verify:
- Table structure and data types
- Sample data for both platforms
- Data quality (NULL values, etc.)
- Performance metrics

## Future Enhancements

- Real-time updates using WebSockets
- Historical health trends
- Automated health alerts
- Performance optimization for large datasets
- Caching layer for frequently accessed data 