# Multi-Platform Social Media Dashboard

A modern, real-time dashboard for monitoring TikTok and Instagram performance metrics.

## Features

### TikTok Dashboard
- Real-time performance metrics
- Daily aggregation statistics
- Top performing posts
- Account overview with follower counts
- Interactive charts and visualizations

### Instagram Dashboard
- Follower growth tracking
- Post engagement metrics (likes, comments, shares)
- Top performing Instagram posts
- Account performance overview
- Performance trends over time

### Multi-Platform Support
- Platform selector to switch between TikTok and Instagram
- Consistent UI/UX across both platforms
- Real-time data updates
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The dashboard expects the following tables in your Supabase database:

### TikTok Tables
- `daily_agg` - Daily aggregated TikTok metrics
- `latest_snapshots` - Latest TikTok account snapshots
- `v_daily_video` - Daily video performance view
- `v_daily_video_delta` - Daily video performance delta view

### Instagram Tables
- `instagram_daily_agg` - Daily aggregated Instagram metrics
- `instagram_accounts` - Instagram account information
- `instagram_posts` - Instagram post data

## API Endpoints

### TikTok
- `GET /api/daily-agg` - Get daily aggregated TikTok data
- `GET /api/accounts` - Get TikTok accounts with views
- `GET /api/top-posts` - Get top performing TikTok posts

### Instagram
- `GET /api/instagram/daily-agg` - Get daily aggregated Instagram data
- `GET /api/instagram/accounts` - Get Instagram accounts
- `GET /api/instagram/top-posts` - Get top performing Instagram posts

## Components

### Shared Components
- `PlatformSelector` - Switch between TikTok and Instagram dashboards

### TikTok Components
- `StatsGrid` - Display TikTok performance metrics
- `ViewsChart` - Chart showing TikTok views over time
- `TopPostsCard` - Display top performing TikTok posts
- `AccountsCard` - Display TikTok account information

### Instagram Components
- `InstagramStatsGrid` - Display Instagram performance metrics
- `InstagramViewsChart` - Chart showing Instagram performance over time
- `InstagramTopPostsCard` - Display top performing Instagram posts
- `InstagramAccountsCard` - Display Instagram account information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
