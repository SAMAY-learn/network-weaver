import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type ReviewStatus = 'pending' | 'reviewed' | 'dismissed';

interface ReviewFlag {
  id: string;
  suspect_id: string;
  reason: string;
  status: ReviewStatus;
  reviewed_at: string | null;
  created_at: string;
}

export const useReviewFlags = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviewFlags = [], isLoading } = useQuery({
    queryKey: ['review-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReviewFlag[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('review-flags-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'review_flags' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['review-flags'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const flagForReview = useMutation({
    mutationFn: async ({ suspectId, reason }: { suspectId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('review_flags')
        .insert({ suspect_id: suspectId, reason, status: 'pending' })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        type: 'warning',
        title: 'Review Requested',
        message: `Suspect flagged for review: ${reason.slice(0, 50)}${reason.length > 50 ? '...' : ''}`,
        entity_type: 'suspect',
        entity_id: suspectId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-flags'] });
      toast({
        title: 'Flagged for Review',
        description: 'Team has been notified',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to flag for review',
        variant: 'destructive',
      });
      console.error('Review flag error:', error);
    },
  });

  const updateReviewStatus = useMutation({
    mutationFn: async ({ flagId, status }: { flagId: string; status: ReviewStatus }) => {
      const { error } = await supabase
        .from('review_flags')
        .update({ 
          status, 
          reviewed_at: status !== 'pending' ? new Date().toISOString() : null 
        })
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-flags'] });
      toast({
        title: 'Review Updated',
        description: 'Status has been updated',
      });
    },
  });

  const removeFlag = useMutation({
    mutationFn: async (suspectId: string) => {
      const { error } = await supabase
        .from('review_flags')
        .delete()
        .eq('suspect_id', suspectId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-flags'] });
      toast({
        title: 'Flag Removed',
        description: 'Review flag has been removed',
      });
    },
  });

  const isFlagged = (suspectId: string): boolean => {
    return reviewFlags.some(flag => flag.suspect_id === suspectId && flag.status === 'pending');
  };

  const getReviewFlag = (suspectId: string): ReviewFlag | undefined => {
    return reviewFlags.find(flag => flag.suspect_id === suspectId && flag.status === 'pending');
  };

  const getPendingCount = (): number => {
    return reviewFlags.filter(flag => flag.status === 'pending').length;
  };

  return {
    reviewFlags,
    isLoading,
    flagForReview,
    updateReviewStatus,
    removeFlag,
    isFlagged,
    getReviewFlag,
    getPendingCount,
  };
};
