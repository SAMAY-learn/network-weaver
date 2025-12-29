import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ExtractedEntities {
  suspects: Array<{
    name: string;
    alias?: string;
    phone_numbers?: string[];
    location?: string;
  }>;
  sim_cards: Array<{
    phone_number: string;
    imsi?: string;
    location?: string;
  }>;
  devices: Array<{
    imei: string;
    device_model?: string;
    location?: string;
  }>;
  mule_accounts: Array<{
    account_number: string;
    bank_name?: string;
    ifsc_code?: string;
    account_holder?: string;
  }>;
  ip_addresses: Array<{
    ip_address: string;
    location?: string;
    is_vpn?: boolean;
  }>;
  relationships: Array<{
    source_type: string;
    source_id: string;
    target_type: string;
    target_id: string;
    relationship_type: string;
  }>;
}

interface ExtractionResult {
  success: boolean;
  entities?: ExtractedEntities;
  summary?: {
    suspects: number;
    sim_cards: number;
    devices: number;
    mule_accounts: number;
    ip_addresses: number;
    relationships: number;
  };
  error?: string;
}

export const useAIExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const queryClient = useQueryClient();

  const extractEntities = async (content: string, fileType: string): Promise<ExtractionResult> => {
    setIsExtracting(true);
    setExtractionResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-entities', {
        body: { content, fileType },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Extraction failed');
      }

      setExtractionResult(data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result = { success: false, error: errorMessage };
      setExtractionResult(result);
      return result;
    } finally {
      setIsExtracting(false);
    }
  };

  const saveExtractedEntities = async (entities: ExtractedEntities): Promise<boolean> => {
    try {
      // Save suspects
      if (entities.suspects?.length) {
        const { error: suspectsError } = await supabase.from('suspects').insert(
          entities.suspects.map(s => ({
            name: s.name || 'Unknown',
            alias: s.alias,
            location: s.location,
            threat_level: 'medium' as const,
          }))
        );
        if (suspectsError) throw suspectsError;
      }

      // Save SIM cards
      if (entities.sim_cards?.length) {
        const { error: simsError } = await supabase.from('sim_cards').insert(
          entities.sim_cards.map(s => ({
            phone_number: s.phone_number || 'Unknown',
            imsi: s.imsi,
            location: s.location,
            threat_level: 'medium' as const,
          }))
        );
        if (simsError) throw simsError;
      }

      // Save devices
      if (entities.devices?.length) {
        const { error: devicesError } = await supabase.from('devices').insert(
          entities.devices.map(d => ({
            imei: d.imei || 'Unknown',
            device_model: d.device_model,
            last_location: d.location,
            threat_level: 'medium' as const,
          }))
        );
        if (devicesError) throw devicesError;
      }

      // Save mule accounts
      if (entities.mule_accounts?.length) {
        const { error: accountsError } = await supabase.from('mule_accounts').insert(
          entities.mule_accounts.map(a => ({
            account_number: a.account_number || 'Unknown',
            bank_name: a.bank_name,
            ifsc_code: a.ifsc_code,
            account_holder: a.account_holder,
            threat_level: 'medium' as const,
          }))
        );
        if (accountsError) throw accountsError;
      }

      // Save IP addresses
      if (entities.ip_addresses?.length) {
        const { error: ipsError } = await supabase.from('ip_addresses').insert(
          entities.ip_addresses.map(ip => ({
            ip_address: ip.ip_address || 'Unknown',
            location: ip.location,
            is_vpn: ip.is_vpn || false,
            threat_level: 'medium' as const,
          }))
        );
        if (ipsError) throw ipsError;
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kingpins'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-clusters'] });
      queryClient.invalidateQueries({ queryKey: ['network-graph'] });

      toast({
        title: 'Entities Saved',
        description: 'All extracted entities have been saved to the database.',
      });

      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save entities',
      });
      return false;
    }
  };

  const recalculateThreatScores = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-threat-scores');

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Threat Scores Updated',
          description: `Updated scores for ${data.updated} suspects. Top kingpins identified.`,
        });

        queryClient.invalidateQueries({ queryKey: ['kingpins'] });
        queryClient.invalidateQueries({ queryKey: ['network-graph'] });
        
        return true;
      }

      return false;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Calculation Failed',
        description: error instanceof Error ? error.message : 'Failed to calculate threat scores',
      });
      return false;
    }
  };

  return {
    isExtracting,
    extractionResult,
    extractEntities,
    saveExtractedEntities,
    recalculateThreatScores,
  };
};
