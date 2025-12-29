import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type DataType = 'suspects' | 'sim_cards' | 'devices' | 'mule_accounts' | 'ip_addresses' | 'fraud_clusters';

export interface ParsedData {
  type: DataType;
  records: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedData;
  error?: string;
}

// Column mapping for different data types
const columnMappings: Record<DataType, Record<string, string>> = {
  suspects: {
    name: 'name',
    suspect_name: 'name',
    full_name: 'name',
    alias: 'alias',
    nickname: 'alias',
    location: 'location',
    address: 'location',
    threat_level: 'threat_level',
    threat: 'threat_level',
    risk_level: 'threat_level',
    fraud_amount: 'fraud_amount',
    amount: 'fraud_amount',
    threat_score: 'threat_score',
    score: 'threat_score',
    notes: 'notes',
    remarks: 'notes',
  },
  sim_cards: {
    phone_number: 'phone_number',
    phone: 'phone_number',
    mobile: 'phone_number',
    number: 'phone_number',
    imsi: 'imsi',
    location: 'location',
    threat_level: 'threat_level',
    is_active: 'is_active',
    active: 'is_active',
    status: 'is_active',
  },
  devices: {
    imei: 'imei',
    device_id: 'imei',
    device_model: 'device_model',
    model: 'device_model',
    last_location: 'last_location',
    location: 'last_location',
    threat_level: 'threat_level',
    is_active: 'is_active',
    active: 'is_active',
  },
  mule_accounts: {
    account_number: 'account_number',
    account_no: 'account_number',
    account: 'account_number',
    bank_name: 'bank_name',
    bank: 'bank_name',
    ifsc_code: 'ifsc_code',
    ifsc: 'ifsc_code',
    account_holder: 'account_holder',
    holder_name: 'account_holder',
    name: 'account_holder',
    is_frozen: 'is_frozen',
    frozen: 'is_frozen',
    threat_level: 'threat_level',
    total_transactions: 'total_transactions',
    transactions: 'total_transactions',
  },
  ip_addresses: {
    ip_address: 'ip_address',
    ip: 'ip_address',
    address: 'ip_address',
    location: 'location',
    isp: 'isp',
    provider: 'isp',
    is_vpn: 'is_vpn',
    vpn: 'is_vpn',
    threat_level: 'threat_level',
  },
  fraud_clusters: {
    name: 'name',
    cluster_name: 'name',
    primary_location: 'primary_location',
    location: 'primary_location',
    estimated_fraud_amount: 'estimated_fraud_amount',
    fraud_amount: 'estimated_fraud_amount',
    amount: 'estimated_fraud_amount',
    threat_level: 'threat_level',
    status: 'status',
    notes: 'notes',
  },
};

// Detect data type from columns
export const detectDataType = (columns: string[]): DataType | null => {
  const lowerColumns = columns.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  
  // Check for unique identifiers
  if (lowerColumns.some(c => c.includes('imei'))) return 'devices';
  if (lowerColumns.some(c => c.includes('phone') || c.includes('mobile') || c.includes('imsi'))) return 'sim_cards';
  if (lowerColumns.some(c => c.includes('account') || c.includes('ifsc') || c.includes('bank'))) return 'mule_accounts';
  if (lowerColumns.some(c => c.includes('ip') && (c.includes('address') || c === 'ip'))) return 'ip_addresses';
  if (lowerColumns.some(c => c.includes('cluster'))) return 'fraud_clusters';
  if (lowerColumns.some(c => c.includes('suspect') || c.includes('alias') || c.includes('threat_score'))) return 'suspects';
  
  // Default to suspects if contains name
  if (lowerColumns.some(c => c === 'name' || c.includes('suspect'))) return 'suspects';
  
  return null;
};

// Map columns to database fields
const mapColumns = (record: Record<string, unknown>, dataType: DataType): Record<string, unknown> => {
  const mapping = columnMappings[dataType];
  const mapped: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dbField = mapping[normalizedKey];
    if (dbField && value !== undefined && value !== null && value !== '') {
      mapped[dbField] = value;
    }
  }
  
  return mapped;
};

