import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Users,
  MapPin,
  AlertTriangle,
  Target,
  TrendingUp,
  Clock,
  User
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface ClusterDetailModalProps {
  clusterId: string | null;
  onClose: () => void;
  onSelectSuspect: (suspectId: string) => void;
}

interface ClusterMember {
  id: string;
  role: string | null;
  joined_at: string | null;
  suspect: {
    id: string;
    name: string;
    alias: string | null;
    threat_level: string | null;
    threat_score: number | null;
    location: string | null;
    fraud_amount: number | null;
  } | null;
}

interface ClusterDetails {
  id: string;
  name: string;
  primary_location: string | null;
  estimated_fraud_amount: number | null;
  threat_level: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  members: ClusterMember[];
}

const useClusterDetails = (clusterId: string | null) => {
  return useQuery({
    queryKey: ['cluster-details', clusterId],
    queryFn: async (): Promise<ClusterDetails | null> => {
      if (!clusterId) return null;

      const { data: cluster, error: clusterError } = await supabase
        .from('fraud_clusters')
        .select('*')
        .eq('id', clusterId)
        .single();

      if (clusterError) throw clusterError;

      const { data: members, error: membersError } = await supabase
        .from('cluster_members')
        .select(`
          id,
          role,
          joined_at,
          suspect:suspects(id, name, alias, threat_level, threat_score, location, fraud_amount)
        `)
        .eq('cluster_id', clusterId);

      if (membersError) throw membersError;

      return {
        ...cluster,
        members: (members || []) as ClusterMember[],
      };
    },
    enabled: !!clusterId,
  });
};

const ClusterDetailModal = ({ clusterId, onClose, onSelectSuspect }: ClusterDetailModalProps) => {
  const { data: cluster, isLoading } = useClusterDetails(clusterId);

  const getThreatBadge = (level: string | null) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case 'low':
        return <Badge className="bg-success/20 text-success border-success/30">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!clusterId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden glass-card rounded-2xl border border-border/50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : cluster ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border/50 bg-gradient-to-r from-destructive/5 to-transparent">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    cluster.threat_level === 'high' ? 'bg-destructive/20' :
                    cluster.threat_level === 'medium' ? 'bg-warning/20' : 'bg-success/20'
                  }`}>
                    <Target className={`w-7 h-7 ${
                      cluster.threat_level === 'high' ? 'text-destructive' :
                      cluster.threat_level === 'medium' ? 'text-warning' : 'text-success'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-foreground">{cluster.name}</h2>
                      {getThreatBadge(cluster.threat_level)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {cluster.primary_location || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Created: {formatDate(cluster.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 p-6 border-b border-border/50">
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{cluster.members.length}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{formatAmount(cluster.estimated_fraud_amount)}</p>
                  <p className="text-xs text-muted-foreground">Est. Fraud Amount</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    cluster.status === 'active' ? 'bg-destructive/20 text-destructive' :
                    cluster.status === 'monitoring' ? 'bg-warning/20 text-warning' :
                    cluster.status === 'contained' ? 'bg-success/20 text-success' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {(cluster.status || 'unknown').toUpperCase()}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">Status</p>
                </div>
              </div>

              {/* Members List */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Cluster Members ({cluster.members.length})
                </h3>
                
                {cluster.members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No members in this cluster</p>
                ) : (
                  <div className="space-y-3">
                    {cluster.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => member.suspect && onSelectSuspect(member.suspect.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            member.suspect?.threat_level === 'high' ? 'bg-destructive/20 text-destructive' :
                            member.suspect?.threat_level === 'medium' ? 'bg-warning/20 text-warning' :
                            'bg-success/20 text-success'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.suspect?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.role || 'Member'} • {member.suspect?.alias || 'No alias'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-mono text-destructive">
                              {formatAmount(member.suspect?.fraud_amount || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.suspect?.location}</p>
                          </div>
                          {member.suspect?.threat_level && (
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              member.suspect.threat_level === 'high' ? 'threat-badge-high' :
                              member.suspect.threat_level === 'medium' ? 'threat-badge-medium' :
                              'threat-badge-low'
                            }`}>
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {member.suspect.threat_score || 0}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {cluster.notes && (
                  <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{cluster.notes}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Cluster not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClusterDetailModal;
