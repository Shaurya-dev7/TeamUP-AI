import useSWR from 'swr';
import { getHackathons, HackathonEvent } from '@/lib/hackathons';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useHackathons(params: Record<string, any>) {
  // Construct a key based on params
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
      }
  });
  const key = `/api/hackathons?${searchParams.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true
  });

  // Map data if present
  let hackathons: HackathonEvent[] = [];
  let pagination = { hasMore: false };

  if (data?.data) {
      hackathons = data.data.map((item: any) => ({
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
            difficulty: 'Open', 
            source: item.external_source,
            redirect_url: item.url,
            logo: item.image,
            created_at: item.created_at,
            view_count: item.views,
            click_count: item.clicks,
            is_featured: item.is_featured
      }));
      pagination = data.pagination;
  }

  return {
    hackathons,
    pagination,
    isLoading,
    isError: error,
    isValidating
  };
}
