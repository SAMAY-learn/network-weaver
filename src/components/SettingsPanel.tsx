import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  User,
  Globe,
  Lock
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

const SettingsPanel = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [highThreatAlerts, setHighThreatAlerts] = useState(true);

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
    { icon: Database, label: 'Database Status', value: 'Connected', status: 'success' },
    { icon: Globe, label: 'API Endpoint', value: 'Active', status: 'success' },
    { icon: Shield, label: 'Security Level', value: 'High', status: 'warning' },
    { icon: Lock, label: 'Session', value: 'Encrypted', status: 'success' },
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
        <div className="grid grid-cols-2 gap-4">
          {infoItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'success' ? 'bg-success' : 'bg-warning'
                }`} />
              </div>
            );
          })}
        </div>
      </motion.div>

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
