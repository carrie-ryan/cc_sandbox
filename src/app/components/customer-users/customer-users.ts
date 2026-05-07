import { Component, ElementRef, inject } from '@angular/core';
import { NgTemplateOutlet, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogEntry, generateLogs, formatLogTimestamp, filterLogs } from '../../utils/log.utils';
import { IdentityService, DeployedEntry } from '../../services/identity.service';
import { buildZip } from '../../utils/zip.utils';

interface AvailableRole {
  id: string;
  name: string;
  description: string;
  connectors: string[];
}

type ModalTab = 'individual' | 'bulk';

@Component({
  selector: 'app-customer-identities',
  standalone: true,
  imports: [NgTemplateOutlet, NgStyle, FormsModule],
  templateUrl: './customer-users.html',
})
export class CustomerIdentitiesComponent {
  readonly identityService = inject(IdentityService);
  private readonly el = inject(ElementRef);
  private previouslyFocusedEl: HTMLElement | null = null;
  private addUserToastTimer: ReturnType<typeof setTimeout> | null = null;
  menuOpenId: string | null = null;

  readonly availableRoles: AvailableRole[] = [
    { id: 'role-it-admin',   name: 'IT Admin',   description: 'Full access to manage IT infrastructure and configurations.', connectors: ['cad-gateway', 'rms-gateway', 'workstation-device', 'mobile-device-unit', 'mobile-unit-device', 'gis-gateway', 'cim-gateway'] },
    { id: 'role-supervisor', name: 'Supervisor', description: 'View and manage team resources and reports.',                  connectors: ['rms-gateway', 'gis-gateway'] },
    { id: 'role-end-user',   name: 'End User',   description: 'Standard access to assigned applications and resources.',     connectors: ['workstation-device', 'mobile-device-unit'] },
  ];

  // ── Multi-select ──────────────────────────────────────────────────────────

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

  get selectedEntries(): DeployedEntry[] {
    return this.entries.filter(e => this.selectedIds.has(e.id));
  }

  get selectedAllEnabled(): boolean {
    return this.selectedEntries.length > 0 && this.selectedEntries.every(e => e.enabled);
  }

  get selectedAllDisabled(): boolean {
    return this.selectedEntries.length > 0 && this.selectedEntries.every(e => !e.enabled);
  }

  toggle(id: string): void {
    this.identityService.toggle(id);
    this.menuOpenId = null;
  }

  bulkEnable(): void {
    this.selectedEntries.forEach(e => { e.enabled = true; });
    this.clearSelection();
  }

  bulkDisable(): void {
    this.selectedEntries.forEach(e => { e.enabled = false; });
    this.clearSelection();
  }

  bulkDelete(): void {
    this.selectedIds.forEach(id => this.identityService.remove(id));
    this.clearSelection();
  }

  // ── Bulk assign roles modal ───────────────────────────────────────────────

  showBulkRoleModal   = false;
  bulkRoleSelectedIds = new Set<string>();

  get isAnyBulkRoleModalOpen(): boolean { return this.showBulkRoleModal; }

  openBulkRoleModal(): void {
    this.bulkRoleSelectedIds = new Set();
    this.showBulkRoleModal   = true;
  }

  closeBulkRoleModal(): void { this.showBulkRoleModal = false; }

  isBulkRoleSelected(roleId: string): boolean { return this.bulkRoleSelectedIds.has(roleId); }

  toggleBulkRole(roleId: string): void {
    const next = new Set(this.bulkRoleSelectedIds);
    if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
    this.bulkRoleSelectedIds = next;
  }

