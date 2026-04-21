import { Component, ElementRef, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogEntry, generateLogs, formatLogTimestamp, filterLogs } from '../../utils/log.utils';
import { IdentityService, DeployedEntry, ConnectorAssignment } from '../../services/identity.service';
import { CustomerService, CustomerConnector } from '../../services/customer.service';

@Component({
  selector: 'app-customer-identities',
  standalone: true,
  imports: [NgTemplateOutlet, FormsModule],
  templateUrl: './customer-identities.html',
})
export class CustomerIdentitiesComponent {
  readonly identityService = inject(IdentityService);
  private readonly customerService = inject(CustomerService);
  private readonly el = inject(ElementRef);
  private previouslyFocusedEl: HTMLElement | null = null;
  private addUserToastTimer: ReturnType<typeof setTimeout> | null = null;
  menuOpenId: string | null = null;
  subMenuOpenId: string | null = null;

  get connectors(): CustomerConnector[] {
    return this.customerService.getById('acme-corp')?.connectorList ?? [];
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

  // Multi-select
  selectedIds = new Set<string>();

  isSelected(id: string): boolean { return this.selectedIds.has(id); }

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds = next;
  }

  get allSelected(): boolean {
    return this.pagedEntries.length > 0 && this.pagedEntries.every(e => this.selectedIds.has(e.id));
  }

  toggleSelectAll(): void {
    const next = new Set(this.selectedIds);
    if (this.allSelected) this.pagedEntries.forEach(e => next.delete(e.id));
    else this.pagedEntries.forEach(e => next.add(e.id));
    this.selectedIds = next;
  }

  clearSelection(): void { this.selectedIds = new Set(); }

  collapseAll(): void { this.expandedIds = new Set(); }

  // Expandable rows
  expandedIds = new Set<string>();

  isExpanded(id: string): boolean { return this.expandedIds.has(id); }

