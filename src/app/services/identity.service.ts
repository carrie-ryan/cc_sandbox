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
  enrollmentStatus: 'Enrolled' | 'Pending' | 'Expired Token';
  activated: string;
  connectorAssignments?: ConnectorAssignment[];
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
      id: 'de-1', label: "John Smith's Mobile", email: 'jsmith@corp.com',
      token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', connection: 'Online',
      enrollmentStatus: 'Pending', activated: 'Jan 3, 2026',
      connectorAssignments: [
        { id: 'Chicago-Dev-01', name: 'Chicago Device 1',  apps: ['RDP'],   status: 'Enrolled',      activated: 'Jan 3, 2026'  },
        { id: 'Chicago-GW-02',  name: 'Chicago Gateway 2', apps: ['HTTPS'], status: 'Pending',       activated: '--'           },
      ],
    },
    { id: 'de-2', label: "Sarah Lee's Laptop",    email: 'slee@corp.com',    token: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', connection: 'Offline', enrollmentStatus: 'Pending',       activated: '--'           },
    { id: 'de-3', label: "Marcus Webb's Desktop", email: 'mwebb@corp.com',   token: 'c3d4e5f6-a7b8-9012-cdef-123456789012', connection: 'Offline', enrollmentStatus: 'Expired Token', activated: 'Dec 10, 2025' },
  ];

  add(label: string, email: string): void {
    this.entries.push({
      id: 'de-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      label,
      email,
      token: this.generateToken(),
      connection: 'Offline',
      enrollmentStatus: 'Pending',
      activated: '--',
    });
  }

  addBulk(rows: Array<{ label: string; email: string }>): void {
    for (const row of rows) {
      this.add(row.label, row.email);
    }
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
      entry.enrollmentStatus = this.deriveStatus(entry.connectorAssignments);
      entry.token = this.generateToken();
    }
  }

  private deriveStatus(assignments: ConnectorAssignment[]): 'Enrolled' | 'Pending' | 'Expired Token' {
    if (assignments.some(a => a.status === 'Expired Token')) return 'Expired Token';
    if (assignments.some(a => a.status === 'Pending')) return 'Pending';
    return 'Enrolled';
  }

  reissueExpiredTokens(): void {
    for (const entry of this.entries) {
      if (entry.enrollmentStatus === 'Expired Token') {
        entry.enrollmentStatus = 'Pending';
        entry.token = this.generateToken();
      }
    }
  }
}
