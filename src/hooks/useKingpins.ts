import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export type KingpinStatus = 'under_surveillance' | 'active_investigation' | 'warrant_issued' | 'arrested' | 'monitoring';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Kingpin {
  id: string;
  name: string;
  alias: string;
  threatScore: number;
  connections: number;
  simCards: number;
  accounts: number;
  devices: number;
  location: string;
  lastActive: string;
  fraudAmount: string;
  status: KingpinStatus;
  priority: PriorityLevel;
  assignedOfficer: string;
  influenceScore: number;
  recentActivities: { action: string; time: string }[];
}

const formatFraudAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(0)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

const formatLastActive = (date: string | null): string => {
  if (!date) return 'Unknown';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const getStatusFromThreatLevel = (level: string | null): KingpinStatus => {
  switch (level) {
    case 'high': return 'active_investigation';
    case 'medium': return 'under_surveillance';
    default: return 'monitoring';
  }
};

const getPriorityFromScore = (score: number): PriorityLevel => {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

const getAssignedOfficer = (id: string): string => {
  const officers = ['Insp. R. Kumar', 'SI P. Sharma', 'Insp. A. Singh', 'SI M. Verma', 'Insp. S. Yadav'];
  const index = id.charCodeAt(0) % officers.length;
  return officers[index];
};

const generateRecentActivities = (lastActive: string | null): { action: string; time: string }[] => {
  if (!lastActive) return [];
  const actions = [
    'New SIM detected',
    'Transaction flagged',
    'Location changed',
    'Network activity',
    'Call pattern anomaly',
  ];
  return actions.slice(0, 3).map((action, i) => ({
    action,
    time: `${i + 1}h ago`,
  }));
};

export const useKingpins = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['kingpins'],
    queryFn: async (): Promise<Kingpin[]> => {
      // Get all suspects with high threat levels, ordered by threat_score
      const { data: suspects, error } = await supabase
        .from('suspects')
        .select('*')
        .order('threat_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get related counts for each suspect
      const kingpins = await Promise.all(
        (suspects || []).map(async (suspect) => {
          const [simResult, accountResult, deviceResult, edgesResult] = await Promise.all([
            supabase.from('sim_cards').select('id', { count: 'exact', head: true }).eq('suspect_id', suspect.id),
            supabase.from('mule_accounts').select('id', { count: 'exact', head: true }).eq('suspect_id', suspect.id),
            supabase.from('devices').select('id', { count: 'exact', head: true }).eq('suspect_id', suspect.id),
            supabase.from('network_edges').select('id', { count: 'exact', head: true }).eq('source_id', suspect.id),
          ]);

          // Generate derived data for professional display
          const threatScore = suspect.threat_score || 0;
          const status = getStatusFromThreatLevel(suspect.threat_level);
          const priority = getPriorityFromScore(threatScore);
          
          return {
            id: suspect.id,
            name: suspect.name,
            alias: suspect.alias || 'N/A',
            threatScore,
            connections: edgesResult.count || 0,
            simCards: simResult.count || 0,
            accounts: accountResult.count || 0,
            devices: deviceResult.count || 0,
            location: suspect.location || 'Unknown',
            lastActive: formatLastActive(suspect.last_active),
            fraudAmount: formatFraudAmount(Number(suspect.fraud_amount) || 0),
            status,
            priority,
            assignedOfficer: getAssignedOfficer(suspect.id),
            influenceScore: Math.min(100, Math.round((edgesResult.count || 0) * 3 + threatScore * 0.5)),
            recentActivities: generateRecentActivities(suspect.last_active),
          };
        })
      );

      return kingpins;
    },
    refetchInterval: 30000,
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('suspects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suspects',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kingpins'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
