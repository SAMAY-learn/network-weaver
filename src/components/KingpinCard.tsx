import { motion } from 'framer-motion';
import { AlertTriangle, Phone, CreditCard, Smartphone, MapPin } from 'lucide-react';
import { Kingpin } from '@/hooks/useKingpins';

interface KingpinCardProps {
  kingpin: Kingpin;
  rank: number;
  delay?: number;
}

const KingpinCard = ({ kingpin, rank, delay = 0 }: KingpinCardProps) => {
  const threatColor = kingpin.threatScore >= 80 ? 'destructive' : kingpin.threatScore >= 50 ? 'warning' : 'success';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01 }}
      className="glass-card p-4 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all duration-300 relative overflow-hidden"
    >
      {/* Threat indicator bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-destructive to-warning"
        style={{ width: `${kingpin.threatScore}%` }}
      />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive/40">
              <span className="text-lg font-bold text-destructive">#{rank}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{kingpin.name}</p>
            <p className="text-xs text-muted-foreground font-mono">Alias: {kingpin.alias}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
          threatColor === 'destructive' ? 'threat-badge-high' :
          threatColor === 'warning' ? 'threat-badge-medium' :
          'threat-badge-low'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          {kingpin.threatScore}%
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <Phone className="w-4 h-4 mx-auto mb-1 text-cyber-purple" />
          <p className="text-sm font-bold">{kingpin.simCards}</p>
          <p className="text-[10px] text-muted-foreground">SIMs</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <CreditCard className="w-4 h-4 mx-auto mb-1 text-cyber-pink" />
          <p className="text-sm font-bold">{kingpin.accounts}</p>
          <p className="text-[10px] text-muted-foreground">Accounts</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <Smartphone className="w-4 h-4 mx-auto mb-1 text-cyber-cyan" />
          <p className="text-sm font-bold">{kingpin.devices}</p>
          <p className="text-[10px] text-muted-foreground">Devices</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <span className="text-sm">🔗</span>
          <p className="text-sm font-bold">{kingpin.connections}</p>
          <p className="text-[10px] text-muted-foreground">Links</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3 h-3" />
          {kingpin.location}
        </div>
        <div className="font-mono text-destructive font-semibold">
          ₹{kingpin.fraudAmount}
        </div>
      </div>
    </motion.div>
  );
};

export default KingpinCard;