// Normalize values for database
const normalizeRecord = (record: Record<string, unknown>, dataType: DataType): Record<string, unknown> => {
  const normalized = mapColumns(record, dataType);
  
  // Handle threat_level enum
  if (normalized.threat_level) {
    const level = String(normalized.threat_level).toLowerCase();
    if (level.includes('high') || level === 'h' || level === '3') {
      normalized.threat_level = 'high';
    } else if (level.includes('medium') || level.includes('med') || level === 'm' || level === '2') {
      normalized.threat_level = 'medium';
    } else {
      normalized.threat_level = 'low';
    }
  }
  
  // Handle status enum for clusters
  if (normalized.status && dataType === 'fraud_clusters') {
    const status = String(normalized.status).toLowerCase();
    if (status.includes('active')) {
      normalized.status = 'active';
    } else if (status.includes('monitor')) {
      normalized.status = 'monitoring';
    } else if (status.includes('contain')) {
      normalized.status = 'contained';
    } else if (status.includes('close')) {
      normalized.status = 'closed';
    }
  }
  
  // Handle boolean values
  if (normalized.is_active !== undefined) {
    normalized.is_active = ['true', '1', 'yes', 'active', 'y'].includes(
      String(normalized.is_active).toLowerCase()
    );
  }
  if (normalized.is_frozen !== undefined) {
    normalized.is_frozen = ['true', '1', 'yes', 'frozen', 'y'].includes(
      String(normalized.is_frozen).toLowerCase()
    );
  }
  if (normalized.is_vpn !== undefined) {
    normalized.is_vpn = ['true', '1', 'yes', 'vpn', 'y'].includes(
      String(normalized.is_vpn).toLowerCase()
    );
  }
  
  // Handle numeric values
  if (normalized.fraud_amount) {
    const amount = String(normalized.fraud_amount).replace(/[^0-9.]/g, '');
    normalized.fraud_amount = parseFloat(amount) || 0;
  }
  if (normalized.estimated_fraud_amount) {
    const amount = String(normalized.estimated_fraud_amount).replace(/[^0-9.]/g, '');
    normalized.estimated_fraud_amount = parseFloat(amount) || 0;
  }
  if (normalized.threat_score) {
    normalized.threat_score = parseInt(String(normalized.threat_score)) || 0;
  }
  if (normalized.total_transactions) {
    normalized.total_transactions = parseFloat(String(normalized.total_transactions)) || 0;
  }
  
  return normalized;
};

// Parse CSV file
export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            error: `CSV parsing error: ${results.errors[0].message}`,
          });
          return;
        }
        
        const columns = results.meta.fields || [];
        const dataType = detectDataType(columns);
        
        if (!dataType) {
          resolve({
            success: false,
            error: 'Could not detect data type from columns. Please ensure the file has recognizable column headers.',
          });
          return;
        }
        
        const records = (results.data as Record<string, unknown>[]).map(
          record => normalizeRecord(record, dataType)
        ).filter(record => Object.keys(record).length > 0);
        
        resolve({
          success: true,
          data: {
            type: dataType,
            records,
            columns,
            rowCount: records.length,
          },
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: `Failed to parse CSV: ${error.message}`,
        });
      },
    });
  });
};

// Parse Excel file
export const parseExcel = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            error: 'Excel file appears to be empty.',
          });
          return;
        }
        
        const columns = Object.keys(jsonData[0]);
        const dataType = detectDataType(columns);
        
        if (!dataType) {
          resolve({
            success: false,
            error: 'Could not detect data type from columns. Please ensure the file has recognizable column headers.',
          });
          return;
        }
        
        const records = jsonData.map(
          record => normalizeRecord(record, dataType)
        ).filter(record => Object.keys(record).length > 0);
        
        resolve({
          success: true,
          data: {
            type: dataType,
            records,
            columns,
            rowCount: records.length,
          },
        });
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file.',
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Main parse function
export const parseFile = async (file: File): Promise<ParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (['xlsx', 'xls'].includes(extension || '')) {
    return parseExcel(file);
  } else {
    return {
      success: false,
      error: 'Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls).',
    };
  }
};
