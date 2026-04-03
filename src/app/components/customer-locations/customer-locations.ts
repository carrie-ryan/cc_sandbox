import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CustomerConnector {
  id: string;
  name: string;
  type: string;
  template: string;
  hostedApps: number;
  status: 'Online' | 'Degraded' | 'Offline';
  uptime: string;
  lastConnected: string;
  allocation: string;
}

interface DeployedEntry {
  id: string;
  label: string;
  token: string;
  status: 'Active' | 'Pending';
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

  drawerEntries: DeployedEntry[] = [
    { id: 'de-1', label: "John Smith's Mobile", token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', status: 'Active',  uptime: '99%', activated: 'Jan 3, 2026',  lastConnected: '2 hrs ago' },
    { id: 'de-2', label: "Sarah Lee's Laptop",  token: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', status: 'Pending', uptime: '--',  activated: '--',           lastConnected: '--'        },
  ];

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
    if (!this.deployToken) return;
    if (this.deployEmail) this.emailToken();
    this.drawerEntries.push({
      id: 'de-' + Date.now(),
      label: this.deployLabel || 'Unnamed Device',
      token: this.deployToken,
      status: 'Pending',
      uptime: '--',
      activated: '--',
      lastConnected: '--',
    });
    this.showDeployModal = false;
  }
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
        { id: 'c1', name: 'Mobile Unit',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/25' },
        { id: 'c2', name: 'Ticket Printer', type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/10' },
        { id: 'c3', name: 'Workstation',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/30' },
        { id: 'c4', name: 'Main Gateway',   type: 'Gateway', template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/5'  },
      ],
    },
    {
      id: 'cloc-2',
      name: 'Riverside Urgent Care',
      address: '456 Healthcare Way',
      addressSub: 'Beaverton, OR 97005',
      licensesAllocated: 15,
      connectors: [
        { id: 'c7',  name: 'Mobile Unit',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '22/25' },
        { id: 'c8',  name: 'Ticket Printer', type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '9/10'  },
        { id: 'c9',  name: 'Workstation',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '25/30' },
        { id: 'c10', name: 'Main Gateway',   type: 'Gateway', template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '4/5'   },
      ],
    },
    {
      id: 'cloc-3',
      name: 'Riverside Admin Office',
      address: '123 Business Center',
      addressSub: 'Portland, OR 97201',
      licensesAllocated: 5,
      connectors: [
        { id: 'c12', name: 'Mobile Unit',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '5/25'  },
        { id: 'c32', name: 'Ticket Printer', type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '0/10'  },
        { id: 'c33', name: 'Workstation',    type: 'Device',  template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '22/30' },
        { id: 'c34', name: 'Main Gateway',   type: 'Gateway', template: '--', hostedApps: 0, status: 'Offline', uptime: '--', lastConnected: '--', allocation: '1/5'   },
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
    this.showConnectorDrawer = true;
  }

  closeConnectorDrawer(): void {
    this.showConnectorDrawer = false;
    this.activeConnector = null;
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
