import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  User,
  Lock,
  Zap,
  Loader2,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SettingsPanel = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [highThreatAlerts, setHighThreatAlerts] = useState(true);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
      setShowSessionDialog(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const testSuspect = {
        name: `Test Suspect ${Date.now().toString().slice(-4)}`,
        alias: 'Demo Kingpin',
        location: 'Mumbai, Maharashtra',
        threat_level: 'high' as const,
        fraud_amount: 2500000,
        notes: 'This is a test suspect created for demo purposes.',
        last_active: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('suspects')
        .insert(testSuspect);

      if (error) throw error;

      toast({
        title: 'Test suspect created',
        description: 'A high-threat demo suspect was inserted. Check notifications!',
      });
    } catch (error) {
      console.error('Error creating test suspect:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test suspect',
        variant: 'destructive',
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  const settingSections = [
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          label: 'Push Notifications',
          description: 'Receive alerts for new threats and kingpin activity',
          value: notifications,
          onChange: setNotifications,
        },
        {
          label: 'Email Alerts',
          description: 'Get daily summary emails of network activity',
          value: emailAlerts,
          onChange: setEmailAlerts,
        },
        {
          label: 'High Threat Alerts',
          description: 'Immediate notifications for high-threat suspects',
          value: highThreatAlerts,
          onChange: setHighThreatAlerts,
        },
      ],
    },
    {
      title: 'Display',
      icon: Palette,
      settings: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme for the interface',
          value: darkMode,
          onChange: setDarkMode,
        },
        {
          label: 'Auto-Refresh Data',
          description: 'Automatically refresh dashboard data every 30 seconds',
          value: autoRefresh,
          onChange: setAutoRefresh,
        },
      ],
    },
  ];

  const infoItems = [
    { icon: Database, label: 'Database Status', value: 'Connected', status: 'success', clickable: false },
    { icon: Shield, label: 'Security Level', value: 'High', status: 'warning', clickable: false },
    { icon: Lock, label: 'Session', value: 'Active & Encrypted', status: 'success', clickable: true, onClick: () => setShowSessionDialog(true) },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6 border border-border/50"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Inspector Singh</h3>
            <p className="text-sm text-muted-foreground">Cyber Cell, Ranchi</p>
            <p className="text-xs text-muted-foreground mt-1">Role: Administrator</p>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="glass-card rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.settings.map((setting, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.value}
                    onCheckedChange={setting.onChange}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Demo & Testing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-xl p-6 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Demo & Testing</h3>
        </div>
        <div className="p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Test Notification System</p>
              <p className="text-xs text-muted-foreground">Insert a demo high-threat suspect to trigger real-time alerts</p>
            </div>
            <Button 
              variant="cyber" 
              size="sm"
              onClick={handleTestNotification}
              disabled={isTestingNotification}
            >
              {isTestingNotification ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Trigger Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-6 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">System Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infoItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={item.clickable ? item.onClick : undefined}
                className={`flex items-center gap-3 p-4 bg-secondary/30 rounded-lg ${
                  item.clickable ? 'cursor-pointer hover:bg-secondary/50 transition-colors' : ''
                }`}
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
                {item.clickable ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'success' ? 'bg-success' : 'bg-warning'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Session Details
            </DialogTitle>
            <DialogDescription>
              Your current session information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-success flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Encryption</span>
                <span className="text-sm font-medium text-foreground">TLS 1.3</span>
              </div>
            </div>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-muted-foreground"
      >
        <p>CrimeNet Intelligence Engine v1.0.0</p>
        <p className="mt-1">© 2024 Cyber Crime Investigation Unit</p>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;
