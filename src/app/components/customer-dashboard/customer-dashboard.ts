import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { CustomerService, Customer } from '../../services/customer.service';
import { PersonaService } from '../../services/persona.service';

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

export interface MayaDevice {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'tablet';
  os: string;
  lastSeen: string;
  status: 'active' | 'inactive';
}

export interface MayaApp {
  id: string;
  name: string;
  description: string;
  category: string;
  iconColor: string;
  iconBg: string;
  status: 'available' | 'active' | 'unavailable';
}

export interface MayaConnection {
  status: 'connected' | 'degraded' | 'disconnected';
  service: string;
  via: string;
  location: string;
  latency: string;
  throughput: string;
  sessionStart: string;
  sessionDuration: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.html',
  imports: [FormsModule, UpperCasePipe],
  host: { class: 'flex-1 min-h-0 overflow-hidden' },
})
export class CustomerDashboardComponent implements OnDestroy {
  customer: Customer;

  // Maya's enrolled devices
  mayaDevices: MayaDevice[] = [
    { id: 'dev-001', name: 'Maya\'s MacBook Pro',  type: 'laptop', os: 'macOS Sequoia',   lastSeen: 'Just now',     status: 'active'   },
    { id: 'dev-002', name: 'Maya\'s iPhone 15',    type: 'phone',  os: 'iOS 18',          lastSeen: '3 hours ago',  status: 'active'   },
    { id: 'dev-003', name: 'Old Work Laptop',      type: 'laptop', os: 'Windows 10',      lastSeen: '47 days ago',  status: 'inactive' },
  ];

  showAddDevice = false;
  newDeviceName = '';
  newDeviceType: 'laptop' | 'phone' | 'tablet' = 'laptop';
  addDeviceStep: 'form' | 'waiting' | 'done' = 'form';
  removingDeviceId: string | null = null;

  openAddDevice() {
    this.newDeviceName = '';
    this.newDeviceType = 'laptop';
    this.addDeviceStep = 'form';
    this.showAddDevice = true;
  }

  sendEnrollmentLink() {
    if (!this.newDeviceName) return;
    this.addDeviceStep = 'waiting';
    setTimeout(() => {
      this.mayaDevices = [
        ...this.mayaDevices,
        {
          id: 'dev-' + Date.now(),
          name: this.newDeviceName,
          type: this.newDeviceType,
          os: this.newDeviceType === 'laptop' ? 'Pending enrollment' : 'Pending enrollment',
          lastSeen: 'Just enrolled',
          status: 'active',
        },
      ];
      this.addDeviceStep = 'done';
    }, 3000);
  }

  confirmRemoveDevice(id: string) { this.removingDeviceId = id; }
  cancelRemoveDevice()             { this.removingDeviceId = null; }
  removeDevice(id: string) {
    this.mayaDevices = this.mayaDevices.filter(d => d.id !== id);
    this.removingDeviceId = null;
  }

  // Maya's authorized apps
  mayaApps: MayaApp[] = [
    { id: 'app-001', name: 'Corporate Network', description: 'Secure tunnel to the company network',       category: 'Network',       iconColor: 'text-blue-600',   iconBg: 'bg-blue-50',   status: 'active'     },
    { id: 'app-002', name: 'Internal Web Portal', description: 'Company intranet and shared resources',    category: 'Web App',       iconColor: 'text-violet-600', iconBg: 'bg-violet-50', status: 'available'  },
    { id: 'app-003', name: 'HR Connect',          description: 'Benefits, time-off, and HR self-service',  category: 'Web App',       iconColor: 'text-pink-600',   iconBg: 'bg-pink-50',   status: 'available'  },
    { id: 'app-004', name: 'Dev Tools',           description: 'Code repos, project tracking, and CI/CD',  category: 'Developer',     iconColor: 'text-teal-600',   iconBg: 'bg-teal-50',   status: 'available'  },
    { id: 'app-005', name: 'Shared Drives',       description: 'Team file storage and document sharing',   category: 'Files',         iconColor: 'text-amber-600',  iconBg: 'bg-amber-50',  status: 'available'  },
    { id: 'app-006', name: 'Finance Portal',      description: 'Expense reports and budget dashboards',    category: 'Web App',       iconColor: 'text-green-600',  iconBg: 'bg-green-50',  status: 'unavailable'},
  ];

