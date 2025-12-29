import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type WatchlistPriority = 'critical' | 'high' | 'medium' | 'low';

interface WatchlistEntry {
  id: string;
  suspect_id: string;
  priority: WatchlistPriority;
  notes: string | null;
  created_at: string;
}

export const useWatchlist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WatchlistEntry[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('watchlist-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'watchlist' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addToWatchlist = useMutation({
    mutationFn: async ({ suspectId, priority, notes }: { suspectId: string; priority: WatchlistPriority; notes?: string }) => {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({ suspect_id: suspectId, priority, notes })
        .select()
        .single();

      if (error) throw error;
      
      // Create notification
      await supabase.from('notifications').insert({
        type: 'info',
        title: 'Added to Watchlist',
        message: `Suspect added to watchlist with ${priority} priority`,
        entity_type: 'suspect',
        entity_id: suspectId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Added to Watchlist',
        description: 'Suspect is now being monitored',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add to watchlist',
        variant: 'destructive',
      });
      console.error('Watchlist error:', error);
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (suspectId: string) => {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('suspect_id', suspectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Removed from Watchlist',
        description: 'Suspect is no longer being monitored',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
      console.error('Watchlist error:', error);
    },
  });

  const isOnWatchlist = (suspectId: string): boolean => {
    return watchlist.some(entry => entry.suspect_id === suspectId);
  };

  const getWatchlistEntry = (suspectId: string): WatchlistEntry | undefined => {
    return watchlist.find(entry => entry.suspect_id === suspectId);
  };

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isOnWatchlist,
    getWatchlistEntry,
  };
};
