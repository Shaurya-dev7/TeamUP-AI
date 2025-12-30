"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Trophy, 
  Code2, 
  User,
  Sparkles,
  Check
} from "lucide-react";

export default function CreateProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    age: "",
    gender: "",
    college: "",
    hostel_city: "",
    location: "",
    skills: [] as string[],
    hackathons_participated: "",
    projects_completed: "",
    achievements: ""
  });

  const [currentSkill, setCurrentSkill] = useState("");

  const suggestedSkills = [
    "Frontend", "Backend", "Full Stack", "Data Science", "Cloud",
    "DevOps", "Mobile App Development", "Blockchain", "Open Source", "AI/ML"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setCurrentSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("You must be logged in.");
      }

      const payload = {
        ...formData,
        skills: formData.skills.join(", "), // Convert array to comma-separated string
      };

      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create profile");

      // Success
      router.push("/profile/" + formData.username);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex justify-center py-10 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="mb-10 text-center">
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                className="mx-auto h-16 w-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-400/30 mb-6"
            >
                <Sparkles className="text-neutral-950" />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-900 dark:from-white dark:via-neutral-400 dark:to-white">
                Build Your Profile
            </h1>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                Showcase your skills, achievements, and personality to find the perfect team.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Identity */}
          <Section title="Identity" icon={<User className="w-5 h-5 text-yellow-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Username" sub="Unique, immutable">
                     <input 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="e.g. tech_wizaard"
                        value={formData.username}
                        onChange={e => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                     />
                </InputGroup>
                <InputGroup label="Full Name">
                     <input 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => handleInputChange("name", e.target.value)}
                     />
                </InputGroup>
                <InputGroup label="Age">
                     <input 
                        required
                        type="number"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="21"
                        value={formData.age}
                        onChange={e => handleInputChange("age", e.target.value)}
                     />
                </InputGroup>
                 <InputGroup label="Gender">
                     <select 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium appearance-none"
                        value={formData.gender}
                        onChange={e => handleInputChange("gender", e.target.value)}
                     >
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                     </select>
                </InputGroup>
            </div>
          </Section>

          {/* Section 2: Location & Education */}
          <Section title="Background" icon={<MapPin className="w-5 h-5 text-blue-500" />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="College / University" className="md:col-span-2">
                     <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input 
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                            placeholder="Harvard University"
                            value={formData.college}
                            onChange={e => handleInputChange("college", e.target.value)}
                        />
                     </div>
                </InputGroup>
                <InputGroup label="Hostel City (Optional)">
                     <input 
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="Cambridge"
                        value={formData.hostel_city}
                        onChange={e => handleInputChange("hostel_city", e.target.value)}
                     />
                </InputGroup>
                <InputGroup label="Current City">
                     <input 
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="New York, NY"
                        value={formData.location}
                        onChange={e => handleInputChange("location", e.target.value)}
                     />
                </InputGroup>
             </div>
          </Section>

          {/* Section 3: Skills */}
          <Section title="Skills & Expertise" icon={<Code2 className="w-5 h-5 text-purple-500" />}>
             <div className="space-y-4">
                 <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedSkills.map(skill => (
                        <button
                            key={skill}
                            type="button"
                            onClick={() => handleAddSkill(skill)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                formData.skills.includes(skill) 
                                ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400"
                            }`}
                        >
                            {skill} {formData.skills.includes(skill) && <Check className="w-3 h-3 inline ml-1"/>}
                        </button>
                    ))}
                 </div>
                 
                 <div className="relative">
                    <input 
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="Add a custom skill (press Enter to add)"
                        value={currentSkill}
                        onChange={e => setCurrentSkill(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill(currentSkill);
                            }
                        }}
                     />
                     <button 
                        type="button"
                        onClick={() => handleAddSkill(currentSkill)}
                        disabled={!currentSkill}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg disabled:opacity-0 transition-all hover:bg-purple-700"
                     >
                        ADD
                     </button>
                 </div>

                 <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400">&times;</button>
                        </span>
                    ))}
                    {formData.skills.length === 0 && (
                        <span className="text-sm text-neutral-400 italic py-1">No skills selected yet.</span>
                    )}
                 </div>
             </div>
          </Section>

          {/* Section 4: Experience */}
          <Section title="Experience" icon={<Trophy className="w-5 h-5 text-green-500" />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Hackathons Participated">
                     <input 
                        type="number"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="0"
                        value={formData.hackathons_participated}
                        onChange={e => handleInputChange("hackathons_participated", e.target.value)}
                     />
                </InputGroup>
                <InputGroup label="Projects Completed">
                     <input 
                        type="number"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="0"
                        value={formData.projects_completed}
                        onChange={e => handleInputChange("projects_completed", e.target.value)}
                     />
                </InputGroup>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                        Key Achievements
                    </label>
                    <textarea 
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium min-h-[100px]"
                        placeholder="Won 1st place at Global Hackathon 2024..."
                        value={formData.achievements}
                        onChange={e => handleInputChange("achievements", e.target.value)}
                     />
                </div>
             </div>
          </Section>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-center font-medium animate-pulse">
                {error}
            </div>
          )}

          <div className="pt-4">
            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-lg shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
                {loading ? "Creating Profile..." : "Complete Profile"}
                {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-[#111] p-6 sm:p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
            </div>
            {children}
        </motion.div>
    )
}

function InputGroup({ label, sub, children, className }: { label: string, sub?: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
             <label className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    {label}
                </span>
                {sub && <span className="text-xs text-neutral-400 font-medium">{sub}</span>}
            </label>
            {children}
        </div>
    )
}
