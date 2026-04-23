import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';

export interface MayaDevice {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'tablet';
  os: string;
  lastSeen: string;
  status: 'active' | 'inactive';
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
  addDeviceUrlCopied = false;

  private readonly activationUrl =
    'https://enroll.acmecorp.netfoundry.io/enroll?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.acme-maya-device-token';

  openAddDevice() {
    this.showAddDevice = true;
  }

  copyDeviceUrl() {
    navigator.clipboard.writeText(this.activationUrl).then(() => {
      this.addDeviceUrlCopied = true;
      setTimeout(() => (this.addDeviceUrlCopied = false), 2000);
    });
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
