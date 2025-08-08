# Cleanup After Enhanced Materialized Views

## Overview

This document outlines the cleanup process after implementing enhanced materialized views for top posts. The regular top posts materialized views have been removed in favor of the enhanced versions that provide better functionality.

## Changes Made

### 1. Dropped Regular Top Posts Views
- `mv_tiktok_top_posts` - Removed
- `mv_instagram_top_posts` - Removed

### 2. Kept Enhanced Top Posts Views
- `mv_tiktok_top_posts_enhanced` - ✅ Active
- `mv_instagram_top_posts_enhanced` - ✅ Active

### 3. Updated API Endpoints
- Removed `/api/refresh-top-posts-views` endpoint
- Updated `/api/refresh-all-materialized-views` to only refresh enhanced views
- Simplified status checking to only include enhanced views

## Current Materialized Views

After cleanup, you have these materialized views:

### Daily Totals
- `mv_instagram_daily_totals` - Instagram daily aggregated metrics
- `mv_tiktok_daily_totals` - TikTok daily aggregated metrics

### Enhanced Top Posts
- `mv_tiktok_top_posts_enhanced` - Pre-computed top posts for multiple time periods
- `mv_instagram_top_posts_enhanced` - Pre-computed top posts for multiple time periods

## Benefits of Cleanup

### Performance
- **Reduced Storage**: Less disk space used
- **Faster Refresh**: Fewer views to refresh
- **Simplified Maintenance**: Less complexity in refresh operations

### Functionality
- **Better Features**: Enhanced views provide pre-computed time periods
- **Consistent API**: All top posts queries use the same enhanced views
- **Cleaner Code**: No need to maintain two different top posts implementations

## Migration Steps

### 1. Run Cleanup Script
```sql
-- Execute the cleanup script
\i DROP_REGULAR_TOP_POSTS_VIEWS.sql
```

### 2. Verify Enhanced Views
```sql
-- Check that enhanced views exist and work
SELECT COUNT(*) FROM mv_tiktok_top_posts_enhanced;
SELECT COUNT(*) FROM mv_instagram_top_posts_enhanced;

-- Test refresh functions
SELECT refresh_all_top_posts_enhanced();
```

### 3. Update Application
- The application code has been updated to use enhanced views only
- No changes needed in your frontend components
- All existing functionality continues to work

## API Endpoints

### Active Endpoints
- **POST** `/api/refresh-all-materialized-views` - Refresh all materialized views
- **GET** `/api/refresh-all-materialized-views` - Check status of all views
- **POST** `/api/refresh-enhanced-top-posts-views` - Refresh enhanced top posts views
- **GET** `/api/refresh-enhanced-top-posts-views` - Check enhanced top posts status

### Removed Endpoints
- **POST** `/api/refresh-top-posts-views` - ❌ Removed (replaced by enhanced version)

## Refresh Behavior

### On Page Visit
When someone visits your webpage, the following materialized views are refreshed:
- `mv_instagram_daily_totals`
- `mv_tiktok_daily_totals`
- `mv_tiktok_top_posts_enhanced`
- `mv_instagram_top_posts_enhanced`

### Smart Refresh Logic
- Only refreshes if data is older than configured threshold (default: 30 minutes)
- Background refresh doesn't block the UI
- Automatic fallback if refresh fails

## Monitoring

### Status Check
```bash
curl http://localhost:3000/api/refresh-all-materialized-views
```

### Expected Response
```json
{
  "status": "active",
  "instagram": {
    "recordCount": 150,
    "error": null
  },
  "tiktok": {
    "recordCount": 200,
    "error": null
  },
  "tiktokEnhancedTopPosts": {
    "recordCount": 120,
    "error": null
  },
  "instagramEnhancedTopPosts": {
    "recordCount": 120,
    "error": null
  },
  "lastChecked": "2025-01-08T10:30:00.000Z"
}
```

## Troubleshooting

### If Enhanced Views Don't Exist
```sql
-- Recreate enhanced views
\i CREATE_ENHANCED_TOP_POSTS_MATERIALIZED_VIEWS.sql
```

### If Refresh Functions Don't Work
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'refresh_%_enhanced';

-- Recreate if missing
\i CREATE_ENHANCED_TOP_POSTS_MATERIALIZED_VIEWS.sql
```

### Verify Cleanup
```sql
-- Check remaining materialized views
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

-- Should show:
-- mv_instagram_daily_totals
-- mv_tiktok_daily_totals
-- mv_tiktok_top_posts_enhanced
-- mv_instagram_top_posts_enhanced
```

## Summary

The cleanup process simplifies your materialized view architecture while maintaining all functionality. The enhanced views provide better performance and more features than the regular views, making this a net improvement for your application. 