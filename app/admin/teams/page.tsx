'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, MoreHorizontal, Trash2, Users2, Loader2, Lock, Globe, ArrowRightLeft, UserMinus
} from 'lucide-react';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Team {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'deleted';
  join_mode: string;
  memberCount: number;
  created_at: string;
  leader: {
    userId: string;
    username: string;
    name: string | null;
  } | null;
}

export default function TeamsPage() {
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search,
      });
      
      const res = await fetch(`/api/admin/teams?${params}`);
      if (!res.ok) throw new Error('Failed to fetch teams');
      
      const data = await res.json();
      setTeams(data.teams);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeams();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleAction = async (teamId: number, action: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success('Action completed successfully');
      fetchTeams();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const statusConfig = {
    active: { className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]', label: 'Active' },
    archived: { className: 'border-amber-500/30 bg-amber-500/10 text-amber-400', label: 'Archived' },
    deleted: { className: 'border-red-500/30 bg-red-500/10 text-red-400', label: 'Deleted' },
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Team <span className="bg-gradient-to-r from-purple-500 to-indigo-600 font-black text-transparent bg-clip-text">Management</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Oversee, moderate, and manage all platform teams.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search team name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 py-5 bg-black/40 border-neutral-800 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <Table className="relative z-10 w-full">
          <TableHeader>
            <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
              <TableHead className="text-neutral-400 font-semibold tracking-wide pl-6">Team</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Leader</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Members</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Status</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Created</TableHead>
              <TableHead className="text-right text-neutral-400 font-semibold tracking-wide pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
                    <span className="text-sm text-neutral-500 font-medium">Loading teams...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-neutral-500">
                  No teams found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id} className="border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-neutral-800 flex items-center justify-center">
                          <Users2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="font-semibold text-neutral-200">{team.name}</span>
                        {team.join_mode === 'closed' ? (
                          <Lock className="w-3 h-3 text-neutral-500" />
                        ) : (
                          <Globe className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 max-w-[200px] truncate ml-10">
                        {team.description || 'No description'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.leader ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-neutral-300 font-medium">{team.leader.name || 'Unnamed'}</span>
                        <span className="text-xs text-neutral-500 font-mono">@{team.leader.username}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 italic text-sm">No leader</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1">
                        <span className="text-purple-400 font-bold text-sm">{team.memberCount}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[team.status]?.className || ''}>
                      {statusConfig[team.status]?.label || team.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm font-medium">
                    {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 w-48">
                        <ConfirmActionModal
                          title="Delete Team"
                          description="This will permanently mark the team as deleted. This action is irreversible."
                          actionLabel="Delete Team"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(team.id, 'force_delete', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-red-400 hover:text-red-300">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Force Delete
                            </div>
                          }
                        />

                        <ConfirmActionModal
                          title="Remove All Members"
                          description="This will remove all members from the team except the leader."
                          actionLabel="Remove All"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(team.id, 'remove_all_members', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-orange-400 hover:text-orange-300">
                              <UserMinus className="mr-2 h-4 w-4" />
                              Clear Members
                            </div>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-5 border-t border-neutral-800/50 bg-neutral-900/40 relative z-10 w-full">
          <div className="text-sm font-medium text-neutral-400">
            Showing <span className="text-white font-bold">{teams.length}</span> of{' '}
            <span className="text-white font-bold">{pagination.total}</span> teams
            <span className="text-neutral-600 ml-2">• Page {page} of {pagination.totalPages || 1}</span>
          </div>
          <div className="flex gap-3">
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
    </div>
  );
}
