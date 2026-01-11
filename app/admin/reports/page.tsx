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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-900">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>Type</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center text-neutral-500">
                  No reports found.
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
        <div className="flex items-center justify-between p-4 border-t border-neutral-800">
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
    </div>
  );
}
