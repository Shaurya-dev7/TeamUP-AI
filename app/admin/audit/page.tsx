'use client';

import { useState, useEffect } from 'react';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Filter, ScrollText, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'view_dashboard', label: 'View Dashboard' },
  { value: 'view_user', label: 'View User' },
  { value: 'soft_ban_user', label: 'Soft Ban' },
  { value: 'hard_ban_user', label: 'Hard Ban' },
  { value: 'shadow_ban_user', label: 'Shadow Ban' },
  { value: 'unban_user', label: 'Unban User' },
  { value: 'force_logout_user', label: 'Force Logout' },
  { value: 'delete_user', label: 'Delete User' },
  { value: 'view_team', label: 'View Team' },
  { value: 'edit_team', label: 'Edit Team' },
  { value: 'delete_team', label: 'Delete Team' },
  { value: 'update_system_flag', label: 'System Flag Change' },
  { value: 'resolve_report', label: 'Resolve Report' },
  { value: 'dismiss_report', label: 'Dismiss Report' },
  { value: 'view_audit_logs', label: 'View Audit Logs' },
];

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  
  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [searchAdmin, setSearchAdmin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (searchAdmin) params.set('admin_user_id', searchAdmin);
      
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, searchAdmin]);

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Time', 'Admin', 'Action', 'Target Table', 'Target ID', 'Metadata'];
    const rows = logs.map((log: any) => [
      new Date(log.created_at).toISOString(),
      log.adminProfile?.username || log.admin_user_id,
      log.action,
      log.target_table || '',
      log.target_id || '',
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const clearFilters = () => {
    setActionFilter('all');
    setSearchAdmin('');
    setPage(1);
  };

  const hasActiveFilters = actionFilter !== 'all' || searchAdmin !== '';

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              System <span className="bg-gradient-to-r from-emerald-500 to-cyan-600 font-black text-transparent bg-clip-text">Audit Trail</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Immutable record of all administrative actions & platform events.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className={`border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-semibold ${showFilters ? 'ring-1 ring-emerald-500/50' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-semibold"
              onClick={exportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-neutral-400">Filter by Action</label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="bg-black/40 border-neutral-800 focus:ring-emerald-500/50">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950 border-neutral-800 max-h-64">
                  {ACTION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-neutral-400">Filter by Admin UUID</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Admin user UUID..."
                  value={searchAdmin}
                  onChange={(e) => { setSearchAdmin(e.target.value); setPage(1); }}
                  className="pl-9 bg-black/40 border-neutral-800 focus-visible:ring-emerald-500/50"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white shrink-0"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-neutral-900/30 rounded-2xl border border-neutral-800 backdrop-blur-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-neutral-500 font-medium">Loading audit trail...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 p-2">
            <AuditLogTable logs={logs} />
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-800/10 to-transparent pointer-events-none" />
        <div className="text-sm font-medium text-neutral-400 relative z-10">
          Showing <span className="text-white font-bold">{logs.length}</span> logs
          <span className="text-neutral-600 ml-2">• Page {page} of {pagination.totalPages || 1}</span>
        </div>
        <div className="flex gap-3 relative z-10">
          <Button
            variant="outline" size="sm"
            className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-semibold"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline" size="sm"
            className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-semibold"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
