import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  AlertCircle, 
  Smartphone, 
  Globe, 
  Users,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from './ui/button';
import { DataType } from '@/lib/fileParser';

interface FileUpload {
  id: string;
  file: File;
  state: UploadState;
}

interface UploadState {
  status: 'idle' | 'parsing' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
  parsedData?: {
    type: DataType;
    rowCount: number;
  };
}

const UploadPanel = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  const handleFileSelect = async (selectedFiles: FileList | null, expectedType?: DataType) => {
    if (!selectedFiles) return;

    const newFiles: FileUpload[] = [];
    
    for (const file of Array.from(selectedFiles)) {
      const id = `${file.name}-${Date.now()}`;
      const uploadFile: FileUpload = {
        id,
        file,
        state: {
          status: 'parsing',
          progress: 0,
          message: 'Starting...',
        },
      };
      
      newFiles.push(uploadFile);
      setFiles(prev => [...prev, uploadFile]);
      
      // Process the file
      processFileWithState(id, file);
    }
  };

  const processFileWithState = async (id: string, file: File) => {
    // Update to parsing
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, state: { status: 'parsing', progress: 10, message: 'Parsing file...' } }
        : f
    ));

    try {
      const { parseFile } = await import('@/lib/fileParser');
      const result = await parseFile(file);
      
      if (!result.success || !result.data) {
        setFiles(prev => prev.map(f => 
          f.id === id 
            ? { ...f, state: { status: 'error', progress: 0, message: result.error || 'Parse failed' } }
            : f
        ));
        return;
      }

      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { 
              ...f, 
              state: { 
                status: 'uploading', 
                progress: 40, 
                message: `Uploading ${result.data!.rowCount} ${result.data!.type.replace('_', ' ')}...`,
                parsedData: result.data,
              } 
            }
          : f
      ));

      // Upload to database
      const { supabase } = await import('@/integrations/supabase/client');
      const batchSize = 50;
      let inserted = 0;
      const records = result.data.records;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // Add required fields
        const preparedBatch = batch.map(record => {
          const prepared = { ...record };
          switch (result.data!.type) {
            case 'suspects':
              if (!prepared.name) prepared.name = 'Unknown';
              break;
            case 'sim_cards':
              if (!prepared.phone_number) prepared.phone_number = 'Unknown';
              break;
            case 'devices':
              if (!prepared.imei) prepared.imei = 'Unknown';
              break;
            case 'mule_accounts':
              if (!prepared.account_number) prepared.account_number = 'Unknown';
              break;
            case 'ip_addresses':
              if (!prepared.ip_address) prepared.ip_address = 'Unknown';
              break;
            case 'fraud_clusters':
              if (!prepared.name) prepared.name = 'Unknown Cluster';
              break;
          }
          return prepared;
        });
        
        const { error } = await supabase.from(result.data!.type).insert(preparedBatch as never[]);
        
        if (error) {
          console.error('Insert error:', error);
          setFiles(prev => prev.map(f => 
            f.id === id 
              ? { ...f, state: { status: 'error', progress: 0, message: error.message } }
              : f
          ));
          return;
        }
        
        inserted += batch.length;
        const progress = 40 + Math.round((inserted / records.length) * 60);
        
        setFiles(prev => prev.map(f => 
          f.id === id 
            ? { 
                ...f, 
                state: { 
                  ...f.state,
                  progress, 
                  message: `Inserted ${inserted}/${records.length} records...` 
                } 
              }
            : f
        ));
      }

      // Success
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { 
              ...f, 
              state: { 
                status: 'complete', 
                progress: 100, 
                message: `Imported ${inserted} ${result.data!.type.replace('_', ' ')} records`,
                parsedData: {
                  type: result.data!.type,
                  rowCount: inserted,
                },
              } 
            }
          : f
      ));

      // Invalidate queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kingpins'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-clusters'] });
      queryClient.invalidateQueries({ queryKey: ['network-graph'] });
      
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { ...f, state: { status: 'error', progress: 0, message: error instanceof Error ? error.message : 'Unknown error' } }
          : f
      ));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleZoneClick = (type: string) => {
    fileInputRefs.current[type]?.click();
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getTypeIcon = (type: DataType) => {
    switch (type) {
      case 'suspects': return Users;
      case 'sim_cards': return Phone;
      case 'devices': return Smartphone;
      case 'mule_accounts': return CreditCard;
      case 'ip_addresses': return Globe;
      case 'fraud_clusters': return FileText;
      default: return FileText;
    }
  };

  const uploadZones = [
    { 
      type: 'suspects' as DataType, 
      label: 'Suspects', 
      desc: 'Name, alias, threat level', 
      icon: Users,
      color: 'destructive' 
    },
    { 
      type: 'sim_cards' as DataType, 
      label: 'SIM Cards', 
      desc: 'Phone numbers, IMSI', 
      icon: Phone,
      color: 'primary' 
    },
    { 
      type: 'devices' as DataType, 
      label: 'Devices', 
      desc: 'IMEI, device models', 
      icon: Smartphone,
      color: 'warning' 
    },
    { 
      type: 'mule_accounts' as DataType, 
      label: 'Bank Accounts', 
      desc: 'Account numbers, IFSC', 
      icon: CreditCard,
      color: 'success' 
    },
    { 
      type: 'ip_addresses' as DataType, 
      label: 'IP Addresses', 
      desc: 'IPs, VPN detection', 
      icon: Globe,
      color: 'secondary' 
    },
    { 
      type: 'fraud_clusters' as DataType, 
      label: 'Fraud Clusters', 
      desc: 'Criminal networks', 
      icon: FileText,
      color: 'accent' 
    },
  ];

  const completedCount = files.filter(f => f.state.status === 'complete').length;
  const totalRecords = files
    .filter(f => f.state.status === 'complete' && f.state.parsedData)
    .reduce((sum, f) => sum + (f.state.parsedData?.rowCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Data Upload</h3>
          <p className="text-sm text-muted-foreground">
            Upload CSV or Excel files to import fraud data
          </p>
        </div>
        {completedCount > 0 && (
          <div className="text-right">
            <p className="text-sm font-medium text-success">{completedCount} files imported</p>
            <p className="text-xs text-muted-foreground">{totalRecords.toLocaleString()} total records</p>
          </div>
        )}
      </div>

      {/* Main Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative glass-card p-8 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all duration-300"
      >
        <input
          type="file"
          ref={el => fileInputRefs.current['main'] = el}
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".csv,.xlsx,.xls"
          multiple
          className="hidden"
        />
        
        <div 
          className="text-center cursor-pointer"
          onClick={() => handleZoneClick('main')}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">
            Drop files here or click to upload
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Supports CSV and Excel files (.csv, .xlsx, .xls)
          </p>
          <p className="text-xs text-muted-foreground">
            Files are automatically detected based on column headers
          </p>
        </div>
      </motion.div>

      {/* Data Type Guide */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Supported Data Types
        </p>
        <div className="grid grid-cols-3 gap-3">
          {uploadZones.map((zone) => {
            const Icon = zone.icon;
            return (
              <div
                key={zone.type}
                className="glass-card p-3 rounded-lg border border-border/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{zone.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{zone.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Upload Progress ({files.length} files)
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {files.map((upload, index) => {
                const Icon = upload.state.parsedData 
                  ? getTypeIcon(upload.state.parsedData.type)
                  : FileSpreadsheet;
                  
                return (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      upload.state.status === 'complete' ? 'bg-success/20' :
                      upload.state.status === 'error' ? 'bg-destructive/20' :
                      'bg-primary/20'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        upload.state.status === 'complete' ? 'text-success' :
                        upload.state.status === 'error' ? 'text-destructive' :
                        'text-primary'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-mono text-foreground truncate">
                          {upload.file.name}
                        </p>
                        {upload.state.parsedData && (
                          <span className="text-xs text-muted-foreground">
                            {upload.state.parsedData.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-1.5">
                          <motion.div
                            className={`h-1.5 rounded-full ${
                              upload.state.status === 'complete' ? 'bg-success' :
                              upload.state.status === 'error' ? 'bg-destructive' :
                              'bg-primary'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${upload.state.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {upload.state.progress}%
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {upload.state.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {upload.state.status === 'complete' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : upload.state.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                      
                      <button
                        onClick={() => removeFile(upload.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample Format Info */}
      <div className="glass-card p-4 rounded-xl border border-border/30">
        <h4 className="text-sm font-medium text-foreground mb-3">Expected File Format</h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p><strong>Suspects:</strong> name, alias, location, threat_level, fraud_amount, threat_score</p>
          <p><strong>SIM Cards:</strong> phone_number, imsi, location, threat_level, is_active</p>
          <p><strong>Devices:</strong> imei, device_model, last_location, threat_level, is_active</p>
          <p><strong>Accounts:</strong> account_number, bank_name, ifsc_code, account_holder, is_frozen</p>
          <p><strong>IP Addresses:</strong> ip_address, location, isp, is_vpn, threat_level</p>
          <p><strong>Clusters:</strong> name, primary_location, estimated_fraud_amount, threat_level, status</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;