  toggleExpand(id: string): void {
    const next = new Set(this.expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    this.expandedIds = next;
  }

  // Assign to connector modal
  showAssignModal = false;
  assignConnectorIds = new Set<string>();
  assignComplete = false;

  get selectedConnectors(): CustomerConnector[] {
    return this.connectors.filter(c => this.assignConnectorIds.has(c.id));
  }

  get canConfirmAssign(): boolean {
    return this.assignConnectorIds.size > 0;
  }

  openAssignModal(): void {
    this.assignConnectorIds = new Set();
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
  }

  openAssignForSingle(id: string): void {
    this.selectedIds = new Set([id]);
    this.menuOpenId = null;
    this.openAssignModal();
  }

  get isAnyModalOpen(): boolean {
    return this.showAssignModal || this.showLogsView ||
      this.showAddUserChoiceModal || this.showAddUserDeployModal || this.showAddUserBulkModal;
  }

  private saveFocus(): void {
    this.previouslyFocusedEl = document.activeElement as HTMLElement;
  }

  private restoreFocus(): void {
    const target = this.previouslyFocusedEl;
    this.previouslyFocusedEl = null;
    setTimeout(() => target?.focus());
  }

  private focusFirstInDialog(): void {
    setTimeout(() => {
      const dialog = this.el.nativeElement.parentElement?.querySelector('[role="dialog"]') as HTMLElement | null;
      if (!dialog) return;
      const first = dialog.querySelector(
        'button:not([disabled]), input:not([type="hidden"]):not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      first?.focus();
    }, 50);
  }

  // Add User — choice modal
  showAddUserChoiceModal = false;

  openAddUserModal(): void {
    this.saveFocus();
    this.showAddUserChoiceModal = true;
    this.focusFirstInDialog();
  }

  closeAddUserChoiceModal(): void {
    this.showAddUserChoiceModal = false;
    this.restoreFocus();
  }

  // Shared connector selection for add user flows
  addUserConnectorIds = new Set<string>();

  get addUserSelectedConnectors(): typeof this.connectors {
    return this.connectors.filter(c => this.addUserConnectorIds.has(c.id));
  }

  toggleAddUserConnector(id: string): void {
    const next = new Set(this.addUserConnectorIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    this.addUserConnectorIds = next;
  }

  // Add User — single deploy modal
  showAddUserDeployModal = false;
  addUserStep: 'form' | 'connectors' = 'form';
  addUserDeployLabel = '';
  addUserDeployEmail = '';

  openAddUserDeployModal(): void {
    this.showAddUserChoiceModal = false;
    this.addUserDeployLabel = '';
    this.addUserDeployEmail = '';
    this.addUserStep = 'form';
    this.addUserConnectorIds = new Set();
    this.showAddUserDeployModal = true;
    this.focusFirstInDialog();
  }

  closeAddUserDeployModal(): void {
    this.showAddUserDeployModal = false;
    this.restoreFocus();
  }

  advanceSingleToConnectors(): void {
    if (!this.addUserDeployLabel.trim() || !this.addUserDeployEmail.trim()) return;
    this.addUserStep = 'connectors';
    this.focusFirstInDialog();
  }

  skipAndFinalizeAddSingleUser(): void {
    this.addUserConnectorIds = new Set();
    this.finalizeAddSingleUser();
  }

  finalizeAddSingleUser(): void {
    const entry = this.identityService.add(this.addUserDeployLabel.trim(), this.addUserDeployEmail.trim());
    if (this.addUserConnectorIds.size > 0) {
      const assignments = this.addUserSelectedConnectors.map(c => ({
        id: c.id, name: c.name, apps: c.hostedApps, status: 'Pending' as const,
      }));
      this.identityService.assignToConnectors([entry.id], assignments);
    }
    this.showAddUserDeployModal = false;
    this.restoreFocus();
    this.triggerAddUserToast(1);
  }

  // Add User — bulk upload modal
  showAddUserBulkModal = false;
  bulkUploadStep: 'upload' | 'preview' | 'connectors' = 'upload';
  bulkUploadFileName = '';
  bulkUploadPreviewRows: Array<{ label: string; email: string }> = [];
  bulkUploadError = '';
  bulkUploadParsing = false;

  openAddUserBulkModal(): void {
    this.showAddUserChoiceModal = false;
    this.bulkUploadStep = 'upload';
    this.bulkUploadFileName = '';
    this.bulkUploadPreviewRows = [];
    this.bulkUploadError = '';
    this.bulkUploadParsing = false;
    this.addUserConnectorIds = new Set();
    this.showAddUserBulkModal = true;
    this.focusFirstInDialog();
  }

  closeAddUserBulkModal(): void {
    this.showAddUserBulkModal = false;
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
      this.parseBulkCsv((e.target as FileReader).result as string);
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

  advanceBulkToConnectors(): void {
    this.bulkUploadStep = 'connectors';
    this.focusFirstInDialog();
  }

  skipAndFinalizeBulkUpload(): void {
    this.addUserConnectorIds = new Set();
    this.finalizeBulkUpload();
  }

  finalizeBulkUpload(): void {
    const count = this.bulkUploadPreviewRows.length;
    const entries = this.identityService.addBulk(this.bulkUploadPreviewRows);
    if (this.addUserConnectorIds.size > 0) {
      const assignments = this.addUserSelectedConnectors.map(c => ({
        id: c.id, name: c.name, apps: c.hostedApps, status: 'Pending' as const,
      }));
      this.identityService.assignToConnectors(entries.map(e => e.id), assignments);
    }
    this.showAddUserBulkModal = false;
    this.restoreFocus();
    this.triggerAddUserToast(count);
  }

  // Add User — success toast
  showAddUserSuccessToast = false;
  addUserSuccessCount = 0;

  private triggerAddUserToast(count: number): void {
    if (this.addUserToastTimer) clearTimeout(this.addUserToastTimer);
    this.addUserSuccessCount = count;
    this.showAddUserSuccessToast = true;
    this.addUserToastTimer = setTimeout(() => this.dismissAddUserToast(), 6000);
  }

  dismissAddUserToast(): void {
    this.showAddUserSuccessToast = false;
  }

  toggleAssignConnector(id: string): void {
    const next = new Set(this.assignConnectorIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    this.assignConnectorIds = next;
  }

  confirmAssign(): void {
    if (!this.canConfirmAssign) return;
    const assignments: ConnectorAssignment[] = this.selectedConnectors.map(c => ({
      id: c.id,
      name: c.name,
      apps: c.hostedApps,
      status: 'Pending' as const,
    }));
    this.identityService.assignToConnectors([...this.selectedIds], assignments);
    this.showAssignModal = false;
    this.selectedIds = new Set();
    this.assignComplete = true;
    setTimeout(() => this.assignComplete = false, 3000);
  }

  // Per-connector reissue confirmation
  reissuedKey: string | null = null;

  reissueConnectorToken(entryId: string, assignmentId: string): void {
    this.identityService.reissueConnectorToken(entryId, assignmentId);
    const key = entryId + '::' + assignmentId;
    this.reissuedKey = key;
    setTimeout(() => { if (this.reissuedKey === key) this.reissuedKey = null; }, 3000);
  }

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

  openLogs(entry: DeployedEntry): void {
    this.menuOpenId = null;
    this.activeLogsEntry = entry;
    this.logsTimeframe = '7d';
    this.logsStatusFilter = 'all';
    this.logsSearch = '';
    this.allLogs = generateLogs(entry.id);
    this.showLogsView = true;
  }

  closeLogs(): void {
    this.showLogsView = false;
    this.activeLogsEntry = null;
  }

  formatLogTimestamp = formatLogTimestamp;

  get entries(): DeployedEntry[] { return this.identityService.entries; }

  search = '';
  connectionFilter: 'all' | 'Online' | 'Offline' = 'all';
  statusFilter: 'all' | 'Enrolled' | 'Pending' | 'Expired Token' = 'all';
  bulkReissueComplete = false;

  get expiredTokenCount(): number {
    return this.entries.filter(e => e.enrollmentStatus === 'Expired Token').length;
  }

  bulkReissueExpiredTokens(): void {
    this.identityService.reissueExpiredTokens();
    this.bulkReissueComplete = true;
    setTimeout(() => this.bulkReissueComplete = false, 3000);
  }

  sortCol: 'label' | 'email' | 'connection' | 'enrollmentStatus' | 'activated' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  identitiesPage = 1;
  readonly identitiesPageSize = 10;

  setSort(col: 'label' | 'email' | 'connection' | 'enrollmentStatus' | 'activated'): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.identitiesPage = 1;
  }

  get identitiesPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredEntries.length / this.identitiesPageSize));
  }

  get identitiesPages(): number[] {
    return Array.from({ length: this.identitiesPageCount }, (_, i) => i + 1);
  }

  get identitiesPageStart(): number {
    return (this.identitiesPage - 1) * this.identitiesPageSize + 1;
  }

  get identitiesPageEnd(): number {
    return Math.min(this.identitiesPage * this.identitiesPageSize, this.filteredEntries.length);
  }

  get pagedEntries(): DeployedEntry[] {
    const start = (this.identitiesPage - 1) * this.identitiesPageSize;
    return this.filteredEntries.slice(start, start + this.identitiesPageSize);
  }

  get filteredEntries(): DeployedEntry[] {
    let entries = this.entries.filter(e => {
      if (this.connectionFilter !== 'all' && e.connection !== this.connectionFilter) return false;
      if (this.statusFilter !== 'all') {
        const matches = e.connectorAssignments?.length
          ? e.connectorAssignments.some(a => a.status === this.statusFilter)
          : e.enrollmentStatus === this.statusFilter;
        if (!matches) return false;
      }
      if (this.search) {
        const q = this.search.toLowerCase();
        return e.label.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.token.toLowerCase().includes(q);
      }
      return true;
    });

    if (this.sortCol) {
      const col = this.sortCol;
      const dir = this.sortDir === 'asc' ? 1 : -1;
      entries = [...entries].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (col) {
          case 'label':            va = a.label.toLowerCase();      vb = b.label.toLowerCase();      break;
          case 'email':            va = a.email.toLowerCase();      vb = b.email.toLowerCase();      break;
          case 'connection':       va = a.connection;               vb = b.connection;               break;
          case 'enrollmentStatus': va = a.enrollmentStatus;         vb = b.enrollmentStatus;         break;
          case 'activated':        va = a.activated === '--' ? 0 : new Date(a.activated).getTime();
                                   vb = b.activated === '--' ? 0 : new Date(b.activated).getTime(); break;
          default: return 0;
        }
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    return entries;
  }
}
