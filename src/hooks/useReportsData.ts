import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CaseSummary {
  id: string;
  case_number: string;
  title: string;
  status: string;
  fraud_amount: number;
  victim_count: number;
  location: string | null;
  reported_date: string | null;
  suspect_count: number;
}

export interface ThreatMetrics {
  totalSuspects: number;
  highThreat: number;
  mediumThreat: number;
  lowThreat: number;
  totalFraudAmount: number;
  activeCases: number;
  frozenAccounts: number;
  activeDevices: number;
}

export interface LocationBreakdown {
  location: string;
  count: number;
  fraudAmount: number;
}

export interface MonthlyTrend {
  month: string;
  suspects: number;
  cases: number;
  fraudAmount: number;
}

export const useReportsData = () => {
  // Fetch case summaries with suspect counts
  const casesQuery = useQuery({
    queryKey: ['report-cases'],
    queryFn: async (): Promise<CaseSummary[]> => {
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Get suspect counts for each case
      const caseSummaries = await Promise.all(
        (cases || []).map(async (c) => {
          const { count } = await supabase
            .from('case_suspects')
            .select('*', { count: 'exact', head: true })
            .eq('case_id', c.id);

          return {
            id: c.id,
            case_number: c.case_number,
            title: c.title,
            status: c.status || 'active',
            fraud_amount: c.fraud_amount || 0,
            victim_count: c.victim_count || 0,
            location: c.location,
            reported_date: c.reported_date,
            suspect_count: count || 0,
          };
        })
      );

      return caseSummaries;
    },
  });

  // Fetch threat metrics
  const metricsQuery = useQuery({
    queryKey: ['report-metrics'],
    queryFn: async (): Promise<ThreatMetrics> => {
      const [suspects, cases, accounts, devices] = await Promise.all([
        supabase.from('suspects').select('threat_level, fraud_amount'),
        supabase.from('cases').select('status'),
        supabase.from('mule_accounts').select('is_frozen'),
        supabase.from('devices').select('is_active'),
      ]);

      const suspectData = suspects.data || [];
      const caseData = cases.data || [];
      const accountData = accounts.data || [];
      const deviceData = devices.data || [];

      return {
        totalSuspects: suspectData.length,
        highThreat: suspectData.filter((s) => s.threat_level === 'high').length,
        mediumThreat: suspectData.filter((s) => s.threat_level === 'medium').length,
        lowThreat: suspectData.filter((s) => s.threat_level === 'low').length,
        totalFraudAmount: suspectData.reduce((sum, s) => sum + (s.fraud_amount || 0), 0),
        activeCases: caseData.filter((c) => c.status === 'active').length,
        frozenAccounts: accountData.filter((a) => a.is_frozen).length,
        activeDevices: deviceData.filter((d) => d.is_active).length,
      };
    },
  });

  // Fetch location breakdown
  const locationQuery = useQuery({
    queryKey: ['report-locations'],
    queryFn: async (): Promise<LocationBreakdown[]> => {
      const { data, error } = await supabase
        .from('suspects')
        .select('location, fraud_amount');

      if (error) throw error;

      const locationMap = new Map<string, { count: number; fraudAmount: number }>();

      (data || []).forEach((s) => {
        const loc = s.location || 'Unknown';
        const existing = locationMap.get(loc) || { count: 0, fraudAmount: 0 };
        locationMap.set(loc, {
          count: existing.count + 1,
          fraudAmount: existing.fraudAmount + (s.fraud_amount || 0),
        });
      });

      return Array.from(locationMap.entries())
        .map(([location, data]) => ({
          location,
          count: data.count,
          fraudAmount: data.fraudAmount,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  // Fetch suspect data for export
  const exportDataQuery = useQuery({
    queryKey: ['report-export-data'],
    queryFn: async () => {
      const [suspects, cases, clusters] = await Promise.all([
        supabase.from('suspects').select('*').order('threat_score', { ascending: false }),
        supabase.from('cases').select('*').order('created_at', { ascending: false }),
        supabase.from('fraud_clusters').select('*').order('estimated_fraud_amount', { ascending: false }),
      ]);

      return {
        suspects: suspects.data || [],
        cases: cases.data || [],
        clusters: clusters.data || [],
      };
    },
  });

  return {
    cases: casesQuery.data || [],
    metrics: metricsQuery.data,
    locations: locationQuery.data || [],
    exportData: exportDataQuery.data,
    isLoading: casesQuery.isLoading || metricsQuery.isLoading || locationQuery.isLoading,
  };
};
