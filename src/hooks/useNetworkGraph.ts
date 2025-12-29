import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type NodeType = Database['public']['Enums']['node_type'];
type EdgeType = Database['public']['Enums']['edge_type'];
type ThreatLevel = Database['public']['Enums']['threat_level'];

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  threat: ThreatLevel;
  connections: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const generatePosition = (index: number, total: number, type: NodeType): { x: number; y: number } => {
  // Arrange nodes in groups by type
  const centerX = 450;
  const centerY = 300;
  const radiusMap: Record<NodeType, number> = {
    suspect: 100,
    sim: 200,
    device: 250,
    account: 300,
    ip: 350,
  };
  
  const radius = radiusMap[type];
  const angleOffset = {
    suspect: 0,
    sim: Math.PI / 5,
    device: Math.PI / 3,
    account: Math.PI / 2,
    ip: Math.PI / 1.5,
  };
  
  const angle = (2 * Math.PI * index) / Math.max(total, 1) + angleOffset[type];
  
  return {
    x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
    y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
  };
};

export const useNetworkGraph = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['network-graph'],
    queryFn: async (): Promise<NetworkData> => {
      // Fetch all node types
      const [suspectsRes, simsRes, devicesRes, accountsRes, ipsRes, edgesRes] = await Promise.all([
        supabase.from('suspects').select('id, name, alias, threat_level').limit(20),
        supabase.from('sim_cards').select('id, phone_number, threat_level').limit(30),
        supabase.from('devices').select('id, imei, threat_level').limit(20),
        supabase.from('mule_accounts').select('id, account_number, threat_level').limit(20),
        supabase.from('ip_addresses').select('id, ip_address, threat_level').limit(15),
        supabase.from('network_edges').select('*').limit(100),
      ]);

      const nodes: NetworkNode[] = [];
      
      // Add suspects
      (suspectsRes.data || []).forEach((suspect, index) => {
        const pos = generatePosition(index, suspectsRes.data?.length || 1, 'suspect');
        nodes.push({
          id: suspect.id,
          type: 'suspect',
          label: suspect.alias || suspect.name.split(' ')[0],
          x: pos.x,
          y: pos.y,
          threat: suspect.threat_level || 'low',
          connections: 0,
        });
      });

      // Add SIMs
      (simsRes.data || []).forEach((sim, index) => {
        const pos = generatePosition(index, simsRes.data?.length || 1, 'sim');
        nodes.push({
          id: sim.id,
          type: 'sim',
          label: sim.phone_number.replace(/(\d{3})\d{4}(\d{4})/, '$1-XXX-$2'),
          x: pos.x,
          y: pos.y,
          threat: sim.threat_level || 'low',
          connections: 0,
        });
      });

      // Add devices
      (devicesRes.data || []).forEach((device, index) => {
        const pos = generatePosition(index, devicesRes.data?.length || 1, 'device');
        nodes.push({
          id: device.id,
          type: 'device',
          label: `IMEI-${device.imei.slice(-4)}`,
          x: pos.x,
          y: pos.y,
          threat: device.threat_level || 'low',
          connections: 0,
        });
      });

      // Add accounts
      (accountsRes.data || []).forEach((account, index) => {
        const pos = generatePosition(index, accountsRes.data?.length || 1, 'account');
        nodes.push({
          id: account.id,
          type: 'account',
          label: `ACC-${account.account_number.slice(-4)}`,
          x: pos.x,
          y: pos.y,
          threat: account.threat_level || 'low',
          connections: 0,
        });
      });

      // Add IPs
      (ipsRes.data || []).forEach((ip, index) => {
        const pos = generatePosition(index, ipsRes.data?.length || 1, 'ip');
        nodes.push({
          id: ip.id,
          type: 'ip',
          label: ip.ip_address.replace(/\d+\.\d+$/, 'X.X'),
          x: pos.x,
          y: pos.y,
          threat: ip.threat_level || 'low',
          connections: 0,
        });
      });

      // Create edges
      const edges: NetworkEdge[] = (edgesRes.data || []).map((edge) => ({
        from: edge.source_id,
        to: edge.target_id,
        type: edge.edge_type,
      }));

      // Update connection counts
      edges.forEach((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (fromNode) fromNode.connections++;
        if (toNode) toNode.connections++;
      });

      return { nodes, edges };
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Set up real-time subscription for network edges
  useEffect(() => {
    const channel = supabase
      .channel('network-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'network_edges',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['network-graph'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