  // Maya's personal connection state
  mayaConnection: MayaConnection = {
    status: 'connected',
    service: 'Corporate Network',
    via: 'Chicago Gateway 2',
    location: 'Chicago HQ',
    latency: '12 ms',
    throughput: '2.4 MB/s',
    sessionStart: '9:02 AM',
    sessionDuration: '2h 34m',
  };

  // Maya diagnostics
  mayaDiagState: 'idle' | 'running' | 'done' = 'idle';
  mayaDiagSteps: { label: string; state: 'pending' | 'running' | 'done' | 'warn' | 'fail' }[] = [];
  mayaDiagResult: { type: 'ok' | 'warn' | 'fail'; headline: string; body: string } | null = null;

  runMayaDiagnostics() {
    this.mayaDiagState = 'running';
    this.mayaDiagResult = null;
    this.mayaDiagSteps = [
      { label: 'Resolving DNS',                  state: 'pending' },
      { label: 'Testing latency to gateway',     state: 'pending' },
      { label: 'Checking for packet loss',       state: 'pending' },
      { label: 'Verifying gateway health',       state: 'pending' },
      { label: 'Analyzing throughput',           state: 'pending' },
    ];
    let i = 0;
    const tick = () => {
      if (i >= this.mayaDiagSteps.length) {
        this.mayaDiagState = 'done';
        this.mayaDiagResult = this.buildDiagResult();
        return;
      }
      this.mayaDiagSteps[i].state = 'running';
      setTimeout(() => {
        const s = this.mayaConnection.status;
        const step = this.mayaDiagSteps[i];
        if (s === 'connected')      { step.state = 'done'; }
        else if (s === 'degraded')  { step.state = (i === 1 || i === 2) ? 'warn' : 'done'; }
        else                        { step.state = (i >= 2) ? 'fail' : 'done'; }
        i++;
        tick();
      }, 650);
    };
    tick();
  }

  private buildDiagResult(): { type: 'ok' | 'warn' | 'fail'; headline: string; body: string } {
    const s = this.mayaConnection.status;
    if (s === 'connected') {
      return {
        type: 'ok',
        headline: 'Everything looks good',
        body: `Latency is ${this.mayaConnection.latency} (excellent) and no packet loss was detected. ${this.mayaConnection.via} is responding normally. If a specific app still feels slow, the issue is likely on that app's server — not your connection.`,
      };
    }
    if (s === 'degraded') {
      return {
        type: 'warn',
        headline: 'Elevated latency on your gateway',
        body: `We detected higher-than-normal latency and some packet loss on ${this.mayaConnection.via}. This is likely causing the slowness you're experiencing. Your IT team has been notified. Try closing and reopening the affected app — if it continues, reconnecting may help.`,
      };
    }
    return {
      type: 'fail',
      headline: `Can't reach ${this.mayaConnection.via}`,
      body: `The gateway your connection routes through appears to be offline or unreachable. This is preventing access to network resources. Please contact your IT administrator or try again in a few minutes.`,
    };
  }

  // Maya notification preferences
  mayaNotifMode: 'quiet' | 'focused' | 'standard' = 'focused';
  mayaQuietHours = { enabled: true, from: '22:00', to: '08:00' };
  mayaNotifChannels = { email: true, slack: false };
  mayaNotifAlerts = {
    connectionDropped: true,
    connectionDegraded: true,
    deviceEnrolled: true,
    securityAlert: true,
    sessionExpiring: false,
    maintenance: false,
  };
  mayaNotifSaved = false;

  saveMayaNotifPrefs() {
    this.mayaNotifSaved = true;
    setTimeout(() => this.mayaNotifSaved = false, 2000);
  }

  killSwitchActive = false;
  killSwitchConfirming = false;

  pausedLocations = new Set<string>();
  pausedConnectors = new Set<string>();

  // Alert action state
  acknowledgedAlerts = new Set<string>();
  restartingConnectors = new Set<string>();
  rotatingCredentials = new Set<string>();
  runningDiagnostics = new Set<string>();
  revokingAccess = new Set<string>();

  // I-6: Provider session approvals
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

