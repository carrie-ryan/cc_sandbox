import { Component, inject } from '@angular/core';
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
  private readonly identityService = inject(IdentityService);
  private readonly customerService = inject(CustomerService);
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
      if (this.statusFilter !== 'all' && e.enrollmentStatus !== this.statusFilter) return false;
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
