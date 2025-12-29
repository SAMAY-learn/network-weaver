import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info';
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notification = payload.new as Notification;
          setNewNotification(notification);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Clear new notification after it's been shown
  const clearNewNotification = () => {
    setNewNotification(null);
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    newNotification,
    clearNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount: query.data?.filter(n => !n.read).length || 0,
  };
};
