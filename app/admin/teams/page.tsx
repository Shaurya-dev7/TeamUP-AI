'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  RefreshCw, 
  Users2, 
  Loader2,
  Lock,
  Globe
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
  const router = useRouter();
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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-neutral-900 border-neutral-800"
          />
        </div>
      </div>

      <div className="rounded-md border border-neutral-800 bg-neutral-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>Team</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
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
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-neutral-500">
                  No teams found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id} className="border-neutral-800 hover:bg-neutral-900/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-200">{team.name}</span>
                        {team.join_mode === 'closed' ? (
                          <Lock className="w-3 h-3 text-neutral-500" />
                        ) : (
                          <Globe className="w-3 h-3 text-neutral-500" />
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 max-w-[200px] truncate">
                        {team.description || 'No description'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.leader ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-neutral-300">{team.leader.name || 'Unnamed'}</span>
                        <span className="text-xs text-neutral-500">@{team.leader.username}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 italic">No leader</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Users2 className="w-4 h-4" />
                      {team.memberCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.status === 'deleted' ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : team.status === 'archived' ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-800 text-green-400 bg-green-950/30">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800">
                        <ConfirmActionModal
                          title="Delete Team"
                          description="This will permanently delete the team. This action is irreversible."
                          actionLabel="Delete Team"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(team.id, 'force_delete', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-red-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-500">
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
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-neutral-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Users2 className="mr-2 h-4 w-4" />
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
