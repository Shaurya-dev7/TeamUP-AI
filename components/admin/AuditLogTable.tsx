'use client';

import { formatDistanceToNow } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLog {
  id: number;
  action: string;
  admin_user_id: string;
  target_table: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
  adminProfile?: {
    username: string;
    name: string | null;
  } | null;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
            <TableHead className="w-[200px] text-neutral-400 font-semibold tracking-wide">Admin</TableHead>
            <TableHead className="text-neutral-400 font-semibold tracking-wide">Action</TableHead>
            <TableHead className="text-neutral-400 font-semibold tracking-wide">Target</TableHead>
            <TableHead className="text-neutral-400 font-semibold tracking-wide">Details</TableHead>
            <TableHead className="text-right text-neutral-400 font-semibold tracking-wide">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-neutral-200">
                    {log.adminProfile?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    {log.admin_user_id.slice(0, 8)}...
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  {log.target_table && (
                    <span className="text-neutral-400">
                      {log.target_table}
                    </span>
                  )}
                  {log.target_id && (
                    <span className="text-neutral-500 text-xs font-mono">
                      ID: {log.target_id}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <ScrollArea className="h-[60px] w-[300px] rounded-lg border border-neutral-800/50 bg-black/40 p-2 shadow-inner">
                  <pre className="text-[10px] text-blue-400/80 font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </TableCell>
              <TableCell className="text-right font-medium text-neutral-400 text-sm">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                No audit logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
