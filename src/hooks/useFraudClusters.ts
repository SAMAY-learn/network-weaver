import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type CaseStatus = Database['public']['Enums']['case_status'];
type ThreatLevel = Database['public']['Enums']['threat_level'];

export interface FraudCluster {
  id: string;
  name: string;
  members: number;
  threat: ThreatLevel;
  fraudAmount: string;
  primaryLocation: string;
  status: CaseStatus;
}

const formatFraudAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(0)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
};

export const useFraudClusters = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['fraud-clusters'],
    queryFn: async (): Promise<FraudCluster[]> => {
      const { data: clusters, error } = await supabase
        .from('fraud_clusters')
        .select('*')
        .order('threat_level', { ascending: false })
        .order('estimated_fraud_amount', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get member counts for each cluster
      const clustersWithMembers = await Promise.all(
        (clusters || []).map(async (cluster) => {
          const { count } = await supabase
            .from('cluster_members')
            .select('id', { count: 'exact', head: true })
            .eq('cluster_id', cluster.id);

          return {
            id: cluster.id,
            name: cluster.name,
            members: count || 0,
            threat: cluster.threat_level || 'low',
            fraudAmount: formatFraudAmount(Number(cluster.estimated_fraud_amount) || 0),
            primaryLocation: cluster.primary_location || 'Unknown',
            status: cluster.status || 'active',
          };
        })
      );

      return clustersWithMembers;
    },
    refetchInterval: 30000,
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('clusters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fraud_clusters',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fraud-clusters'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
