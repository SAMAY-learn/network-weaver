import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  AlertTriangle,
  CreditCard,
  Clock,
  ChevronDown,
  X,
  Download,
  FileSpreadsheet,
  Map
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { useSuspects, Suspect } from '@/hooks/useSuspects';
import SuspectDetailModal from './SuspectDetailModal';
import SuspectMap from './SuspectMap';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

type ThreatLevel = 'all' | 'high' | 'medium' | 'low';

const SuspectsPanel = () => {
  const { data: suspects, isLoading } = useSuspects();
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatLevel>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Get unique locations for filter dropdown
  const locations = useMemo(() => {
    if (!suspects) return [];
    const locs = suspects
      .map(s => s.location)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locs)].sort();
  }, [suspects]);

  // Filter suspects based on search and filters
  const filteredSuspects = useMemo(() => {
    if (!suspects) return [];
    
    return suspects.filter(suspect => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        suspect.name.toLowerCase().includes(searchLower) ||
        (suspect.alias?.toLowerCase().includes(searchLower)) ||
        (suspect.location?.toLowerCase().includes(searchLower)) ||
        (suspect.notes?.toLowerCase().includes(searchLower));

      // Threat level filter
      const matchesThreat = threatFilter === 'all' || 
        suspect.threat_level === threatFilter;

      // Location filter
      const matchesLocation = locationFilter === 'all' || 
        suspect.location === locationFilter;

      return matchesSearch && matchesThreat && matchesLocation;
    });
  }, [suspects, searchQuery, threatFilter, locationFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setThreatFilter('all');
    setLocationFilter('all');
  };

  const hasActiveFilters = searchQuery || threatFilter !== 'all' || locationFilter !== 'all';

  const exportToCSV = () => {
    if (!filteredSuspects.length) {
      toast({
        variant: 'destructive',
        title: 'No data to export',
        description: 'There are no suspects matching your current filters.',
      });
      return;
    }

    const csvData = filteredSuspects.map(s => ({
      Name: s.name,
      Alias: s.alias || '',
      Location: s.location || '',
      'Threat Level': s.threat_level || '',
      'Threat Score': s.threat_score || 0,
      'Fraud Amount': s.fraud_amount || 0,
      'Last Active': s.last_active ? new Date(s.last_active).toLocaleString() : '',
      Notes: s.notes || '',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suspects_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${filteredSuspects.length} suspects to CSV.`,
    });
  };

  const exportToExcel = () => {
    if (!filteredSuspects.length) {
      toast({
        variant: 'destructive',
        title: 'No data to export',
        description: 'There are no suspects matching your current filters.',
      });
      return;
    }

    const excelData = filteredSuspects.map(s => ({
      Name: s.name,
      Alias: s.alias || '',
      Location: s.location || '',
      'Threat Level': s.threat_level || '',
      'Threat Score': s.threat_score || 0,
      'Fraud Amount (₹)': s.fraud_amount || 0,
      'Last Active': s.last_active ? new Date(s.last_active).toLocaleString() : '',
      Notes: s.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suspects');
    
    // Auto-size columns
    const colWidths = Object.keys(excelData[0]).map(key => ({
      wch: Math.max(key.length, ...excelData.map(row => String(row[key as keyof typeof row]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `suspects_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Export successful',
      description: `Exported ${filteredSuspects.length} suspects to Excel.`,
    });
  };

  const getThreatBadge = (level: string | null) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">Medium</Badge>;
      case 'low':
        return <Badge className="bg-success/20 text-success border-success/30 text-xs">Low</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const formatLastActive = (date: string | null) => {
    if (!date) return 'Unknown';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Search */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Suspect Database</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredSuspects.length} of {suspects?.length || 0} suspects
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Export Buttons */}
              <Button 
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>

              <Button 
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="gap-2"
              >
                <Map className="w-4 h-4" />
                Map
              </Button>
              
              <Button 
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, alias, location, or notes..."
              className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Threat Level Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Threat Level</label>
                    <div className="flex gap-1">
                      {(['all', 'high', 'medium', 'low'] as ThreatLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setThreatFilter(level)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                            threatFilter === level
                              ? level === 'high' ? 'bg-destructive text-destructive-foreground' :
                                level === 'medium' ? 'bg-warning text-warning-foreground' :
                                level === 'low' ? 'bg-success text-success-foreground' :
                                'bg-primary text-primary-foreground'
                              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Location</label>
                    <div className="relative">
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-8 text-xs bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="all">All Locations</option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs mt-auto"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map Visualization */}
        <AnimatePresence>
          {showMap && suspects && suspects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <SuspectMap 
                suspects={filteredSuspects} 
                onSuspectClick={(id) => setSelectedSuspectId(id)}
                onClose={() => setShowMap(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suspects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredSuspects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No suspects found</h3>
            <p className="text-muted-foreground text-sm">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : 'Upload data to populate the suspect database'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredSuspects.map((suspect, index) => (
              <motion.div
                key={suspect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedSuspectId(suspect.id)}
                className="glass-card p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      suspect.threat_level === 'high' ? 'bg-destructive/20' :
                      suspect.threat_level === 'medium' ? 'bg-warning/20' :
                      'bg-success/20'
                    }`}>
                      <span className="text-lg font-bold">
                        {suspect.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{suspect.name}</h3>
                      {suspect.alias && (
                        <p className="text-xs text-muted-foreground font-mono">{suspect.alias}</p>
                      )}
                    </div>
                  </div>
                  {getThreatBadge(suspect.threat_level)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-medium text-foreground">{suspect.threat_score || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-3.5 h-3.5 text-warning" />
                    <span className="text-muted-foreground">Fraud:</span>
                    <span className="font-medium text-foreground">{formatAmount(suspect.fraud_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{suspect.location || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatLastActive(suspect.last_active)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Suspect Detail Modal */}
      {selectedSuspectId && (
        <SuspectDetailModal 
          suspectId={selectedSuspectId} 
          onClose={() => setSelectedSuspectId(null)} 
        />
      )}
    </>
  );
};

export default SuspectsPanel;
