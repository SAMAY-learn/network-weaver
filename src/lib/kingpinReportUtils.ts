import { supabase } from '@/integrations/supabase/client';
import { Kingpin } from '@/hooks/useKingpins';

interface LinkedData {
  simCards: Array<{ phone_number: string; location: string | null; is_active: boolean | null; threat_level: string | null }>;
  devices: Array<{ imei: string; device_model: string | null; last_location: string | null; is_active: boolean | null }>;
  muleAccounts: Array<{ account_number: string; bank_name: string | null; account_holder: string | null; is_frozen: boolean | null }>;
  ipAddresses: Array<{ ip_address: string; location: string | null; is_vpn: boolean | null; isp: string | null }>;
}

export const fetchLinkedData = async (suspectId: string): Promise<LinkedData> => {
  const [simCards, devices, muleAccounts, ipAddresses] = await Promise.all([
    supabase.from('sim_cards').select('phone_number, location, is_active, threat_level').eq('suspect_id', suspectId),
    supabase.from('devices').select('imei, device_model, last_location, is_active').eq('suspect_id', suspectId),
    supabase.from('mule_accounts').select('account_number, bank_name, account_holder, is_frozen').eq('suspect_id', suspectId),
    supabase.from('ip_addresses').select('ip_address, location, is_vpn, isp').eq('suspect_id', suspectId),
  ]);

  return {
    simCards: simCards.data || [],
    devices: devices.data || [],
    muleAccounts: muleAccounts.data || [],
    ipAddresses: ipAddresses.data || [],
  };
};

const getThreatColor = (score: number): string => {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#eab308';
  return '#22c55e';
};

