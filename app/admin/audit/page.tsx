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
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-neutral-400 mt-1">
          Immutable record of all administrative actions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-neutral-900/30 rounded-lg border border-neutral-800">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      ) : (
        <AuditLogTable logs={logs} />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border rounded-lg border-neutral-800 bg-neutral-900/30">
        <div className="text-sm text-neutral-500">
          Page {page} of {pagination.totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
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
