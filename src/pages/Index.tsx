import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Phone, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  AlertTriangle,
  Network as NetworkIcon,
  IndianRupee,
  MapPin,
  LogOut
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CytoscapeGraph from '@/components/CytoscapeGraph';
import StatsCard from '@/components/StatsCard';
import KingpinCard from '@/components/KingpinCard';
import UploadPanel from '@/components/UploadPanel';
import ClusterAnalysis from '@/components/ClusterAnalysis';
import SettingsPanel from '@/components/SettingsPanel';
import SuspectsPanel from '@/components/SuspectsPanel';
import ReportsPanel from '@/components/ReportsPanel';
import SuspectDetailModal from '@/components/SuspectDetailModal';
import ClusterDetailModal from '@/components/ClusterDetailModal';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useKingpins, Kingpin } from '@/hooks/useKingpins';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Mock kingpins for when database is empty
const mockKingpins: Kingpin[] = [
  {
    id: 'K1',
    name: 'Rajan Kumar',
    alias: 'CYBER-KING-01',
    threatScore: 95,
    connections: 47,
    simCards: 12,
    accounts: 8,
    devices: 5,
    location: 'Jamtara, JH',
    lastActive: '2 hours ago',
    fraudAmount: '1.2Cr',
    status: 'active_investigation',
    priority: 'critical',
    assignedOfficer: 'Insp. R. Kumar',
    influenceScore: 92,
    recentActivities: [
      { action: 'New SIM detected', time: '1h ago' },
      { action: 'Transaction flagged', time: '2h ago' },
      { action: 'Location changed', time: '3h ago' },
    ],
  },
  {
    id: 'K2',
    name: 'Vikram Singh',
    alias: 'MULE-MASTER',
    threatScore: 88,
    connections: 35,
    simCards: 8,
    accounts: 15,
    devices: 4,
    location: 'Deoghar, JH',
    lastActive: '5 hours ago',
    fraudAmount: '89L',
    status: 'active_investigation',
    priority: 'high',
    assignedOfficer: 'SI P. Sharma',
    influenceScore: 78,
    recentActivities: [
      { action: 'Transaction flagged', time: '2h ago' },
      { action: 'Call pattern anomaly', time: '4h ago' },
    ],
  },
  {
    id: 'K3',
    name: 'Arun Yadav',
    alias: 'SIM-GHOST',
    threatScore: 82,
    connections: 28,
    simCards: 23,
    accounts: 4,
    devices: 7,
    location: 'Jamtara, JH',
    lastActive: '1 day ago',
    fraudAmount: '56L',
    status: 'under_surveillance',
    priority: 'high',
    assignedOfficer: 'Insp. A. Singh',
    influenceScore: 71,
    recentActivities: [
      { action: 'New SIM detected', time: '6h ago' },
      { action: 'Network activity', time: '12h ago' },
    ],
  },
  {
    id: 'K4',
    name: 'Deepak Thakur',
    alias: 'CALL-CENTER',
    threatScore: 75,
    connections: 22,
    simCards: 6,
    accounts: 3,
    devices: 3,
    location: 'Ranchi, JH',
    lastActive: '3 hours ago',
    fraudAmount: '34L',
    status: 'under_surveillance',
    priority: 'medium',
    assignedOfficer: 'SI M. Verma',
    influenceScore: 58,
    recentActivities: [
      { action: 'Location changed', time: '3h ago' },
    ],
  },
  {
    id: 'K5',
    name: 'Manish Gupta',
    alias: 'MONEY-TRAIL',
    threatScore: 68,
    connections: 18,
    simCards: 4,
    accounts: 12,
    devices: 2,
    location: 'Dhanbad, JH',
    lastActive: '6 hours ago',
    fraudAmount: '28L',
    status: 'monitoring',
    priority: 'medium',
    assignedOfficer: 'Insp. S. Yadav',
    influenceScore: 45,
    recentActivities: [
      { action: 'Transaction flagged', time: '5h ago' },
    ],
  },
];

