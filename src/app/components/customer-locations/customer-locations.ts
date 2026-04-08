import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface LogEntry {
  timestamp: Date;
  url: string;
  port: number;
  status: 'success' | 'fail';
}

interface CustomerConnector {
  id: string;
  name: string;
  type: string;
  template: string;
  hostedApps: number;
  hostedAppNames: string[];
  status: 'Online' | 'Degraded' | 'Offline';
  uptime: string;
  lastConnected: string;
  allocation: string;
}

interface DeployedEntry {
  id: string;
  label: string;
  token: string;
  connection: 'Online' | 'Offline';
  enrollmentStatus: 'Enrolled' | 'Pending' | 'Expired Token';
  uptime: string;
  activated: string;
  lastConnected: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: CustomerConnector[];
}

@Component({
  selector: 'app-customer-locations',
  imports: [RouterLink, FormsModule],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  showAddConnectorModal = false;
  showConnectorDrawer = false;
  showDeployModal = false;
  activeConnector: CustomerConnector | null = null;
  connectorMenuOpenId: string | null = null;

  // Logs view
  showLogsView = false;
  activeLogsEntry: DeployedEntry | null = null;
  logsTimeframe: '24h' | '7d' | '30d' = '7d';
  logsStatusFilter: 'all' | 'success' | 'fail' = 'all';
  logsSearch = '';
  private allLogs: LogEntry[] = [];

  get filteredLogs(): LogEntry[] {
    const cutoff = new Date();
    if (this.logsTimeframe === '24h') cutoff.setHours(cutoff.getHours() - 24);
    else if (this.logsTimeframe === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);
    return this.allLogs.filter(l => {
      if (l.timestamp < cutoff) return false;
      if (this.logsStatusFilter !== 'all' && l.status !== this.logsStatusFilter) return false;
      if (this.logsSearch) {
        const q = this.logsSearch.toLowerCase();
        return l.url.toLowerCase().includes(q) || String(l.port).includes(q);
      }
      return true;
    });
  }

  openLogs(entry: DeployedEntry): void {
    this.connectorMenuOpenId = null;
    this.activeLogsEntry = entry;
    this.logsTimeframe = '7d';
    this.logsStatusFilter = 'all';
    this.logsSearch = '';
    this.allLogs = this.generateLogs(entry.id);
    this.showLogsView = true;
  }

  closeLogs(): void {
    this.showLogsView = false;
    this.activeLogsEntry = null;
  }

  private generateLogs(seed: string): LogEntry[] {
    const urls = [
      'app.salesforce.com', 'mail.google.com', 'github.com',
      'api.internal.corp', 'jira.company.io', 'confluence.company.io',
      'vpn.corp.net', 's3.amazonaws.com', 'login.microsoftonline.com',
      'slack.com', 'zoom.us', 'drive.google.com',
    ];
    const ports = [443, 443, 443, 8443, 80, 22, 3389, 5432, 8080];
    const hash = (s: string) => s.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    const rand = (n: number, i: number) => Math.abs(hash(seed + i)) % n;
    const entries: LogEntry[] = [];
    const now = Date.now();
    for (let i = 0; i < 120; i++) {
      const minsAgo = rand(43200, i * 3) + i * 2;
      entries.push({
        timestamp: new Date(now - minsAgo * 60000),
        url: urls[rand(urls.length, i * 7)],
        port: ports[rand(ports.length, i * 13)],
        status: rand(10, i * 17) < 8 ? 'success' : 'fail',
      });
    }
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  formatLogTimestamp(d: Date): string {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  drawerEntries: DeployedEntry[] = [
    { id: 'de-1', label: "John Smith's Mobile",  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', connection: 'Online',  enrollmentStatus: 'Enrolled',       uptime: '99%', activated: 'Jan 3, 2026',  lastConnected: '2 hrs ago' },
    { id: 'de-2', label: "Sarah Lee's Laptop",   token: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', connection: 'Offline', enrollmentStatus: 'Pending',         uptime: '--',  activated: '--',           lastConnected: '--'        },
    { id: 'de-3', label: "Marcus Webb's Desktop", token: 'c3d4e5f6-a7b8-9012-cdef-123456789012', connection: 'Offline', enrollmentStatus: 'Expired Token',   uptime: '--',  activated: 'Dec 10, 2025', lastConnected: '14 days ago' },
  ];

  drawerSearch = '';
  drawerConnectionFilter: 'all' | 'Online' | 'Offline' = 'all';
  drawerStatusFilter: 'all' | 'Enrolled' | 'Pending' | 'Expired Token' = 'all';

  get filteredDrawerEntries(): DeployedEntry[] {
    return this.drawerEntries.filter(e => {
      if (this.drawerConnectionFilter !== 'all' && e.connection !== this.drawerConnectionFilter) return false;
      if (this.drawerStatusFilter !== 'all' && e.enrollmentStatus !== this.drawerStatusFilter) return false;
      if (this.drawerSearch) {
        const q = this.drawerSearch.toLowerCase();
        return e.label.toLowerCase().includes(q) || e.token.toLowerCase().includes(q);
      }
      return true;
    });
  }

  deployLabel = '';
  deployEmail = '';
  deployToken = '';
  tokenCopied = false;
  tokenEmailSent = false;

  openDeployModal(): void {
    this.deployLabel = '';
    this.deployEmail = '';
    this.deployToken = '';
    this.tokenCopied = false;
    this.tokenEmailSent = false;
    this.showDeployModal = true;
  }

  generateToken(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.deployToken = `${segment(8)}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(12)}`;
    this.tokenCopied = false;
  }

  copyToken(): void {
    navigator.clipboard.writeText(this.deployToken);
    this.tokenCopied = true;
    setTimeout(() => this.tokenCopied = false, 2000);
  }

  emailToken(): void {
    this.tokenEmailSent = true;
    setTimeout(() => this.tokenEmailSent = false, 2000);
  }

  confirmDeploy(): void {
    if (!this.deployLabel.trim() || !this.deployEmail.trim()) return;
    this.drawerEntries.push({
      id: 'de-' + Date.now(),
      label: this.deployLabel,
      token: '',
      connection: 'Offline',
      enrollmentStatus: 'Pending',
      uptime: '--',
      activated: '--',
      lastConnected: '--',
    });
    this.showDeployModal = false;
  }
  rowMenuOpenId: string | null = null;
  hostedAppsOpenId: string | null = null;
  activeLocationId: string | null = null;
  pausedConnectors = new Set<string>();

  connectorName = '';
  connectorType = '';
  selectedTemplate = 'No Template';
  saveAsTemplate = false;

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type'];
  expanded: { [id: string]: boolean } = { 'cloc-1': true };

  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  locations: CustomerLocation[] = [
    {
      id: 'cloc-1',
      name: 'Riverside Main Clinic',
      address: '789 Medical Plaza',
      addressSub: 'Portland, OR 97201',
      licensesAllocated: 20,
      connectors: [
        { id: 'c1', name: 'Chicago Gateway 1', type: 'Gateway',    template: '--', hostedApps: 3, hostedAppNames: ['Patient Records Portal', 'Scheduling System', 'Imaging Viewer'],   status: 'Online',   uptime: '--', lastConnected: '--', allocation: '0/25' },
        { id: 'c2', name: 'Chicago Gateway 2', type: 'Gateway',    template: '--', hostedApps: 2, hostedAppNames: ['Lab Results Portal', 'Pharmacy System'],                           status: 'Online',   uptime: '--', lastConnected: '--', allocation: '0/10' },
        { id: 'c3', name: 'Chicago Device 1',  type: 'Device',     template: '--', hostedApps: 2, hostedAppNames: ['Remote Desktop', 'File Share'],                                   status: 'Offline',  uptime: '--', lastConnected: '--', allocation: '0/30' },
      ],
    },
    {
      id: 'cloc-2',
      name: 'Riverside Urgent Care',
      address: '456 Healthcare Way',
      addressSub: 'Beaverton, OR 97005',
      licensesAllocated: 15,
      connectors: [
        { id: 'c7', name: 'Austin Host 3',          type: 'Device',     template: '--', hostedApps: 2, hostedAppNames: ['Patient Records Portal', 'Telehealth Platform'],                 status: 'Degraded', uptime: '--', lastConnected: '--', allocation: '22/25' },
        { id: 'c8', name: 'New York Clientless 1',  type: 'Clientless', template: '--', hostedApps: 3, hostedAppNames: ['Web Portal', 'Patient Records Portal', 'Scheduling System'], status: 'Online',   uptime: '--', lastConnected: '--', allocation: '9/10'  },
      ],
    },
    {
      id: 'cloc-3',
      name: 'Riverside Admin Office',
      address: '123 Business Center',
      addressSub: 'Portland, OR 97201',
      licensesAllocated: 5,
      connectors: [
        { id: 'c12', name: 'London Gateway 1', type: 'Gateway', template: '--', hostedApps: 2, hostedAppNames: ['Patient Records Portal', 'Imaging Viewer'], status: 'Online',  uptime: '--', lastConnected: '--', allocation: '5/25' },
        { id: 'c32', name: 'London Device 1',  type: 'Device',  template: '--', hostedApps: 1, hostedAppNames: ['Remote Desktop'],                        status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/10' },
      ],
    },
  ];

  locationAllocation(loc: CustomerLocation): string {
    let used = 0, total = 0;
    for (const conn of loc.connectors) {
      const [u, t] = conn.allocation.split('/').map(Number);
      used += u;
      total += t;
    }
    return `${used}/${total}`;
  }

  locationUsagePct(loc: CustomerLocation): number {
    let used = 0, total = 0;
    for (const conn of loc.connectors) {
      const [u, t] = conn.allocation.split('/').map(Number);
      used += u;
      total += t;
    }
    return total > 0 ? used / total : 0;
  }

  get totalLicenses(): number {
    return this.locations.reduce((sum, loc) => sum + loc.licensesAllocated, 0);
  }

  get usedLicenses(): number {
    return this.locations.reduce((sum, loc) => sum + loc.connectors.length, 0);
  }

  get availableLicenses(): number {
    return this.totalLicenses - this.usedLicenses;
  }

  get licenseWarning(): boolean {
    return this.totalLicenses > 0 && this.usedLicenses / this.totalLicenses >= 0.8;
  }

  get licenseUsagePct(): number {
    return this.totalLicenses > 0 ? Math.round((this.usedLicenses / this.totalLicenses) * 100) : 0;
  }

  get activeLocation(): CustomerLocation | null {
    return this.locations.find(l => l.id === this.activeLocationId) ?? null;
  }

  connectorTypeColor(type: string): string {
    const map: { [key: string]: string } = {
      'Device': 'bg-blue-100 text-blue-700',
      'Gateway': 'bg-green-100 text-green-700',
      'Clientless': 'bg-purple-100 text-purple-700',
      'SDK Embedded': 'bg-orange-100 text-orange-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  toggleExpand(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  toggleConnectorPause(id: string): void {
    if (this.pausedConnectors.has(id)) {
      this.pausedConnectors.delete(id);
    } else {
      this.pausedConnectors.add(id);
    }
  }

  isConnectorPaused(id: string): boolean {
    return this.pausedConnectors.has(id);
  }

  openConnectorDrawer(conn: CustomerConnector): void {
    this.activeConnector = conn;
    this.drawerSearch = '';
    this.drawerConnectionFilter = 'all';
    this.drawerStatusFilter = 'all';
    this.showConnectorDrawer = true;
  }

  closeConnectorDrawer(): void {
    this.showConnectorDrawer = false;
    this.activeConnector = null;
    this.showLogsView = false;
    this.activeLogsEntry = null;
  }

  openAddConnector(locationId: string): void {
    this.activeLocationId = locationId;
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.showAddConnectorModal = true;
  }

  closeAddConnector(): void {
    this.showAddConnectorModal = false;
    this.activeLocationId = null;
  }
}
