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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { Loader2, Shield, Trash2, ArrowUpCircle, ArrowDownCircle, Info, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type AdminRole = 'super_admin' | 'admin' | 'senior_moderator' | 'moderator';

export const ROLE_POWER: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 90,
  senior_moderator: 70,
  moderator: 50,
};

interface AdminUser {
  user_id: string;
  role: AdminRole;
  granted_at: string;
  granted_by: string | null;
  profile: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

const ROLE_BADGE_STYLES: Record<AdminRole, { className: string; glow: string; desc: string }> = {
  super_admin: {
    className: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]',
    desc: 'Absolute Control. Can manage everything.'
  },
  admin: {
    className: 'border-rose-500/50 text-rose-400 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]',
    desc: 'Platform Management. Can manage up to Senior Mods.'
  },
  senior_moderator: {
    className: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]',
    desc: 'Elevated Moderation. Can manage Moderators.'
  },
  moderator: {
    className: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]',
    desc: 'Operational Moderation. Cannot promote others.'
  }
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminId, setNewAdminId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('moderator');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByRole, setSortByRole] = useState<boolean>(false);

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
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Access Control</h1>
          <p className="text-neutral-400 mt-2 font-medium">
            Manage hierarchical platform administrators and authority matrices.
          </p>
        </div>

        {/* Add New Admin Form */}
        <div className="relative overflow-hidden p-6 lg:p-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <UserPlus className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Grant Admin Authority</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end relative z-10 w-full lg:w-2/3">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium text-neutral-400 ml-1">User Identifier (UUID)</label>
              <Input
                placeholder="e.g. 123e4567-e89b-12d3..."
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                className="bg-black/50 border-neutral-800 h-11 focus-visible:ring-rose-500/50"
              />
            </div>
            
            <div className="w-full sm:w-56 space-y-2">
               <label className="text-sm font-medium text-neutral-400 ml-1">Authority Level</label>
               <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                 <SelectTrigger className="h-11 bg-black/50 border-neutral-800 focus:ring-rose-500/50">
                    <SelectValue placeholder="Select role" />
                 </SelectTrigger>
                 <SelectContent className="bg-neutral-950 border-neutral-800">
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="senior_moderator">Senior Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <ConfirmActionModal
              title={`Promote to ${selectedRole.replace('_', ' ')}`}
              description={`You are about to grant ${selectedRole.replace('_', ' ')} authority to this user. This action will be logged.`}
              actionLabel="Confirm Promotion"
              requireReason={false}
              onConfirm={() => handleAction(newAdminId, 'promote', selectedRole)}
              trigger={
                <Button disabled={!newAdminId || !selectedRole} className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-lg glow">
                  <Shield className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
              }
            />
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500 bg-black/30 p-3 rounded-lg border border-neutral-800/50 w-fit">
             <Info className="w-4 h-4 text-blue-400" />
             <span>Backend validates all role assignments strictly according to the hierarchical authority matrix.</span>
          </div>
        </div>

        {/* Admin List Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <Input
            placeholder="Search by name, @username, or UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/50 border-neutral-800 max-w-sm focus-visible:ring-blue-500/50"
          />
          <Button 
            variant="outline" 
            onClick={() => setSortByRole(!sortByRole)}
            className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white"
          >
            {sortByRole ? 'Reset Sorting' : 'Sort by Power Level'}
          </Button>
        </div>

        {/* Admin List */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-neutral-900/50">
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableHead className="font-semibold text-neutral-300">User Identity</TableHead>
                <TableHead className="font-semibold text-neutral-300">Role & Power</TableHead>
                <TableHead className="font-semibold text-neutral-300">Granted On</TableHead>
                <TableHead className="text-right font-semibold text-neutral-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex justify-center flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      <span className="text-sm text-neutral-500 font-medium tracking-wide">Synchronizing Authority Matrix...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (() => {
                let filtered = admins.filter(a => {
                   const q = searchQuery.toLowerCase();
                   return a.user_id.toLowerCase().includes(q) || 
                          (a.profile?.name && a.profile.name.toLowerCase().includes(q)) ||
                          (a.profile?.username && a.profile.username.toLowerCase().includes(q));
                });
                
                if (sortByRole) {
                  filtered.sort((a, b) => ROLE_POWER[b.role] - ROLE_POWER[a.role]);
                }

                if (filtered.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-neutral-500">
                        No administrators found matching your search.
                      </TableCell>
                    </TableRow>
                  );
                }

                return filtered.map((admin) => (
                  <TableRow key={admin.user_id} className="border-neutral-800 hover:bg-white/[0.02] transition-colors group">
                    <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-neutral-800 shadow-md">
                        <AvatarImage src={admin.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-neutral-800 text-neutral-300 font-medium">
                           {admin.profile?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-200">
                          {admin.profile?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono mt-0.5">
                          {admin.user_id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip>
                       <TooltipTrigger className="cursor-help">
                          <Badge 
                            variant="outline" 
                            className={`
                              capitalize px-3 py-1 font-semibold tracking-wide border
                              ${ROLE_BADGE_STYLES[admin.role].className}
                              ${ROLE_BADGE_STYLES[admin.role].glow}
                            `}
                          >
                            <Shield className="w-3 h-3 mr-1.5 opacity-70" />
                            {admin.role.replace('_', ' ')}
                          </Badge>
                       </TooltipTrigger>
                       <TooltipContent className="bg-neutral-900 border-neutral-800 text-neutral-200 font-medium shadow-2xl p-3 max-w-xs">
                          <p>{ROLE_BADGE_STYLES[admin.role].desc}</p>
                          <p className="mt-1 text-xs text-neutral-500 font-mono">Power Level: {ROLE_POWER[admin.role]}/100</p>
                       </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell className="text-neutral-400 text-sm font-medium">
                    {new Date(admin.granted_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                      {/* Demote visually represented as a quick action if possible (depends on authority, will be rejected by backend if unauthorized) */}
                      {admin.role !== 'moderator' && (
                         <ConfirmActionModal
                            title="Demote Admin"
                            description={`Are you sure you want to demote this user from ${admin.role.replace('_', ' ')}?`}
                            actionLabel="Demote"
                            requireReason={false}
                            variant="destructive"
                            onConfirm={() => handleAction(admin.user_id, 'demote', admin.role === 'super_admin' ? 'admin' : admin.role === 'admin' ? 'senior_moderator' : 'moderator')}
                            trigger={
                              <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-orange-500/10 hover:text-orange-400" title="Demote one level">
                                <ArrowDownCircle className="w-4 h-4" />
                              </Button>
                            }
                          />
                      )}

                      <ConfirmActionModal
                        title="Revoke Access"
                        description="Permanently revoke all administrative privileges from this user. They will return to standard user access."
                        actionLabel="Revoke"
                        variant="destructive"
                        requireReason={false}
                        onConfirm={() => handleAction(admin.user_id, 'remove')}
                        trigger={
                          <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-red-500/10 hover:text-red-400" title="Remove entirely">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
