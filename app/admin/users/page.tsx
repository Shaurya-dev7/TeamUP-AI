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
  ShieldAlert, 
  ShieldBan, 
  UserX, 
  LogOut, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

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
    } catch (error) {
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
    <div className="space-y-6">
      {/* Header with Title and Premium Glass Profile indicator */}
      <div className="flex justify-between items-center backdrop-blur-xl bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            User <span className="bg-gradient-to-r from-blue-500 to-purple-600 font-black text-transparent bg-clip-text">Management</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Monitor, manage, and moderate all platform users.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search username or UUID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-5 bg-black/40 border-neutral-800 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <Table className="relative z-10 w-full mb-2">
          <TableHeader>
            <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
              <TableHead className="text-neutral-400 font-semibold tracking-wide pl-4">User</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Status</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Joined</TableHead>
              <TableHead className="text-neutral-400 font-semibold tracking-wide">Last Active</TableHead>
              <TableHead className="text-right text-neutral-400 font-semibold tracking-wide pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-neutral-800">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-neutral-900 text-neutral-400">{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-200">{user.name || 'Unnamed User'}</span>
                        <span className="text-xs text-neutral-500 font-mono tracking-tight">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.suspended && user.suspended !== 'No' ? (
                      <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-500">
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
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800">
                        <ConfirmActionModal
                          title="Soft Ban User"
                          description="This will restrict the user's access but verify they can still login. They will be marked as suspended."
                          actionLabel="Soft Ban"
                          variant="destructive"
                          onConfirm={(reason) => handleAction(user.id, 'soft_ban', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-red-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-400">
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
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-red-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-500">
                              <ShieldBan className="mr-2 h-4 w-4" />
                              Hard Ban
                            </div>
                          }
                        />

                        <ConfirmActionModal
                          title="Force Logout"
                          description="This will terminate all active sessions for this user."
                          actionLabel="Force Logout"
                          onConfirm={(reason) => handleAction(user.id, 'force_logout', reason)}
                          trigger={
                            <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-neutral-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <LogOut className="mr-2 h-4 w-4" />
                              Force Logout
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
                              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-800 hover:text-green-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-green-400">
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
