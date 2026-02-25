'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Users2, AlertTriangle, Calendar, Mail, MapPin, GraduationCap, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserDetail {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  suspended: string | null;
  created_at: string;
  last_active_at: string | null;
  profile_completed: boolean;
  age: number | null;
  gender: string | null;
  college: string | null;
  location: string | null;
  skills: string | null;
  rating: number;
  workscore: number;
  teamMemberships: Array<{
    role: string;
    joined_at: string;
    teams: { id: number; name: string; status: string } | null;
  }>;
  reportCount: number;
  adminRole: string | null;
}

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({ userId, open, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUser(userId);
    } else {
      setUser(null);
    }
  }, [userId, open]);

  const fetchUser = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = user?.suspended
    ? 'border-red-500/50 bg-red-500/10 text-red-400'
    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] p-0 overflow-hidden">
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : user ? (
          <div className="relative z-10">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-neutral-800/50">
              <DialogHeader>
                <DialogTitle className="sr-only">User Profile</DialogTitle>
              </DialogHeader>
              <div className="flex items-start gap-5">
                <Avatar className="w-20 h-20 border-2 border-neutral-700 shadow-xl">
                  <AvatarImage src={user.profile_picture_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-white truncate">{user.name || 'Unnamed User'}</h2>
                    {user.adminRole && (
                      <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 capitalize">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.adminRole.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-neutral-400 font-mono text-sm mt-1">@{user.username}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline" className={statusColor}>
                      {user.suspended ? user.suspended.replace('_', ' ') : 'Active'}
                    </Badge>
                    {user.profile_completed && (
                      <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">Profile Complete</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-8 pt-6 space-y-6">
              {/* Info Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Mail, label: 'Email', value: user.email || 'N/A' },
                  { icon: Calendar, label: 'Joined', value: new Date(user.created_at).toLocaleDateString() },
                  { icon: Clock, label: 'Last Active', value: user.last_active_at ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true }) : 'Never' },
                  { icon: GraduationCap, label: 'College', value: user.college || 'N/A' },
                  { icon: MapPin, label: 'Location', value: user.location || 'N/A' },
                  { icon: AlertTriangle, label: 'Reports', value: `${user.reportCount} filed` },
                ].map((item) => (
                  <div key={item.label} className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wider mb-2">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <p className="text-neutral-200 font-medium text-sm truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Rating', value: user.rating?.toFixed(1) || '0.0', color: 'text-amber-400' },
                  { label: 'Work Score', value: user.workscore?.toFixed(0) || '0', color: 'text-blue-400' },
                  { label: 'Skills', value: user.skills ? user.skills.split(',').length.toString() : '0', color: 'text-purple-400' },
                  { label: 'Age', value: user.age?.toString() || 'N/A', color: 'text-emerald-400' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center bg-black/40 rounded-xl border border-neutral-800/40 p-3">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Teams */}
              {user.teamMemberships && user.teamMemberships.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users2 className="w-4 h-4" />
                    Team Memberships ({user.teamMemberships.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {user.teamMemberships.map((tm, i) => (
                      <div key={i} className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800/30 rounded-lg px-4 py-2.5">
                        <span className="text-sm text-neutral-200 font-medium">{tm.teams?.name || 'Unknown Team'}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-neutral-700 text-neutral-400 capitalize">{tm.role}</Badge>
                          <Badge variant="outline" className={`text-xs capitalize ${tm.teams?.status === 'active' ? 'border-emerald-800 text-emerald-400' : 'border-neutral-700 text-neutral-500'}`}>
                            {tm.teams?.status || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User ID */}
              <div className="pt-2 border-t border-neutral-800/30">
                <p className="text-xs text-neutral-600 font-mono select-all">UUID: {user.id}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-neutral-500">
            User not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
