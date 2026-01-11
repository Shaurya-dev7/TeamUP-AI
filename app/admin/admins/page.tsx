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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { Loader2, Shield, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminUser {
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator';
  granted_at: string;
  granted_by: string | null;
  profile: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminId, setNewAdminId] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      if (!res.ok) throw new Error('Failed to fetch admins');
      
      const data = await res.json();
      setAdmins(data.admins);
    } catch (error) {
      toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAction = async (userId: string, action: string, role?: string) => {
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success('Admin role updated');
      fetchAdmins();
      setNewAdminId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <p className="text-neutral-400 mt-1">
          Manage platform administrators. Only Super Admins can access this page.
        </p>
      </div>

      {/* Add New Admin */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30">
        <h2 className="text-lg font-semibold mb-4">Add New Admin</h2>
        <div className="flex gap-4">
          <Input
            placeholder="User UUID"
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
            className="max-w-md bg-neutral-950 border-neutral-800"
          />
          <ConfirmActionModal
            title="Promote to Admin"
            description="This user will be granted full administrative access to the platform."
            actionLabel="Promote"
            requireReason={false}
            onConfirm={() => handleAction(newAdminId, 'promote', 'admin')}
            trigger={
              <Button disabled={!newAdminId}>
                <Shield className="w-4 h-4 mr-2" />
                Promote to Admin
              </Button>
            }
          />
        </div>
      </div>

      {/* Admin List */}
      <div className="rounded-md border border-neutral-800 bg-neutral-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  </div>
                </TableCell>
              </TableRow>
            ) : admins.map((admin) => (
              <TableRow key={admin.user_id} className="border-neutral-800 hover:bg-neutral-900/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={admin.profile?.avatar_url || ''} />
                      <AvatarFallback>{admin.profile?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-200">
                        {admin.profile?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {admin.user_id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`
                      capitalize
                      ${admin.role === 'super_admin' ? 'border-purple-800 text-purple-400 bg-purple-950/30' : ''}
                      ${admin.role === 'admin' ? 'border-blue-800 text-blue-400 bg-blue-950/30' : ''}
                      ${admin.role === 'moderator' ? 'border-green-800 text-green-400 bg-green-950/30' : ''}
                    `}
                  >
                    {admin.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-400 text-sm">
                  {new Date(admin.granted_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {admin.role !== 'super_admin' && (
                      <ConfirmActionModal
                        title="Promote to Super Admin"
                        description="Grant this user Super Admin privileges. They will be able to manage other admins."
                        actionLabel="Promote"
                        requireReason={false}
                        onConfirm={() => handleAction(admin.user_id, 'promote', 'super_admin')}
                        trigger={
                          <Button size="sm" variant="ghost" title="Promote">
                            <ArrowUpCircle className="w-4 h-4 text-purple-400" />
                          </Button>
                        }
                      />
                    )}
                    
                    {admin.role === 'super_admin' && (
                      <ConfirmActionModal
                        title="Demote to Admin"
                        description="Revoke Super Admin privileges. They will become a regular admin."
                        actionLabel="Demote"
                        requireReason={false}
                        variant="destructive"
                        onConfirm={() => handleAction(admin.user_id, 'demote', 'admin')}
                        trigger={
                          <Button size="sm" variant="ghost" title="Demote">
                            <ArrowDownCircle className="w-4 h-4 text-orange-400" />
                          </Button>
                        }
                      />
                    )}

                    <ConfirmActionModal
                      title="Remove Admin Access"
                      description="Revoke all administrative privileges from this user. They will become a regular user."
                      actionLabel="Remove Access"
                      variant="destructive"
                      requireReason={false}
                      onConfirm={() => handleAction(admin.user_id, 'remove')}
                      trigger={
                        <Button size="sm" variant="ghost" className="hover:bg-red-950/30">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
