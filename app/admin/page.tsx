import { requireAdmin, AdminActions, logAdminAction } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { StatCard } from '@/components/admin/StatCard';
import { Users, UsersRound, Activity, UserPlus, AlertTriangle, Zap, ShieldAlert, Shield } from 'lucide-react';
import Link from 'next/link';
import { AdminRole } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const supabase = createServiceClient();

  const [
    usersResult,
    teamsResult,
    activeUsersResult,
    newSignupsResult,
    reportsResult,
    flagsResult,
    adminsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('system_flags').select('key, value'),
    supabase.from('admin_roles').select('role'),
  ]);

  const flags: Record<string, boolean> = {};
  (flagsResult.data || []).forEach(f => {
    flags[f.key] = f.value;
  });

  const admins = adminsResult.data || [];
  const adminDistribution = {
    super_admin: admins.filter(a => a.role === 'super_admin').length,
    admin: admins.filter(a => a.role === 'admin').length,
    senior_moderator: admins.filter(a => a.role === 'senior_moderator').length,
    moderator: admins.filter(a => a.role === 'moderator').length,
  };

  return {
    totalUsers: usersResult.count ?? 0,
    totalTeams: teamsResult.count ?? 0,
    activeUsers24h: activeUsersResult.count ?? 0,
    newSignups7d: newSignupsResult.count ?? 0,
    pendingReports: reportsResult.count ?? 0,
    systemFlags: flags,
    adminDistribution,
  };
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const stats = await getDashboardStats();

  // Log dashboard view
  await logAdminAction({
    adminUserId: admin.id,
    action: AdminActions.VIEW_DASHBOARD,
  });

  return (
    <div className="space-y-12">
      {/* Header with Title and Premium Glass Profile indicator */}
      <div className="flex justify-between items-center backdrop-blur-xl bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Admin <span className="bg-gradient-to-r from-red-500 to-purple-600 font-black text-transparent bg-clip-text">Nexus</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Real-time platform oversight & control</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 bg-black/40 px-5 py-3 rounded-full border border-neutral-800">
           <div className="text-right">
             <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Active Session</p>
             <p className="text-sm font-bold text-white capitalize">{admin.role.replace('_', ' ')}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center border border-white/20 shadow-lg glow">
             <Shield className="w-5 h-5 text-white" />
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users (24h)"
          value={stats.activeUsers24h}
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Active Teams"
          value={stats.totalTeams}
          icon={UsersRound}
          color="purple"
        />
        <StatCard
          title="New Signups (7d)"
          value={stats.newSignups7d}
          icon={UserPlus}
          color="cyan"
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          icon={AlertTriangle}
          color={stats.pendingReports > 0 ? 'red' : 'green'}
          href="/admin/reports"
          glowing={stats.pendingReports > 0}
        />
        <StatCard
          title="Total Admins"
          value={Object.values(stats.adminDistribution).reduce((a, b) => a + b, 0)}
          icon={ShieldAlert}
          color="gold"
          href="/admin/admins"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Status (2 cols wide) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
            <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
            System Control Panel
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 border border-neutral-800/50 p-6 rounded-xl bg-black/40">
            {[
              { key: 'registrations_enabled', label: 'Registrations', desc: 'New user signups' },
              { key: 'team_creation_enabled', label: 'Team Creation', desc: 'Forming new teams' },
              { key: 'invites_enabled', label: 'Invites', desc: 'Team invitations' },
              { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Platform lockdown', inverted: true },
              { key: 'read_only_mode', label: 'Read Only Mode', desc: 'Database writes paused', inverted: true },
            ].map(flag => {
              const isEnabled = stats.systemFlags[flag.key] ?? (flag.inverted ? false : true);
              const isGood = flag.inverted ? !isEnabled : isEnabled;

              return (
                <div
                  key={flag.key}
                  className={`
                    relative group px-5 py-4 rounded-xl border transition-all duration-300
                    ${isGood 
                      ? 'bg-emerald-950/20 border-emerald-900/50 hover:bg-emerald-900/30' 
                      : 'bg-red-950/20 border-red-900/50 hover:bg-red-900/30 animate-pulse'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-2 h-2 rounded-full glowing bg-current shadow-[0_0_10px_current]" 
                         style={{ color: isGood ? '#10b981' : '#ef4444' }} />
                    <div className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded
                      ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}
                    >
                      {isEnabled ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${isGood ? 'text-emerald-100' : 'text-red-100'}`}>{flag.label}</div>
                  <div className={`text-xs mt-1 ${isGood ? 'text-emerald-500/70' : 'text-red-400/80'}`}>{flag.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Hierarchy Distribution (1 col wide) */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-8 shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
           <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              Role Distribution
           </h2>
           <div className="space-y-4">
              {[
                { role: 'super_admin' as AdminRole, count: stats.adminDistribution.super_admin, color: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-500' },
                { role: 'admin' as AdminRole, count: stats.adminDistribution.admin, color: 'text-rose-400', bg: 'bg-rose-500/20', bar: 'bg-rose-500' },
                { role: 'senior_moderator' as AdminRole, count: stats.adminDistribution.senior_moderator, color: 'text-blue-400', bg: 'bg-blue-500/20', bar: 'bg-blue-500' },
                { role: 'moderator' as AdminRole, count: stats.adminDistribution.moderator, color: 'text-emerald-400', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
              ].map(item => {
                const max = Math.max(...Object.values(stats.adminDistribution), 1);
                const width = `${(item.count / max) * 100}%`;
                return (
                  <div key={item.role} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-medium tracking-wide ${item.color} capitalize`}>{item.role.replace('_', ' ')}</span>
                      <span className="font-mono text-neutral-400 font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div className={`h-full rounded-full transition-all duration-1000 ${item.bar}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
           </div>
           
           <Link href="/admin/admins" className="mt-8 flex items-center justify-center w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-sm font-medium text-white transition-all">
             Manage Access Controls
           </Link>
        </div>
      </div>
    </div>
  );
}
