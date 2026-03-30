import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CustomerConnector {
  id: string;
  name: string;
  type: string;
  template: string;
  hostedApps: number;
  status: 'Online' | 'Degraded' | 'Offline';
  uptime: string;
  lastConnected: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: CustomerConnector[];
}

@Component({
  selector: 'app-customer-locations',
  imports: [RouterLink, FormsModule],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  showAddConnectorModal = false;
  activeLocationId: string | null = null;
  pausedConnectors = new Set<string>();

  connectorName = '';
  connectorType = '';
  selectedTemplate = 'No Template';
  saveAsTemplate = false;

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type'];
  expanded: { [id: string]: boolean } = { 'cloc-1': true };

  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  locations: CustomerLocation[] = [
    {
      id: 'cloc-1',
      name: 'Riverside Main Clinic',
      address: '789 Medical Plaza',
      addressSub: 'Portland, OR 97201',
      licensesAllocated: 20,
      connectors: [
        { id: 'c1',  name: 'Reception Workstation', type: 'Device',    template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c2',  name: 'Billing Terminal',       type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.7%', lastConnected: '3 mins ago' },
        { id: 'c3',  name: 'Clinic Gateway',         type: 'Gateway',   template: 'Secure Gateway', hostedApps: 4, status: 'Degraded', uptime: '97.2%', lastConnected: '12 mins ago' },
        { id: 'c4',  name: 'Patient Portal',         type: 'Clientless',template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.8%', lastConnected: '1 min ago' },
        { id: 'c5',  name: 'Admin Workstation',      type: 'Device',    template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.5%', lastConnected: '5 mins ago' },
        { id: 'c6',  name: 'Lab Terminal',           type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.9%', lastConnected: '2 mins ago' },
        { id: 'c13', name: 'Pharmacy Terminal',      type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.6%', lastConnected: '4 mins ago' },
        { id: 'c14', name: 'Imaging Workstation',    type: 'Device',    template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.8%', lastConnected: 'Just now' },
        { id: 'c15', name: 'Scheduling Terminal',    type: 'Device',    template: '--',             hostedApps: 1, status: 'Offline',  uptime: '0%',    lastConnected: '2 hrs ago' },
        { id: 'c16', name: 'EHR Workstation 1',      type: 'Device',    template: 'Standard Device',hostedApps: 3, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c17', name: 'EHR Workstation 2',      type: 'Device',    template: 'Standard Device',hostedApps: 3, status: 'Online',   uptime: '99.7%', lastConnected: '6 mins ago' },
        { id: 'c18', name: 'Telehealth Kiosk',       type: 'Clientless',template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.4%', lastConnected: '8 mins ago' },
        { id: 'c19', name: 'Break Room Terminal',    type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '98.9%', lastConnected: '11 mins ago' },
        { id: 'c20', name: 'Nurses Station 1',       type: 'Device',    template: 'Standard Device',hostedApps: 2, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c21', name: 'Nurses Station 2',       type: 'Device',    template: 'Standard Device',hostedApps: 2, status: 'Online',   uptime: '99.8%', lastConnected: '2 mins ago' },
        { id: 'c22', name: 'Supply Room Terminal',   type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.3%', lastConnected: '15 mins ago' },
        { id: 'c23', name: 'Security Workstation',   type: 'Device',    template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
      ],
    },
    {
      id: 'cloc-2',
      name: 'Riverside Urgent Care',
      address: '456 Healthcare Way',
      addressSub: 'Beaverton, OR 97005',
      licensesAllocated: 15,
      connectors: [
        { id: 'c7',  name: 'Triage Station',       type: 'Device',     template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.6%', lastConnected: '2 mins ago' },
        { id: 'c8',  name: 'UC Gateway',            type: 'Gateway',    template: 'Secure Gateway', hostedApps: 3, status: 'Online',   uptime: '99.1%', lastConnected: '5 mins ago' },
        { id: 'c9',  name: 'Check-in Kiosk',        type: 'Device',     template: '--',             hostedApps: 1, status: 'Online',   uptime: '98.8%', lastConnected: '3 mins ago' },
        { id: 'c10', name: 'Nurse Station',         type: 'Device',     template: '--',             hostedApps: 2, status: 'Degraded', uptime: '96.4%', lastConnected: '18 mins ago' },
        { id: 'c11', name: 'Radiology Terminal',    type: 'Device',     template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.5%', lastConnected: 'Just now' },
        { id: 'c24', name: 'Exam Room 1 Terminal',  type: 'Device',     template: 'Standard Device',hostedApps: 1, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c25', name: 'Exam Room 2 Terminal',  type: 'Device',     template: 'Standard Device',hostedApps: 1, status: 'Online',   uptime: '99.7%', lastConnected: '4 mins ago' },
        { id: 'c26', name: 'Waiting Room Kiosk',    type: 'Clientless', template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.3%', lastConnected: '7 mins ago' },
        { id: 'c27', name: 'Lab Workstation',       type: 'Device',     template: '--',             hostedApps: 2, status: 'Online',   uptime: '99.8%', lastConnected: '1 min ago' },
        { id: 'c28', name: 'Billing Terminal',      type: 'Device',     template: '--',             hostedApps: 1, status: 'Offline',  uptime: '0%',    lastConnected: '3 hrs ago' },
        { id: 'c29', name: 'EHR Workstation',       type: 'Device',     template: 'Standard Device',hostedApps: 3, status: 'Online',   uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c30', name: 'Pharmacy Terminal',     type: 'Device',     template: '--',             hostedApps: 1, status: 'Online',   uptime: '99.2%', lastConnected: '9 mins ago' },
        { id: 'c31', name: 'Supply Terminal',       type: 'Device',     template: '--',             hostedApps: 1, status: 'Online',   uptime: '98.6%', lastConnected: '14 mins ago' },
      ],
    },
    {
      id: 'cloc-3',
      name: 'Riverside Admin Office',
      address: '123 Business Center',
      addressSub: 'Portland, OR 97201',
      licensesAllocated: 5,
      connectors: [
        { id: 'c12', name: 'Admin Workstation',    type: 'Device', template: '--',             hostedApps: 3, status: 'Online', uptime: '99.7%', lastConnected: '3 mins ago' },
        { id: 'c32', name: 'HR Terminal',          type: 'Device', template: '--',             hostedApps: 2, status: 'Online', uptime: '99.4%', lastConnected: '6 mins ago' },
        { id: 'c33', name: 'Finance Workstation',  type: 'Device', template: 'Standard Device',hostedApps: 2, status: 'Online', uptime: '99.9%', lastConnected: 'Just now' },
        { id: 'c34', name: 'Executive Workstation',type: 'Device', template: '--',             hostedApps: 1, status: 'Online', uptime: '99.1%', lastConnected: '10 mins ago' },
      ],
    },
  ];

  get totalLicenses(): number {
    return this.locations.reduce((sum, loc) => sum + loc.licensesAllocated, 0);
  }

  get usedLicenses(): number {
    return this.locations.reduce((sum, loc) => sum + loc.connectors.length, 0);
  }

  get availableLicenses(): number {
    return this.totalLicenses - this.usedLicenses;
  }

  get licenseWarning(): boolean {
    return this.totalLicenses > 0 && this.usedLicenses / this.totalLicenses >= 0.8;
  }

  get licenseUsagePct(): number {
    return this.totalLicenses > 0 ? Math.round((this.usedLicenses / this.totalLicenses) * 100) : 0;
  }

  get activeLocation(): CustomerLocation | null {
    return this.locations.find(l => l.id === this.activeLocationId) ?? null;
  }

  connectorTypeColor(type: string): string {
    const map: { [key: string]: string } = {
      'Device': 'bg-blue-100 text-blue-700',
      'Gateway': 'bg-green-100 text-green-700',
      'Clientless': 'bg-purple-100 text-purple-700',
      'SDK Embedded': 'bg-orange-100 text-orange-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  toggleExpand(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  toggleConnectorPause(id: string): void {
    if (this.pausedConnectors.has(id)) {
      this.pausedConnectors.delete(id);
    } else {
      this.pausedConnectors.add(id);
    }
  }

  isConnectorPaused(id: string): boolean {
    return this.pausedConnectors.has(id);
  }

  openAddConnector(locationId: string): void {
    this.activeLocationId = locationId;
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.showAddConnectorModal = true;
  }

  closeAddConnector(): void {
    this.showAddConnectorModal = false;
    this.activeLocationId = null;
  }
}
