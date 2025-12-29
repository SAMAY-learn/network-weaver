import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Smartphone,
  CreditCard,
  Globe,
  MapPin,
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Banknote
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSuspectDetails } from '@/hooks/useSuspectDetails';

interface SuspectDetailModalProps {
  suspectId: string | null;
  onClose: () => void;
}

const SuspectDetailModal = ({ suspectId, onClose }: SuspectDetailModalProps) => {
  const { data: suspect, isLoading } = useSuspectDetails(suspectId);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!suspectId) return null;

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
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden glass-card rounded-2xl border border-border/50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : suspect ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    suspect.threat_level === 'high' ? 'bg-destructive/20 text-destructive' :
                    suspect.threat_level === 'medium' ? 'bg-warning/20 text-warning' :
                    'bg-success/20 text-success'
                  }`}>
                    {suspect.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-foreground">{suspect.name}</h2>
                      {getThreatBadge(suspect.threat_level)}
                    </div>
                    {suspect.alias && (
                      <p className="text-sm text-muted-foreground font-mono">{suspect.alias}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {suspect.location || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Last active: {formatDate(suspect.last_active)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-5 gap-4 p-6 border-b border-border/50">
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{suspect.threat_score || 0}</p>
                  <p className="text-xs text-muted-foreground">Threat Score</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{formatAmount(suspect.fraud_amount)}</p>
                  <p className="text-xs text-muted-foreground">Fraud Amount</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{suspect.sim_cards.length}</p>
                  <p className="text-xs text-muted-foreground">SIM Cards</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/10">
                  <p className="text-2xl font-bold text-accent">{suspect.devices.length}</p>
                  <p className="text-xs text-muted-foreground">Devices</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">{suspect.mule_accounts.length}</p>
                  <p className="text-xs text-muted-foreground">Accounts</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <Tabs defaultValue="sims" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 mb-4">
                    <TabsTrigger value="sims" className="gap-2">
                      <Phone className="w-4 h-4" />
                      SIMs ({suspect.sim_cards.length})
                    </TabsTrigger>
                    <TabsTrigger value="devices" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      Devices ({suspect.devices.length})
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="gap-2">
                      <CreditCard className="w-4 h-4" />
                      Accounts ({suspect.mule_accounts.length})
                    </TabsTrigger>
                    <TabsTrigger value="ips" className="gap-2">
                      <Globe className="w-4 h-4" />
                      IPs ({suspect.ip_addresses.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sims" className="space-y-3">
                    {suspect.sim_cards.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No SIM cards linked</p>
                    ) : (
                      suspect.sim_cards.map((sim) => (
                        <div key={sim.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-mono font-medium text-foreground">{sim.phone_number}</p>
                              <p className="text-xs text-muted-foreground">IMSI: {sim.imsi || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{sim.location}</span>
                            {sim.is_active ? (
                              <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="devices" className="space-y-3">
                    {suspect.devices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No devices linked</p>
                    ) : (
                      suspect.devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <Smartphone className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{device.device_model || 'Unknown Device'}</p>
                              <p className="text-xs text-muted-foreground font-mono">IMEI: {device.imei}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{device.last_location}</span>
                            {device.is_active ? (
                              <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="accounts" className="space-y-3">
                    {suspect.mule_accounts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No accounts linked</p>
                    ) : (
                      suspect.mule_accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-warning/10">
                              <CreditCard className="w-4 h-4 text-warning" />
                            </div>
                            <div>
                              <p className="font-mono font-medium text-foreground">{account.account_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {account.bank_name} • {account.ifsc_code}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">
                              {formatAmount(account.total_transactions)}
                            </span>
                            {account.is_frozen ? (
                              <Badge variant="destructive" className="text-xs">Frozen</Badge>
                            ) : (
                              <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="ips" className="space-y-3">
                    {suspect.ip_addresses.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No IP addresses linked</p>
                    ) : (
                      suspect.ip_addresses.map((ip) => (
                        <div key={ip.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-destructive/10">
                              <Globe className="w-4 h-4 text-destructive" />
                            </div>
                            <div>
                              <p className="font-mono font-medium text-foreground">{ip.ip_address}</p>
                              <p className="text-xs text-muted-foreground">{ip.isp || 'Unknown ISP'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{ip.location}</span>
                            {ip.is_vpn && (
                              <Badge variant="destructive" className="text-xs">VPN</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {/* Notes */}
                {suspect.notes && (
                  <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{suspect.notes}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Suspect not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuspectDetailModal;
