import React from "react";
import Link from "next/link";
import { UserPlus, UserMinus, MessageCircle, Check, Users, MapPin, GraduationCap } from "lucide-react";

type Profile = {
    id: string;
    username: string;
    name?: string | null;
    skills?: string | null; // Comma separated
    college?: string | null;
    location?: string | null;
    followers_count?: number;
    following_count?: number;
    match_count?: number;
    matching_interests?: string[]; // Kept for UI logic if needed, or derived
    matching_interests_count?: number;
    is_following?: boolean;
};

type ProfileCardProps = {
    profile: Profile;
    currentUserId: string | null;
    isFollowing: boolean;
    onFollow: (id: string) => void;
    onUnfollow: (id: string) => void;
    index?: number; // For animation stagger
};

export function ProfileCard({ profile, currentUserId, isFollowing, onFollow, onUnfollow, index = 0 }: ProfileCardProps) {
    const displayName = profile.name || profile.username;
    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    // Parse skills if string
    const skillList = profile.skills ? profile.skills.split(",").map(s => s.trim()).filter(Boolean) : [];

    // Stagger animation delay based on index
    const animationDelay = `${index * 0.1}s`;

    return (
        <div
            className="group relative flex flex-col rounded-[32px] border border-neutral-200 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-400/10 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 opacity-0 animate-slide-up backdrop-blur-md"
            style={{ animationDelay, animationFillMode: 'forwards' }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 w-full">
                    <Link href={`/profile/${profile.username}`} className="relative shrink-0">
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
                            alt={displayName}
                            className="h-16 w-16 rounded-2xl bg-neutral-100 object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Match Badge - Show if there's a match count or shared interests */}
                        {((profile.match_count && profile.match_count > 0) || (profile.matching_interests_count && profile.matching_interests_count > 0)) && (
                            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500 text-[10px] text-white shadow-sm dark:border-neutral-900">
                                <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                        )}
                    </Link>

                    <div className="min-w-0 flex-1">
                        <Link href={`/profile/${profile.username}`} className="block">
                            <h3 className="truncate text-lg font-bold leading-tight text-neutral-900 transition-colors group-hover:text-yellow-600 dark:text-neutral-100 dark:group-hover:text-yellow-400">
                                {displayName}
                            </h3>
                            <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                                @{profile.username}
                            </div>
                        </Link>

                        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                            {profile.followers_count !== undefined && (
                                <span className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
                                    <Users className="h-3 w-3" /> {profile.followers_count}
                                    <span className="text-neutral-300 dark:text-neutral-700 mx-1">|</span>
                                    <span className="text-xs">{profile.following_count || 0} following</span>
                                </span>
                            )}
                            {profile.matching_interests_count !== undefined && profile.matching_interests_count > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                        {profile.matching_interests_count} Shared
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex-1 space-y-2">
                 {/* Replaced Bio with College / Location since Bio is removed */}
                 {profile.college && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <GraduationCap className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate">{profile.college}</span>
                    </div>
                 )}
                 {profile.location && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate">{profile.location}</span>
                    </div>
                 )}
                 {!profile.college && !profile.location && (
                    <p className="text-sm italic text-neutral-400">No additional info</p>
                 )}
            </div>

            {/* Skills / Interests Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
                {/* Prioritize skills, fall back to matching interests if skills empty */}
                {skillList.length > 0 ? (
                    skillList.slice(0, 3).map((skill, i) => (
                        <span
                            key={`skill-${i}`}
                            className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-white/5 dark:bg-white/5 dark:text-neutral-400"
                        >
                            {skill}
                        </span>
                    ))
                ) : (
                    profile.matching_interests?.slice(0, 3).map((interest, i) => (
                         <span
                            key={`int-${i}`}
                            className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-white/5 dark:bg-white/5 dark:text-neutral-400"
                        >
                            {interest}
                        </span>
                    ))
                )}

                {skillList.length === 0 && (!profile.matching_interests || profile.matching_interests.length === 0) && (
                    <span className="text-xs text-neutral-400">No skills listed</span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200/50 dark:border-white/5">
                {currentUserId && profile.id !== currentUserId && (
                    <button
                        onClick={() => isFollowing ? onUnfollow(profile.id) : onFollow(profile.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${isFollowing
                                ? "border border-neutral-200 bg-transparent text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                                : "bg-neutral-900 text-white shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 hover:shadow-neutral-900/20 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                            }`}
                    >
                        {isFollowing ? (
                            <>
                                <UserMinus className="h-4 w-4" />
                                Unfollow
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                Follow
                            </>
                        )}
                    </button>
                )}

                <Link
                    href={`/chat?userId=${profile.id}`}
                    className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    title="Message"
                >
                    <MessageCircle className="h-5 w-5" />
                </Link>
            </div>
        </div>
    );
}
