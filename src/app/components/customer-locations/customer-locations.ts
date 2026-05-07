import { Component, ElementRef, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { LogEntry, generateLogs, formatLogTimestamp, filterLogs } from '../../utils/log.utils';
import { buildZip } from '../../utils/zip.utils';

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
  version: string;
}


interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: CustomerConnector[];
}

interface ConnectorApp {
  protocol: string;
  name: string;
  roles: string[];
}

interface ConnectorCatalogItem {
  id: string;
  name: string;
  type: string;
  apps: string[];
}

@Component({
  selector: 'app-customer-locations',
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  private readonly el = inject(ElementRef);
  private readonly customerService = inject(CustomerService);
  private previouslyFocusedEl: HTMLElement | null = null;

  get isAnyModalOpen(): boolean {
    return this.showAddConnectorModal || this.showLogsView;
  }

  private saveFocus(): void {
    this.previouslyFocusedEl = document.activeElement as HTMLElement;
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

  private readonly templateToCatalogId: Record<string, string> = {
    'CAD Gateway': 'cat-gw-cad',
    'RMS Gateway': 'cat-gw-rms',
    'GIS Gateway': 'cat-gw-gis',
    'CIM Gateway': 'cat-gw-cim',
    'Workstation': 'cat-dev-ws',
    'Mobile Device': 'cat-dev-mob',
    'Clientless Web Portal': 'cat-cl-web',
  };

  get activeLocationCatalog(): ConnectorCatalogItem[] {
    const loc = this.locations.find(l => l.id === this.activeLocationId);
    if (!loc) return this.connectorCatalog;
    const allowedIds = new Set(
      loc.connectors.map(c => this.templateToCatalogId[c.template]).filter(Boolean)
    );
    return this.connectorCatalog.filter(item => allowedIds.has(item.id));
  }

  readonly connectorCatalog: ConnectorCatalogItem[] = [
    { id: 'cat-gw-cad', name: 'CAD Gateway', type: 'Gateway', apps: ['CAD'] },
    { id: 'cat-gw-rms', name: 'RMS Gateway', type: 'Gateway', apps: ['RMS'] },
    { id: 'cat-gw-gis', name: 'GIS Gateway', type: 'Gateway', apps: ['GIS'] },
    { id: 'cat-gw-cim', name: 'CIM Gateway', type: 'Gateway', apps: ['CIM'] },
    { id: 'cat-dev-ws', name: 'Workstation Device', type: 'Device', apps: [] },
    { id: 'cat-dev-mob', name: 'Mobile Device', type: 'Device', apps: ['Criminal Profiling System', 'Patrol Route Optimizer'] },
    { id: 'cat-cl-web', name: 'Clientless Web Portal', type: 'Clientless', apps: [] },
  ];

  selectedCatalogId: string | null = null;

  isCatalogItemSelected(id: string): boolean { return this.selectedCatalogId === id; }

  selectCatalogItem(id: string): void { this.selectedCatalogId = id; }

  catalogItemClasses(id: string): string {
    return this.isCatalogItemSelected(id)
      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50';
  }

  get canAddConnectors(): boolean {
    return this.connectorName.trim().length > 0 && this.selectedCatalogId !== null;
  }

  addConnectors(): void {
    if (!this.canAddConnectors || !this.activeLocationId || !this.selectedCatalogId) return;
    const loc = this.locations.find(l => l.id === this.activeLocationId);
    if (!loc) return;
    this.addConnectorFromCatalog(loc, this.connectorName.trim(), this.selectedCatalogId);
    this.expanded[this.activeLocationId] = true;
    this.closeAddConnector();
  }

  // ── Bulk add ───────────────────────────────────────────────────────────────

  addConnectorTab: 'single' | 'bulk' = 'single';

  bulkCsvFile: File | null = null;
  bulkCsvRows: { name: string; catalogId: string | null; catalogName: string }[] = [];
  bulkCsvError = '';
  bulkCsvDragOver = false;

  get hasBulkCsvData(): boolean { return this.bulkCsvRows.length > 0; }

  get canSubmitBulkConnectors(): boolean {
    return this.bulkCsvRows.length > 0 &&
           this.bulkCsvRows.every(r => r.catalogId !== null) &&
           this.tokenExpirationWeeks > 0;
  }

  downloadBulkCsvTemplate(): void {
    const catalog = this.activeLocationCatalog;
    const examples = catalog.slice(0, 3).map((c, i) =>
      `new-${c.name.toLowerCase().replace(/\s+/g, '-')}-0${i + 1},${c.name}`
    );
    const lines = ['Connector Name,Parent Connector', ...(examples.length ? examples : ['my-connector-01,CAD Gateway'])];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connector-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  handleBulkCsvFile(file: File): void {
    this.bulkCsvFile = file;
    this.bulkCsvError = '';
    const reader = new FileReader();
    reader.onload = (e) => this.parseBulkCsv(e.target?.result as string ?? '');
    reader.readAsText(file);
  }

  parseBulkCsv(text: string): void {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      this.bulkCsvError = 'CSV must have a header row and at least one data row.';
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'connector name');
    const parentIdx = headers.findIndex(h => h === 'parent connector');
    if (nameIdx === -1) {
      this.bulkCsvError = 'CSV must include a "Connector Name" column.';
      return;
    }
    const rows: { name: string; catalogId: string | null; catalogName: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const name = cols[nameIdx] ?? '';
      if (!name) continue;
      const catalogName = parentIdx !== -1 ? (cols[parentIdx] ?? '') : '';
      const catalogItem = this.connectorCatalog.find(c => c.name.toLowerCase() === catalogName.toLowerCase());
      rows.push({ name, catalogId: catalogItem?.id ?? null, catalogName });
    }
    if (rows.length === 0) {
      this.bulkCsvError = 'No valid connector names found in CSV.';
      return;
    }
    this.bulkCsvRows = rows;
  }

  clearBulkCsv(): void {
    this.bulkCsvFile = null;
    this.bulkCsvRows = [];
    this.bulkCsvError = '';
  }

  onBulkCsvDrop(event: DragEvent): void {
    event.preventDefault();
    this.bulkCsvDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file?.name.endsWith('.csv')) {
      this.handleBulkCsvFile(file);
    } else if (file) {
      this.bulkCsvError = 'Please upload a .csv file.';
    }
  }

  onBulkCsvFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleBulkCsvFile(file);
    input.value = '';
  }

  private addConnectorFromCatalog(loc: CustomerLocation, name: string, catalogId: string): void {
    const cat = this.connectorCatalog.find(c => c.id === catalogId)!;
    const newId = `new-conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newConn: CustomerConnector = {
      id: newId, name, type: cat.type, template: cat.name,
      hostedApps: cat.apps.length, hostedAppNames: [...cat.apps],
      status: 'Offline', uptime: '0%', lastConnected: 'Never',
      allocation: '0/0', version: this.LATEST_VERSION,
    };
    const sourceConn = this.locations.flatMap(l => l.connectors)
      .find(c => c.template === cat.name && this.appRoleMap[c.id]);
    if (sourceConn) this.appRoleMap[newId] = { ...this.appRoleMap[sourceConn.id] };
    loc.connectors.push(newConn);
    this.enrollmentStatusOverrides[newId] = 'Pending';
  }

  submitBulkConnectors(): void {
    if (!this.canSubmitBulkConnectors || !this.activeLocationId) return;
    const loc = this.locations.find(l => l.id === this.activeLocationId);
    if (!loc) return;
    this.bulkCsvRows.forEach(row => {
      if (row.catalogId) this.addConnectorFromCatalog(loc, row.name, row.catalogId);
    });
    this.expanded[this.activeLocationId] = true;
    this.closeAddConnector();
  }

  connectorSortCol: 'name' | 'type' | 'status' | 'connection' | null = null;
  connectorSortDir: 'asc' | 'desc' = 'asc';

  setConnectorSort(col: 'name' | 'type' | 'status' | 'connection'): void {
    if (this.connectorSortCol === col) {
      this.connectorSortDir = this.connectorSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.connectorSortCol = col;
      this.connectorSortDir = 'asc';
    }
  }

  // ── Multi-select ──────────────────────────────────────────────────────────

  selectedConnectorIds = new Set<string>();

  isConnectorSelected(id: string): boolean {
    return this.selectedConnectorIds.has(id);
  }

  toggleConnectorSelect(id: string): void {
    const next = new Set(this.selectedConnectorIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedConnectorIds = next;
  }

  selectedConnectorsForLocation(loc: CustomerLocation): CustomerConnector[] {
    return loc.connectors.filter(c => this.selectedConnectorIds.has(c.id));
  }

  allConnectorsSelectedForLocation(loc: CustomerLocation): boolean {
    const visible = this.filteredConnectors(loc);
    return visible.length > 0 && visible.every(c => this.selectedConnectorIds.has(c.id));
  }

  toggleSelectAllForLocation(loc: CustomerLocation): void {
    const visible = this.filteredConnectors(loc);
    const next = new Set(this.selectedConnectorIds);
    if (this.allConnectorsSelectedForLocation(loc)) {
      visible.forEach(c => next.delete(c.id));
    } else {
      visible.forEach(c => next.add(c.id));
    }
    this.selectedConnectorIds = next;
  }

  clearLocationSelection(loc: CustomerLocation): void {
    const next = new Set(this.selectedConnectorIds);
    loc.connectors.forEach(c => next.delete(c.id));
    this.selectedConnectorIds = next;
  }

  tokenEligibleForLocation(loc: CustomerLocation): CustomerConnector[] {
    return this.selectedConnectorsForLocation(loc).filter(
      c => this.getConnectorEnrollmentStatus(c) !== 'Enrolled'
    );
  }

  allSelectedDisabledForLocation(loc: CustomerLocation): boolean {
    const sel = this.selectedConnectorsForLocation(loc);
    return sel.length > 0 && sel.every(c => this.isConnectorDisabled(c.id));
  }

  allSelectedEnabledForLocation(loc: CustomerLocation): boolean {
    const sel = this.selectedConnectorsForLocation(loc);
    return sel.length > 0 && sel.every(c => !this.isConnectorDisabled(c.id));
  }

  bulkDownloadTokens(loc: CustomerLocation): void {
    const eligible = this.tokenEligibleForLocation(loc);
    if (!eligible.length) return;
    const b64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const files: { name: string; content: string }[] = eligible.map(conn => {
      const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT' }));
      const payload = b64url(JSON.stringify({ sub: conn.name, iss: 'netfoundry.io', iat: now, exp: now + 4 * 7 * 24 * 3600, jti: conn.id }));
      const sig = b64url(conn.id + Math.random().toString(36).slice(2, 18));
      return { name: `${conn.name}.jwt`, content: `${header}.${payload}.${sig}` };
    });
    const exampleName = eligible[0].name;
    files.push({ name: 'README.txt', content: [
      'Each .jwt file is the enrollment token for one connector.',
      `The filename matches the connector name (e.g. ${exampleName}.jwt = ${exampleName}).`,
      '',
      'IMPORTANT:',
      '- These tokens expire 4 weeks from download',
      '- Each token can only be used ONCE',
      '- Run this command on each host to enroll the connector:',
      '',
      `  ziti-edge-tunnel enroll --jwt ./${exampleName}.jwt --identity /etc/ziti/identity.json`,
      '',
      'If a token expires, return to the portal and reissue the token for that connector.',
    ].join('\n') });
    const zip = buildZip(files);
    const blob = new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connector-tokens.zip';
    a.click();
    URL.revokeObjectURL(url);
    this.clearLocationSelection(loc);
  }

  bulkEnableConnectors(loc: CustomerLocation): void {
    this.selectedConnectorsForLocation(loc).forEach(c => this.disabledConnectors.delete(c.id));
    this.clearLocationSelection(loc);
  }

  bulkDisableConnectors(loc: CustomerLocation): void {
    this.selectedConnectorsForLocation(loc).forEach(c => this.disabledConnectors.add(c.id));
    this.clearLocationSelection(loc);
  }

  rowMenuOpenId: string | null = null;
  editingConnectorId: string | null = null;
  editingConnectorName = '';
  activeLocationId: string | null = null;
  pausedConnectors = new Set<string>();
  disabledConnectors = new Set<string>(['Chicago-GW-01']);

  isConnectorDisabled(id: string): boolean { return this.disabledConnectors.has(id); }

  toggleConnectorDisabled(conn: CustomerConnector): void {
    this.rowMenuOpenId = null;
    if (this.disabledConnectors.has(conn.id)) this.disabledConnectors.delete(conn.id);
    else this.disabledConnectors.add(conn.id);
  }

  connectorName = '';
  connectorType = '';
  selectedTemplate = 'No Template';
  saveAsTemplate = false;
  tokenExpirationWeeks = 4;

  searchQuery = '';
  connectionFilter: 'all' | 'Online' | 'Offline' = 'all';
  enrollmentStatusFilter: 'all' | 'Enrolled' | 'Pending' | 'Expired Token' = 'all';

  locationsPage = 1;
  locationsPageSize = 10;
  readonly locationsPageSizeOptions = [10, 25, 50, 100];

  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  private readonly typeLabel: Record<string, string> = {
    gateway: 'Gateway', device: 'Device', clientless: 'Clientless', sdk: 'SDK Embedded', connector: 'Connector',
  };

  filteredConnectors(loc: CustomerLocation): CustomerConnector[] {
    const filtered = loc.connectors.filter(conn => {
      if (this.connectionFilter !== 'all' && conn.status !== this.connectionFilter) return false;
      if (this.enrollmentStatusFilter !== 'all' && this.getConnectorEnrollmentStatus(conn) !== this.enrollmentStatusFilter) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        return conn.name.toLowerCase().includes(q) ||
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q);
      }
      return true;
    });
    if (!this.connectorSortCol) return filtered;
    const dir = this.connectorSortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va: string, vb: string;
      switch (this.connectorSortCol) {
        case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
        case 'type': va = a.type.toLowerCase(); vb = b.type.toLowerCase(); break;
        case 'status': va = this.getConnectorEnrollmentStatus(a); vb = this.getConnectorEnrollmentStatus(b); break;
        case 'connection': va = a.status; vb = b.status; break;
        default: return 0;
      }
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }

  get filteredLocations(): CustomerLocation[] {
    const noFilters = !this.searchQuery.trim() && this.connectionFilter === 'all' && this.enrollmentStatusFilter === 'all';
    if (noFilters) return this.locations;
    return this.locations.filter(loc => this.filteredConnectors(loc).length > 0);
  }

  get locationsPageCount(): number { return Math.max(1, Math.ceil(this.filteredLocations.length / this.locationsPageSize)); }
  get locationsPages(): number[] { return Array.from({ length: this.locationsPageCount }, (_, i) => i + 1); }
  get locationsPageStart(): number { return (this.locationsPage - 1) * this.locationsPageSize + 1; }
  get locationsPageEnd(): number { return Math.min(this.locationsPage * this.locationsPageSize, this.filteredLocations.length); }
  get pagedLocations(): CustomerLocation[] {
    const start = (this.locationsPage - 1) * this.locationsPageSize;
    return this.filteredLocations.slice(start, start + this.locationsPageSize);
  }

  locations: CustomerLocation[] = (() => {
    const customer = this.customerService.getById('acme-corp')!;
    return customer.locationList.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.city,
      addressSub: loc.country,
      licensesAllocated: loc.connectors,
      connectors: customer.connectorList
        .filter(c => c.location === loc.name)
        .map(c => ({
          id: c.id,
          name: c.name,
          type: this.typeLabel[c.type] ?? c.type,
          template: c.template,
          hostedApps: c.hostedApps.length,
          hostedAppNames: c.hostedApps,
          status: c.status,
          uptime: c.uptime,
          lastConnected: c.lastSeen,
          allocation: '0/0',
          version: c.version,
        })),
    }));
  })();

  expanded: { [id: string]: boolean } = { [this.locations[0]?.id ?? '']: true };
  connectorExpanded: Record<string, boolean> = {};
  appEnabled: Record<string, boolean> = {};

  readonly providerName = 'Central Square';

  private readonly connectorEnrollmentStatus: Record<string, 'Enrolled' | 'Expired Token' | 'Pending'> = {
    'Chicago-GW-01': 'Expired Token',
    'Chicago-GW-02': 'Enrolled',
    'Chicago-Dev-01': 'Enrolled',
    'Chicago-Dev-02': 'Enrolled',
    'Austin-Host-03': 'Pending',
    'NY-CL-01':       'Enrolled',
    'London-GW-01':   'Expired Token',
    'London-Dev-01':  'Pending',
  };

  private readonly enrollmentStatusOverrides: Record<string, 'Enrolled' | 'Expired Token' | 'Pending'> = {};

  getConnectorEnrollmentStatus(conn: CustomerConnector): 'Enrolled' | 'Expired Token' | 'Pending' {
    return this.enrollmentStatusOverrides[conn.id] ?? this.connectorEnrollmentStatus[conn.id] ?? 'Enrolled';
  }

  bulkReissueCompleteLocationId: string | null = null;
  private bulkReissueTimer: ReturnType<typeof setTimeout> | null = null;

  expiredConnectorCountForLocation(loc: CustomerLocation): number {
    return loc.connectors.filter(c => this.getConnectorEnrollmentStatus(c) === 'Expired Token').length;
  }

  bulkReissueExpiredTokensForLocation(loc: CustomerLocation): void {
    loc.connectors
      .filter(c => this.getConnectorEnrollmentStatus(c) === 'Expired Token')
      .forEach(c => { this.enrollmentStatusOverrides[c.id] = 'Pending'; });
    if (this.bulkReissueTimer) clearTimeout(this.bulkReissueTimer);
    this.bulkReissueCompleteLocationId = loc.id;
    this.bulkReissueTimer = setTimeout(() => { this.bulkReissueCompleteLocationId = null; }, 3000);
  }

  reissueToken(conn: CustomerConnector): void {
    this.rowMenuOpenId = null;
    this.enrollmentStatusOverrides[conn.id] = 'Pending';
    const b64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT' }));
    const payload = b64url(JSON.stringify({ sub: conn.name, iss: 'netfoundry.io', iat: now, exp: now + 4 * 7 * 24 * 3600, jti: conn.id }));
    const sig = b64url(conn.id + Math.random().toString(36).slice(2, 18));
    const blob = new Blob([`${header}.${payload}.${sig}`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conn.name}.jwt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private readonly appRoleMap: Record<string, Record<string, string[]>> = {
    'Chicago-GW-01': { CAD: ['End User', 'IT Admin'] },
    'Chicago-GW-02': { RMS: ['IT Admin', 'Supervisor'] },
    'Chicago-Dev-02': { 'Criminal Profiling System': ['IT Admin', 'Supervisor'], 'Patrol Route Optimizer': ['End User', 'IT Admin'] },
    'NY-CL-01':      { GIS: ['End User', 'IT Admin', 'Supervisor'] },
    'London-GW-01':  { CIM: ['IT Admin', 'Supervisor'] },
  };

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

  readonly appFriendlyNames: Record<string, string> = {
    'CAD': 'Computer-Aided Dispatch',
    'RMS': 'Records Management System',
    'GIS': 'GIS Mapping',
    'CIM': 'Common Informatics Module',
  };

  readonly appLabel = (tech: string): string => {
    const friendly = this.appFriendlyNames[tech];
    return friendly ? `${tech} / ${friendly}` : tech;
  };

  private readonly LATEST_VERSION = '3.4.1';

  private readonly versionOverrides: Record<string, 'required' | 'failed'> = {
    'Chicago-Dev-01': 'required',
    'Austin-Host-03': 'failed',
  };

  versionStatusLabel(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'required') return 'Update required';
    if (override === 'failed') return 'Update failed';
    if (conn.version === this.LATEST_VERSION) return 'Version up to date';
    return 'Needs updating';
  }

  versionStatusClasses(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'required') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    if (override === 'failed') return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
    if (conn.version === this.LATEST_VERSION) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
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

  toggleConnectorExpand(connId: string, event: Event): void {
    event.stopPropagation();
    this.connectorExpanded[connId] = !this.connectorExpanded[connId];
  }

  getConnectorApps(conn: CustomerConnector): ConnectorApp[] {
    return conn.hostedAppNames.map(protocol => ({
      protocol,
      name: this.appFriendlyNames[protocol] ?? protocol,
      roles: this.appRoleMap[conn.id]?.[protocol] ?? [],
    }));
  }

  getConnectorRoles(conn: CustomerConnector): string[] {
    const roles = new Set<string>();
    for (const protocol of conn.hostedAppNames) {
      for (const r of (this.appRoleMap[conn.id]?.[protocol] ?? [])) {
        roles.add(r);
      }
    }
    return [...roles];
  }

  isAppEnabled(connId: string, protocol: string): boolean {
    return this.appEnabled[`${connId}::${protocol}`] !== false;
  }

  toggleAppEnabled(connId: string, protocol: string): void {
    const key = `${connId}::${protocol}`;
    this.appEnabled[key] = !this.isAppEnabled(connId, protocol);
  }

  openAddConnector(locationId: string): void {
    this.saveFocus();
    this.activeLocationId = locationId;
    this.addConnectorTab = 'single';
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.tokenExpirationWeeks = 4;
    this.selectedCatalogId = null;
    this.bulkCsvFile = null;
    this.bulkCsvRows = [];
    this.bulkCsvError = '';
    this.bulkCsvDragOver = false;
    this.showAddConnectorModal = true;
    this.focusFirstInDialog();
  }

  closeAddConnector(): void {
    this.showAddConnectorModal = false;
    this.activeLocationId = null;
    this.restoreFocus();
  }

  // ── Logs drawer ───────────────────────────────────────────────────────────

  showLogsView = false;
  activeConnector: CustomerConnector | null = null;
  logsTimeframe: '24h' | '7d' | '30d' = '7d';
  logsStatusFilter: 'all' | 'success' | 'fail' = 'all';
  logsSearch = '';
  private allLogs: LogEntry[] = [];

  get filteredLogs(): LogEntry[] {
    return filterLogs(this.allLogs, this.logsTimeframe, this.logsStatusFilter, this.logsSearch);
  }

  openLogs(conn: CustomerConnector): void {
    this.rowMenuOpenId = null;
    this.activeConnector = conn;
    this.logsTimeframe = '7d';
    this.logsStatusFilter = 'all';
    this.logsSearch = '';
    this.allLogs = generateLogs(conn.id);
    this.showLogsView = true;
  }

  closeLogs(): void {
    this.showLogsView = false;
    this.activeConnector = null;
  }

  readonly formatLogTimestamp = formatLogTimestamp;

}
