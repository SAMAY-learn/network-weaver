import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseFile, ParsedData, DataType } from '@/lib/fileParser';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface UploadState {
  status: 'idle' | 'parsing' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
  parsedData?: ParsedData;
}

export const useDataUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const queryClient = useQueryClient();

  const uploadToDatabase = async (data: ParsedData): Promise<{ success: boolean; inserted: number; error?: string }> => {
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < data.records.length; i += batchSize) {
      const batch = data.records.slice(i, i + batchSize);
      
      // Add required fields based on data type
      const preparedBatch = batch.map(record => {
        const prepared = { ...record };
        
        // Ensure required fields exist
        switch (data.type) {
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
      
      const { error } = await supabase.from(data.type).insert(preparedBatch as never[]);
      
      if (error) {
        console.error('Insert error:', error);
        return { success: false, inserted, error: error.message };
      }
      
      inserted += batch.length;
      
      // Update progress
      const progress = Math.round((i + batch.length) / data.records.length * 100);
      setUploadState(prev => ({
        ...prev,
        progress,
        message: `Inserting records... ${inserted}/${data.records.length}`,
      }));
    }
    
    return { success: true, inserted };
  };

  const processFile = async (file: File): Promise<boolean> => {
    setUploadState({
      status: 'parsing',
      progress: 10,
      message: 'Parsing file...',
    });

    try {
      // Parse the file
      const result = await parseFile(file);
      
      if (!result.success || !result.data) {
        setUploadState({
          status: 'error',
          progress: 0,
          message: result.error || 'Failed to parse file',
        });
        toast({
          variant: 'destructive',
          title: 'Parse Error',
          description: result.error || 'Failed to parse file',
        });
        return false;
      }
      
      setUploadState({
        status: 'parsing',
        progress: 30,
        message: `Detected ${result.data.rowCount} ${result.data.type.replace('_', ' ')} records`,
        parsedData: result.data,
      });

      // Upload to database
      setUploadState(prev => ({
        ...prev,
        status: 'uploading',
        progress: 40,
        message: 'Uploading to database...',
      }));

      const uploadResult = await uploadToDatabase(result.data);
      
      if (!uploadResult.success) {
        setUploadState({
          status: 'error',
          progress: 0,
          message: uploadResult.error || 'Failed to upload data',
        });
        toast({
          variant: 'destructive',
          title: 'Upload Error',
          description: uploadResult.error || 'Failed to upload data',
        });
        return false;
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kingpins'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-clusters'] });
      queryClient.invalidateQueries({ queryKey: ['network-graph'] });

      setUploadState({
        status: 'complete',
        progress: 100,
        message: `Successfully imported ${uploadResult.inserted} ${result.data.type.replace('_', ' ')} records`,
        parsedData: result.data,
      });

      toast({
        title: 'Upload Complete',
        description: `Successfully imported ${uploadResult.inserted} ${result.data.type.replace('_', ' ')} records`,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadState({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return false;
    }
  };

  const resetState = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  return {
    uploadState,
    processFile,
    resetState,
  };
};
