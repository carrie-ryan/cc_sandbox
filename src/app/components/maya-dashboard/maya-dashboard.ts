import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';

export interface MayaDevice {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'tablet';
  os: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'pending';
  token?: string;
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
  selector: 'app-maya-dashboard',
  templateUrl: './maya-dashboard.html',
  imports: [FormsModule],
  host: { class: 'flex-1 min-h-0 overflow-hidden' },
})
export class MayaDashboardComponent {
  mayaDevices: MayaDevice[] = [
    { id: 'dev-001', name: "Maya's MacBook Pro",  type: 'laptop', os: 'macOS Sequoia',   lastSeen: 'Just now',     status: 'active'   },
    { id: 'dev-002', name: "Maya's iPhone 15",    type: 'phone',  os: 'iOS 18',          lastSeen: '3 hours ago',  status: 'active'   },
    { id: 'dev-003', name: 'Old Work Laptop',      type: 'laptop', os: 'Windows 10',      lastSeen: '47 days ago',  status: 'inactive' },
  ];

  showAddDevice = false;
  removingDeviceId: string | null = null;

  openAddDevice() {
    this.showAddDevice = true;
  }

  downloadJwt() {
    const blob = new Blob([''], { type: 'application/jwt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activation.jwt';
    a.click();
    URL.revokeObjectURL(url);
  }

  submitActivationToken() {
    this.mayaDevices = [
      ...this.mayaDevices,
      {
        id: 'dev-' + Date.now(),
        name: 'New Device',
        type: 'laptop',
        os: 'Pending activation',
        lastSeen: 'Just now',
        status: 'pending',
      },
    ];
    this.showAddDevice = false;
  }

  acceptDevice(id: string) {
    const device = this.mayaDevices.find(d => d.id === id);
    if (device) {
      device.status = 'active';
      device.os = device.type === 'phone' ? 'iOS 18'
                : device.type === 'tablet' ? 'iPadOS 18'
                : 'macOS Sequoia';
    }
  }

  rejectDevice(id: string) {
    this.mayaDevices = this.mayaDevices.filter(d => d.id !== id);
  }

  confirmRemoveDevice(id: string) { this.removingDeviceId = id; }
  cancelRemoveDevice()             { this.removingDeviceId = null; }
  removeDevice(id: string) {
    this.mayaDevices = this.mayaDevices.filter(d => d.id !== id);
    this.removingDeviceId = null;
  }

  mayaApps: MayaApp[] = [
    { id: 'app-001', name: 'Corporate Network',   description: 'Secure tunnel to the company network',       category: 'Network',   iconColor: 'text-blue-600',   iconBg: 'bg-blue-50',   status: 'active'    },
    { id: 'app-002', name: 'Internal Web Portal', description: 'Company intranet and shared resources',      category: 'Web App',   iconColor: 'text-violet-600', iconBg: 'bg-violet-50', status: 'available' },
    { id: 'app-003', name: 'HR Connect',          description: 'Benefits, time-off, and HR self-service',    category: 'Web App',   iconColor: 'text-pink-600',   iconBg: 'bg-pink-50',   status: 'available' },
    { id: 'app-004', name: 'Dev Tools',           description: 'Code repos, project tracking, and CI/CD',    category: 'Developer', iconColor: 'text-teal-600',   iconBg: 'bg-teal-50',   status: 'available' },
    { id: 'app-005', name: 'Shared Drives',       description: 'Team file storage and document sharing',     category: 'Files',     iconColor: 'text-amber-600',  iconBg: 'bg-amber-50',  status: 'available' },
  ];

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

  mayaDiagState: 'idle' | 'running' | 'done' = 'idle';
  mayaDiagSteps: { label: string; state: 'pending' | 'running' | 'done' | 'warn' | 'fail' }[] = [];
  mayaDiagResult: { type: 'ok' | 'warn' | 'fail'; headline: string; body: string } | null = null;

  runMayaDiagnostics() {
    this.mayaDiagState = 'running';
    this.mayaDiagResult = null;
    this.mayaDiagSteps = [
      { label: 'Resolving DNS',              state: 'pending' },
      { label: 'Testing latency to gateway', state: 'pending' },
      { label: 'Checking for packet loss',   state: 'pending' },
      { label: 'Verifying gateway health',   state: 'pending' },
      { label: 'Analyzing throughput',       state: 'pending' },
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
    setTimeout(() => {
      this.mayaNotifSaved = false;
      this.personaService.showSettings.set(false);
    }, 800);
  }

  constructor(public personaService: PersonaService) {}
}
