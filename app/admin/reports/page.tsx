'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface Report {
  id: number;
  reporter: { username: string } | null;
  reportedUser: { username: string } | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  severity: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
      });
      
      const res = await fetch(`/api/admin/reports?${params}`);
      
      // Handle 404/500 gracefully if table doesn't exist
      if (res.status === 404 || res.status === 500) {
        setReports([]);
        setPagination({ total: 0, totalPages: 0 });
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch reports');
      
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Reports fetch error:', error);
      // Don't toast error here as it might be expected if table missing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const handleAction = async (reportId: number, action: string, reason: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action, reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success('Report resolved successfully');
      fetchReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Premium Glass Profile indicator */}
      <div className="flex justify-between items-center backdrop-blur-xl bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Content <span className="bg-gradient-to-r from-red-500 to-orange-600 font-black text-transparent bg-clip-text">Moderation</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Review, resolve, and manage user reports.</p>
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-neutral-800 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white transition-all">Pending</TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white transition-all">Resolved</TabsTrigger>
            <TabsTrigger value="dismissed" className="rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white transition-all">Dismissed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <Table className="relative z-10 w-full mb-2">
          <TableHeader>
            <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
              <TableHead className="text-neutral-400 font-semibold tracking-wide pl-4">Type</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Reporter</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Reported User</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Reason</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Time</TableHead>
              <TableHead className="text-right text-neutral-400 font-semibold tracking-wide pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <ShieldAlert className="w-8 h-8 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-neutral-300">No Reports Found</h3>
                      <p className="text-sm text-neutral-500 mt-1 max-w-sm">There are currently no user reports matching your selected filter. Everything looks clean!</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="border-neutral-800 hover:bg-neutral-900/50">
                  <TableCell>
                    <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/30">
                      {report.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {report.reporter?.username || 'Unknown'}
                  </TableCell>
                  <TableCell className="font-medium text-neutral-200">
                    {report.reportedUser?.username || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[300px]">
                      <span className="font-medium text-neutral-300">{report.reason}</span>
                      {report.description && (
                        <span className="text-xs text-neutral-500 truncate">{report.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <ConfirmActionModal
                          title="Dismiss Report"
                          description="This will mark the report as invalid. No action will be taken against the user."
                          actionLabel="Dismiss"
                          onConfirm={(reason) => handleAction(report.id, 'dismiss', reason)}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-white">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          }
                        />

                        <ConfirmActionModal
                          title="Resolve & Warn"
                          description="The user will receive a warning. The report will be marked as resolved."
                          actionLabel="Warn User"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(report.id, 'warn_user', reason)}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-400">
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          }
                        />

                        <ConfirmActionModal
                          title="Ban User"
                          description="The user will be suspended (soft ban). The report will be marked as resolved."
                          actionLabel="Ban User"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(report.id, 'ban_user', reason)}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400">
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    )}
                    {report.status !== 'pending' && (
                      <Badge variant="secondary" className="capitalize">
                        {report.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-800 bg-neutral-900/40 relative z-10 w-full">
          <div className="text-sm font-medium text-neutral-400">
            Page {page} of {pagination.totalPages || 1}
          </div>
          <div className="flex gap-3">
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
    </div>
  );
}
