'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConfirmActionModalProps {
  title: string;
  description: string;
  actionLabel: string;
  trigger: React.ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  variant?: 'destructive' | 'default';
  requireReason?: boolean;
}

export function ConfirmActionModal({
  title,
  description,
  actionLabel,
  trigger,
  onConfirm,
  variant = 'default',
  requireReason = true,
}: ConfirmActionModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;

    setLoading(true);
    try {
      await onConfirm(reason);
      setOpen(false);
      setReason('');
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">
              Reason for this action (required)
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Violated terms, Requested by user..."
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