const formatFraudValue = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(0)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: kingpins, isLoading: kingpinsLoading } = useKingpins();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Use real data if available, otherwise use mock data
  const displayKingpins = kingpins?.length ? kingpins : mockKingpins;

  // Set up real-time subscriptions for stats
  useEffect(() => {
    const channels = [
      supabase.channel('stats-suspects').on('postgres_changes', { event: '*', schema: 'public', table: 'suspects' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }),
      supabase.channel('stats-sims').on('postgres_changes', { event: '*', schema: 'public', table: 'sim_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }),
      supabase.channel('stats-accounts').on('postgres_changes', { event: '*', schema: 'public', table: 'mule_accounts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }),
      supabase.channel('stats-devices').on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }),
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient]);

  const headerConfig: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Intelligence Dashboard', subtitle: 'Real-time cybercrime network analysis' },
    network: { title: 'Network Visualization', subtitle: 'Interactive fraud network mapping' },
    kingpins: { title: 'Kingpin Identification', subtitle: 'High-value targets ranked by threat score' },
    suspects: { title: 'Suspect Database', subtitle: 'All identified suspects and their profiles' },
    upload: { title: 'Data Ingestion', subtitle: 'Upload CDR, FIR, and transaction records' },
    reports: { title: 'Intelligence Reports', subtitle: 'Generated analysis and case files' },
    settings: { title: 'Settings', subtitle: 'Configure system preferences and options' },
  };

  // Display values - use real data or show mock values
  const displayStats = {
    totalSuspects: stats?.totalSuspects || 847,
    activeSims: stats?.activeSims || 2341,
    muleAccounts: stats?.muleAccounts || 512,
    devicesTracked: stats?.devicesTracked || 1089,
    estFraudValue: stats?.estFraudValue || 48000000,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={headerConfig[activeTab]?.title || 'Dashboard'} 
          subtitle={headerConfig[activeTab]?.subtitle}
          onSuspectSelect={setSelectedSuspectId}
          onNotificationClick={(entityType, entityId) => {
            if (entityType === 'suspect' || entityType === 'sim_card') {
              setSelectedSuspectId(entityId);
            } else if (entityType === 'cluster') {
              setSelectedClusterId(entityId);
            }
          }}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-5 gap-4">
                {statsLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </>
                ) : (
                  <>
                    <StatsCard
                      title="Total Suspects"
                      value={displayStats.totalSuspects.toLocaleString()}
                      change="+12%"
                      changeType="increase"
                      icon={Users}
                      delay={0}
                    />
                    <StatsCard
                      title="Active SIMs"
                      value={displayStats.activeSims.toLocaleString()}
                      change="+8%"
                      changeType="increase"
                      icon={Phone}
                      delay={0.1}
                    />
                    <StatsCard
                      title="Mule Accounts"
                      value={displayStats.muleAccounts.toLocaleString()}
                      change="+23%"
                      changeType="increase"
                      icon={CreditCard}
                      variant="warning"
                      delay={0.2}
                    />
                    <StatsCard
                      title="Devices Tracked"
                      value={displayStats.devicesTracked.toLocaleString()}
                      change="+5%"
                      changeType="increase"
                      icon={Smartphone}
                      delay={0.3}
                    />
                    <StatsCard
                      title="Est. Fraud Value"
                      value={formatFraudValue(displayStats.estFraudValue)}
                      change="+18%"
                      changeType="increase"
                      icon={IndianRupee}
                      variant="threat"
                      delay={0.4}
                    />
                  </>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Network Graph */}
                <div className="col-span-2 glass-card rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <NetworkIcon className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Live Network Graph</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Real-time</span>
                    </div>
                  </div>
                  <div className="h-[500px]">
                    <CytoscapeGraph />
                  </div>
                </div>

                {/* Kingpins Panel */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h2 className="text-lg font-semibold text-foreground">Top Kingpins</h2>
                  </div>
                  <div className="space-y-3 max-h-[540px] overflow-y-auto pr-2">
                    {kingpinsLoading ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-40" />
                        ))}
                      </>
                    ) : (
                      displayKingpins.map((kingpin, index) => (
                        <KingpinCard
                          key={kingpin.id}
                          kingpin={kingpin}
                          rank={index + 1}
                          delay={index * 0.1}
                          onClick={() => setSelectedSuspectId(kingpin.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Cluster Analysis */}
              <div className="glass-card rounded-xl p-4 border border-border/50">
                <ClusterAnalysis onSelectCluster={setSelectedClusterId} />
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="h-full glass-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <NetworkIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Full Network Visualization</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 bg-destructive rounded-full" /> High Threat
                    <span className="w-2 h-2 bg-warning rounded-full ml-2" /> Medium
                    <span className="w-2 h-2 bg-success rounded-full ml-2" /> Low
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-60px)]">
                <CytoscapeGraph />
              </div>
            </div>
          )}

          {activeTab === 'kingpins' && (
            <div className="space-y-6">
              {/* Header Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-4 border border-destructive/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {displayKingpins.filter(k => k.priority === 'critical').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Critical Priority</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 border border-warning/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">
                        {displayKingpins.filter(k => k.status === 'active_investigation').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Under Investigation</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 border border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{displayKingpins.length}</p>
                      <p className="text-xs text-muted-foreground">Total Kingpins</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 border border-cyber-cyan/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-cyber-cyan" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-cyber-cyan">
                        {displayKingpins.reduce((sum, k) => sum + k.connections, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Connections</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kingpins Grid */}
              <div className="grid grid-cols-2 gap-6">
                {kingpinsLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-72" />
                    ))}
                  </>
                ) : (
                  displayKingpins.map((kingpin, index) => (
                    <motion.div
                      key={kingpin.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <KingpinCard
                        kingpin={kingpin}
                        rank={index + 1}
                        onClick={() => setSelectedSuspectId(kingpin.id)}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-4xl mx-auto">
              <div className="glass-card rounded-xl p-6 border border-border/50">
                <UploadPanel />
              </div>
            </div>
          )}

          {activeTab === 'suspects' && (
            <SuspectsPanel />
          )}

          {activeTab === 'reports' && (
            <ReportsPanel />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>

      {/* Modals */}
      <SuspectDetailModal
        suspectId={selectedSuspectId}
        onClose={() => setSelectedSuspectId(null)}
      />
      <ClusterDetailModal
        clusterId={selectedClusterId}
        onClose={() => setSelectedClusterId(null)}
        onSelectSuspect={(suspectId) => {
          setSelectedClusterId(null);
          setSelectedSuspectId(suspectId);
        }}
      />
    </div>
  );
};

export default Index;
