'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmActionModal } from '@/components/admin/ConfirmActionModal';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Megaphone, Plus, Trash2, Eye, EyeOff, AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'critical';
  active: boolean;
  created_at: string;
  expires_at: string | null;
  creator: { username: string; name: string | null } | null;
}

const TYPE_CONFIG = {
  info: { color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', icon: Info, label: 'Info', glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' },
  warning: { color: 'border-amber-500/30 bg-amber-500/10 text-amber-400', icon: AlertTriangle, label: 'Warning', glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' },
  critical: { color: 'border-red-500/30 bg-red-500/10 text-red-400', icon: ShieldAlert, label: 'Critical', glow: 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', type: 'info' as const, expires_at: '' });
  const [creating, setCreating] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      // Table might not exist yet
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: formData.title,
          body: formData.body,
          type: formData.type,
          expires_at: formData.expires_at || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Announcement created');
      setFormData({ title: '', body: '', type: 'info', expires_at: '' });
      setShowForm(false);
      fetchAnnouncements();
    } catch {
      toast.error('Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Announcement visibility toggled');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to toggle announcement');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Broadcast <span className="bg-gradient-to-r from-rose-500 to-orange-600 font-black text-transparent bg-clip-text">Center</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">Create and manage platform-wide announcements visible to all users.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`font-semibold shadow-lg ${showForm ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500'}`}
          >
            {showForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />New Announcement</>}
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-rose-500/20 rounded-xl">
                <Megaphone className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Create Announcement</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Title</label>
                <Input
                  placeholder="Announcement title..."
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="bg-black/40 border-neutral-800 focus-visible:ring-rose-500/50 h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Message Body</label>
                <Textarea
                  placeholder="Write your announcement message..."
                  value={formData.body}
                  onChange={(e) => setFormData(p => ({ ...p, body: e.target.value }))}
                  className="bg-black/40 border-neutral-800 focus-visible:ring-rose-500/50 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">Type</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v as any }))}>
                    <SelectTrigger className="bg-black/40 border-neutral-800 focus:ring-rose-500/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 border-neutral-800">
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="critical">🚨 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">Expires At (optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(p => ({ ...p, expires_at: e.target.value }))}
                    className="bg-black/40 border-neutral-800 focus-visible:ring-rose-500/50 h-11"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating || !formData.title.trim() || !formData.body.trim()}
              className="w-full h-12 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 font-semibold text-lg shadow-lg"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Megaphone className="w-5 h-5 mr-2" />}
              Publish Announcement
            </Button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-neutral-900/30 rounded-2xl border border-neutral-800 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-sm text-neutral-500 font-medium">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-neutral-900/20 rounded-2xl border border-neutral-800">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-300">No Announcements</h3>
          <p className="text-sm text-neutral-500 mt-1">Create your first platform announcement to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const TypeIcon = config.icon;
            return (
              <div
                key={item.id}
                className={`
                  relative overflow-hidden rounded-2xl border bg-neutral-950/60 backdrop-blur-xl p-6 transition-all duration-300
                  ${item.active ? `${config.color.split(' ')[0]} ${config.glow}` : 'border-neutral-800/50 opacity-60'}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${item.active ? config.color.split(' ').slice(1).join(' ') : 'bg-neutral-800 text-neutral-500'}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        {!item.active && (
                          <Badge variant="outline" className="border-neutral-700 text-neutral-500">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-neutral-400 text-sm mt-2 leading-relaxed">{item.body}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                        <span>by @{item.creator?.username || 'unknown'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                        {item.expires_at && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400/70">Expires {formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 hover:bg-neutral-800"
                      onClick={() => handleToggle(item.id)}
                      title={item.active ? 'Hide' : 'Show'}
                    >
                      {item.active ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
                    </Button>
                    <ConfirmActionModal
                      title="Delete Announcement"
                      description="This will permanently remove this announcement. This cannot be undone."
                      actionLabel="Delete"
                      variant="destructive"
                      requireReason={false}
                      onConfirm={() => handleDelete(item.id)}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