export const generateKingpinReport = (kingpin: Kingpin, linkedData: LinkedData): string => {
  const reportDate = new Date().toLocaleString('en-IN', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  
  const initials = kingpin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const threatColor = getThreatColor(kingpin.threatScore);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Intelligence Report - ${kingpin.name}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; position: relative; }
    .classification { position: absolute; top: 12px; right: 12px; background: #dc2626; color: white; padding: 4px 12px; font-size: 11px; font-weight: bold; letter-spacing: 1px; border-radius: 2px; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.8; font-size: 13px; }
    .profile-section { display: flex; gap: 24px; padding: 24px; border-bottom: 1px solid #e2e8f0; }
    .avatar { width: 100px; height: 100px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: bold; flex-shrink: 0; }
    .profile-info { flex: 1; }
    .profile-info h2 { font-size: 22px; margin-bottom: 4px; }
    .alias { color: #64748b; font-family: monospace; margin-bottom: 8px; }
    .status-badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #dc2626; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .threat-gauge { text-align: center; padding: 12px; }
    .threat-score { font-size: 42px; font-weight: bold; color: ${threatColor}; }
    .threat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px; background: #f8fafc; }
    .stat-box { background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 28px; font-weight: bold; color: #6366f1; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .section { padding: 24px; border-bottom: 1px solid #e2e8f0; }
    .section-title { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 16px; background: #6366f1; border-radius: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
    .badge-active { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }
    .badge-frozen { background: #dbeafe; color: #2563eb; }
    .badge-vpn { background: #fef3c7; color: #d97706; }
    .footer { padding: 16px 24px; background: #f8fafc; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .info-item { display: flex; gap: 8px; }
    .info-label { color: #64748b; font-size: 12px; min-width: 100px; }
    .info-value { font-weight: 500; font-size: 13px; }
    .amount { color: #dc2626; font-weight: bold; font-size: 24px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="classification">CONFIDENTIAL</div>
      <h1>Intelligence Dossier</h1>
      <p>Criminal Intelligence Bureau • Case Reference: KP-${kingpin.id.slice(0, 8).toUpperCase()}</p>
    </div>

    <div class="profile-section">
      <div class="avatar">${initials}</div>
      <div class="profile-info">
        <h2>${kingpin.name}</h2>
        <div class="alias">Alias: ${kingpin.alias}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Location:</span>
            <span class="info-value">${kingpin.location}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="status-badge">${kingpin.status.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Assigned Officer:</span>
            <span class="info-value">${kingpin.assignedOfficer}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last Active:</span>
            <span class="info-value">${kingpin.lastActive}</span>
          </div>
        </div>
      </div>
      <div class="threat-gauge">
        <div class="threat-score">${kingpin.threatScore}</div>
        <div class="threat-label">Threat Score</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${kingpin.simCards}</div>
        <div class="stat-label">SIM Cards</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${kingpin.accounts}</div>
        <div class="stat-label">Mule Accounts</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${kingpin.devices}</div>
        <div class="stat-label">Devices</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${kingpin.connections}</div>
        <div class="stat-label">Network Links</div>
      </div>
    </div>

    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="section-title" style="margin-bottom: 0;">Fraud Assessment</div>
        <div class="amount">₹${kingpin.fraudAmount}</div>
      </div>
      <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #dc2626;">
        <p style="font-size: 13px; color: #991b1b;">Total estimated fraud amount linked to this suspect based on tracked transactions and case reports.</p>
      </div>
    </div>

    ${linkedData.simCards.length > 0 ? `
    <div class="section">
      <div class="section-title">Linked SIM Cards (${linkedData.simCards.length})</div>
      <table>
        <thead>
          <tr>
            <th>Phone Number</th>
            <th>Location</th>
            <th>Threat Level</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linkedData.simCards.map(sim => `
          <tr>
            <td style="font-family: monospace;">${sim.phone_number}</td>
            <td>${sim.location || 'Unknown'}</td>
            <td>${sim.threat_level?.toUpperCase() || 'LOW'}</td>
            <td><span class="badge ${sim.is_active ? 'badge-active' : 'badge-inactive'}">${sim.is_active ? 'Active' : 'Inactive'}</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${linkedData.devices.length > 0 ? `
    <div class="section">
      <div class="section-title">Tracked Devices (${linkedData.devices.length})</div>
      <table>
        <thead>
          <tr>
            <th>IMEI</th>
            <th>Model</th>
            <th>Last Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linkedData.devices.map(device => `
          <tr>
            <td style="font-family: monospace;">${device.imei}</td>
            <td>${device.device_model || 'Unknown'}</td>
            <td>${device.last_location || 'Unknown'}</td>
            <td><span class="badge ${device.is_active ? 'badge-active' : 'badge-inactive'}">${device.is_active ? 'Active' : 'Inactive'}</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${linkedData.muleAccounts.length > 0 ? `
    <div class="section">
      <div class="section-title">Mule Accounts (${linkedData.muleAccounts.length})</div>
      <table>
        <thead>
          <tr>
            <th>Account Number</th>
            <th>Bank</th>
            <th>Holder Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linkedData.muleAccounts.map(acc => `
          <tr>
            <td style="font-family: monospace;">${acc.account_number}</td>
            <td>${acc.bank_name || 'Unknown'}</td>
            <td>${acc.account_holder || 'Unknown'}</td>
            <td><span class="badge ${acc.is_frozen ? 'badge-frozen' : 'badge-active'}">${acc.is_frozen ? 'Frozen' : 'Active'}</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${linkedData.ipAddresses.length > 0 ? `
    <div class="section">
      <div class="section-title">IP Addresses (${linkedData.ipAddresses.length})</div>
      <table>
        <thead>
          <tr>
            <th>IP Address</th>
            <th>Location</th>
            <th>ISP</th>
            <th>VPN</th>
          </tr>
        </thead>
        <tbody>
          ${linkedData.ipAddresses.map(ip => `
          <tr>
            <td style="font-family: monospace;">${ip.ip_address}</td>
            <td>${ip.location || 'Unknown'}</td>
            <td>${ip.isp || 'Unknown'}</td>
            <td>${ip.is_vpn ? '<span class="badge badge-vpn">VPN Detected</span>' : 'No'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <div>Generated: ${reportDate}</div>
      <div>Report ID: RPT-${Date.now().toString(36).toUpperCase()}</div>
    </div>
  </div>
</body>
</html>
  `;
};

export const printKingpinReport = async (kingpin: Kingpin): Promise<void> => {
  const linkedData = await fetchLinkedData(kingpin.id);
  const reportHtml = generateKingpinReport(kingpin, linkedData);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
