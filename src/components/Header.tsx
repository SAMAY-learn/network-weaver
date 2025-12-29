import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Filter, LogOut, X, AlertTriangle, Info, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSuspects } from '@/hooks/useSuspects';
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSuspectSelect?: (suspectId: string) => void;
}

export interface FilterState {
  threatLevel: ('high' | 'medium' | 'low')[];
  locations: string[];
}

const Header = ({ title, subtitle, onSearch, onFilterChange, onSuspectSelect }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { data: suspects } = useSuspects();
  const { 
    notifications, 
    isLoading: notificationsLoading,
    newNotification,
    clearNewNotification,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    unreadCount 
  } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof suspects>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    threatLevel: [],
    locations: [],
  });
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Get unique locations from suspects
  const locations = Array.from(new Set(suspects?.map(s => s.location).filter(Boolean) || []));

  // Show toast for new notifications
  useEffect(() => {
    if (newNotification) {
      const icon = newNotification.type === 'alert' ? '🚨' : 
                   newNotification.type === 'warning' ? '⚠️' : 'ℹ️';
      
      toast(newNotification.title, {
        description: newNotification.message,
        icon: icon,
        duration: 5000,
      });
      clearNewNotification();
    }
  }, [newNotification, clearNewNotification]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() && suspects) {
      const query = searchQuery.toLowerCase();
      const filtered = suspects.filter(suspect => 
        suspect.name.toLowerCase().includes(query) ||
        suspect.alias?.toLowerCase().includes(query) ||
        suspect.location?.toLowerCase().includes(query)
      ).slice(0, 5);
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    
    onSearch?.(searchQuery);
  }, [searchQuery, suspects, onSearch]);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle filter changes
  const handleThreatLevelToggle = (level: 'high' | 'medium' | 'low') => {
    setFilters(prev => {
      const newThreatLevels = prev.threatLevel.includes(level)
        ? prev.threatLevel.filter(l => l !== level)
        : [...prev.threatLevel, level];
      
      const newFilters = { ...prev, threatLevel: newThreatLevels };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  };

  const handleLocationToggle = (location: string) => {
    setFilters(prev => {
      const newLocations = prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location];
      
      const newFilters = { ...prev, locations: newLocations };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    const clearedFilters = { threatLevel: [], locations: [] };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const activeFiltersCount = filters.threatLevel.length + filters.locations.length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suspects, SIMs, accounts..."
            className="pl-10 pr-10 py-2 w-80 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="border-t border-border">
                  {searchResults.map((suspect) => (
                    <button
                      key={suspect.id}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left cursor-pointer"
                      onClick={() => {
                        onSuspectSelect?.(suspect.id);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        suspect.threat_level === 'high' ? 'bg-destructive' :
                        suspect.threat_level === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {suspect.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {suspect.alias} • {suspect.location}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        suspect.threat_level === 'high' ? 'bg-destructive/20 text-destructive' :
                        suspect.threat_level === 'medium' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>
                        {suspect.threat_score}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center justify-between">
              Filters
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground">Threat Level</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.threatLevel.includes('high')}
              onCheckedChange={() => handleThreatLevelToggle('high')}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                High Threat
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.threatLevel.includes('medium')}
              onCheckedChange={() => handleThreatLevelToggle('medium')}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Medium Threat
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.threatLevel.includes('low')}
              onCheckedChange={() => handleThreatLevelToggle('low')}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                Low Threat
              </span>
            </DropdownMenuCheckboxItem>
            
            {locations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Location</DropdownMenuLabel>
                {locations.slice(0, 5).map((location) => (
                  <DropdownMenuCheckboxItem
                    key={location}
                    checked={filters.locations.includes(location!)}
                    onCheckedChange={() => handleLocationToggle(location!)}
                  >
                    {location}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <ScrollArea className="h-80">
              {notificationsLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer group ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.created_at)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name || 'Officer'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
