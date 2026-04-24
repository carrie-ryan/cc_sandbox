import { Component, HostListener, inject } from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, CustomerIdentity } from '../../services/customer.service';
import { NetworkMapComponent } from '../network-map/network-map';

@Component({
  selector: 'app-customer-live-audit',
  standalone: true,
  imports: [NgTemplateOutlet, UpperCasePipe, FormsModule, NetworkMapComponent],
  templateUrl: './customer-live-audit.html',
})
export class CustomerLiveAuditComponent {
  private readonly customerService = inject(CustomerService);
  readonly customer = this.customerService.getById('acme-corp')!;

  viewMode: 'split' | 'map' | 'table' = 'split';
  readonly locations = this.customer.locationList;
  readonly connectors = this.customer.connectorList;

  mapHeight = 320;
  private dragging = false;
  private dragStartY = 0;
  private dragStartHeight = 0;

  onDragStart(event: MouseEvent): void {
    this.dragging = true;
    this.dragStartY = event.clientY;
    this.dragStartHeight = this.mapHeight;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    const delta = event.clientY - this.dragStartY;
    this.mapHeight = Math.min(600, Math.max(150, this.dragStartHeight + delta));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.dragging = false;
  }

  get activeIdentities(): number {
    return this.customer.identityList.filter(i => i.status === 'Connected').length;
  }

  auditSearch = '';
  auditTypeFilter: string = '';
  auditStatusFilter: string = '';
  auditWarningsOnly = false;
  auditPage = 1;
  readonly auditPageSize = 10;
  auditSortCol: 'entity' | 'type' | 'usage' | 'lastSeen' | 'status' | null = null;
  auditSortDir: 'asc' | 'desc' = 'asc';

  resetAuditPage() { this.auditPage = 1; }

  setAuditSort(col: 'entity' | 'type' | 'usage' | 'lastSeen' | 'status') {
    if (this.auditSortCol === col) {
      this.auditSortDir = this.auditSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.auditSortCol = col;
      this.auditSortDir = 'asc';
    }
    this.auditPage = 1;
  }

