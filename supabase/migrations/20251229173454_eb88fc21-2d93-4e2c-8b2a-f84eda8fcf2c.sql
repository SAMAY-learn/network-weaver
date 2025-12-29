-- Create enum for threat levels
CREATE TYPE public.threat_level AS ENUM ('high', 'medium', 'low');

-- Create enum for node types
CREATE TYPE public.node_type AS ENUM ('suspect', 'sim', 'device', 'account', 'ip');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('active', 'monitoring', 'contained', 'closed');

-- Create enum for edge types
CREATE TYPE public.edge_type AS ENUM ('call', 'transaction', 'shared_device', 'shared_ip');

-- Create suspects table
CREATE TABLE public.suspects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  threat_score INTEGER DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  threat_level threat_level DEFAULT 'low',
  location TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  fraud_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SIM cards table
CREATE TABLE public.sim_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  imsi TEXT,
  threat_level threat_level DEFAULT 'low',
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE SET NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imei TEXT NOT NULL,
  device_model TEXT,
  threat_level threat_level DEFAULT 'low',
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE SET NULL,
  last_location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mule accounts table
CREATE TABLE public.mule_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  ifsc_code TEXT,
  account_holder TEXT,
  threat_level threat_level DEFAULT 'low',
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE SET NULL,
  total_transactions DECIMAL(15, 2) DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create IP addresses table
CREATE TABLE public.ip_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  location TEXT,
  threat_level threat_level DEFAULT 'low',
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE SET NULL,
  isp TEXT,
  is_vpn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fraud clusters table
CREATE TABLE public.fraud_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_location TEXT,
  threat_level threat_level DEFAULT 'medium',
  status case_status DEFAULT 'active',
  estimated_fraud_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cluster members junction table
CREATE TABLE public.cluster_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id UUID REFERENCES public.fraud_clusters(id) ON DELETE CASCADE NOT NULL,
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cluster_id, suspect_id)
);

-- Create network edges table (connections between entities)
CREATE TABLE public.network_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type node_type NOT NULL,
  source_id UUID NOT NULL,
  target_type node_type NOT NULL,
  target_id UUID NOT NULL,
  edge_type edge_type NOT NULL,
  weight INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases/FIRs table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status case_status DEFAULT 'active',
  reported_date DATE,
  victim_count INTEGER DEFAULT 0,
  fraud_amount DECIMAL(15, 2) DEFAULT 0,
  location TEXT,
  cluster_id UUID REFERENCES public.fraud_clusters(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case suspects junction table
CREATE TABLE public.case_suspects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  suspect_id UUID REFERENCES public.suspects(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  UNIQUE(case_id, suspect_id)
);

-- Enable RLS on all tables
ALTER TABLE public.suspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mule_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_suspects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (law enforcement access)
-- Suspects
CREATE POLICY "Authenticated users can view suspects" ON public.suspects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suspects" ON public.suspects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suspects" ON public.suspects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete suspects" ON public.suspects FOR DELETE TO authenticated USING (true);

-- SIM Cards
CREATE POLICY "Authenticated users can view sim_cards" ON public.sim_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sim_cards" ON public.sim_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sim_cards" ON public.sim_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sim_cards" ON public.sim_cards FOR DELETE TO authenticated USING (true);

-- Devices
CREATE POLICY "Authenticated users can view devices" ON public.devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert devices" ON public.devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update devices" ON public.devices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete devices" ON public.devices FOR DELETE TO authenticated USING (true);

-- Mule Accounts
CREATE POLICY "Authenticated users can view mule_accounts" ON public.mule_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert mule_accounts" ON public.mule_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update mule_accounts" ON public.mule_accounts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mule_accounts" ON public.mule_accounts FOR DELETE TO authenticated USING (true);

-- IP Addresses
CREATE POLICY "Authenticated users can view ip_addresses" ON public.ip_addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ip_addresses" ON public.ip_addresses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ip_addresses" ON public.ip_addresses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete ip_addresses" ON public.ip_addresses FOR DELETE TO authenticated USING (true);

-- Fraud Clusters
CREATE POLICY "Authenticated users can view fraud_clusters" ON public.fraud_clusters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fraud_clusters" ON public.fraud_clusters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fraud_clusters" ON public.fraud_clusters FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete fraud_clusters" ON public.fraud_clusters FOR DELETE TO authenticated USING (true);

-- Cluster Members
CREATE POLICY "Authenticated users can view cluster_members" ON public.cluster_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cluster_members" ON public.cluster_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cluster_members" ON public.cluster_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cluster_members" ON public.cluster_members FOR DELETE TO authenticated USING (true);

-- Network Edges
CREATE POLICY "Authenticated users can view network_edges" ON public.network_edges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert network_edges" ON public.network_edges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update network_edges" ON public.network_edges FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete network_edges" ON public.network_edges FOR DELETE TO authenticated USING (true);

-- Cases
CREATE POLICY "Authenticated users can view cases" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cases" ON public.cases FOR DELETE TO authenticated USING (true);

-- Case Suspects
CREATE POLICY "Authenticated users can view case_suspects" ON public.case_suspects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert case_suspects" ON public.case_suspects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update case_suspects" ON public.case_suspects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete case_suspects" ON public.case_suspects FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_suspects_updated_at BEFORE UPDATE ON public.suspects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sim_cards_updated_at BEFORE UPDATE ON public.sim_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mule_accounts_updated_at BEFORE UPDATE ON public.mule_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ip_addresses_updated_at BEFORE UPDATE ON public.ip_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fraud_clusters_updated_at BEFORE UPDATE ON public.fraud_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_suspects_threat_level ON public.suspects(threat_level);
CREATE INDEX idx_suspects_location ON public.suspects(location);
CREATE INDEX idx_sim_cards_suspect ON public.sim_cards(suspect_id);
CREATE INDEX idx_devices_suspect ON public.devices(suspect_id);
CREATE INDEX idx_mule_accounts_suspect ON public.mule_accounts(suspect_id);
CREATE INDEX idx_network_edges_source ON public.network_edges(source_type, source_id);
CREATE INDEX idx_network_edges_target ON public.network_edges(target_type, target_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_fraud_clusters_status ON public.fraud_clusters(status);