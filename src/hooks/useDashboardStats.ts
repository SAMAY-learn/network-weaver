import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalSuspects: number;
  activeSims: number;
  muleAccounts: number;
  devicesTracked: number;
  estFraudValue: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [suspectsResult, simsResult, accountsResult, devicesResult, fraudResult] = await Promise.all([
        supabase.from('suspects').select('id', { count: 'exact', head: true }),
        supabase.from('sim_cards').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('mule_accounts').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('suspects').select('fraud_amount'),
      ]);

      const totalFraud = fraudResult.data?.reduce((sum, s) => sum + (Number(s.fraud_amount) || 0), 0) || 0;

      return {
        totalSuspects: suspectsResult.count || 0,
        activeSims: simsResult.count || 0,
        muleAccounts: accountsResult.count || 0,
        devicesTracked: devicesResult.count || 0,
        estFraudValue: totalFraud,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
