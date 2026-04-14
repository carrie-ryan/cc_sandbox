import { Component, ElementRef, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LogEntry, generateLogs, formatLogTimestamp, filterLogs } from '../../utils/log.utils';

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
  imports: [RouterLink, FormsModule, NgTemplateOutlet],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  private readonly el = inject(ElementRef);
  private previouslyFocusedEl: HTMLElement | null = null;

  get isAnyModalOpen(): boolean {
    return this.showConnectorDrawer || this.showDeployModal || this.showBulkUploadModal || this.showAddConnectorModal;
  }

  private saveFocus(): void {
    this.previouslyFocusedEl = document.activeElement as HTMLElement;
  }

  private saveActionMenuTrigger(connName: string): void {
    // The menu item being clicked is about to be removed from the DOM when the
    // dropdown closes. Save the stable three-dot button instead so focus can
    // return to it after the modal/drawer closes.
    const btn = this.el.nativeElement.querySelector(`[aria-label="Actions for ${connName}"]`) as HTMLElement | null;
    this.previouslyFocusedEl = btn ?? document.activeElement as HTMLElement;
  }

  private restoreFocus(): void {
    // Defer focus() past Angular's change detection cycle so the [attr.inert]
    // binding on the main content div is removed before we attempt to focus.
    // Calling focus() on an element inside an inert subtree is a silent no-op.
    const target = this.previouslyFocusedEl;
    this.previouslyFocusedEl = null;
    setTimeout(() => target?.focus());
  }

  private focusFirstInDialog(): void {
    setTimeout(() => {
      const dialog = this.el.nativeElement.parentElement?.querySelector('[role="dialog"]') as HTMLElement | null;
      if (!dialog) return;
      const first = dialog.querySelector(
        'button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      first?.focus();
    }, 50);
  }

  showAddConnectorModal = false;
  showConnectorDrawer = false;
  showDeployModal = false;
  showBulkUploadModal = false;
  bulkUploadConnector: CustomerConnector | null = null;
  bulkUploadStep: 'upload' | 'preview' = 'upload';
  bulkUploadFileName = '';
  bulkUploadPreviewRows: Array<{ label: string; email: string }> = [];
  bulkUploadError = '';
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
    return filterLogs(this.allLogs, this.logsTimeframe, this.logsStatusFilter, this.logsSearch);
  }

  private logsEntryLabel: string | null = null;

  openLogs(entry: DeployedEntry): void {
    this.logsEntryLabel = entry.label;
    this.connectorMenuOpenId = null;
    this.activeLogsEntry = entry;
    this.logsTimeframe = '7d';
    this.logsStatusFilter = 'all';
    this.logsSearch = '';
    this.allLogs = generateLogs(entry.id);
    this.showLogsView = true;
    setTimeout(() => {
      const dialog = this.el.nativeElement.parentElement?.querySelector('[role="dialog"]') as HTMLElement | null;
      const backBtn = dialog?.querySelector('[aria-label="Back to identities"]') as HTMLElement | null;
      backBtn?.focus();
    }, 50);
  }

  closeLogs(): void {
    this.showLogsView = false;
    this.activeLogsEntry = null;
    const label = this.logsEntryLabel;
    this.logsEntryLabel = null;
    setTimeout(() => {
      const dialog = this.el.nativeElement.parentElement?.querySelector('[role="dialog"]') as HTMLElement | null;
      const trigger = dialog?.querySelector(`[aria-label="Actions for ${label}"]`) as HTMLElement | null;
      trigger?.focus();
    }, 50);
  }

  formatLogTimestamp = formatLogTimestamp;

  drawerEntries: DeployedEntry[] = [
    { id: 'de-1', label: "John Smith's Mobile",  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', connection: 'Online',  enrollmentStatus: 'Enrolled',       uptime: '99%', activated: 'Jan 3, 2026',  lastConnected: '2 hrs ago' },
    { id: 'de-2', label: "Sarah Lee's Laptop",   token: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', connection: 'Offline', enrollmentStatus: 'Pending',         uptime: '--',  activated: '--',           lastConnected: '--'        },
    { id: 'de-3', label: "Marcus Webb's Desktop", token: 'c3d4e5f6-a7b8-9012-cdef-123456789012', connection: 'Offline', enrollmentStatus: 'Expired Token',   uptime: '--',  activated: 'Dec 10, 2025', lastConnected: '14 days ago' },
  ];

  drawerSearch = '';
  drawerConnectionFilter: 'all' | 'Online' | 'Offline' = 'all';
  drawerStatusFilter: 'all' | 'Enrolled' | 'Pending' | 'Expired Token' = 'all';
  bulkReissueComplete = false;

  get expiredTokenCount(): number {
    return this.drawerEntries.filter(e => e.enrollmentStatus === 'Expired Token').length;
  }

  bulkReissueExpiredTokens(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.drawerEntries = this.drawerEntries.map(e => {
      if (e.enrollmentStatus !== 'Expired Token') return e;
      return { ...e, enrollmentStatus: 'Pending', token: `${segment(8)}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(12)}` };
    });
    this.bulkReissueComplete = true;
    setTimeout(() => this.bulkReissueComplete = false, 3000);
  }
  drawerSortCol: 'label' | 'connection' | 'enrollmentStatus' | 'uptime' | 'activated' | 'lastConnected' | null = null;
  drawerSortDir: 'asc' | 'desc' = 'asc';

  setDrawerSort(col: 'label' | 'connection' | 'enrollmentStatus' | 'uptime' | 'activated' | 'lastConnected'): void {
    if (this.drawerSortCol === col) {
      this.drawerSortDir = this.drawerSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.drawerSortCol = col;
      this.drawerSortDir = 'asc';
    }
  }

  private parseDrawerRelativeTime(s: string): number {
    if (s === '--') return Infinity;
    const m = s.match(/(\d+)\s*(min|hr|day)/i);
    if (!m) return Infinity;
    const n = parseInt(m[1]);
    if (m[2].startsWith('min')) return n;
    if (m[2].startsWith('hr')) return n * 60;
    return n * 1440;
  }

  get filteredDrawerEntries(): DeployedEntry[] {
    let entries = this.drawerEntries.filter(e => {
      if (this.drawerConnectionFilter !== 'all' && e.connection !== this.drawerConnectionFilter) return false;
      if (this.drawerStatusFilter !== 'all' && e.enrollmentStatus !== this.drawerStatusFilter) return false;
      if (this.drawerSearch) {
        const q = this.drawerSearch.toLowerCase();
        return e.label.toLowerCase().includes(q) || e.token.toLowerCase().includes(q);
      }
      return true;
    });

    if (this.drawerSortCol) {
      const col = this.drawerSortCol;
      const dir = this.drawerSortDir === 'asc' ? 1 : -1;
      entries = [...entries].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'label':            va = a.label.toLowerCase();      vb = b.label.toLowerCase();      break;
          case 'connection':       va = a.connection;               vb = b.connection;               break;
          case 'enrollmentStatus': va = a.enrollmentStatus;         vb = b.enrollmentStatus;         break;
          case 'uptime':           va = a.uptime === '--' ? -1 : parseFloat(a.uptime);
                                   vb = b.uptime === '--' ? -1 : parseFloat(b.uptime);               break;
          case 'activated':        va = a.activated === '--' ? 0 : new Date(a.activated).getTime();
                                   vb = b.activated === '--' ? 0 : new Date(b.activated).getTime(); break;
          case 'lastConnected':    va = this.parseDrawerRelativeTime(a.lastConnected);
                                   vb = this.parseDrawerRelativeTime(b.lastConnected);               break;
          default: return 0;
        }
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    return entries;
  }

  deployLabel = '';
  deployEmail = '';
  deployToken = '';
  tokenCopied = false;
  tokenEmailSent = false;

  openDeployModal(): void {
    this.saveFocus();
    this.deployLabel = '';
    this.deployEmail = '';
    this.deployToken = '';
    this.tokenCopied = false;
    this.tokenEmailSent = false;
    this.showDeployModal = true;
    this.focusFirstInDialog();
  }

  closeDeployModal(): void {
    this.showDeployModal = false;
    this.restoreFocus();
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
    this.restoreFocus();
  }
  rowMenuOpenId: string | null = null;
  hostedAppsOpenId: string | null = null;
  editingConnectorId: string | null = null;
  editingConnectorName = '';
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

  private locationTotals(loc: CustomerLocation): { used: number; total: number } {
    let used = 0, total = 0;
    for (const conn of loc.connectors) {
      const [u, t] = conn.allocation.split('/').map(Number);
      used += u;
      total += t;
    }
    return { used, total };
  }

  locationAllocation(loc: CustomerLocation): string {
    const { used, total } = this.locationTotals(loc);
    return `${used}/${total}`;
  }

  locationUsagePct(loc: CustomerLocation): number {
    const { used, total } = this.locationTotals(loc);
    return total > 0 ? used / total : 0;
  }

  get totalLicenses(): number {
    return this.locations.reduce((sum, loc) =>
      sum + loc.connectors.reduce((s, c) => s + Number(c.allocation.split('/')[1]), 0), 0);
  }

  get usedLicenses(): number {
    return this.locations.reduce((sum, loc) =>
      sum + loc.connectors.reduce((s, c) => s + Number(c.allocation.split('/')[0]), 0), 0);
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

  deleteConnector(conn: CustomerConnector, loc: CustomerLocation): void {
    loc.connectors.splice(loc.connectors.indexOf(conn), 1);
  }

  duplicateConnector(conn: CustomerConnector, loc: CustomerLocation): void {
    const newId = 'c-dup-' + Date.now();
    const copy: CustomerConnector = { ...conn, id: newId, name: conn.name + ' (Copy)' };
    const idx = loc.connectors.indexOf(conn);
    loc.connectors.splice(idx + 1, 0, copy);
    this.editingConnectorId = newId;
    this.editingConnectorName = copy.name;
  }

  commitConnectorName(conn: CustomerConnector): void {
    const trimmed = this.editingConnectorName.trim();
    if (trimmed) conn.name = trimmed;
    this.editingConnectorId = null;
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
    this.saveActionMenuTrigger(conn.name);
    this.activeConnector = conn;
    this.drawerSearch = '';
    this.drawerConnectionFilter = 'all';
    this.drawerStatusFilter = 'all';
    this.drawerSortCol = null;
    this.drawerSortDir = 'asc';
    this.showConnectorDrawer = true;
    this.focusFirstInDialog();
  }

  closeConnectorDrawer(): void {
    this.showConnectorDrawer = false;
    this.activeConnector = null;
    this.showLogsView = false;
    this.activeLogsEntry = null;
    this.restoreFocus();
  }

  openAddConnector(locationId: string): void {
    this.saveFocus();
    this.activeLocationId = locationId;
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.showAddConnectorModal = true;
    this.focusFirstInDialog();
  }

  closeAddConnector(): void {
    this.showAddConnectorModal = false;
    this.activeLocationId = null;
    this.restoreFocus();
  }

  openBulkUpload(conn: CustomerConnector): void {
    this.saveActionMenuTrigger(conn.name);
    this.bulkUploadConnector = conn;
    this.bulkUploadStep = 'upload';
    this.bulkUploadFileName = '';
    this.bulkUploadPreviewRows = [];
    this.bulkUploadError = '';
    this.rowMenuOpenId = null;
    this.showBulkUploadModal = true;
    this.focusFirstInDialog();
  }

  closeBulkUploadModal(): void {
    this.showBulkUploadModal = false;
    this.restoreFocus();
  }

  onBulkFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.bulkUploadFileName = file.name;
    this.bulkUploadError = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target as FileReader).result as string;
      this.parseBulkCsv(text);
    };
    reader.readAsText(file);
  }

  private parseBulkCsv(text: string): void {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      this.bulkUploadError = 'File must contain a header row and at least one data row.';
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const labelIdx = headers.indexOf('label');
    const emailIdx = headers.indexOf('email');
    if (labelIdx === -1) {
      this.bulkUploadError = 'CSV must include a "label" column.';
      return;
    }
    const rows: Array<{ label: string; email: string }> = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const label = cols[labelIdx] ?? '';
      const email = emailIdx !== -1 ? (cols[emailIdx] ?? '') : '';
      if (label) rows.push({ label, email });
    }
    if (rows.length === 0) {
      this.bulkUploadError = 'No valid rows found in the file.';
      return;
    }
    this.bulkUploadPreviewRows = rows;
    this.bulkUploadStep = 'preview';
  }

  confirmBulkUpload(): void {
    for (const row of this.bulkUploadPreviewRows) {
      this.drawerEntries.push({
        id: 'de-bulk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        label: row.label,
        token: '',
        connection: 'Offline',
        enrollmentStatus: 'Pending',
        uptime: '--',
        activated: '--',
        lastConnected: '--',
      });
    }
    this.showBulkUploadModal = false;
    this.restoreFocus();
  }
}
