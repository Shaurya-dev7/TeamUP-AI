"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Loader2, Check } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FollowBackToast = ({ followerUsername }: { followerUsername: string }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const supabase = createClient();
    const router = useRouter();

    const handleFollowBack = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setStatus('loading');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("No token");

            const res = await fetch('/api/follow', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ following_username: followerUsername })
            });

            if (!res.ok) throw new Error("Failed to follow");
            
            setStatus('success');
            toast.success(`You are now following ${followerUsername}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to follow back");
            setStatus('idle');
        }
    };

    return (
        <div className="flex items-start gap-3 w-full">
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 shrink-0 mt-1">
                <UserPlus size={18} />
            </div>
            <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">New Follower!</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        <Link 
                            href={`/profile/${followerUsername}`} 
                            className="font-bold text-neutral-900 dark:text-white hover:underline hover:text-blue-500 transition-colors"
                        >
                            {followerUsername}
                        </Link> started following you.
                    </span>
                </div>
                
                <button
                    onClick={handleFollowBack}
                    disabled={status !== 'idle'}
                    className={`
                        w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                        ${status === 'success' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'}
                    `}
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Following...
                        </>
                    ) : status === 'success' ? (
                        <>
                            <Check className="w-3 h-3" />
                            Following
                        </>
                    ) : (
                        'Follow Back'
                    )}
                </button>
            </div>
        </div>
    );
};

export function GlobalNotifications() {
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchUserAndSubscribe = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;

            // Get my username for subscription
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();
            
            if (!(myProfile as any)?.username) return;

            // Subscribe to FOLLOWS table (using usernames)
            const channel = supabase.channel(`global-follows:${userId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'follows',
                    filter: `following=eq.${(myProfile as any).username}` // Someone followed ME (username)
                }, async (payload) => {
                    const newFollow = payload.new as any;
                    const followerUsername = newFollow.follower; // "follower" column is username

                    toast(<FollowBackToast followerUsername={followerUsername} />, {
                        duration: 8000, // Slightly longer duration for interaction
                    });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        fetchUserAndSubscribe();
    }, [supabase]);

    return null;
}
