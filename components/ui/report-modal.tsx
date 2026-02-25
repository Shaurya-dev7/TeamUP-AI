"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle, UserX } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "bug" | "user";
  reportedUserId?: string;
  reportedUsername?: string;
}

const BUG_REASONS = [
  "UI/Visual Glitch",
  "Feature Not Working",
  "Performance Issue",
  "Security Concern",
  "Other"
];

const USER_REASONS = [
  "Spam or Scam",
  "Harassment or Bullying",
  "Inappropriate Content",
  "Pretending to be Someone Else",
  "Other"
];

export function ReportModal({ isOpen, onClose, type, reportedUserId, reportedUsername }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = type === "bug" ? BUG_REASONS : USER_REASONS;
  const title = type === "bug" ? "Report a Bug" : `Report ${reportedUsername || "User"}`;
  const descriptionText = type === "bug" 
    ? "Help us improve TeamUp by describing the issue you encountered."
    : "Your report is anonymous. We will review this user's activity against our guidelines.";

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reason,
          description,
          reported_user_id: reportedUserId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      toast.success(type === "bug" ? "Bug reported successfully" : "User reported successfully");
      setReason("");
      setDescription("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex-shrink-0 ${type === "bug" ? "bg-red-500/10 dark:bg-red-500/20" : "bg-orange-500/10 dark:bg-orange-500/20"}`}>
              {type === "bug" ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <UserX className="w-5 h-5 text-orange-500" />}
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {descriptionText}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details (Optional)</label>
            <Textarea
              placeholder={type === "bug" ? "Steps to reproduce the bug..." : "Additional context about the user's behavior..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason} className={type === "bug" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
