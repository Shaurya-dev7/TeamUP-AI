import { requireAdmin, AdminActions, logAdminAction } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { StatCard } from '@/components/admin/StatCard';
import { Users, UsersRound, Activity, UserPlus, AlertTriangle, Zap } from 'lucide-react';

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
  ]);

  const flags: Record<string, boolean> = {};
  (flagsResult.data || []).forEach(f => {
    flags[f.key] = f.value;
  });

  return {
    totalUsers: usersResult.count ?? 0,
    totalTeams: teamsResult.count ?? 0,
    activeUsers24h: activeUsersResult.count ?? 0,
    newSignups7d: newSignupsResult.count ?? 0,
    pendingReports: reportsResult.count ?? 0,
    systemFlags: flags,
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Platform overview and quick stats</p>
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
          title="Total Teams"
          value={stats.totalTeams}
          icon={UsersRound}
          color="purple"
        />
        <StatCard
          title="Active Users (24h)"
          value={stats.activeUsers24h}
          icon={Activity}
          color="green"
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
        />
      </div>

      {/* System Status */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          System Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { key: 'registrations_enabled', label: 'Registrations' },
            { key: 'team_creation_enabled', label: 'Team Creation' },
            { key: 'invites_enabled', label: 'Invites' },
            { key: 'maintenance_mode', label: 'Maintenance', inverted: true },
            { key: 'read_only_mode', label: 'Read Only', inverted: true },
          ].map(flag => {
            const isEnabled = stats.systemFlags[flag.key] ?? (flag.inverted ? false : true);
            const isGood = flag.inverted ? !isEnabled : isEnabled;

            return (
              <div
                key={flag.key}
                className={`
                  px-4 py-3 rounded-lg border text-center
                  ${isGood 
                    ? 'bg-green-950/30 border-green-800 text-green-400' 
                    : 'bg-red-950/30 border-red-800 text-red-400'
                  }
                `}
              >
                <div className="text-sm font-medium">{flag.label}</div>
                <div className="text-xs mt-1 opacity-70">
                  {isEnabled ? 'ON' : 'OFF'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Manage Users
          </a>
          <a
            href="/admin/teams"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Manage Teams
          </a>
          {admin.role === 'super_admin' && (
            <a
              href="/admin/system"
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
            >
              System Settings
            </a>
          )}
          <a
            href="/admin/audit"
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
          >
            View Audit Logs
          </a>
        </div>
      </div>
    </div>
  );
}
