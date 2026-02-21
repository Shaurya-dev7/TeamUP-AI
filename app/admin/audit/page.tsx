'use client';

import { useState, useEffect } from 'react';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Premium Glass Profile indicator */}
      <div className="flex justify-between items-center backdrop-blur-xl bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            System <span className="bg-gradient-to-r from-blue-500 to-emerald-600 font-black text-transparent bg-clip-text">Audit Trail</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Immutable record of all administrative actions & platform events.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-neutral-900/30 rounded-2xl border border-neutral-800 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
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
      <div className="flex items-center justify-between p-4 border rounded-2xl border-neutral-800 bg-neutral-900/40 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-800/20 to-transparent"></div>
        <div className="text-sm font-medium text-neutral-400 relative z-10">
          Page {page} of {pagination.totalPages || 1}
        </div>
        <div className="flex gap-3 relative z-10">
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 transition-all font-semibold"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 transition-all font-semibold"
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
