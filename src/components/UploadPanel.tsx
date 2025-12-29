import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Phone, CreditCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface FileUpload {
  name: string;
  type: 'cdr' | 'fir' | 'transaction';
  status: UploadStatus;
  progress: number;
}

const UploadPanel = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const simulateUpload = (fileName: string, type: 'cdr' | 'fir' | 'transaction') => {
    const newFile: FileUpload = {
      name: fileName,
      type,
      status: 'uploading',
      progress: 0,
    };
    
    setFiles(prev => [...prev, newFile]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.name === fileName ? { ...f, status: 'complete', progress: 100 } : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.name === fileName ? { ...f, progress } : f
        ));
      }
    }, 300);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: 'cdr' | 'fir' | 'transaction') => {
    e.preventDefault();
    const fileName = `${type.toUpperCase()}_${Date.now()}.csv`;
    simulateUpload(fileName, type);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const getTypeIcon = (type: 'cdr' | 'fir' | 'transaction') => {
    switch (type) {
      case 'cdr': return Phone;
      case 'fir': return FileText;
      case 'transaction': return CreditCard;
    }
  };

  const uploadZones = [
    { type: 'cdr' as const, label: 'Call Detail Records', desc: 'Upload CDR logs', color: 'primary' },
    { type: 'fir' as const, label: 'FIR / Complaints', desc: 'Police reports & complaints', color: 'warning' },
    { type: 'transaction' as const, label: 'Transaction Data', desc: 'Bank & UPI records', color: 'success' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Data Ingestion</h3>
          <p className="text-sm text-muted-foreground">Upload raw police datasets for analysis</p>
        </div>
        <Button 
          variant="cyber" 
          onClick={handleAnalyze}
          disabled={files.length === 0 || isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <span>🧠</span>
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {uploadZones.map((zone) => {
          const Icon = getTypeIcon(zone.type);
          return (
            <motion.div
              key={zone.type}
              whileHover={{ scale: 1.02 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, zone.type)}
              onClick={() => simulateUpload(`${zone.type.toUpperCase()}_sample.csv`, zone.type)}
              className="glass-card p-4 rounded-xl border border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-all duration-300 text-center"
            >
              <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-${zone.color}/10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${zone.color}`} />
              </div>
              <p className="text-sm font-medium text-foreground">{zone.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{zone.desc}</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                <Upload className="w-3 h-3" />
                Drag & drop or click
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Uploaded Files ({files.length})
            </p>
            {files.map((file, index) => {
              const Icon = getTypeIcon(file.type);
              return (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{file.name}</p>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                      <motion.div
                        className="bg-primary h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  {file.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : file.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Status */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 rounded-xl border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Gemini AI Processing</p>
                <p className="text-xs text-muted-foreground">Extracting entities & mapping relationships...</p>
              </div>
              <div className="text-xs font-mono text-primary">~2 min</div>
            </div>
            <div className="mt-3 space-y-1.5">
              {['Parsing CDR records...', 'Extracting phone numbers...', 'Mapping SIM connections...'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle2 className={`w-3 h-3 ${i < 2 ? 'text-success' : 'text-muted-foreground'}`} />
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPanel;
