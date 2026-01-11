'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Save, Undo2 } from 'lucide-react';

interface SystemFlag {
  key: string;
  value: boolean;
}

const FLAG_METADATA: Record<string, { label: string; description: string; danger?: boolean }> = {
  registrations_enabled: {
    label: 'Enable Registrations',
    description: 'Allow new users to sign up to the platform.',
  },
  team_creation_enabled: {
    label: 'Enable Team Creation',
    description: 'Allow users to create new teams.',
  },
  invites_enabled: {
    label: 'Enable Invitations',
    description: 'Allow users to invite others to teams.',
  },
  maintenance_mode: {
    label: 'Maintenance Mode',
    description: 'Put the site in maintenance mode. Only admins can access.',
    danger: true,
  },
  read_only_mode: {
    label: 'Read-Only Mode',
    description: 'Disable all write operations (posts, updates, etc).',
    danger: true,
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
      
      // Initialize defaults
      Object.keys(FLAG_METADATA).forEach(key => {
        flagMap[key] = data.flags.find((f: SystemFlag) => f.key === key)?.value ?? 
          (!FLAG_METADATA[key].danger); // Default dangerous flags to false, others true
      });

      setFlags(flagMap);
    } catch (error) {
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
      toast.success(`${FLAG_METADATA[key].label} updated`);
    } catch (error) {
      toast.error('Failed to update setting');
      // Revert UI on error
      fetchFlags(); 
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">System Configuration</h1>
        <p className="text-neutral-400 mt-1">
          Manage global platform settings. Changes take effect immediately.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(FLAG_METADATA).map(([key, meta]) => (
          <div 
            key={key}
            className={`
              flex items-center justify-between p-6 rounded-xl border
              ${meta.danger 
                ? 'border-red-900/30 bg-red-950/10' 
                : 'border-neutral-800 bg-neutral-900/30'
              }
            `}
          >
            <div className="space-y-1">
              <Label className={`text-base font-semibold ${meta.danger ? 'text-red-400' : 'text-neutral-200'}`}>
                {meta.label}
              </Label>
              <p className="text-sm text-neutral-400">
                {meta.description}
              </p>
            </div>
            
            <Switch
              checked={flags[key]}
              onCheckedChange={(val) => handleToggle(key, val)}
              disabled={saving === key}
              className={meta.danger && flags[key] ? 'bg-red-600' : ''}
            />
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-900/50 text-blue-200 text-sm">
        <strong>Note:</strong> System flags are cached heavily for performance. 
        It may take up to 60 seconds for changes to propagate to all users.
      </div>
    </div>
  );
}
