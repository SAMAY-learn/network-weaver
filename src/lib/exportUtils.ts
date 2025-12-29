import * as XLSX from 'xlsx';

export interface ExportData {
  suspects: any[];
  cases: any[];
  clusters: any[];
}

// Format currency for Indian Rupees
export const formatINR = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

// Export to CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export to Excel
export const exportToExcel = (data: ExportData, filename: string) => {
  const workbook = XLSX.utils.book_new();

  // Suspects sheet
  if (data.suspects.length > 0) {
    const suspectsFormatted = data.suspects.map((s) => ({
      Name: s.name,
      Alias: s.alias || 'N/A',
      Location: s.location || 'Unknown',
      'Threat Level': s.threat_level?.toUpperCase() || 'LOW',
      'Threat Score': s.threat_score || 0,
      'Fraud Amount': s.fraud_amount || 0,
      'Last Active': s.last_active ? new Date(s.last_active).toLocaleDateString() : 'N/A',
      Notes: s.notes || '',
    }));
    const suspectsSheet = XLSX.utils.json_to_sheet(suspectsFormatted);
    XLSX.utils.book_append_sheet(workbook, suspectsSheet, 'Suspects');
  }

  // Cases sheet
  if (data.cases.length > 0) {
    const casesFormatted = data.cases.map((c) => ({
      'Case Number': c.case_number,
      Title: c.title,
      Status: c.status?.toUpperCase() || 'ACTIVE',
      Location: c.location || 'Unknown',
      'Fraud Amount': c.fraud_amount || 0,
      'Victim Count': c.victim_count || 0,
      'Reported Date': c.reported_date || 'N/A',
      Description: c.description || '',
    }));
    const casesSheet = XLSX.utils.json_to_sheet(casesFormatted);
    XLSX.utils.book_append_sheet(workbook, casesSheet, 'Cases');
  }

  // Clusters sheet
  if (data.clusters.length > 0) {
    const clustersFormatted = data.clusters.map((cl) => ({
      Name: cl.name,
      'Primary Location': cl.primary_location || 'Unknown',
      'Threat Level': cl.threat_level?.toUpperCase() || 'MEDIUM',
      Status: cl.status?.toUpperCase() || 'ACTIVE',
      'Estimated Fraud Amount': cl.estimated_fraud_amount || 0,
      Notes: cl.notes || '',
    }));
    const clustersSheet = XLSX.utils.json_to_sheet(clustersFormatted);
    XLSX.utils.book_append_sheet(workbook, clustersSheet, 'Fraud Clusters');
  }

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Generate PDF report content (returns HTML for printing)
export const generatePDFReport = (data: ExportData, metrics: any): string => {
  const reportDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CrimeNet Intelligence Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #1a1a2e; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; }
        h2 { color: #16213e; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .date { color: #666; font-size: 14px; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: bold; color: #0ea5e9; }
        .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #1a1a2e; color: white; }
        tr:nth-child(even) { background: #f8f9fa; }
        .threat-high { color: #ef4444; font-weight: bold; }
        .threat-medium { color: #f59e0b; font-weight: bold; }
        .threat-low { color: #22c55e; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CrimeNet Intelligence Report</h1>
        <span class="date">Generated: ${reportDate}</span>
      </div>

      <h2>Executive Summary</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${metrics?.totalSuspects || 0}</div>
          <div class="metric-label">Total Suspects</div>
        </div>
        <div class="metric">
          <div class="metric-value">${metrics?.highThreat || 0}</div>
          <div class="metric-label">High Threat</div>
        </div>
        <div class="metric">
          <div class="metric-value">${metrics?.activeCases || 0}</div>
          <div class="metric-label">Active Cases</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatINR(metrics?.totalFraudAmount || 0)}</div>
          <div class="metric-label">Total Fraud</div>
        </div>
      </div>

      <h2>High-Priority Suspects</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Alias</th>
            <th>Location</th>
            <th>Threat Level</th>
            <th>Fraud Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.suspects
            .filter((s) => s.threat_level === 'high')
            .slice(0, 10)
            .map(
              (s) => `
              <tr>
                <td>${s.name}</td>
                <td>${s.alias || 'N/A'}</td>
                <td>${s.location || 'Unknown'}</td>
                <td class="threat-${s.threat_level}">${s.threat_level?.toUpperCase()}</td>
                <td>${formatINR(s.fraud_amount || 0)}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>

      <h2>Active Cases</h2>
      <table>
        <thead>
          <tr>
            <th>Case Number</th>
            <th>Title</th>
            <th>Status</th>
            <th>Location</th>
            <th>Fraud Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.cases
            .filter((c) => c.status === 'active')
            .slice(0, 10)
            .map(
              (c) => `
              <tr>
                <td>${c.case_number}</td>
                <td>${c.title}</td>
                <td>${c.status?.toUpperCase()}</td>
                <td>${c.location || 'Unknown'}</td>
                <td>${formatINR(c.fraud_amount || 0)}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>

      <h2>Fraud Clusters</h2>
      <table>
        <thead>
          <tr>
            <th>Cluster Name</th>
            <th>Primary Location</th>
            <th>Threat Level</th>
            <th>Estimated Fraud</th>
          </tr>
        </thead>
        <tbody>
          ${data.clusters
            .slice(0, 10)
            .map(
              (cl) => `
              <tr>
                <td>${cl.name}</td>
                <td>${cl.primary_location || 'Unknown'}</td>
                <td class="threat-${cl.threat_level}">${cl.threat_level?.toUpperCase()}</td>
                <td>${formatINR(cl.estimated_fraud_amount || 0)}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>CrimeNet Intelligence Engine - Jharkhand Cyber Cell</p>
        <p>This report is confidential and intended for official use only.</p>
      </div>
    </body>
    </html>
  `;
};

export const printPDFReport = (data: ExportData, metrics: any) => {
  const htmlContent = generatePDFReport(data, metrics);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
