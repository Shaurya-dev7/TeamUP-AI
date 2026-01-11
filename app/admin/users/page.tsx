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
  const [search, setSearch] = useState(searchParams.get('search') || '');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search users..."
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
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={user.id} className="border-neutral-800 hover:bg-neutral-900/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-200">{user.name || 'Unnamed'}</span>
                        <span className="text-xs text-neutral-500">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.suspended ? (
                      <Badge variant="destructive" className="capitalize">
                        {user.suspended.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-green-800 text-green-400 bg-green-950/30">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    <div className="flex items-center gap-2">
                      {user.last_active_at ? (
                        <>
                          <Wifi className="w-3 h-3 text-green-500" />
                          {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-neutral-600" />
                          Never
                        </>
                      )}
                    </div>
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
