import { motion } from 'framer-motion';
import { Users, AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface Cluster {
  id: string;
  name: string;
  members: number;
  threat: 'high' | 'medium' | 'low';
  fraudAmount: string;
  primaryLocation: string;
  status: 'active' | 'monitoring' | 'contained';
}

const mockClusters: Cluster[] = [
  {
    id: 'C1',
    name: 'Jamtara Ring Alpha',
    members: 23,
    threat: 'high',
    fraudAmount: '₹2.4Cr',
    primaryLocation: 'Jamtara, JH',
    status: 'active',
  },
  {
    id: 'C2',
    name: 'Deoghar Network',
    members: 15,
    threat: 'high',
    fraudAmount: '₹1.8Cr',
    primaryLocation: 'Deoghar, JH',
    status: 'active',
  },
  {
    id: 'C3',
    name: 'Ranchi Cell',
    members: 8,
    threat: 'medium',
    fraudAmount: '₹45L',
    primaryLocation: 'Ranchi, JH',
    status: 'monitoring',
  },
  {
    id: 'C4',
    name: 'Jamshedpur Ops',
    members: 12,
    threat: 'medium',
    fraudAmount: '₹78L',
    primaryLocation: 'Jamshedpur, JH',
    status: 'monitoring',
  },
  {
    id: 'C5',
    name: 'Dhanbad Group',
    members: 5,
    threat: 'low',
    fraudAmount: '₹12L',
    primaryLocation: 'Dhanbad, JH',
    status: 'contained',
  },
];

const ClusterAnalysis = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Fraud Clusters Detected</h3>
          <p className="text-sm text-muted-foreground">AI-identified criminal networks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Live Analysis</span>
        </div>
      </div>

      <div className="space-y-3">
        {mockClusters.map((cluster, index) => (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            className={`glass-card p-4 rounded-xl border transition-all cursor-pointer ${
              cluster.threat === 'high' 
                ? 'border-destructive/30 hover:border-destructive/50' 
                : cluster.threat === 'medium'
                ? 'border-warning/30 hover:border-warning/50'
                : 'border-success/30 hover:border-success/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  cluster.threat === 'high' ? 'bg-destructive/20' :
                  cluster.threat === 'medium' ? 'bg-warning/20' : 'bg-success/20'
                }`}>
                  <Target className={`w-6 h-6 ${
                    cluster.threat === 'high' ? 'text-destructive' :
                    cluster.threat === 'medium' ? 'text-warning' : 'text-success'
                  }`} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{cluster.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      cluster.status === 'active' ? 'bg-destructive/20 text-destructive' :
                      cluster.status === 'monitoring' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {cluster.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{cluster.primaryLocation}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                  </div>
                  <p className="text-lg font-bold font-mono">{cluster.members}</p>
                  <p className="text-[10px] text-muted-foreground">Members</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <p className="text-lg font-bold font-mono text-destructive">{cluster.fraudAmount}</p>
                  <p className="text-[10px] text-muted-foreground">Fraud Est.</p>
                </div>

                <div className={`px-3 py-2 rounded-lg ${
                  cluster.threat === 'high' ? 'threat-badge-high' :
                  cluster.threat === 'medium' ? 'threat-badge-medium' :
                  'threat-badge-low'
                }`}>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs font-medium">{cluster.threat.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ClusterAnalysis;