  applyBulkRoles(): void {
    if (this.bulkRoleSelectedIds.size === 0) return;
    this.identityService.mergeRoles([...this.selectedIds], [...this.bulkRoleSelectedIds]);
    this.closeBulkRoleModal();
    this.clearSelection();
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  get isAnyModalOpen(): boolean {
    return this.showLogsView || this.showAddUserModal || this.showBulkRoleModal;
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

  // ── Add User Modal ────────────────────────────────────────────────────────

  showAddUserModal = false;
  addUserTab: ModalTab = 'individual';

  addUserName = '';
  addUserEmail = '';
  selectedRoleIds = new Set<string>();
  tokenExpirationWeeks: number | null = 4;

  bulkFile: File | null = null;
  bulkDragging = false;
  bulkPreviewRows: Array<{ name: string; email: string; roles: string[] }> = [];
  bulkParseError = '';
  bulkManualText = '';

  openAddUserModal(): void {
    this.saveFocus();
    this.addUserTab = 'individual';
    this.addUserName = '';
    this.addUserEmail = '';
    this.selectedRoleIds = new Set();
    this.tokenExpirationWeeks = 4;
    this.bulkFile = null;
    this.bulkDragging = false;
    this.bulkPreviewRows = [];
    this.bulkParseError = '';
    this.bulkManualText = '';
    this.showAddUserModal = true;
    this.focusFirstInDialog();
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.restoreFocus();
  }

  isRoleSelected(roleId: string): boolean { return this.selectedRoleIds.has(roleId); }

  toggleRole(roleId: string): void {
    const next = new Set(this.selectedRoleIds);
    if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
    this.selectedRoleIds = next;
  }

  get canSaveIndividual(): boolean {
    return !!this.addUserName.trim() && !!this.addUserEmail.trim();
  }

  saveIndividualUser(): void {
    if (!this.canSaveIndividual) return;
    this.identityService.add(
      this.addUserName.trim(),
      this.addUserEmail.trim(),
      [...this.selectedRoleIds],
      this.tokenExpirationWeeks ?? 4,
    );
    this.closeAddUserModal();
    this.triggerAddUserToast(1);
  }

  get parsedManualRows(): Array<{ name: string; email: string; roles: string[] }> {
    const rows: Array<{ name: string; email: string; roles: string[] }> = [];
    for (const line of this.bulkManualText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
      const cols = line.split(',').map(c => c.trim());
      const name = cols[0] ?? '';
      if (!name) continue;
      const email = cols[1] ?? '';
      rows.push({ name, email, roles: [] });
    }
    return rows;
  }

  get allBulkRows(): Array<{ name: string; email: string; roles: string[] }> {
    return this.bulkFile ? this.bulkPreviewRows : this.parsedManualRows;
  }

  get canSubmitBulk(): boolean { return this.allBulkRows.length > 0; }

  downloadCsvTemplate(): void {
    const lines = [
      'name,email,role',
      ...this.availableRoles.slice(0, 2).map((r, i) =>
        `Example User ${i + 1},user${i + 1}@company.com,${r.name}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onBulkDragOver(event: DragEvent): void {
    event.preventDefault();
    this.bulkDragging = true;
  }

  onBulkDragLeave(): void { this.bulkDragging = false; }

  onBulkDrop(event: DragEvent): void {
    event.preventDefault();
    this.bulkDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file?.name.endsWith('.csv')) {
      this.readAndParseCsv(file);
    } else if (file) {
      this.bulkParseError = 'Please upload a .csv file.';
    }
  }

  onBulkFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.readAndParseCsv(file);
  }

  clearBulkFile(): void {
    this.bulkFile = null;
    this.bulkPreviewRows = [];
    this.bulkParseError = '';
  }

  private readAndParseCsv(file: File): void {
    this.bulkFile = file;
    this.bulkPreviewRows = [];
    this.bulkParseError = '';
    const reader = new FileReader();
    reader.onload = (e) => this.parseBulkCsv((e.target as FileReader).result as string);
    reader.onerror = () => { this.bulkParseError = 'Failed to read the file. Please try again.'; };
    reader.readAsText(file);
  }

  private parseBulkCsv(text: string): void {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      this.bulkParseError = 'File must contain a header row and at least one data row.';
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx  = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const roleIdx  = headers.indexOf('role');
    if (nameIdx === -1 || emailIdx === -1) {
      this.bulkParseError = 'CSV must include "name" and "email" columns.';
      return;
    }
    const rows: Array<{ name: string; email: string; roles: string[] }> = [];
    for (let i = 1; i < lines.length; i++) {
      const cols  = lines[i].split(',').map(c => c.trim());
      const name  = cols[nameIdx]  ?? '';
      const email = cols[emailIdx] ?? '';
      const roles = roleIdx !== -1
        ? (cols[roleIdx] ?? '').split('|').map(r => r.trim()).filter(Boolean)
        : [];
      if (name) rows.push({ name, email, roles });
    }
    if (rows.length === 0) {
      this.bulkParseError = 'No valid rows found in the file.';
      return;
    }
    this.bulkPreviewRows = rows;
  }

  submitBulkUsers(): void {
    if (!this.canSubmitBulk) return;
    let count: number;
    const expiry = this.tokenExpirationWeeks ?? 4;
    if (this.bulkFile) {
      this.identityService.addBulk(
        this.bulkPreviewRows.map(r => ({
          label: r.name,
          email: r.email,
          tokenExpirationWeeks: expiry,
          roles: r.roles
            .map(name => this.availableRoles.find(
              role => role.name.toLowerCase() === name.toLowerCase()
            )?.id)
            .filter((id): id is string => !!id),
        }))
      );
      count = this.bulkPreviewRows.length;
    } else {
      const roleIds = [...this.selectedRoleIds];
      this.identityService.addBulk(
        this.parsedManualRows.map(r => ({
          label: r.name,
          email: r.email,
          tokenExpirationWeeks: expiry,
          roles: roleIds,
        }))
      );
      count = this.parsedManualRows.length;
    }
    this.closeAddUserModal();
    this.triggerAddUserToast(count);
  }

  // ── Download tokens ───────────────────────────────────────────────────────

  downloadTokens(): void {
    const selected = this.entries.filter(e => this.selectedIds.has(e.id));
    const expiryWeeks = selected[0]?.tokenExpirationWeeks ?? 4;

    const files: { name: string; content: string }[] = selected.map(e => ({
      name: `${e.label}.jwt`,
      content: this.generateMockJwt(e),
    }));

    const exampleName = selected[0]?.label ?? 'John Smith';
    const readme = [
      'Each .jwt file in this folder is the identity token for one user.',
      `The filename matches the identity name (e.g. ${exampleName}.jwt = ${exampleName}).`,
      '',
      'IMPORTANT:',
      `- These tokens expire ${expiryWeeks} week${expiryWeeks === 1 ? '' : 's'} from download`,
      '- Each token can only be used ONCE',
      '- Run this command on each machine to enroll it:',
      '',
      `  ziti-edge-tunnel enroll --jwt "./${exampleName}.jwt" --identity /etc/ziti/identity.json`,
      '',
      'If a token is expired, go back to the portal and click "Reissue Token" for that user.',
    ].join('\n');

    files.push({ name: 'README.txt', content: readme });

    const zip = buildZip(files);
    const blob = new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwts.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  private generateMockJwt(entry: DeployedEntry): string {
    const b64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const exp = now + entry.tokenExpirationWeeks * 7 * 24 * 3600;
    const payload = b64url(JSON.stringify({
      sub: entry.label,
      email: entry.email,
      iss: 'netfoundry.io',
      iat: now,
      exp,
      jti: entry.id,
      'http://schemas.openziti.io/v1/controller': 'https://ctrl.netfoundry.io:443',
    }));
    const sig = b64url(entry.id + Math.random().toString(36).slice(2, 18));
    return `${header}.${payload}.${sig}`;
  }

  // ── Reissue token ─────────────────────────────────────────────────────────

  reissuedEntryId: string | null = null;

  reissueToken(id: string): void {
    this.identityService.reissueToken(id);
    this.menuOpenId = null;
    this.reissuedEntryId = id;
    setTimeout(() => { if (this.reissuedEntryId === id) this.reissuedEntryId = null; }, 3000);
    const entry = this.identityService.entries.find(e => e.id === id);
    if (entry) this.downloadSingleJwt(entry);
  }

  private downloadSingleJwt(entry: DeployedEntry): void {
    const blob = new Blob([this.generateMockJwt(entry)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.label}.jwt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteUser(id: string): void {
    this.identityService.remove(id);
    this.menuOpenId = null;
    if (this.selectedIds.has(id)) {
      const next = new Set(this.selectedIds);
      next.delete(id);
      this.selectedIds = next;
    }
  }

  // ── Success toast ─────────────────────────────────────────────────────────

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

  // ── Logs view ─────────────────────────────────────────────────────────────

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

  // ── Table data & filtering ────────────────────────────────────────────────

  get entries(): DeployedEntry[] { return this.identityService.entries; }

  search = '';
  connectionFilter: 'all' | 'Online' | 'Offline' = 'all';
  statusFilter: 'all' | 'Enrolled' | 'Pending' | 'Expired Token' = 'all';
  bulkReissueComplete = false;

  get expiredTokenCount(): number {
    return this.entries.filter(e => e.identityStatus === 'Expired Token').length;
  }

  bulkReissueExpiredTokens(): void {
    this.identityService.reissueExpiredTokens();
    this.bulkReissueComplete = true;
    setTimeout(() => this.bulkReissueComplete = false, 3000);
  }

  sortCol: 'label' | 'email' | 'connection' | 'identityStatus' | 'activated' | null = null;
  sortDir: 'asc' | 'desc' = 'asc';
  identitiesPage = 1;
  identitiesPageSize = 10;
  readonly identitiesPageSizeOptions = [10, 25, 50, 100];

  setSort(col: 'label' | 'email' | 'connection' | 'identityStatus' | 'activated'): void {
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
      if (this.statusFilter !== 'all' && e.identityStatus !== this.statusFilter) return false;
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
          case 'identityStatus': va = a.identityStatus;            vb = b.identityStatus;           break;
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

  // ── Display helpers ───────────────────────────────────────────────────────

  entryRoles(entry: DeployedEntry): AvailableRole[] {
    return (entry.roles ?? [])
      .map(id => this.availableRoles.find(r => r.id === id))
      .filter((r): r is AvailableRole => !!r);
  }

  roleBadgeStyle(index: number): { 'background-color': string; color: string; 'border-color': string } {
    const colors = [
      { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
      { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
      { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
      { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
    ];
    const c = colors[index % colors.length];
    return { 'background-color': c.bg, color: c.color, 'border-color': c.border };
  }

  connectorBadgeStyle(index: number): { 'background-color': string; color: string } {
    const palette = [
      { bg: '#dbeafe', color: '#1d4ed8' },
      { bg: '#dcfce7', color: '#15803d' },
      { bg: '#f3e8ff', color: '#7e22ce' },
      { bg: '#ffedd5', color: '#c2410c' },
      { bg: '#fce7f3', color: '#be185d' },
      { bg: '#ccfbf1', color: '#0f766e' },
    ];
    const c = palette[index % palette.length];
    return { 'background-color': c.bg, color: c.color };
  }
}
