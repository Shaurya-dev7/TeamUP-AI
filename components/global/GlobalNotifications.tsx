"use client";
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { UserPlus } from 'lucide-react';
import React from 'react';

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

                    toast(
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                <UserPlus size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">New Follower!</span>
                                <span className="text-xs text-neutral-500">
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                                        {followerUsername}
                                    </span> followed you.
                                </span>
                            </div>
                        </div>
                    );
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
