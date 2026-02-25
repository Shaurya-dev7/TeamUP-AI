'use client';

import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { Loader2, Shield, Trash2, ArrowDownCircle, Info, UserPlus, Crown, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AdminRole = 'super_admin' | 'admin' | 'senior_moderator' | 'moderator';

const ROLE_POWER: Record<AdminRole, number> = {
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

const ROLE_BADGE_STYLES: Record<AdminRole, { className: string; glow: string; desc: string; gradient: string }> = {
  super_admin: {
    className: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]',
    gradient: 'from-amber-600/30 to-orange-600/30',
    desc: 'Absolute Control. Can manage everything.'
  },
  admin: {
    className: 'border-rose-500/50 text-rose-400 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]',
    gradient: 'from-rose-600/30 to-pink-600/30',
    desc: 'Platform Management. Can manage up to Senior Mods.'
  },
  senior_moderator: {
    className: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]',
    gradient: 'from-blue-600/30 to-indigo-600/30',
    desc: 'Elevated Moderation. Can manage Moderators.'
  },
  moderator: {
    className: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]',
    gradient: 'from-emerald-600/30 to-teal-600/30',
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
    } catch {
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
        {/* Premium Header */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Super Admin Only
              </Badge>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Access <span className="bg-gradient-to-r from-amber-500 to-rose-600 font-black text-transparent bg-clip-text">Control</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">
              Manage hierarchical platform administrators and authority matrices.
            </p>
          </div>
        </div>

        {/* Add New Admin Form */}
        <div className="relative overflow-hidden p-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-500/20 rounded-xl">
              <UserPlus className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Grant Admin Authority</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Enter a username or UUID to promote</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end relative z-10 w-full lg:w-2/3">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium text-neutral-400 ml-1">Username or UUID</label>
              <Input
                placeholder="e.g. @username or 123e4567-e89b-12d3..."
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                className="bg-black/40 border-neutral-800 h-12 focus-visible:ring-rose-500/50 text-white"
              />
            </div>
            
            <div className="w-full sm:w-56 space-y-2">
               <label className="text-sm font-medium text-neutral-400 ml-1">Authority Level</label>
               <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                 <SelectTrigger className="h-12 bg-black/40 border-neutral-800 focus:ring-rose-500/50">
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
                <Button disabled={!newAdminId || !selectedRole} className="h-12 px-8 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold shadow-lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
              }
            />
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500 bg-black/30 p-3 rounded-xl border border-neutral-800/50 w-fit">
             <Info className="w-4 h-4 text-blue-400 shrink-0" />
             <span>Backend validates all role assignments strictly according to the hierarchical authority matrix.</span>
          </div>
        </div>

        {/* Admin List Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            placeholder="Search by name, @username, or UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/40 border-neutral-800 max-w-sm focus-visible:ring-amber-500/50"
          />
          <Button 
            variant="outline" 
            onClick={() => setSortByRole(!sortByRole)}
            className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white font-semibold"
          >
            {sortByRole ? 'Reset Sorting' : 'Sort by Power Level'}
          </Button>
        </div>

        {/* Admin List */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <Table className="relative z-10">
            <TableHeader>
              <TableRow className="border-neutral-800/50 bg-neutral-900/60 hover:bg-neutral-900/60">
                <TableHead className="font-semibold text-neutral-400 tracking-wide pl-6">User Identity</TableHead>
                <TableHead className="font-semibold text-neutral-400 tracking-wide">Role & Power</TableHead>
                <TableHead className="font-semibold text-neutral-400 tracking-wide">Granted On</TableHead>
                <TableHead className="text-right font-semibold text-neutral-400 tracking-wide pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex justify-center flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                      <span className="text-sm text-neutral-500 font-medium">Synchronizing Authority Matrix...</span>
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
                  <TableRow key={admin.user_id} className="border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <Avatar className={`h-10 w-10 border border-neutral-800 shadow-md`}>
                        <AvatarImage src={admin.profile?.avatar_url || ''} />
                        <AvatarFallback className={`bg-gradient-to-br ${ROLE_BADGE_STYLES[admin.role].gradient} text-neutral-200 font-bold`}>
                           {admin.profile?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-200">
                          {admin.profile?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono mt-0.5">
                          @{admin.profile?.username || admin.user_id.slice(0, 8)}
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
                  
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
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
