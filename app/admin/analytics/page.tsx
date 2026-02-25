'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, UsersRound, ShieldBan, UserCheck, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface TrendPoint {
  date: string;
  count: number;
}

interface AnalyticsData {
  signupTrend: TrendPoint[];
  activeTrend: TrendPoint[];
  teamTrend: TrendPoint[];
  totals: {
    users: number;
    teams: number;
    banned: number;
    completedProfiles: number;
  };
}

function MiniChart({ data, color, label }: { data: TrendPoint[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-6 shadow-2xl">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-10" style={{ background: color }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{label}</h3>
            <p className="text-3xl font-bold text-white mt-1">{total}</p>
            <p className="text-xs text-neutral-500 mt-0.5">in the last {data.length} days</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
            <TrendingUp className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="flex items-end gap-[2px] h-24">
          {data.map((point, i) => {
            const height = max > 0 ? (point.count / max) * 100 : 0;
            return (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    background: `linear-gradient(to top, ${color}40, ${color}90)`,
                    minHeight: '2px',
                  }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 whitespace-nowrap shadow-xl">
                    <p className="text-[10px] text-neutral-400">{point.date}</p>
                    <p className="text-xs font-bold text-white">{point.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-neutral-600">{data[0]?.date?.slice(5)}</span>
          <span className="text-[10px] text-neutral-600">{data[data.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-sm text-neutral-500 font-medium">Crunching analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-80 text-neutral-500">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Platform <span className="bg-gradient-to-r from-cyan-500 to-sky-600 font-black text-transparent bg-clip-text">Analytics</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Visual insights into platform health, growth, and user engagement.</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: data.totals.users, icon: Users, color: '#3b82f6' },
          { label: 'Total Teams', value: data.totals.teams, icon: UsersRound, color: '#a855f7' },
          { label: 'Banned Users', value: data.totals.banned, icon: ShieldBan, color: '#ef4444' },
          { label: 'Complete Profiles', value: data.totals.completedProfiles, icon: UserCheck, color: '#10b981' },
        ].map((metric) => (
          <div key={metric.label} className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-6">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10" style={{ background: metric.color }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">{metric.label}</p>
                <div className="p-2 rounded-lg" style={{ background: `${metric.color}20` }}>
                  <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-3">{metric.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniChart data={data.signupTrend} color="#3b82f6" label="New Signups (30d)" />
        <MiniChart data={data.activeTrend} color="#10b981" label="Daily Active Users (14d)" />
      </div>

      <div className="grid grid-cols-1">
        <MiniChart data={data.teamTrend} color="#a855f7" label="Teams Created (30d)" />
      </div>

      {/* Growth Insight */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Growth Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-bold text-blue-400">{data.signupTrend.slice(-7).reduce((s, d) => s + d.count, 0)}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">Signups this week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{data.activeTrend.slice(-1)[0]?.count || 0}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">Active today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{data.teamTrend.slice(-7).reduce((s, d) => s + d.count, 0)}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">Teams this week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {data.totals.users > 0 ? Math.round((data.totals.completedProfiles / data.totals.users) * 100) : 0}%
              </p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">Profile completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
