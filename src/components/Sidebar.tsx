import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Network, 
  Users, 
  FileSearch, 
  Upload, 
  Settings, 
  Shield,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'network', label: 'Network Map', icon: Network },
    { id: 'kingpins', label: 'Kingpins', icon: AlertTriangle },
    { id: 'suspects', label: 'Suspects', icon: Users },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'reports', label: 'Reports', icon: FileSearch },
  ];

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">CrimeNet</h1>
            <p className="text-xs text-muted-foreground">Intelligence Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-primary border-l-2 border-primary' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              {item.label}
              {item.id === 'kingpins' && (
                <span className="ml-auto bg-destructive/20 text-destructive text-xs px-2 py-0.5 rounded-full">
                  5
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">System Active</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-foreground">847</p>
              <p className="text-[10px] text-muted-foreground">Nodes</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-foreground">1.2K</p>
              <p className="text-[10px] text-muted-foreground">Edges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent/50 transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
