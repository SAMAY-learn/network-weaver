import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Suspect {
  id: string;
  name: string;
  alias: string | null;
  location: string | null;
  threat_level: 'high' | 'medium' | 'low' | null;
  threat_score: number | null;
  fraud_amount: number | null;
  last_active: string | null;
  notes: string | null;
  created_at: string;
}

export const useSuspects = () => {
  return useQuery({
    queryKey: ['suspects'],
    queryFn: async (): Promise<Suspect[]> => {
      const { data, error } = await supabase
        .from('suspects')
        .select('*')
        .order('threat_score', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
