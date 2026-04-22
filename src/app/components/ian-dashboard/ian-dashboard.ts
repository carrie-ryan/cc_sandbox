import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CustomerLocationsComponent } from '../customer-locations/customer-locations';
import { CustomerIdentitiesComponent } from '../customer-users/customer-users';
import { CustomerService, Customer, CustomerIdentity } from '../../services/customer.service';
import { PersonaService } from '../../services/persona.service';
import { OnboardingService } from '../../services/onboarding.service';

export interface PendingApproval {
  id: string;
  requester: string;
  requesterRole: string;
  reason: string;
  requestedResources: string[];
  requestedDuration: string;
  requestedAt: string;
}

export interface AccessTimer {
  id: string;
  grantedTo: string;
  purpose: string;
  resources: string[];
  durationLabel: string;
  remainingSeconds: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface LicenseEntry {
  id: string;
  name: string;
  type: 'user' | 'device';
  application: string;
  enrolledAt: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

export interface TrafficFilter {
  id: string;
  name: string;
  protocol: string;
  connector: string;
  ianAllows: boolean;
}

@Component({
  selector: 'app-ian-dashboard',
  templateUrl: './ian-dashboard.html',
  imports: [FormsModule, NgTemplateOutlet, UpperCasePipe, CustomerLocationsComponent, CustomerIdentitiesComponent],
  host: { class: 'flex-1 min-h-0 overflow-hidden' },
})
export class IanDashboardComponent implements OnDestroy {
  customer: Customer;

  killSwitchActive = false;
  killSwitchConfirming = false;

  pausedLocations = new Set<string>();
  pausedConnectors = new Set<string>();

  acknowledgedAlerts = new Set<string>();
  restartingConnectors = new Set<string>();
  rotatingCredentials = new Set<string>();
  runningDiagnostics = new Set<string>();
  revokingAccess = new Set<string>();

  pendingApprovals: PendingApproval[] = [
    {
      id: 'req-001',
      requester: 'Alex Morgan',
      requesterRole: 'Provider Admin',
      reason: 'Scheduled firmware upgrade for Chicago site connectors — estimated 45 min maintenance window.',
      requestedResources: ['Chicago Gateway 1', 'Chicago Gateway 2'],
      requestedDuration: '2 hours',
      requestedAt: '8 minutes ago',
    },
    {
      id: 'req-002',
      requester: 'Sarah Chen',
      requesterRole: 'Provider Support',
      reason: 'Investigating reported latency on Austin Office — need connector log access to diagnose.',
      requestedResources: ['Austin Host 3'],
      requestedDuration: '30 minutes',
      requestedAt: '2 minutes ago',
    },
  ];
  approvedRequests = new Set<string>();
  deniedRequests = new Set<string>();

  get visibleApprovals(): PendingApproval[] {
    return this.pendingApprovals.filter(
      a => !this.approvedRequests.has(a.id) && !this.deniedRequests.has(a.id)
    );
  }

  approveRequest(id: string) { this.approvedRequests.add(id); }
  denyRequest(id: string)    { this.deniedRequests.add(id); }

  accessTimers: AccessTimer[] = [
    {
      id: 'tmr-001',
      grantedTo: 'Dell Support Tech',
      purpose: 'Hardware diagnostics — Austin server rack',
      resources: ['Austin Host 3'],
      durationLabel: '2 hours',
      remainingSeconds: 2700,
      status: 'active',
    },
    {
      id: 'tmr-002',
      grantedTo: 'Monthly Cert Rotation Script',
      purpose: 'Automated credential rotation workflow',
      resources: ['Chicago Gateway 2', 'NY Clientless 1'],
      durationLabel: '20 minutes',
      remainingSeconds: 720,
      status: 'active',
    },
  ];

  showTimerForm = false;
  newTimerGrantedTo = '';
  newTimerPurpose = '';
  newTimerResources = '';
  newTimerDuration = 60;
  private timerInterval: ReturnType<typeof setInterval>;

  get activeTimers(): AccessTimer[] {
    return this.accessTimers.filter(t => t.status === 'active');
  }

  formatRemaining(seconds: number): string {
    if (seconds <= 0) return 'Expired';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    if (m > 0) return `${m}m ${s}s remaining`;
    return `${s}s remaining`;
  }

  remainingPct(timer: AccessTimer): number {
    const totalSeconds = this.parseDurationToSeconds(timer.durationLabel);
    if (totalSeconds === 0) return 0;
    return Math.max(0, Math.min(100, (timer.remainingSeconds / totalSeconds) * 100));
  }

  private parseDurationToSeconds(label: string): number {
    if (label.includes('hour')) return parseInt(label) * 3600;
    if (label.includes('min')) return parseInt(label) * 60;
    return 3600;
  }

  revokeTimer(id: string) {
    const t = this.accessTimers.find(t => t.id === id);
    if (t) t.status = 'revoked';
  }

  submitTimerForm() {
    if (!this.newTimerGrantedTo || !this.newTimerPurpose) return;
    this.accessTimers.push({
      id: 'tmr-' + Date.now(),
      grantedTo: this.newTimerGrantedTo,
      purpose: this.newTimerPurpose,
      resources: this.newTimerResources ? this.newTimerResources.split(',').map(r => r.trim()) : ['All connectors'],
      durationLabel: this.newTimerDuration + ' minutes',
      remainingSeconds: this.newTimerDuration * 60,
      status: 'active',
    });
    this.newTimerGrantedTo = '';
    this.newTimerPurpose = '';
    this.newTimerResources = '';
    this.newTimerDuration = 60;
    this.showTimerForm = false;
  }

  trafficFilters: TrafficFilter[] = [
    { id: 'tf-001', name: 'Corporate VPN',  protocol: 'HTTPS', connector: 'Chicago Gateway 2', ianAllows: true  },
    { id: 'tf-002', name: 'SSH Tunnel',     protocol: 'SSH',   connector: 'Chicago Gateway 2', ianAllows: true  },
    { id: 'tf-003', name: 'Remote Desktop', protocol: 'RDP',   connector: 'Chicago Device 1',  ianAllows: true  },
    { id: 'tf-004', name: 'Web Portal',     protocol: 'HTTPS', connector: 'NY Clientless 1',   ianAllows: true  },
    { id: 'tf-005', name: 'Austin RDP',     protocol: 'RDP',   connector: 'Austin Host 3',     ianAllows: false },
  ];

  toggleFilter(id: string) {
    const f = this.trafficFilters.find(f => f.id === id);
    if (f) f.ianAllows = !f.ianAllows;
  }

  expandedIdentities = new Set<string>();
  resettingIdentities = new Set<string>();

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

  enrolledLicenses: LicenseEntry[] = [
    { id: 'lic-001', name: 'Alice Monroe',        type: 'user',   application: 'Corporate VPN',  enrolledAt: 'Jan 12, 2025', lastActive: '2 min ago',   status: 'active'   },
    { id: 'lic-002', name: 'Bob Carter',           type: 'user',   application: 'Remote Desktop', enrolledAt: 'Jan 15, 2025', lastActive: '5 min ago',   status: 'active'   },
    { id: 'lic-003', name: 'Carol Singh',          type: 'user',   application: 'Web Portal',     enrolledAt: 'Feb 3, 2025',  lastActive: '12 min ago',  status: 'active'   },
    { id: 'lic-004', name: 'Dave Kim',             type: 'user',   application: 'SSH Tunnel',     enrolledAt: 'Feb 8, 2025',  lastActive: '8 min ago',   status: 'active'   },
    { id: 'lic-005', name: 'Eva Torres',           type: 'user',   application: 'Corporate VPN',  enrolledAt: 'Feb 14, 2025', lastActive: '3 days ago',  status: 'inactive' },
    { id: 'lic-006', name: 'MacBook-Ops-01',       type: 'device', application: 'Corporate VPN',  enrolledAt: 'Mar 1, 2025',  lastActive: 'Just now',    status: 'active'   },
    { id: 'lic-007', name: 'WinDesk-Finance-03',   type: 'device', application: 'Finance Portal', enrolledAt: 'Mar 5, 2025',  lastActive: '1 hour ago',  status: 'active'   },
    { id: 'lic-008', name: 'iPad-Sales-12',        type: 'device', application: 'Web Portal',     enrolledAt: 'Mar 10, 2025', lastActive: '2 hours ago', status: 'active'   },
    { id: 'lic-009', name: 'WinDesk-HR-07',        type: 'device', application: 'HR Connect',     enrolledAt: 'Mar 12, 2025', lastActive: '47 days ago', status: 'inactive' },
    { id: 'lic-010', name: 'MacBook-Dev-09',       type: 'device', application: 'Dev Tools',      enrolledAt: 'Mar 15, 2025', lastActive: '30 min ago',  status: 'active'   },
    { id: 'lic-011', name: 'Frank Nguyen',         type: 'user',   application: 'Corporate VPN',  enrolledAt: 'Mar 16, 2025', lastActive: '45 min ago',  status: 'active'   },
    { id: 'lic-012', name: 'Grace Patel',          type: 'user',   application: 'Dev Tools',      enrolledAt: 'Mar 17, 2025', lastActive: '1 hour ago',  status: 'active'   },
    { id: 'lic-013', name: 'WinDesk-Legal-02',     type: 'device', application: 'Corporate VPN',  enrolledAt: 'Mar 18, 2025', lastActive: '20 min ago',  status: 'active'   },
    { id: 'lic-014', name: 'Henry Walsh',          type: 'user',   application: 'SSH Tunnel',     enrolledAt: 'Mar 19, 2025', lastActive: '6 hours ago', status: 'active'   },
    { id: 'lic-015', name: 'iPad-Exec-03',         type: 'device', application: 'Finance Portal', enrolledAt: 'Mar 19, 2025', lastActive: '4 days ago',  status: 'inactive' },
    { id: 'lic-016', name: 'Iris Chen',            type: 'user',   application: 'Web Portal',     enrolledAt: 'Mar 20, 2025', lastActive: '3 min ago',   status: 'active'   },
    { id: 'lic-017', name: 'MacBook-Sales-07',     type: 'device', application: 'Corporate VPN',  enrolledAt: 'Mar 21, 2025', lastActive: 'Just now',    status: 'active'   },
    { id: 'lic-018', name: "James O'Brien",        type: 'user',   application: 'Remote Desktop', enrolledAt: 'Mar 21, 2025', lastActive: '2 hours ago', status: 'active'   },
    { id: 'lic-019', name: 'WinDesk-Ops-11',       type: 'device', application: 'SSH Tunnel',     enrolledAt: 'Mar 22, 2025', lastActive: '15 min ago',  status: 'active'   },
    { id: 'lic-020', name: 'Karen Liu',            type: 'user',   application: 'HR Connect',     enrolledAt: 'Mar 22, 2025', lastActive: '31 days ago', status: 'inactive' },
    { id: 'lic-021', name: 'MacBook-Eng-14',       type: 'device', application: 'Dev Tools',      enrolledAt: 'Mar 23, 2025', lastActive: '10 min ago',  status: 'active'   },
    { id: 'lic-022', name: 'Liam Foster',          type: 'user',   application: 'Corporate VPN',  enrolledAt: 'Mar 23, 2025', lastActive: '55 min ago',  status: 'active'   },
    { id: 'lic-023', name: 'WinDesk-Marketing-04', type: 'device', application: 'Web Portal',     enrolledAt: 'Mar 24, 2025', lastActive: '3 hours ago', status: 'active'   },
    { id: 'lic-024', name: 'Mia Rossi',            type: 'user',   application: 'Finance Portal', enrolledAt: 'Mar 24, 2025', lastActive: 'Just now',    status: 'active'   },
    { id: 'lic-025', name: 'iPad-Field-08',        type: 'device', application: 'Corporate VPN',  enrolledAt: 'Mar 25, 2025', lastActive: '58 days ago', status: 'inactive' },
  ];
  revokingLicenses = new Set<string>();
  licensesPage = 1;
  readonly licensesPageSize = 10;

  get checklistCompletedCount(): number {
    return [
      true,
      this.onboardingService.setupReviewed(),
      this.onboardingService.connectorsAdded(),
      this.onboardingService.hostedAppsConfigured(),
    ].filter(Boolean).length;
  }

  get licenseWarning(): boolean {
    return this.customer.licensesUsed / this.customer.licensesTotal >= 0.8;
  }

  get licensesPct(): number {
    return Math.round((this.customer.licensesUsed / this.customer.licensesTotal) * 100);
  }

  get pagedLicenses(): LicenseEntry[] {
    const start = (this.licensesPage - 1) * this.licensesPageSize;
    return this.enrolledLicenses.slice(start, start + this.licensesPageSize);
  }

  get licensesTotalPages(): number {
    return Math.ceil(this.enrolledLicenses.length / this.licensesPageSize);
  }

  prevLicensePage() {
    if (this.licensesPage > 1) this.licensesPage--;
  }

  nextLicensePage() {
    if (this.licensesPage < this.licensesTotalPages) this.licensesPage++;
  }

  revokeLicense(id: string) {
    this.revokingLicenses.add(id);
    setTimeout(() => {
      this.enrolledLicenses = this.enrolledLicenses.filter(l => l.id !== id);
      if (this.licensesPage > this.licensesTotalPages) this.licensesPage = this.licensesTotalPages;
      this.revokingLicenses.delete(id);
    }, 1500);
  }

  activeSection: 'overview' | 'connectors' | 'audit' | 'alerts' | 'access' | 'licenses' | 'locations' | 'identities' = 'overview';

  get alertBadge(): number { return this.visibleAlerts.length; }
  get connectorBadge(): number { return this.degradedConnectors + this.offlineConnectors; }
  get accessBadge(): number { return this.visibleApprovals.length; }

  exitImpersonation() {
    const customerId = this.personaService.impersonatedCustomerId();
    this.personaService.endImpersonation();
    this.router.navigate(['/customers', customerId]);
  }

  constructor(private customerService: CustomerService, public personaService: PersonaService, public onboardingService: OnboardingService, private router: Router) {
    this.customer = this.customerService.getById('acme-corp')!;
    this.timerInterval = setInterval(() => {
      this.accessTimers.forEach(t => {
        if (t.status === 'active' && t.remainingSeconds > 0) {
          t.remainingSeconds--;
        } else if (t.status === 'active' && t.remainingSeconds === 0) {
          t.status = 'expired';
        }
      });
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  get onlineConnectors(): number {
    return this.customer.connectorList.filter(c => c.status === 'Online').length;
  }

  get degradedConnectors(): number {
    return this.customer.connectorList.filter(c => c.status === 'Degraded').length;
  }

  get offlineConnectors(): number {
    return this.customer.connectorList.filter(c => c.status === 'Offline').length;
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
  auditSortCol: 'entity' | 'type' | 'throughput' | 'lastSeen' | 'status' | null = null;
  auditSortDir: 'asc' | 'desc' = 'asc';

  resetAuditPage() { this.auditPage = 1; }

  setAuditSort(col: 'entity' | 'type' | 'throughput' | 'lastSeen' | 'status') {
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
        case 'throughput':
          return (this.parseThroughput(a.throughputSent) - this.parseThroughput(b.throughputSent)) * dir;
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

  get visibleAlerts() {
    return this.customer.alerts.filter(a => !this.acknowledgedAlerts.has(a.resource));
  }

  triggerKillSwitch() {
    if (!this.killSwitchConfirming) {
      this.killSwitchConfirming = true;
      return;
    }
    this.killSwitchActive = !this.killSwitchActive;
    this.killSwitchConfirming = false;
    if (this.killSwitchActive) {
      this.pausedLocations.clear();
      this.pausedConnectors.clear();
    }
  }

  cancelKillSwitch() {
    this.killSwitchConfirming = false;
  }

  toggleLocationPause(locationId: string) {
    if (this.pausedLocations.has(locationId)) {
      this.pausedLocations.delete(locationId);
    } else {
      this.pausedLocations.add(locationId);
    }
  }

  isLocationPaused(locationId: string): boolean {
    return this.killSwitchActive || this.pausedLocations.has(locationId);
  }

  toggleConnectorPause(connectorId: string) {
    if (this.pausedConnectors.has(connectorId)) {
      this.pausedConnectors.delete(connectorId);
    } else {
      this.pausedConnectors.add(connectorId);
    }
  }

  isConnectorPaused(connectorId: string): boolean {
    return this.killSwitchActive || this.pausedConnectors.has(connectorId);
  }

  acknowledgeAlert(resource: string) {
    this.acknowledgedAlerts.add(resource);
  }

  restartConnector(resource: string) {
    this.restartingConnectors.add(resource);
    setTimeout(() => this.restartingConnectors.delete(resource), 4000);
  }

  rotateCredentials(resource: string) {
    this.rotatingCredentials.add(resource);
    setTimeout(() => this.rotatingCredentials.delete(resource), 4000);
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

  runAlertDiagnostics(resource: string) {
    this.runningDiagnostics.add(resource);
    setTimeout(() => this.runningDiagnostics.delete(resource), 4000);
  }

  revokeAccess(resource: string) {
    this.revokingAccess.add(resource);
    setTimeout(() => {
      this.revokingAccess.delete(resource);
      this.acknowledgedAlerts.add(resource);
    }, 2000);
  }

  ianNotifMode: 'quiet' | 'focused' | 'standard' = 'standard';
  ianQuietHours = { enabled: false, from: '22:00', to: '08:00' };
  ianNotifChannels = { email: true, slack: true };
  ianNotifAlerts = {
    connectorDown: true,
    connectorDegraded: true,
    newIdentityEnrolled: true,
    securityAlert: true,
    accessRequestPending: true,
    licenseThreshold: false,
    maintenanceWindow: false,
  };
  ianNotifSaved = false;

  saveIanNotifPrefs() {
    this.ianNotifSaved = true;
    setTimeout(() => {
      this.ianNotifSaved = false;
      this.personaService.showSettings.set(false);
    }, 800);
  }
}
