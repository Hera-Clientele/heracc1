# Account Health Materialized View Refresh Options

This document explains the different ways to refresh the `hera_account_health` materialized view to keep data current.

## 🚀 Automatic Refresh Options

### 1. **On Website Visit (Recommended)**
- **How it works**: Every time someone visits the dashboard, the account health data is automatically refreshed in the background
- **Location**: `src/app/page.tsx` - `fetchAll()` function
- **Frequency**: Every page load/refresh
- **Pros**: Always fresh data, no manual intervention needed
- **Cons**: Slight delay on first page load

### 2. **Hourly Cron Job (Database Level)**
- **How it works**: PostgreSQL cron job runs every hour automatically
- **File**: `REFRESH_ACCOUNT_HEALTH_CRON.sql`
- **Frequency**: Every hour at the top of the hour (e.g., 1:00, 2:00, 3:00...)
- **Setup**: Run the SQL commands in your Supabase SQL editor
- **Pros**: Completely automatic, runs even if no one visits the website
- **Cons**: Requires pg_cron extension (may need superuser privileges)

## 🎯 Manual Refresh Options

### 3. **Manual Refresh Button**
- **How it works**: Users can click a "Refresh Now" button in the dashboard header
- **Component**: `AccountHealthRefresher` component
- **Location**: Top of the dashboard, below the main header
- **Features**: 
  - Shows last refresh time
  - Counts manual refreshes
  - Visual feedback during refresh
  - Success/error alerts

### 4. **API Endpoint**
- **Endpoint**: `/api/refresh-account-health`
- **Method**: POST
- **Usage**: Can be called programmatically or via tools like Postman
- **Response**: JSON with success/error status and timestamp

## 📋 Setup Instructions

### For Automatic Website Refresh:
✅ **Already implemented** - No setup needed

### For Manual Refresh Button:
✅ **Already implemented** - Component is visible on the dashboard

### For Cron Job (Optional):
1. Open your Supabase SQL editor
2. Run the commands in `REFRESH_ACCOUNT_HEALTH_CRON.sql`
3. Verify the jobs are scheduled: `SELECT * FROM cron.job;`

### For API Testing:
```bash
# Test the refresh endpoint
curl -X POST http://localhost:3000/api/refresh-account-health

# Check the endpoint info
curl http://localhost:3000/api/refresh-account-health
```

## 🔄 Refresh Frequency Recommendations

### **Development/Testing:**
- Manual refresh button (as needed)
- On website visit

### **Production:**
- **Primary**: On website visit + hourly cron job
- **Backup**: Manual refresh button for urgent updates
- **Result**: Data is never more than 1 hour old

## 📊 Monitoring Refresh Status

### **Dashboard Display:**
- Shows "Last updated X minutes/hours ago"
- Displays manual refresh count
- Visual refresh button with loading states

### **Console Logs:**
- All refresh attempts are logged
- Success/failure messages
- Timestamps for debugging

### **API Response:**
- Success/failure status
- Error details if something goes wrong
- Timestamp of refresh completion

## 🚨 Troubleshooting

### **If refresh fails:**
1. Check browser console for error messages
2. Verify Supabase connection
3. Check if the materialized view exists
4. Ensure proper permissions on the view

### **If cron jobs aren't working:**
1. Verify pg_cron extension is enabled
2. Check cron.job table for scheduled jobs
3. Ensure you have superuser privileges in Supabase

### **If manual refresh button doesn't work:**
1. Check browser console for errors
2. Verify the API endpoint is accessible
3. Check network tab for failed requests

## 💡 Best Practices

1. **Don't refresh too frequently** - Materialized views take time to rebuild
2. **Use the manual button sparingly** - Let automatic refresh handle most cases
3. **Monitor refresh performance** - If it takes too long, consider optimizing the view
4. **Set up alerts** - Monitor for failed refreshes in production

## 🔧 Customization

### **Change refresh frequency:**
- Modify the cron schedule in `REFRESH_ACCOUNT_HEALTH_CRON.sql`
- Adjust the `refreshInterval` in `useMaterializedViewRefresh` hook

### **Add refresh to other pages:**
- Import and use the `AccountHealthRefresher` component
- Call the refresh API endpoint from any component

### **Modify refresh behavior:**
- Edit the `refreshAccountHealth` function in `page.tsx`
- Modify the API endpoint in `route.ts` 