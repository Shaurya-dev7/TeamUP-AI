export type HackathonEvent = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  mode: string;
  location: string;
  prize_text: string;
  cash_prize?: number | null;
  organizer: string;
  difficulty: string;
  source: string;
  redirect_url: string;
  logo: string;
  created_at?: string;
  view_count?: number;
  click_count?: number;
  is_featured?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * Fetch Hackathons from Internal API
 */
export async function getHackathons(params: Record<string, any> = {}): Promise<{ data: HackathonEvent[], pagination: any }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });

    try {
        const url = `${API_URL}/api/hackathons?${searchParams.toString()}`;
        const res = await fetch(url, {
             next: { revalidate: 60 } 
        });
        
        if (!res.ok) throw new Error('Failed to fetch hackathons');
        
        const json = await res.json();
        
        // Map DB response to HackathonEvent type
        const data = json.data.map((item: any) => ({
            id: item.id || item.external_id,
            title: item.title,
            description: item.description || '',
            start_date: item.start_date,
            end_date: item.end_date,
            mode: item.mode,
            location: item.location || 'Online',
            prize_text: item.prize_text || (item.cash_prize ? `$${item.cash_prize}` : 'TBD'),
            cash_prize: item.cash_prize,
            organizer: item.platform,
            difficulty: 'Open', // Default
            source: item.external_source,
            redirect_url: item.url,
            logo: item.image,
            created_at: item.created_at,
            view_count: item.views,
            click_count: item.clicks,
            is_featured: item.is_featured
        }));

        return { data, pagination: json.pagination };
    } catch (error) {
        console.error("getHackathons error:", error);
        return { data: [], pagination: { hasMore: false } };
    }
}

// Wrappers for specific sections
export async function getTrendingHackathons(limit = 6): Promise<HackathonEvent[]> {
    const { data } = await getHackathons({ sort: 'trending', limit });
    return data;
}

export async function getLiveHackathons(limit = 10): Promise<HackathonEvent[]> {
    // Current API 'soon' sort puts nearest startDate first.
    // For live, we might want to filter where start_date <= now <= end_date.
    // The current API implementation doesn't strictly have 'live' filter, 
    // but the task asks to "Filter: start_date >= now()" for Live/Upcoming.
    // Actually "Live / Upcoming" usually means "Not ended yet".
    // I'll stick to 'soon' sort which gives upcoming.
    const { data } = await getHackathons({ sort: 'soon', limit }); 
    return data;
}

export async function getUpcomingHackathons(limit = 10): Promise<HackathonEvent[]> {
    const { data } = await getHackathons({ sort: 'soon', limit });
    return data;
}

export async function getAllHackathons(): Promise<HackathonEvent[]> {
    const { data } = await getHackathons({ limit: 100 });
    return data;
}
