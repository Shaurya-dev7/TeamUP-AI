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
  Search, MoreHorizontal, ShieldAlert, ShieldBan, UserX, LogOut, 
  RotateCcw, Loader2, CheckCircle2, Eye, EyeOff, Trash2, Edit3
} from 'lucide-react';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  suspended: string | null;
  created_at: string;
  last_active_at: string | null;
  profile_completed: boolean;
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search,
      });
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleAction = async (userId: string, action: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success('Action completed successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              User <span className="bg-gradient-to-r from-blue-500 to-purple-600 font-black text-transparent bg-clip-text">Management</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Monitor, manage, and moderate all platform users.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search username or UUID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 py-5 bg-black/40 border-neutral-800 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <Table className="relative z-10 w-full">
          <TableHeader>
            <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
              <TableHead className="text-neutral-400 font-semibold tracking-wide pl-6">User</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Status</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Joined</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Last Active</TableHead>
              <TableHead className="text-right text-neutral-400 font-semibold tracking-wide pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                    <span className="text-sm text-neutral-500 font-medium">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-neutral-500">
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-neutral-800/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-neutral-800 shadow-md">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-neutral-300 font-medium">
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-200">{user.name || 'Unnamed User'}</span>
                        <span className="text-xs text-neutral-500 font-mono tracking-tight">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.suspended && user.suspended !== 'No' ? (
                      <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        {user.suspended.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-400 font-medium text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    <div className="flex items-center gap-2">
                      {user.last_active_at ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                          {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                          Never
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 w-48">
                        <ConfirmActionModal
                          title="Soft Ban User"
                          description="This will restrict the user's access. They can still login but with limited functionality."
                          actionLabel="Soft Ban"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(user.id, 'soft_ban', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-orange-400 hover:text-orange-300">
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Soft Ban
                            </div>
                          }
                        />
                        
                        <ConfirmActionModal
                          title="Hard Ban User"
                          description="This will completely disable the account. The user cannot log in."
                          actionLabel="Hard Ban"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(user.id, 'hard_ban', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-red-400 hover:text-red-300">
                              <ShieldBan className="mr-2 h-4 w-4" />
                              Hard Ban
                            </div>
                          }
                        />

                        <ConfirmActionModal
                          title="Shadow Ban User"
                          description="The user won't know they are banned. Their content will be invisible to others."
                          actionLabel="Shadow Ban"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(user.id, 'shadow_ban', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-purple-400 hover:text-purple-300">
                              <EyeOff className="mr-2 h-4 w-4" />
                              Shadow Ban
                            </div>
                          }
                        />

                        <ConfirmActionModal
                          title="Force Logout"
                          description="This will terminate all active sessions for this user."
                          actionLabel="Force Logout"
                          onConfirm={(reason) => handleAction(user.id, 'force_logout', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-neutral-300 hover:text-white">
                              <LogOut className="mr-2 h-4 w-4" />
                              Force Logout
                            </div>
                          }
                        />

                        <ConfirmActionModal
                          title="Delete Account"
                          description="DANGER: This will permanently delete the user from the database. This action cannot be undone. Requires super_admin."
                          actionLabel="Delete Forever"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(user.id, 'delete_account', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-red-500 hover:text-red-400">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </div>
                          }
                        />

                        {user.suspended && (
                          <ConfirmActionModal
                            title="Unban User"
                            description="This will restore full access to the account."
                            actionLabel="Unban"
                            onConfirm={(reason) => handleAction(user.id, 'unban', reason)}
                            trigger={
                              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 text-green-400 hover:text-green-300">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Unban
                              </div>
                            }
                          />
                        )}
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
            Showing <span className="text-white font-bold">{users.length}</span> of{' '}
            <span className="text-white font-bold">{pagination.total}</span> users
            <span className="text-neutral-600 ml-2">• Page {page} of {pagination.totalPages || 1}</span>
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

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
