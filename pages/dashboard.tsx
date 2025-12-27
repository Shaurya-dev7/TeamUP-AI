import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
};

type Recommendation = {
  username: string;
  name?: string;
  college?: string;
};

type TeamMember = {
  id?: string;
  username?: string;
  display_name?: string;
  bio?: string;
};

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [followed, setFollowed] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState<Profile[]>([]);
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  // Load general discover suggestions on mount
  useEffect(() => {
    async function fetchDiscover() {
      const res = await fetch('/api/discover-people?limit=10');
      const data = await res.json();
      setDiscoverProfiles(data.profiles || []);
    }
    fetchDiscover();
  }, []);

  const supabase = createClient();

  // Search for a user profile
  async function handleSearch(optionalUsername?: string) {
    const usernameToSearch = optionalUsername || search;
    if (!usernameToSearch) return;
    const res = await fetch(`/api/profile?username=${usernameToSearch}`);
    const data = await res.json();
    setProfile(data.profile || null);
    setFollowersList(data.followers || []);
    setFollowingList(data.following || []);
    setInterestsList(data.interests || []);

    // Determine if current user follows this profile
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      // supabase v2 session shape: sessionData.session.user.id
      const userId = sessionData?.session?.user?.id;
      if (userId && Array.isArray(data.followers)) {
        setFollowed(data.followers.some((f: any) => f.id === userId));
      } else {
        setFollowed(false);
      }
    } catch (e) {
      setFollowed(false);
    }
  }

  // Get recommendations for the current profile
  async function getRecommendations() {
    if (!profile) return;
    const res = await fetch('/api/suggest-people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username })
    });
    const data = await res.json();
    setRecommendations(data.recommendations || []);
  }

  // Get team recommendations
  async function getTeam() {
    if (!profile) return;
    const res = await fetch('/api/team-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username })
    });
    const data = await res.json();
    setTeam(data.team || []);
  }

  // Follow/unfollow user
  async function toggleFollow() {
    if (!profile) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      alert('Please sign in to follow users');
      return;
    }
    if (!followed) {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: userId, following_id: profile.id })
      });
      if (res.ok) {
        setFollowed(true);
        // Optionally append the current user to followers list locally
        setFollowersList(prev => prev.concat([{ id: userId, username: 'you', display_name: 'You', avatar_url: undefined }]));
      }
    } else {
      const res = await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: userId, following_id: profile.id })
      });
      if (res.ok) {
        setFollowed(false);
        setFollowersList(prev => prev.filter(p => p.id !== userId));
      }
    }
  }

  // Send a message
  async function sendMessage() {
    if (!profile || !message) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      alert('Please sign in to send messages');
      return;
    }
    await fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: userId, receiver_id: profile.id, content: message })
    });
    setMessage('');
    // Optionally refresh messages
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans">
      <header className="w-full py-4 bg-white shadow flex justify-center">
        <h1 className="text-3xl font-bold text-indigo-600">TeamUp Social</h1>
      </header>
      <main className="w-full max-w-2xl mt-8">
        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 border rounded px-4 py-2"
            placeholder="Search username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={() => handleSearch()}>
            Search
          </button>
        </div>

        {/* General Discover Suggestions */}
        {!profile && discoverProfiles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Discover People</h3>
            <ul className="grid grid-cols-2 gap-4">
              {discoverProfiles.map(p => (
                <li key={p.username} className="bg-white rounded shadow p-4 flex flex-col items-center">
                  <img src={p.avatar_url || '/default-avatar.png'} alt="avatar" className="w-12 h-12 rounded-full mb-2" />
                  <span className="font-semibold">{p.display_name || p.username}</span>
                  <span className="text-xs text-gray-500">{p.bio}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <div className="bg-white rounded shadow p-6 mb-6 flex flex-col items-center">
            <img src={profile.avatar_url || '/default-avatar.png'} alt="avatar" className="w-24 h-24 rounded-full mb-2" />
            <h2 className="text-xl font-semibold">{profile.display_name || profile.username}</h2>
            <p className="text-gray-500">{profile.bio}</p>

            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <div className="font-bold text-lg">{followersList.length}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{followingList.length}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
            </div>

            <button
              className={`mt-4 px-4 py-2 rounded ${followed ? 'bg-gray-300' : 'bg-indigo-600 text-white'}`}
              onClick={toggleFollow}
            >
              {followed ? 'Unfollow' : 'Follow'}
            </button>

            <div className="mt-4 w-full">
              <div className="mb-2">
                <div className="text-sm font-semibold">Interests</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interestsList.map((i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{i}</span>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full border rounded px-2 py-1"
                placeholder="Send a message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button className="mt-2 w-full bg-indigo-500 text-white py-2 rounded" onClick={sendMessage}>
                Send Message
              </button>

              {/* Show a few follower avatars */}
              {followersList.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Followers</div>
                  <div className="flex gap-2">
                    {followersList.slice(0, 6).map(f => (
                      <div key={f.username} className="flex flex-col items-center text-center w-16">
                        <img src={f.avatar_url || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
                        <div className="text-xs">{f.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show a few following avatars */}
              {followingList.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Following</div>
                  <div className="flex gap-2">
                    {followingList.slice(0, 6).map(f => (
                      <div key={f.username} className="flex flex-col items-center text-center w-16">
                        <img src={f.avatar_url || '/default-avatar.png'} className="w-10 h-10 rounded-full" />
                        <div className="text-xs">{f.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Recommendations */}
        {profile && (
          <div className="mb-6">
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={getRecommendations}>
              Get Recommendations
            </button>
            {recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Suggested People</h3>
                <ul className="grid grid-cols-2 gap-4">
                  {recommendations.map(r => (
                    <li key={r.username} className="bg-white rounded shadow p-4 flex flex-col items-center">
                      <span className="font-semibold">{r.name || r.username}</span>
                      <span className="text-xs text-gray-500">{r.college}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* Team Recommendations */}
        {profile && (
          <div className="mb-6">
            <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={getTeam}>
              Get Team Recommendation
            </button>
            {team.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Suggested Team</h3>
                <ul className="grid grid-cols-2 gap-4">
                  {team.map(t => (
                    <li key={t.username || t.id} className="bg-white rounded shadow p-4 flex flex-col items-center">
                      <span className="font-semibold">{t.display_name || t.username}</span>
                      <span className="text-xs text-gray-500">{t.bio}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
