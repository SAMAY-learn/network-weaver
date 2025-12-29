import { motion } from 'framer-motion';
import { 
  Phone, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  User, 
  Clock,
  FileText,
  Flag,
  Eye,
  AlertTriangle,
  Shield,
  Activity
} from 'lucide-react';
import { Kingpin, KingpinStatus, PriorityLevel } from '@/hooks/useKingpins';
import ThreatGauge from './ThreatGauge';
import RankBadge from './RankBadge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface KingpinCardProps {
  kingpin: Kingpin;
  rank: number;
  delay?: number;
  onClick?: () => void;
  compact?: boolean;
}

const getStatusConfig = (status: KingpinStatus) => {
  const configs = {
    under_surveillance: { label: 'Under Surveillance', color: 'bg-warning/20 text-warning border-warning/30', icon: Eye },
    active_investigation: { label: 'Active Investigation', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Shield },
    warrant_issued: { label: 'Warrant Issued', color: 'bg-destructive/30 text-destructive border-destructive/40', icon: AlertTriangle },
    arrested: { label: 'Arrested', color: 'bg-success/20 text-success border-success/30', icon: Shield },
    monitoring: { label: 'Monitoring', color: 'bg-primary/20 text-primary border-primary/30', icon: Activity },
  };
  return configs[status] || configs.monitoring;
};

const getPriorityConfig = (priority: PriorityLevel) => {
  const configs = {
    critical: { label: 'CRITICAL', color: 'bg-destructive text-destructive-foreground', pulse: true },
    high: { label: 'HIGH', color: 'bg-destructive/80 text-destructive-foreground', pulse: false },
    medium: { label: 'MEDIUM', color: 'bg-warning text-warning-foreground', pulse: false },
    low: { label: 'LOW', color: 'bg-muted text-muted-foreground', pulse: false },
  };
  return configs[priority] || configs.medium;
};

const KingpinCard = ({ kingpin, rank, delay = 0, onClick, compact = false }: KingpinCardProps) => {
  const statusConfig = getStatusConfig(kingpin.status);
  const priorityConfig = getPriorityConfig(kingpin.priority);
  const StatusIcon = statusConfig.icon;

  // Generate initials for avatar
  const initials = kingpin.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className="glass-card rounded-xl border border-border/50 hover:border-primary/40 transition-all duration-300 relative overflow-hidden cursor-pointer group"
    >
      {/* Priority Flag */}
      {kingpin.priority === 'critical' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 right-0 w-20 h-20 overflow-hidden"
        >
          <div className="absolute top-3 right-[-35px] w-[120px] text-center transform rotate-45 bg-destructive text-destructive-foreground text-[10px] font-bold py-0.5 shadow-lg">
            CRITICAL
          </div>
        </motion.div>
      )}

      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          <RankBadge rank={rank} size="md" />

          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-inner">
              <span className="text-lg font-bold text-primary">{initials}</span>
            </div>
            {kingpin.priority === 'critical' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background"
              />
            )}
          </div>

          {/* Name & Alias */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{kingpin.name}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {kingpin.alias}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusIcon className="w-3 h-3" />
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Threat Gauge */}
          <div className="flex flex-col items-center">
            <ThreatGauge score={kingpin.threatScore} size={52} strokeWidth={4} />
            <span className="text-[9px] text-muted-foreground mt-1">THREAT</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                  <Phone className="w-3.5 h-3.5 mx-auto mb-1 text-cyber-purple" />
                  <p className="text-sm font-bold">{kingpin.simCards}</p>
                  <p className="text-[9px] text-muted-foreground">SIMs</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kingpin.simCards} linked SIM cards</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                  <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-cyber-pink" />
                  <p className="text-sm font-bold">{kingpin.accounts}</p>
                  <p className="text-[9px] text-muted-foreground">Accounts</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kingpin.accounts} mule accounts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                  <Smartphone className="w-3.5 h-3.5 mx-auto mb-1 text-cyber-cyan" />
                  <p className="text-sm font-bold">{kingpin.devices}</p>
                  <p className="text-[9px] text-muted-foreground">Devices</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kingpin.devices} tracked devices</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-2 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                  <Activity className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-bold">{kingpin.connections}</p>
                  <p className="text-[9px] text-muted-foreground">Links</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kingpin.connections} network connections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Network Influence Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Network Influence</span>
          <span className="font-mono">{kingpin.influenceScore}%</span>
        </div>
        <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${kingpin.influenceScore}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
            className="h-full bg-gradient-to-r from-primary to-cyber-cyan rounded-full"
          />
        </div>
      </div>

      {/* Recent Activity Timeline */}
      {!compact && kingpin.recentActivities.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent Activity
          </div>
          <div className="space-y-1">
            {kingpin.recentActivities.slice(0, 2).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] text-muted-foreground bg-secondary/30 rounded px-2 py-1">
                <span className="truncate">{activity.action}</span>
                <span className="text-[9px] font-mono ml-2">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30 bg-secondary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{kingpin.location}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{kingpin.assignedOfficer}</span>
            </div>
          </div>
          <div className="font-mono text-destructive font-bold text-sm">
            ₹{kingpin.fraudAmount}
          </div>
        </div>
      </div>

      {/* Quick Actions (visible on hover) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 bg-secondary/80 hover:bg-primary hover:text-primary-foreground"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Report
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Report</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 bg-secondary/80 hover:bg-warning hover:text-warning-foreground"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Watchlist
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to Watchlist</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 bg-secondary/80 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Flag className="w-3.5 h-3.5 mr-1" />
                  Flag
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flag for Review</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KingpinCard;