  private parseRelativeTime(s: string): number {
    if (!s || s === 'Just now') return 0;
    const m = s.match(/^(\d+)\s*(sec|min|hour|day)/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    if (m[2] === 'sec')  return n / 60;
    if (m[2] === 'min')  return n;
    if (m[2] === 'hour') return n * 60;
    return n * 1440;
  }

  private parseThroughput(s: string): number {
    if (!s || s === '—') return 0;
    const m = s.match(/([\d.]+)\s*(MB|GB)/);
    if (!m) return 0;
    return parseFloat(m[1]) * (m[2] === 'GB' ? 1024 : 1);
  }

  get filteredIdentities() {
    const search = this.auditSearch.toLowerCase().trim();
    const list = this.customer.identityList.filter(i => {
      if (search && !i.name.toLowerCase().includes(search)) return false;
      if (this.auditTypeFilter && i.type !== this.auditTypeFilter) return false;
      if (this.auditStatusFilter && i.status !== this.auditStatusFilter) return false;
      if (this.auditWarningsOnly && i.droppedPackets === 0 && i.droppedConnections === 0) return false;
      return true;
    });

    if (!this.auditSortCol) return list;

    const dir = this.auditSortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (this.auditSortCol) {
        case 'entity': {
          const nameA = a.type === 'user' && a.device ? `${a.name}'s ${a.device}` : a.name;
          const nameB = b.type === 'user' && b.device ? `${b.name}'s ${b.device}` : b.name;
          return nameA.localeCompare(nameB) * dir;
        }
        case 'type':
          return a.type.localeCompare(b.type) * dir;
        case 'usage':
          return (this.parseThroughput(a.usageBandwidth ?? '') - this.parseThroughput(b.usageBandwidth ?? '')) * dir;
        case 'lastSeen':
          return (this.parseRelativeTime(a.lastConnected) - this.parseRelativeTime(b.lastConnected)) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        default:
          return 0;
      }
    });
  }

  get auditPageCount() {
    return Math.max(1, Math.ceil(this.filteredIdentities.length / this.auditPageSize));
  }

  get auditPages(): number[] {
    return Array.from({ length: this.auditPageCount }, (_, i) => i + 1);
  }

  get auditPageStart(): number {
    return (this.auditPage - 1) * this.auditPageSize + 1;
  }

  get auditPageEnd(): number {
    return Math.min(this.auditPage * this.auditPageSize, this.filteredIdentities.length);
  }

  get pagedIdentities() {
    const start = (this.auditPage - 1) * this.auditPageSize;
    return this.filteredIdentities.slice(start, start + this.auditPageSize);
  }

  expandedIdentities = new Set<string>();
  resettingIdentities = new Set<string>();
  restartingConnectors = new Set<string>();
  identityDiagState = new Map<string, 'running' | 'done'>();
  identityDiagSteps = new Map<string, { label: string; state: 'pending' | 'running' | 'done' | 'warn' | 'fail' }[]>();
  identityDiagResult = new Map<string, { type: 'ok' | 'warn' | 'fail'; headline: string; body: string }>();

  toggleIdentityExpand(id: string) {
    if (this.expandedIdentities.has(id)) {
      this.expandedIdentities.delete(id);
    } else {
      this.expandedIdentities.add(id);
    }
  }

  resetSession(id: string) {
    this.resettingIdentities.add(id);
    setTimeout(() => {
      this.resettingIdentities.delete(id);
      this.expandedIdentities.delete(id);
    }, 3000);
  }

  restartConnector(resource: string) {
    this.restartingConnectors.add(resource);
    setTimeout(() => this.restartingConnectors.delete(resource), 4000);
  }

  runDiagnostics(identity: CustomerIdentity) {
    const isNetworkResource = identity.type === 'gateway' || identity.type === 'clientless' || identity.type === 'sdk';
    const steps = isNetworkResource
      ? [
          { label: 'Pinging connector endpoint',     state: 'pending' as const },
          { label: 'Checking tunnel integrity',      state: 'pending' as const },
          { label: 'Measuring packet loss rate',     state: 'pending' as const },
          { label: 'Verifying service reachability', state: 'pending' as const },
          { label: 'Inspecting dropped connections', state: 'pending' as const },
        ]
      : [
          { label: 'Resolving identity endpoint',    state: 'pending' as const },
          { label: 'Testing gateway latency',        state: 'pending' as const },
          { label: 'Checking for packet loss',       state: 'pending' as const },
          { label: 'Verifying bound service access', state: 'pending' as const },
          { label: 'Inspecting session health',      state: 'pending' as const },
        ];

    this.identityDiagSteps.set(identity.id, steps);
    this.identityDiagState.set(identity.id, 'running');
    this.identityDiagResult.delete(identity.id);

    let i = 0;
    const isCritical = identity.droppedConnections >= 3;
    const isWarning  = !isCritical && (identity.droppedConnections > 0 || identity.droppedPackets > 0);

    const tick = () => {
      const currentSteps = this.identityDiagSteps.get(identity.id)!;
      if (i >= currentSteps.length) {
        this.identityDiagState.set(identity.id, 'done');
        this.identityDiagResult.set(identity.id, this.buildIdentityDiagResult(identity));
        return;
      }
      currentSteps[i].state = 'running';
      setTimeout(() => {
        if (isCritical) {
          currentSteps[i].state = (i >= 2) ? 'fail' : 'done';
        } else if (isWarning) {
          currentSteps[i].state = (i === 2 || i === 4) ? 'warn' : 'done';
        } else {
          currentSteps[i].state = 'done';
        }
        i++;
        tick();
      }, 600);
    };
    tick();
  }

  private buildIdentityDiagResult(identity: CustomerIdentity): { type: 'ok' | 'warn' | 'fail'; headline: string; body: string } {
    const { droppedPackets, droppedConnections, type, name } = identity;
    const isNetworkResource = type === 'gateway' || type === 'clientless' || type === 'sdk';
    if (droppedConnections >= 3) {
      return {
        type: 'fail',
        headline: `${name} has critical connection failures`,
        body: `${droppedConnections} dropped connections and elevated packet loss were detected. ${isNetworkResource ? 'The connector is likely unable to reach its target service reliably — a restart is recommended.' : 'This session is degraded and likely causing access failures. Resetting the session should restore connectivity.'}`,
      };
    }
    if (droppedConnections > 0) {
      return {
        type: 'warn',
        headline: 'Intermittent connection drops detected',
        body: `One dropped connection was found alongside packet loss on ${name}. This may indicate brief network instability on the path. Monitor closely — if it recurs, ${isNetworkResource ? 'restarting the connector' : 'resetting the session'} should resolve it.`,
      };
    }
    if (droppedPackets >= 10) {
      return {
        type: 'warn',
        headline: 'High packet loss — connection is degraded',
        body: `${droppedPackets} dropped packets were detected on ${name}. The connection is still active but degraded. ${isNetworkResource ? 'Consider restarting the connector to establish a cleaner path.' : 'Resetting the session may resolve the packet loss.'}`,
      };
    }
    return {
      type: 'warn',
      headline: 'Minor packet loss — within tolerance',
      body: `${droppedPackets} dropped packet${droppedPackets > 1 ? 's' : ''} detected on ${name}. This is within normal range and no action is needed right now. Continue monitoring — if this number grows, ${isNetworkResource ? 'a connector restart' : 'a session reset'} is the recommended next step.`,
    };
  }

  siemEnabled = true;
  siemStatus: 'connected' | 'disconnected' | 'error' = 'connected';
  siemProtocol: 'syslog' | 'webhook' | 'cef' = 'webhook';
  siemEndpoint = 'https://ingest.splunk.acmecorp.com/services/collector';
  siemLastSync = '2 minutes ago';
  siemEditing = false;
  siemEndpointDraft = '';
  siemProtocolDraft: 'syslog' | 'webhook' | 'cef' = 'webhook';
  exporting: 'csv' | 'json' | null = null;

  toggleSiemStream() {
    this.siemEnabled = !this.siemEnabled;
    this.siemStatus = this.siemEnabled ? 'connected' : 'disconnected';
  }

  openSiemEdit() {
    this.siemEndpointDraft = this.siemEndpoint;
    this.siemProtocolDraft = this.siemProtocol;
    this.siemEditing = true;
  }

  saveSiemConfig() {
    this.siemEndpoint = this.siemEndpointDraft;
    this.siemProtocol = this.siemProtocolDraft;
    this.siemEditing = false;
    this.siemStatus = 'connected';
    this.siemLastSync = 'Just now';
  }

  exportLogs(format: 'csv' | 'json') {
    this.exporting = format;
    setTimeout(() => this.exporting = null, 2500);
  }
}
