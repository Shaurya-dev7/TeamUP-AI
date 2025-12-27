"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [allInterests] = useState([
    "AI", "Open Source", "Startups", "Gaming", "FinTech", "HealthTech", "Web Dev", "Data Science", "UI/UX", "Marketing"
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.data?.session?.user?.id;
      if (!userId) {
        setError("You must be logged in to create a profile.");
        setLoading(false);
        return;
      }
      // Check username uniqueness
      const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (existing) {
        setError("Username already taken. Please pick another.");
        setLoading(false);
        return;
      }
      const { error: profileErr } = await supabase.from("profiles").upsert([
        {
          id: userId,
          username,
          display_name: displayName,
          bio,
          college,
          year,
          workplace,
          interests: interests.join(", "),
          is_demo: false,
        },
      ]);
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }
      router.push(`/profile/${username}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50 py-8">
      <div className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl p-8 border border-yellow-100">
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-2 tracking-tight drop-shadow-sm">Create Your Profile</h1>
        <p className="text-center text-neutral-500 mb-6">Stand out and connect with your dream team!</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Display Name</label>
              <input className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Username</label>
              <input className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Bio</label>
              <textarea className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition min-h-[60px]" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">College</label>
              <input className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition" value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Year</label>
              <input className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Workplace</label>
              <input className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none transition" value={workplace} onChange={e => setWorkplace(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${interests.includes(interest)
                    ? "bg-gradient-to-r from-blue-500 to-yellow-400 text-white border-blue-500 scale-105"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"}`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center font-semibold">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-yellow-400 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-yellow-500 transition-all duration-150" disabled={loading}>
            {loading ? "Creating..." : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
