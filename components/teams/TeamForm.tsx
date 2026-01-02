"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X, Lock, Unlock, FileText } from "lucide-react";

interface TeamFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: number;
    name: string;
    description: string;
    goal: string;
    max_members: number;
    join_mode: "open" | "request" | "closed";
    roles_needed: string[];
  };
}

export default function TeamForm({ mode, initialData }: TeamFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [goal, setGoal] = useState(initialData?.goal || "");
  const [maxMembers, setMaxMembers] = useState(initialData?.max_members || 5);
  const [joinMode, setJoinMode] = useState<"open" | "request" | "closed">(initialData?.join_mode || "request");
  const [rolesNeeded, setRolesNeeded] = useState<string[]>(initialData?.roles_needed || []);
  const [newRole, setNewRole] = useState("");

  const addRole = () => {
    const trimmed = newRole.trim();
    if (trimmed && !rolesNeeded.includes(trimmed)) {
      setRolesNeeded([...rolesNeeded, trimmed]);
      setNewRole("");
    }
  };

  const removeRole = (role: string) => {
    setRolesNeeded(rolesNeeded.filter((r) => r !== role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error("Please log in to continue");
        router.push("/login");
        return;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        goal: goal.trim() || null,
        max_members: maxMembers,
        join_mode: joinMode,
        roles_needed: rolesNeeded,
      };

      let response;
      
      if (mode === "create") {
        response = await fetch("/api/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/teams/${initialData?.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      toast.success(mode === "create" ? "Team created!" : "Team updated!");
      
      if (mode === "create" && data.team_id) {
        router.push(`/discover/teams/${data.team_id}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error("Team form error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const joinModeOptions = [
    { 
      value: "open" as const, 
      label: "Open", 
      desc: "Anyone can join instantly", 
      icon: Unlock,
      color: "green"
    },
    { 
      value: "request" as const, 
      label: "Request", 
      desc: "Users apply, you approve",
      icon: FileText,
      color: "yellow"
    },
    { 
      value: "closed" as const, 
      label: "Closed", 
      desc: "Invite only (private)",
      icon: Lock,
      color: "neutral"
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Team Name */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Team Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., AI Innovators"
          maxLength={50}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's your team about?"
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Goal / Focus
        </label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Hackathon: AI / Web3"
          maxLength={100}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>

      {/* Max Members */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Maximum Members
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={20}
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-yellow-500 dark:bg-neutral-700"
          />
          <span className="w-12 rounded-lg bg-neutral-100 py-2 text-center text-sm font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
            {maxMembers}
          </span>
        </div>
      </div>

      {/* Join Mode (3 options) */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Join Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {joinModeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setJoinMode(option.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                joinMode === option.value
                  ? option.color === "green"
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : option.color === "yellow"
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-neutral-400 bg-neutral-100 dark:bg-neutral-800"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              <option.icon className={`h-5 w-5 ${
                joinMode === option.value
                  ? option.color === "green"
                    ? "text-green-600 dark:text-green-400"
                    : option.color === "yellow"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-neutral-600 dark:text-neutral-400"
                  : "text-neutral-400"
              }`} />
              <span className={`text-sm font-semibold ${
                joinMode === option.value
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}>
                {option.label}
              </span>
              <span className="text-[10px] text-neutral-500 leading-tight">
                {option.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Roles Needed */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Roles Needed
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
            placeholder="e.g., Backend Developer"
            maxLength={30}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <button
            type="button"
            onClick={addRole}
            disabled={!newRole.trim()}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {rolesNeeded.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {rolesNeeded.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
              >
                {role}
                <button
                  type="button"
                  onClick={() => removeRole(role)}
                  className="ml-1 rounded-full p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl px-6 py-3 font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3 font-bold text-neutral-900 shadow-lg shadow-yellow-400/25 transition-all hover:bg-yellow-500 hover:shadow-xl disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Team" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
