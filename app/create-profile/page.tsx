"use client";

import { useState, useEffect } from "react";
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
  Check,
  Github,
  Linkedin,
  Link as LinkIcon,
  Plus,
  Trash2,
  FileText,
  Briefcase, 
  School,
  Share2,
  Loader2,
  X,
  AlertCircle
} from "lucide-react";

export default function CreateProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [initialUsername, setInitialUsername] = useState("");

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
    achievements: "",
    // New Fields
    github_url: "",
    linkedin_url: "",
    profile_picture_url: "",
    interests: [] as string[],
    certificates: [] as { title: string, issuer: string, year: string, url: string }[],
    workplace: "",
    school: "",
    synced_contacts: false // UI toggle state
  });

  const [currentSkill, setCurrentSkill] = useState("");
  const [currentInterest, setCurrentInterest] = useState("");

  // Fetch existing profile on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: rawProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const profile = rawProfile as any;

        if (error) console.error("Error fetching profile:", error);

        if (mounted && profile) {
          setFormData({
            username: profile.username || "",
            name: profile.name || "",
            age: profile.age ? String(profile.age) : "",
            gender: profile.gender || "",
            college: profile.college || "",
            hostel_city: profile.hostel_city || "",
            location: profile.location || "",
            skills: profile.skills ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            hackathons_participated: profile.hackathons_participated ? String(profile.hackathons_participated) : "",
            projects_completed: profile.projects_completed ? String(profile.projects_completed) : "",
            achievements: profile.achievements || "",
            // New Fields
            github_url: profile.github_url || "",
            linkedin_url: profile.linkedin_url || "",
            profile_picture_url: profile.profile_picture_url || "",
            interests: profile.interests ? profile.interests.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            certificates: Array.isArray(profile.certificates) ? profile.certificates : [],
            workplace: profile.workplace || "",
            school: profile.school || "",
            synced_contacts: Array.isArray(profile.synced_contacts) && profile.synced_contacts.length > 0
          });
          setInitialUsername(profile.username || "");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    const username = formData.username;
    if (!username || username === initialUsername) {
        setUsernameAvailable(null);
        setCheckingUsername(false);
        return;
    }

    setCheckingUsername(true);
    setUsernameAvailable(null);

    const timer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/check-username?username=${username}`);
            const data = await res.json();
            if (res.ok) {
                setUsernameAvailable(data.available);
            }
        } catch (error) {
            console.error("Username check failed", error);
        } finally {
            setCheckingUsername(false);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, initialUsername]);

  const sortedSkills = [
    "Frontend", "Backend", "Full Stack", "Data Science", "Cloud",
    "DevOps", "Mobile App Development", "Blockchain", "Open Source", "AI/ML"
  ];
  const suggestedSkills = sortedSkills; // alias for existing usage

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

  // Interest Handlers
  const handleAddInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
    }
    setCurrentInterest("");
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interestToRemove)
    }));
  };

  // Certificate Handlers
  const addCertificate = () => {
    setFormData(prev => ({
      ...prev,
      certificates: [...prev.certificates, { title: "", issuer: "", year: "", url: "" }]
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const newCerts = [...formData.certificates];
    newCerts[index] = { ...newCerts[index], [field]: value };
    setFormData(prev => ({ ...prev, certificates: newCerts }));
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

      if (usernameAvailable === false) {
        throw new Error("Username is already taken.");
      }

      const payload = {
        ...formData,
        skills: formData.skills.join(", "),
        interests: formData.interests.join(", "),
        synced_contacts: formData.synced_contacts ? ["hashed_id_placeholder"] : [] // Mock hash for now
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
                Build / Update Your Profile
            </h1>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                Showcase your skills, achievements, and personality to find the perfect team.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Identity */}
          <Section title="Identity" icon={<User className="w-5 h-5 text-yellow-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Username *" sub="Unique, immutable">
                     <div className="relative">
                        <input 
                            required
                            className={`w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 transition-all outline-none font-medium ${
                                usernameAvailable === false 
                                ? "border-red-500 focus:border-red-500" 
                                : usernameAvailable === true 
                                ? "border-green-500 focus:border-green-500"
                                : "border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black"
                            }`}
                            placeholder="e.g. tech_wizaard"
                            value={formData.username}
                            onChange={e => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                            {checkingUsername && <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />}
                            {!checkingUsername && usernameAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                            {!checkingUsername && usernameAvailable === false && <X className="w-5 h-5 text-red-500" />}
                         </div>
                     </div>
                     {!checkingUsername && usernameAvailable === false && (
                        <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Username is taken
                        </p>
                     )}
                     {!checkingUsername && usernameAvailable === true && (
                        <p className="text-xs text-green-500 mt-1 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Username is available
                        </p>
                     )}
                </InputGroup>
                <InputGroup label="Full Name *">
                     <input 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => handleInputChange("name", e.target.value)}
                     />
                </InputGroup>
                <InputGroup label="Age *">
                     <input 
                        required
                        type="number"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-yellow-400 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="21"
                        value={formData.age}
                        onChange={e => handleInputChange("age", e.target.value)}
                     />
                </InputGroup>
                 <InputGroup label="Gender *">
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

          {/* New Section: Professional Links */}
          <Section title="Professional Links" icon={<LinkIcon className="w-5 h-5 text-indigo-500" />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="LinkedIn URL">
                     <div className="relative">
                        <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                        <input 
                           type="url"
                           className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                           placeholder="https://linkedin.com/in/..."
                           value={formData.linkedin_url}
                           onChange={e => handleInputChange("linkedin_url", e.target.value)}
                        />
                     </div>
                </InputGroup>
                <InputGroup label="GitHub URL">
                     <div className="relative">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-800 dark:text-white" />
                        <input 
                           type="url"
                           className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                           placeholder="https://github.com/..."
                           value={formData.github_url}
                           onChange={e => handleInputChange("github_url", e.target.value)}
                        />
                     </div>
                </InputGroup>
                <InputGroup label="Profile Picture URL" className="md:col-span-2">
                     <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <input 
                               type="url"
                               className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                               placeholder="https://..."
                               value={formData.profile_picture_url}
                               onChange={e => handleInputChange("profile_picture_url", e.target.value)}
                            />
                        </div>
                        {formData.profile_picture_url && (
                            <img src={formData.profile_picture_url} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-neutral-200" />
                        )}
                     </div>
                     <p className="text-xs text-neutral-400 mt-1">Paste a public URL for your profile picture.</p>
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
          
          {/* New Section: Extended Background */}
          <Section title="Work & Education" icon={<Briefcase className="w-5 h-5 text-orange-500" />}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Workplace / Company">
                      <div className="relative">
                         <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                         <input 
                             className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                             placeholder="Google, Startup, etc."
                             value={formData.workplace}
                             onChange={e => handleInputChange("workplace", e.target.value)}
                         />
                      </div>
                 </InputGroup>
                 <InputGroup label="School / High School">
                      <div className="relative">
                         <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                         <input 
                             className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                             placeholder="DPS, St. Xaviers, etc."
                             value={formData.school}
                             onChange={e => handleInputChange("school", e.target.value)}
                         />
                      </div>
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

          {/* New Section: Interests */}
          <Section title="Interests" icon={<Sparkles className="w-5 h-5 text-pink-500" />}>
             <div className="space-y-4">
                 <div className="relative">
                    <input 
                        className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 border-transparent focus:border-pink-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-medium"
                        placeholder="Add an interest (e.g. Travel, Chess, Sci-Fi)"
                        value={currentInterest}
                        onChange={e => setCurrentInterest(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInterest(currentInterest);
                            }
                        }}
                     />
                     <button 
                        type="button"
                        onClick={() => handleAddInterest(currentInterest)}
                        disabled={!currentInterest}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-pink-600 text-white text-xs font-bold rounded-lg disabled:opacity-0 transition-all hover:bg-pink-700"
                     >
                        ADD
                     </button>
                 </div>

                 <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.interests.map(interest => (
                        <span key={interest} className="px-3 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            {interest}
                            <button type="button" onClick={() => removeInterest(interest)} className="hover:text-pink-900">&times;</button>
                        </span>
                    ))}
                    {formData.interests.length === 0 && (
                        <span className="text-sm text-neutral-400 italic py-1">No interests added yet.</span>
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

          {/* New Section: Certificates */}
          <Section title="Certificates" icon={<FileText className="w-5 h-5 text-teal-500" />}>
                <div className="space-y-4">
                    {formData.certificates.map((cert, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 relative group">
                            <button 
                                type="button" 
                                onClick={() => removeCertificate(idx)}
                                className="absolute top-2 right-2 p-2 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Title">
                                    <input 
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm"
                                        placeholder="AWS Solution Architect"
                                        value={cert.title}
                                        onChange={e => updateCertificate(idx, 'title', e.target.value)}
                                    />
                                </InputGroup>
                                <InputGroup label="Issuer">
                                    <input 
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm"
                                        placeholder="Amazon Web Services"
                                        value={cert.issuer}
                                        onChange={e => updateCertificate(idx, 'issuer', e.target.value)}
                                    />
                                </InputGroup>
                                <InputGroup label="Year">
                                    <input 
                                        type="number"
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm"
                                        placeholder="2024"
                                        value={cert.year}
                                        onChange={e => updateCertificate(idx, 'year', e.target.value)}
                                    />
                                </InputGroup>
                                <InputGroup label="Credential URL">
                                    <input 
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm"
                                        placeholder="https://..."
                                        value={cert.url}
                                        onChange={e => updateCertificate(idx, 'url', e.target.value)}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addCertificate}
                        className="w-full py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-center gap-2 text-neutral-500 hover:text-teal-500 hover:border-teal-500 transition-all font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Certificate
                    </button>
                </div>
          </Section>

          {/* New Section: Contact Sync */}
          <Section title="Network Settings" icon={<Share2 className="w-5 h-5 text-yellow-500" />}>
             <div className="flex items-start gap-4">
                 <div className="relative flex items-center pt-1">
                     <input
                        type="checkbox"
                        id="contactSync"
                        checked={formData.synced_contacts}
                        onChange={e => setFormData(prev => ({ ...prev, synced_contacts: e.target.checked }))}
                        className="w-5 h-5 rounded border-neutral-300 text-yellow-500 focus:ring-yellow-500"
                     />
                 </div>
                 <div>
                     <label htmlFor="contactSync" className="block text-base font-bold text-neutral-900 dark:text-white">
                         Allow Contact Syncing
                     </label>
                     <p className="text-sm text-neutral-500 mt-1">
                         We store hashed identifiers to help you find people you know. Your raw contacts are never stored.
                     </p>
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
