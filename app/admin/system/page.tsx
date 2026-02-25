'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Settings, ShieldAlert, Zap, Lock, Users, Mail, Wrench, BookOpen } from 'lucide-react';

interface SystemFlag {
  key: string;
  value: boolean;
}

const FLAG_METADATA: Record<string, { label: string; description: string; danger?: boolean; icon: any }> = {
  registrations_enabled: {
    label: 'Enable Registrations',
    description: 'Allow new users to sign up to the platform.',
    icon: Users,
  },
  team_creation_enabled: {
    label: 'Enable Team Creation',
    description: 'Allow users to create new teams. Disable to stop spamming.',
    icon: Users,
  },
  invites_enabled: {
    label: 'Enable Invitations',
    description: 'Allow users to invite others to join teams.',
    icon: Mail,
  },
  maintenance_mode: {
    label: 'Maintenance Mode',
    description: 'Platform lockdown. Only admins can access the site. All users see a maintenance page.',
    danger: true,
    icon: Wrench,
  },
  read_only_mode: {
    label: 'Read-Only Mode',
    description: 'Disable all write operations. Users can browse but cannot create, update, or delete anything.',
    danger: true,
    icon: BookOpen,
  },
};

export default function SystemPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/admin/system');
      if (!res.ok) throw new Error('Failed to fetch flags');
      
      const data = await res.json();
      const flagMap: Record<string, boolean> = {};
      
      Object.keys(FLAG_METADATA).forEach(key => {
        flagMap[key] = data.flags.find((f: SystemFlag) => f.key === key)?.value ?? 
          (!FLAG_METADATA[key].danger);
      });

      setFlags(flagMap);
    } catch {
      toast.error('Failed to load system flags');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, newValue: boolean) => {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (!res.ok) throw new Error('Failed to update flag');

      setFlags(prev => ({ ...prev, [key]: newValue }));
      toast.success(`${FLAG_METADATA[key].label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update setting');
      fetchFlags(); 
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <p className="text-sm text-neutral-500 font-medium">Loading system controls...</p>
      </div>
    );
  }

  // Separate safe and danger flags
  const safeFlags = Object.entries(FLAG_METADATA).filter(([,m]) => !m.danger);
  const dangerFlags = Object.entries(FLAG_METADATA).filter(([,m]) => m.danger);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            System <span className="bg-gradient-to-r from-yellow-500 to-amber-600 font-black text-transparent bg-clip-text">Configuration</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium tracking-wide text-sm">
            Manage global platform settings. Changes take effect immediately across all users.
          </p>
        </div>
      </div>

      {/* Feature Toggles (Safe) */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shadow-2xl p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Feature Controls</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Toggle platform features on or off</p>
            </div>
          </div>

          <div className="space-y-4">
            {safeFlags.map(([key, meta]) => {
              const isEnabled = flags[key] ?? true;
              const Icon = meta.icon;
              return (
                <div 
                  key={key}
                  className={`
                    flex items-center justify-between p-5 rounded-xl border transition-all duration-300
                    ${isEnabled 
                      ? 'bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-800/50' 
                      : 'bg-neutral-900/30 border-neutral-800/50 hover:border-neutral-700/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${isEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-semibold text-neutral-200">{meta.label}</Label>
                      <p className="text-sm text-neutral-500">{meta.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 bg-neutral-800'}`}>
                      {isEnabled ? 'ON' : 'OFF'}
                    </span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(val) => handleToggle(key, val)}
                      disabled={saving === key}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-neutral-950/60 backdrop-blur-xl shadow-2xl p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-red-500/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
              <p className="text-xs text-neutral-500 mt-0.5">These settings affect all users immediately — proceed with caution</p>
            </div>
          </div>

          <div className="space-y-4">
            {dangerFlags.map(([key, meta]) => {
              const isEnabled = flags[key] ?? false;
              const Icon = meta.icon;
              return (
                <div 
                  key={key}
                  className={`
                    flex items-center justify-between p-5 rounded-xl border transition-all duration-300
                    ${isEnabled 
                      ? 'bg-red-950/20 border-red-900/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]' 
                      : 'bg-neutral-900/20 border-neutral-800/50 hover:border-neutral-700/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${isEnabled ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-base font-semibold ${isEnabled ? 'text-red-300' : 'text-neutral-200'}`}>
                        {meta.label}
                      </Label>
                      <p className={`text-sm ${isEnabled ? 'text-red-400/70' : 'text-neutral-500'}`}>
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isEnabled ? 'text-red-400 bg-red-500/15 animate-pulse' : 'text-neutral-500 bg-neutral-800'}`}>
                      {isEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(val) => handleToggle(key, val)}
                      disabled={saving === key}
                      className={isEnabled ? 'data-[state=checked]:bg-red-600' : ''}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative overflow-hidden p-5 rounded-xl bg-blue-950/20 border border-blue-900/30 backdrop-blur-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <Lock className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-200 text-sm font-medium">Only Super Admins can modify these settings</p>
            <p className="text-blue-400/60 text-xs mt-1">System flags are cached for performance. Changes may take up to 60 seconds to propagate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
