import { Injectable } from '@angular/core';

export interface ConnectorAssignment {
  id: string;
  name: string;
  apps: string[];
  status: 'Enrolled' | 'Pending' | 'Expired Token';
  activated?: string;
}

export interface DeployedEntry {
  id: string;
  label: string;
  email: string;
  token: string;
  connection: 'Online' | 'Offline';
  identityStatus: 'Enrolled' | 'Pending' | 'Expired Token';
  activated: string;
  enabled: boolean;
  tokenExpirationWeeks: number;
  connectorAssignments?: ConnectorAssignment[];
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class IdentityService {
  private readonly chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  generateToken(): string {
    const seg = (n: number) => Array.from({ length: n }, () => this.chars[Math.floor(Math.random() * this.chars.length)]).join('');
    return `${seg(8)}-${seg(4)}-${seg(4)}-${seg(4)}-${seg(12)}`;
  }

  entries: DeployedEntry[] = [
    {
      id: 'de-1', label: 'John Smith', email: 'jsmith@corp.com',
      token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', connection: 'Online',
      identityStatus: 'Enrolled', activated: 'Jan 3, 2026',
      enabled: true, tokenExpirationWeeks: 4,
      roles: ['role-it-admin'],
    },
    {
      id: 'de-2', label: 'Sarah Lee', email: 'slee@corp.com',
      token: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', connection: 'Offline',
      identityStatus: 'Enrolled', activated: '--',
      enabled: true, tokenExpirationWeeks: 4,
      roles: ['role-supervisor', 'role-end-user'],
    },
    {
      id: 'de-3', label: 'Marcus Webb', email: 'mwebb@corp.com',
      token: 'c3d4e5f6-a7b8-9012-cdef-123456789012', connection: 'Offline',
      identityStatus: 'Expired Token', activated: 'Dec 10, 2025',
      enabled: true, tokenExpirationWeeks: 4,
      roles: ['role-end-user'],
    },
  ];

  add(label: string, email: string, roles?: string[], tokenExpirationWeeks = 4): DeployedEntry {
    const entry: DeployedEntry = {
      id: 'de-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      label,
      email,
      token: this.generateToken(),
      connection: 'Offline',
      identityStatus: 'Pending',
      activated: '--',
      enabled: true,
      tokenExpirationWeeks,
      roles: roles ?? [],
    };
    this.entries.push(entry);
    return entry;
  }

  addBulk(rows: Array<{ label: string; email: string; roles?: string[]; tokenExpirationWeeks?: number }>): DeployedEntry[] {
    return rows.map(row => this.add(row.label, row.email, row.roles, row.tokenExpirationWeeks));
  }

  toggle(id: string): void {
    const entry = this.entries.find(e => e.id === id);
    if (entry) entry.enabled = !entry.enabled;
  }

  mergeRoles(ids: string[], roleIds: string[]): void {
    for (const entry of this.entries) {
      if (!ids.includes(entry.id)) continue;
      const merged = new Set([...(entry.roles ?? []), ...roleIds]);
      entry.roles = [...merged];
    }
  }

  remove(id: string): void {
    this.entries = this.entries.filter(e => e.id !== id);
  }

  reissueConnectorToken(entryId: string, assignmentId: string): void {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;
    const assignment = entry.connectorAssignments?.find(a => a.id === assignmentId);
    if (!assignment) return;
    assignment.status = 'Pending';
    entry.identityStatus = this.deriveStatus(entry.connectorAssignments!);
  }

  removeConnector(entryId: string, assignmentId: string): void {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;
    entry.connectorAssignments = entry.connectorAssignments?.filter(a => a.id !== assignmentId);
  }

  assignToConnectors(ids: string[], newAssignments: ConnectorAssignment[]): void {
    for (const entry of this.entries) {
      if (!ids.includes(entry.id)) continue;
      const existing = entry.connectorAssignments ?? [];
      const existingIds = new Set(existing.map(a => a.id));
      const toAdd = newAssignments
        .filter(a => !existingIds.has(a.id))
        .map(a => ({ ...a, status: 'Pending' as const }));
      entry.connectorAssignments = [...existing, ...toAdd];
      if (entry.identityStatus !== 'Expired Token') {
        entry.identityStatus = this.deriveStatus(entry.connectorAssignments);
        entry.token = this.generateToken();
      }
    }
  }

  private deriveStatus(assignments: ConnectorAssignment[]): 'Enrolled' | 'Pending' | 'Expired Token' {
    if (assignments.some(a => a.status === 'Expired Token')) return 'Expired Token';
    if (assignments.some(a => a.status === 'Pending')) return 'Pending';
    return 'Enrolled';
  }

  reissueToken(id: string): void {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;
    entry.identityStatus = 'Pending';
    entry.token = this.generateToken();
  }

  reissueExpiredTokens(): void {
    for (const entry of this.entries) {
      if (entry.identityStatus === 'Expired Token') {
        entry.identityStatus = 'Pending';
        entry.token = this.generateToken();
      }
    }
  }
}
