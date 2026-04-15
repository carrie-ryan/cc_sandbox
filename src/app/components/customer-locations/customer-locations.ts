import { Component, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../../services/identity.service';

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
  imports: [FormsModule],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  private readonly el = inject(ElementRef);
  private readonly identityService = inject(IdentityService);
  private previouslyFocusedEl: HTMLElement | null = null;

  get isAnyModalOpen(): boolean {
    return this.showDeployModal || this.showAddConnectorModal || this.showBulkUploadModal || this.showAssignChoiceModal;
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
  showAssignChoiceModal = false;
  showDeployModal = false;
  showBulkUploadModal = false;
  assignConnector: CustomerConnector | null = null;
  bulkUploadStep: 'upload' | 'preview' = 'upload';
  bulkUploadFileName = '';
  bulkUploadPreviewRows: Array<{ label: string; email: string }> = [];
  bulkUploadError = '';
  bulkUploadParsing = false;
  deployLabel = '';
  deployEmail = '';
  deployToken = '';
  tokenCopied = false;
  tokenEmailSent = false;

  openAssignChoiceModal(connector: CustomerConnector): void {
    this.saveFocus();
    this.assignConnector = connector;
    this.showAssignChoiceModal = true;
    this.focusFirstInDialog();
  }

  closeAssignChoiceModal(): void {
    this.showAssignChoiceModal = false;
    this.restoreFocus();
  }

  openDeployModal(): void {
    this.showAssignChoiceModal = false;
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
    this.identityService.add(this.deployLabel.trim(), this.deployEmail.trim());
    this.showDeployModal = false;
    this.restoreFocus();
  }

  openBulkUploadModal(): void {
    this.showAssignChoiceModal = false;
    this.bulkUploadStep = 'upload';
    this.bulkUploadFileName = '';
    this.bulkUploadPreviewRows = [];
    this.bulkUploadError = '';
    this.bulkUploadParsing = false;
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
    this.bulkUploadParsing = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target as FileReader).result as string;
      this.parseBulkCsv(text);
      this.bulkUploadParsing = false;
    };
    reader.onerror = () => {
      this.bulkUploadError = 'Failed to read the file. Please try again.';
      this.bulkUploadParsing = false;
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
    this.identityService.addBulk(this.bulkUploadPreviewRows);
    this.showBulkUploadModal = false;
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

}
