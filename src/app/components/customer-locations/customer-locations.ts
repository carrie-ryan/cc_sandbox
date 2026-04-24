import { Component, ElementRef, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectorAssignment, IdentityService } from '../../services/identity.service';
import { CustomerService } from '../../services/customer.service';

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

@Component({
  selector: 'app-customer-locations',
  imports: [FormsModule],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  @Output() navigateToIdentities = new EventEmitter<void>();

  private readonly el = inject(ElementRef);
  private readonly identityService = inject(IdentityService);
  private readonly customerService = inject(CustomerService);
  private previouslyFocusedEl: HTMLElement | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

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

  showAssignSuccessToast = false;
  assignSuccessCount = 0;
  assignSuccessConnectorName = '';

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
    const connectorName = this.assignConnector?.name ?? '';
    const assignment: ConnectorAssignment | undefined = this.assignConnector ? {
      id: this.assignConnector.id,
      name: this.assignConnector.name,
      apps: this.assignConnector.hostedAppNames,
      status: 'Pending',
      activated: '--',
    } : undefined;
    this.identityService.add(this.deployLabel.trim(), this.deployEmail.trim(), assignment);
    this.showDeployModal = false;
    this.restoreFocus();
    this.showToast(1, connectorName);
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
    const count = this.bulkUploadPreviewRows.length;
    const connectorName = this.assignConnector?.name ?? '';
    const assignment: ConnectorAssignment | undefined = this.assignConnector ? {
      id: this.assignConnector.id,
      name: this.assignConnector.name,
      apps: this.assignConnector.hostedAppNames,
      status: 'Pending',
      activated: '--',
    } : undefined;
    this.identityService.addBulk(this.bulkUploadPreviewRows, assignment);
    this.showBulkUploadModal = false;
    this.restoreFocus();
    this.showToast(count, connectorName);
  }

  private showToast(count: number, connectorName: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.assignSuccessCount = count;
    this.assignSuccessConnectorName = connectorName;
    this.showAssignSuccessToast = true;
    this.toastTimer = setTimeout(() => this.dismissToast(), 6000);
  }

  dismissToast(): void {
    this.showAssignSuccessToast = false;
  }

  goToUsers(): void {
    this.dismissToast();
    this.navigateToIdentities.emit();
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

  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  private readonly typeLabel: Record<string, string> = {
    gateway: 'Gateway', device: 'Device', clientless: 'Clientless', sdk: 'SDK Embedded', connector: 'Connector',
  };

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
    'RDP':   'Remote Desktop',
    'HTTPS': 'File Share',
    'SSH':   'Secure Shell',
  };

  readonly appLabel = (tech: string): string => {
    const friendly = this.appFriendlyNames[tech];
    return friendly ? `${tech} / ${friendly}` : tech;
  };

  private readonly LATEST_VERSION = '3.4.1';

  private readonly versionOverrides: Record<string, 'pending' | 'failed'> = {
    'Chicago-Dev-01': 'pending',
    'Austin-Host-03': 'failed',
  };

  versionStatusLabel(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'pending') return 'Update pending';
    if (override === 'failed') return 'Update failed';
    if (conn.version === this.LATEST_VERSION) return 'Version up to date';
    return 'Needs updating';
  }

  versionStatusClasses(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'pending') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
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