  // I-5: One-time access timers
  accessTimers: AccessTimer[] = [
    {
      id: 'tmr-001',
      grantedTo: 'Dell Support Tech',
      purpose: 'Hardware diagnostics — Austin server rack',
      resources: ['Austin Host 3'],
      durationLabel: '2 hours',
      remainingSeconds: 2700, // 45 min remaining
      status: 'active',
    },
    {
      id: 'tmr-002',
      grantedTo: 'Monthly Cert Rotation Script',
      purpose: 'Automated credential rotation workflow',
      resources: ['Chicago Gateway 2', 'NY Clientless 1'],
      durationLabel: '20 minutes',
      remainingSeconds: 720, // 12 min remaining
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

  // I-7: Traffic filters
  trafficFilters: TrafficFilter[] = [
    { id: 'tf-001', name: 'Corporate VPN',   protocol: 'HTTPS', connector: 'Chicago Gateway 2', ianAllows: true  },
    { id: 'tf-002', name: 'SSH Tunnel',       protocol: 'SSH',   connector: 'Chicago Gateway 2', ianAllows: true  },
    { id: 'tf-003', name: 'Remote Desktop',   protocol: 'RDP',   connector: 'Chicago Device 1',  ianAllows: true  },
    { id: 'tf-004', name: 'Web Portal',       protocol: 'HTTPS', connector: 'NY Clientless 1',   ianAllows: true  },
    { id: 'tf-005', name: 'Austin RDP',       protocol: 'RDP',   connector: 'Austin Host 3',     ianAllows: false },
  ];

  toggleFilter(id: string) {
    const f = this.trafficFilters.find(f => f.id === id);
    if (f) f.ianAllows = !f.ianAllows;
  }

  // Identity error inspection
  expandedIdentities = new Set<string>();
  resettingIdentities = new Set<string>();

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

  diagnosisFor(droppedPackets: number, droppedConnections: number, type: string): string {
    if (droppedConnections >= 3) {
      return `This ${type} has dropped ${droppedConnections} active connection${droppedConnections > 1 ? 's' : ''} and is losing packets. It is likely unable to reliably reach its target service. A restart is recommended.`;
    }
    if (droppedConnections > 0) {
      return `One dropped connection detected alongside packet loss. This may indicate brief network instability. Monitor closely — if it recurs, reset the session.`;
    }
    if (droppedPackets >= 10) {
      return `High packet loss detected (${droppedPackets} packets dropped). The connection is degraded but still active. Consider resetting the session to establish a cleaner path.`;
    }
    return `Minor packet loss detected (${droppedPackets} packet${droppedPackets > 1 ? 's' : ''} dropped). No immediate action needed — this is within normal tolerance. Monitor if it continues to grow.`;
  }

  // I-8: SIEM export & streaming
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

  // Licenses
  enrolledLicenses: LicenseEntry[] = [
    { id: 'lic-001', name: 'Alice Monroe',        type: 'user',   application: 'Corporate VPN',   enrolledAt: 'Jan 12, 2025', lastActive: '2 min ago',    status: 'active'   },
    { id: 'lic-002', name: 'Bob Carter',           type: 'user',   application: 'Remote Desktop',  enrolledAt: 'Jan 15, 2025', lastActive: '5 min ago',    status: 'active'   },
    { id: 'lic-003', name: 'Carol Singh',          type: 'user',   application: 'Web Portal',      enrolledAt: 'Feb 3, 2025',  lastActive: '12 min ago',   status: 'active'   },
    { id: 'lic-004', name: 'Dave Kim',             type: 'user',   application: 'SSH Tunnel',      enrolledAt: 'Feb 8, 2025',  lastActive: '8 min ago',    status: 'active'   },
    { id: 'lic-005', name: 'Eva Torres',           type: 'user',   application: 'Corporate VPN',   enrolledAt: 'Feb 14, 2025', lastActive: '3 days ago',   status: 'inactive' },
    { id: 'lic-006', name: 'MacBook-Ops-01',       type: 'device', application: 'Corporate VPN',   enrolledAt: 'Mar 1, 2025',  lastActive: 'Just now',     status: 'active'   },
    { id: 'lic-007', name: 'WinDesk-Finance-03',   type: 'device', application: 'Finance Portal',  enrolledAt: 'Mar 5, 2025',  lastActive: '1 hour ago',   status: 'active'   },
    { id: 'lic-008', name: 'iPad-Sales-12',        type: 'device', application: 'Web Portal',      enrolledAt: 'Mar 10, 2025', lastActive: '2 hours ago',  status: 'active'   },
    { id: 'lic-009', name: 'WinDesk-HR-07',        type: 'device', application: 'HR Connect',      enrolledAt: 'Mar 12, 2025', lastActive: '47 days ago',  status: 'inactive' },
    { id: 'lic-010', name: 'MacBook-Dev-09',       type: 'device', application: 'Dev Tools',       enrolledAt: 'Mar 15, 2025', lastActive: '30 min ago',   status: 'active'   },
    { id: 'lic-011', name: 'Frank Nguyen',         type: 'user',   application: 'Corporate VPN',   enrolledAt: 'Mar 16, 2025', lastActive: '45 min ago',   status: 'active'   },
    { id: 'lic-012', name: 'Grace Patel',          type: 'user',   application: 'Dev Tools',       enrolledAt: 'Mar 17, 2025', lastActive: '1 hour ago',   status: 'active'   },
    { id: 'lic-013', name: 'WinDesk-Legal-02',     type: 'device', application: 'Corporate VPN',   enrolledAt: 'Mar 18, 2025', lastActive: '20 min ago',   status: 'active'   },
    { id: 'lic-014', name: 'Henry Walsh',          type: 'user',   application: 'SSH Tunnel',      enrolledAt: 'Mar 19, 2025', lastActive: '6 hours ago',  status: 'active'   },
    { id: 'lic-015', name: 'iPad-Exec-03',         type: 'device', application: 'Finance Portal',  enrolledAt: 'Mar 19, 2025', lastActive: '4 days ago',   status: 'inactive' },
    { id: 'lic-016', name: 'Iris Chen',            type: 'user',   application: 'Web Portal',      enrolledAt: 'Mar 20, 2025', lastActive: '3 min ago',    status: 'active'   },
    { id: 'lic-017', name: 'MacBook-Sales-07',     type: 'device', application: 'Corporate VPN',   enrolledAt: 'Mar 21, 2025', lastActive: 'Just now',     status: 'active'   },
    { id: 'lic-018', name: 'James O\'Brien',       type: 'user',   application: 'Remote Desktop',  enrolledAt: 'Mar 21, 2025', lastActive: '2 hours ago',  status: 'active'   },
    { id: 'lic-019', name: 'WinDesk-Ops-11',       type: 'device', application: 'SSH Tunnel',      enrolledAt: 'Mar 22, 2025', lastActive: '15 min ago',   status: 'active'   },
    { id: 'lic-020', name: 'Karen Liu',            type: 'user',   application: 'HR Connect',      enrolledAt: 'Mar 22, 2025', lastActive: '31 days ago',  status: 'inactive' },
    { id: 'lic-021', name: 'MacBook-Eng-14',       type: 'device', application: 'Dev Tools',       enrolledAt: 'Mar 23, 2025', lastActive: '10 min ago',   status: 'active'   },
    { id: 'lic-022', name: 'Liam Foster',          type: 'user',   application: 'Corporate VPN',   enrolledAt: 'Mar 23, 2025', lastActive: '55 min ago',   status: 'active'   },
    { id: 'lic-023', name: 'WinDesk-Marketing-04', type: 'device', application: 'Web Portal',      enrolledAt: 'Mar 24, 2025', lastActive: '3 hours ago',  status: 'active'   },
    { id: 'lic-024', name: 'Mia Rossi',            type: 'user',   application: 'Finance Portal',  enrolledAt: 'Mar 24, 2025', lastActive: 'Just now',     status: 'active'   },
    { id: 'lic-025', name: 'iPad-Field-08',        type: 'device', application: 'Corporate VPN',   enrolledAt: 'Mar 25, 2025', lastActive: '58 days ago',  status: 'inactive' },
  ];
  revokingLicenses = new Set<string>();
  licensesPage = 1;
  readonly licensesPageSize = 10;

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

  // Navigation
  activeSection: 'overview' | 'connectors' | 'audit' | 'alerts' | 'access' | 'licenses' | 'locations' = 'overview';

  get alertBadge(): number { return this.visibleAlerts.length; }
  get connectorBadge(): number { return this.degradedConnectors + this.offlineConnectors; }
  get accessBadge(): number { return this.visibleApprovals.length; }

  // Shared helpers
  constructor(private customerService: CustomerService, public personaService: PersonaService) {
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

  runDiagnostics(resource: string) {
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
}
