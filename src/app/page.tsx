import StatsGrid from './components/StatsGrid';
import ViewsChart from './components/ViewsChart';
import { fetchDailyAgg } from './lib/fetchDailyAgg';
import { fetchTopPosts } from './lib/fetchTopPosts';
import TopPostsCard from './components/TopPostsCard';
import { fetchAccountsWithViews } from './lib/fetchAccountsWithViews';
import AccountsCard from './components/AccountsCard';

export default async function Page() {
  const data = await fetchDailyAgg();
  const topPosts = await fetchTopPosts();
  const accounts = await fetchAccountsWithViews();
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex flex-col items-center py-12 font-sans">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow">TikTok Dashboard</h1>
          <p className="text-slate-400 text-lg">Your daily TikTok performance at a glance</p>
        </header>
        <section className="mb-10">
          <StatsGrid data={data} />
        </section>
        <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Total Views Over Time</h2>
          <ViewsChart data={data} />
        </section>
        <TopPostsCard/>
        <AccountsCard accounts={accounts} />
      </div>
    </main>
  );
}