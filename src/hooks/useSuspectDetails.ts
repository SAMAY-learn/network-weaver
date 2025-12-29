import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuspectDetails {
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
  sim_cards: Array<{
    id: string;
    phone_number: string;
    imsi: string | null;
    location: string | null;
    threat_level: string | null;
    is_active: boolean | null;
  }>;
  devices: Array<{
    id: string;
    imei: string;
    device_model: string | null;
    last_location: string | null;
    threat_level: string | null;
    is_active: boolean | null;
  }>;
  mule_accounts: Array<{
    id: string;
    account_number: string;
    bank_name: string | null;
    ifsc_code: string | null;
    account_holder: string | null;
    threat_level: string | null;
    is_frozen: boolean | null;
    total_transactions: number | null;
  }>;
  ip_addresses: Array<{
    id: string;
    ip_address: string;
    location: string | null;
    isp: string | null;
    is_vpn: boolean | null;
    threat_level: string | null;
  }>;
}

export const useSuspectDetails = (suspectId: string | null) => {
  return useQuery({
    queryKey: ['suspect-details', suspectId],
    queryFn: async (): Promise<SuspectDetails | null> => {
      if (!suspectId) return null;

      // Fetch suspect
      const { data: suspect, error: suspectError } = await supabase
        .from('suspects')
        .select('*')
        .eq('id', suspectId)
        .maybeSingle();

      if (suspectError) throw suspectError;
      if (!suspect) return null;

      // Fetch related entities in parallel
      const [simCards, devices, muleAccounts, ipAddresses] = await Promise.all([
        supabase.from('sim_cards').select('*').eq('suspect_id', suspectId),
        supabase.from('devices').select('*').eq('suspect_id', suspectId),
        supabase.from('mule_accounts').select('*').eq('suspect_id', suspectId),
        supabase.from('ip_addresses').select('*').eq('suspect_id', suspectId),
      ]);

      return {
        ...suspect,
        sim_cards: simCards.data || [],
        devices: devices.data || [],
        mule_accounts: muleAccounts.data || [],
        ip_addresses: ipAddresses.data || [],
      };
    },
    enabled: !!suspectId,
  });
};
