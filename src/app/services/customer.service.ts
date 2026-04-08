import { Injectable } from '@angular/core';

export interface Alert {
  resource: string;
  resourceIcon: 'gateway' | 'device' | 'connector';
  description: string;
  createdAt: string;
  type: string;
  typeIcon: 'connectivity' | 'certificate' | 'performance' | 'auth';
}

export type ConnectorIconType = 'gateway' | 'device' | 'clientless' | 'sdk';

export interface CustomerConnection {
  source: string;
  sourceType: ConnectorIconType;
  destination: string;
  destinationType: ConnectorIconType;
  app: string;
  throughput: string;
  throughputPct: number;
  status: 'Connected' | 'Idle' | 'Disconnected';
}

export interface CustomerLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  connectors: number;
  activeConnections: number;
  usageBandwidth: string;
  usagePct: number;
  status: 'Online' | 'Degraded' | 'Offline';
}

export type UserRole = 'operator' | 'monitor' | 'custom';
export type PermissionLevel = 'manage' | 'read-only';

export interface UserPermissions {
  locations?: PermissionLevel;
  connectors?: PermissionLevel;
  workflows?: PermissionLevel;
  users?: PermissionLevel;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string;
  permissions: UserPermissions;
}

export interface BoundService {
  name: string;
  role: 'dial' | 'bind';
}

export interface CustomerIdentity {
  id: string;
  name: string;
  type: 'user' | 'device' | 'service';
  status: 'Connected' | 'Disconnected';
  boundServices: BoundService[];
  lastConnected: string;
  requestsSent: number;
  requestsReceived: number;
  bandwidthSent: string;
  bandwidthReceived: string;
  bandwidthSentPct: number;
  bandwidthReceivedPct: number;
  throughputSent: string;
  throughputReceived: string;
  droppedPackets: number;
  droppedConnections: number;
  uptime?: string;
  usageBandwidth?: string;
  usagePct?: number;
  connectorStatus?: 'Online' | 'Degraded' | 'Offline';
}

export interface CustomerConnector {
  id: string;
  name: string;
  type: 'gateway' | 'device' | 'clientless' | 'sdk' | 'connector';
  location: string;
  connectors: number;
  usageBandwidth: string;
  usagePct: number;
  version: string;
  uptime: string;
  lastSeen: string;
  status: 'Online' | 'Degraded' | 'Offline';
  template: string;
  hostedApps: string[];
}

export interface Customer {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  status: 'Active' | 'Degraded' | 'Inactive';
  locations: number;
  connectors: number;
  activeConnections: number;
  bandwidthUsed: string;
  uptime: string;
  licensesUsed: number;
  licensesTotal: number;
  alertSeverity: 'Critical' | 'Warning' | 'None';
  alerts: Alert[];
  locationList: CustomerLocation[];
  connectorList: CustomerConnector[];
  connectionList: CustomerConnection[];
  identityList: CustomerIdentity[];
  userList: CustomerUser[];
  bandwidthHistory: { tx: number[]; rx: number[] };
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private customers: Customer[] = [
    {
      id: 'acme-corp',
      name: 'Acme Corp', initials: 'AC', avatarBg: 'bg-blue-500',
      status: 'Active', locations: 4, connectors: 18, activeConnections: 214, bandwidthUsed: '980 GB', uptime: '99.98%', licensesUsed: 214, licensesTotal: 250,
      alertSeverity: 'Critical',
      alerts: [
        { resource: 'Chicago-GW-01', resourceIcon: 'gateway', description: 'Connector has been offline for 2 hours', createdAt: '2 hours ago', type: 'Connectivity', typeIcon: 'connectivity' },
        { resource: 'Austin-Host-03', resourceIcon: 'device', description: 'SSL certificate has expired', createdAt: '45 minutes ago', type: 'Certificate Expired', typeIcon: 'certificate' },
      ],
      locationList: [
        { id: 'LOC-001', name: 'Chicago HQ', city: 'Chicago', country: 'US', connectors: 6, activeConnections: 98, usageBandwidth: '412 GB', usagePct: 88, status: 'Online' },
        { id: 'LOC-002', name: 'Austin Office', city: 'Austin', country: 'US', connectors: 4, activeConnections: 52, usageBandwidth: '284 GB', usagePct: 61, status: 'Degraded' },
        { id: 'LOC-003', name: 'New York DC', city: 'New York', country: 'US', connectors: 5, activeConnections: 64, usageBandwidth: '198 GB', usagePct: 43, status: 'Online' },
        { id: 'LOC-004', name: 'London Office', city: 'London', country: 'UK', connectors: 3, activeConnections: 0, usageBandwidth: '86 GB', usagePct: 18, status: 'Offline' },
      ],
      connectorList: [
        { id: 'Chicago-GW-01', name: 'Chicago Gateway 1', type: 'gateway', location: 'Chicago HQ', connectors: 2, usageBandwidth: '150 GB', usagePct: 32, version: '3.4.1', uptime: '0%', lastSeen: '2 hours ago', status: 'Offline', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'Chicago-GW-02', name: 'Chicago Gateway 2', type: 'gateway', location: 'Chicago HQ', connectors: 2, usageBandwidth: '180 GB', usagePct: 41, version: '3.4.1', uptime: '99.99%', lastSeen: '30 sec ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS', 'SSH'] },
        { id: 'Chicago-Dev-01', name: 'Chicago Device 1', type: 'device', location: 'Chicago HQ', connectors: 2, usageBandwidth: '82 GB', usagePct: 15, version: '3.3.8', uptime: '99.95%', lastSeen: '1 min ago', status: 'Online', template: '--', hostedApps: ['RDP'] },
        { id: 'Austin-Host-03', name: 'Austin Host 3', type: 'device', location: 'Austin Office', connectors: 4, usageBandwidth: '284 GB', usagePct: 61, version: '3.4.0', uptime: '97.20%', lastSeen: '12 min ago', status: 'Degraded', template: 'Warehouse Device', hostedApps: ['RDP', 'SSH'] },
        { id: 'NY-CL-01', name: 'New York Clientless 1', type: 'clientless', location: 'New York DC', connectors: 5, usageBandwidth: '198 GB', usagePct: 43, version: '3.4.1', uptime: '100%', lastSeen: 'Just now', status: 'Online', template: 'Web Portal', hostedApps: ['HTTPS'] },
        { id: 'London-GW-01', name: 'London Gateway 1', type: 'gateway', location: 'London Office', connectors: 2, usageBandwidth: '60 GB', usagePct: 13, version: '3.4.1', uptime: '0%', lastSeen: '3 days ago', status: 'Offline', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'London-Dev-01', name: 'London Device 1', type: 'device', location: 'London Office', connectors: 1, usageBandwidth: '26 GB', usagePct: 5, version: '3.4.0', uptime: '0%', lastSeen: '3 days ago', status: 'Offline', template: '--', hostedApps: ['RDP'] },
      ],
      connectionList: [
        { source: 'MacBook-Alice', sourceType: 'device', destination: 'Chicago-GW-02', destinationType: 'gateway', app: 'Corporate VPN', throughput: '14.2 MB/s', throughputPct: 92, status: 'Connected' },
        { source: 'Win-Bob-PC', sourceType: 'device', destination: 'Austin-Host-03', destinationType: 'device', app: 'Remote Desktop', throughput: '3.1 MB/s', throughputPct: 41, status: 'Connected' },
        { source: 'iPhone-Carol', sourceType: 'sdk', destination: 'NY-CL-01', destinationType: 'clientless', app: 'Web Portal', throughput: '0.4 MB/s', throughputPct: 18, status: 'Idle' },
        { source: 'MacBook-Dave', sourceType: 'device', destination: 'Chicago-GW-02', destinationType: 'gateway', app: 'SSH Tunnel', throughput: '0.1 MB/s', throughputPct: 8, status: 'Connected' },
      ],
      identityList: [
        { id: 'id-001', name: 'Alice Monroe', type: 'user', status: 'Connected', boundServices: [{ name: 'Corporate VPN', role: 'dial' }], lastConnected: '2 min ago', requestsSent: 1420, requestsReceived: 892, bandwidthSent: '2.1 GB', bandwidthReceived: '8.4 GB', bandwidthSentPct: 42, bandwidthReceivedPct: 78, throughputSent: '14.2 MB/s', throughputReceived: '18.6 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.95%', usageBandwidth: '10.5 GB', usagePct: 22, connectorStatus: 'Online' },
        { id: 'id-002', name: 'Bob Carter', type: 'user', status: 'Connected', boundServices: [{ name: 'Remote Desktop', role: 'dial' }], lastConnected: '5 min ago', requestsSent: 340, requestsReceived: 210, bandwidthSent: '0.8 GB', bandwidthReceived: '3.2 GB', bandwidthSentPct: 18, bandwidthReceivedPct: 34, throughputSent: '3.1 MB/s', throughputReceived: '4.2 MB/s', droppedPackets: 2, droppedConnections: 0, uptime: '97.20%', usageBandwidth: '4.0 GB', usagePct: 10, connectorStatus: 'Degraded' },
        { id: 'id-003', name: 'Carol Singh', type: 'user', status: 'Connected', boundServices: [{ name: 'Web Portal', role: 'dial' }], lastConnected: '12 min ago', requestsSent: 88, requestsReceived: 54, bandwidthSent: '0.1 GB', bandwidthReceived: '0.3 GB', bandwidthSentPct: 6, bandwidthReceivedPct: 9, throughputSent: '0.4 MB/s', throughputReceived: '0.6 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.99%', usageBandwidth: '0.4 GB', usagePct: 4, connectorStatus: 'Online' },
        { id: 'id-004', name: 'Dave Kim', type: 'user', status: 'Connected', boundServices: [{ name: 'SSH Tunnel', role: 'dial' }, { name: 'Corporate VPN', role: 'dial' }], lastConnected: '8 min ago', requestsSent: 212, requestsReceived: 180, bandwidthSent: '0.05 GB', bandwidthReceived: '0.1 GB', bandwidthSentPct: 4, bandwidthReceivedPct: 6, throughputSent: '0.1 MB/s', throughputReceived: '0.2 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '97.20%', usageBandwidth: '0.15 GB', usagePct: 2, connectorStatus: 'Degraded' },
        { id: 'id-005', name: 'Chicago Gateway 1', type: 'service', status: 'Disconnected', boundServices: [{ name: 'Corporate VPN', role: 'bind' }, { name: 'SSH Tunnel', role: 'bind' }], lastConnected: '2 hours ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 14, droppedConnections: 3, uptime: '0%', usageBandwidth: '0 GB', usagePct: 0, connectorStatus: 'Offline' },
        { id: 'id-006', name: 'NY Web Portal', type: 'service', status: 'Connected', boundServices: [{ name: 'Web Portal', role: 'bind' }], lastConnected: 'Just now', requestsSent: 9240, requestsReceived: 4120, bandwidthSent: '12.4 GB', bandwidthReceived: '24.8 GB', bandwidthSentPct: 88, bandwidthReceivedPct: 94, throughputSent: '8.2 MB/s', throughputReceived: '16.4 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.98%', usageBandwidth: '198 GB', usagePct: 43, connectorStatus: 'Online' },
      ],
      userList: [
        { id: 'usr-001', name: 'Alice Monroe', email: 'alice@provider.com', role: 'operator', location: 'Chicago HQ', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'Bob Carter', email: 'bob@provider.com', role: 'monitor', location: 'Austin Office', permissions: { locations: 'read-only', connectors: 'read-only' } },
        { id: 'usr-003', name: 'Carol Singh', email: 'carol@provider.com', role: 'custom', location: 'New York DC', permissions: { connectors: 'manage', workflows: 'read-only' } },
        { id: 'usr-004', name: 'Dave Kim', email: 'dave@provider.com', role: 'custom', location: 'Chicago HQ', permissions: { locations: 'read-only', connectors: 'manage', workflows: 'manage' } },
        { id: 'usr-005', name: 'Eva Torres', email: 'eva@provider.com', role: 'monitor', location: 'London Office', permissions: { locations: 'read-only', connectors: 'read-only', workflows: 'read-only' } },
      ],
      bandwidthHistory: {
        tx: [8,9,11,10,12,7,6,9,10,11,10,12,11,9,8,10,11,12,10,9,8,7,9,10,11,10,12,11,9,8],
        rx: [20,22,25,23,28,16,14,21,23,26,24,28,26,22,19,23,26,28,24,22,19,16,21,23,26,24,28,26,22,19],
      },
    },
    {
      id: 'umbrella-systems',
      name: 'Umbrella Systems', initials: 'US', avatarBg: 'bg-indigo-500',
      status: 'Active', locations: 6, connectors: 31, activeConnections: 512, bandwidthUsed: '2.1 TB', uptime: '100%', licensesUsed: 512, licensesTotal: 600,
      alertSeverity: 'None', alerts: [],
      locationList: [
        { id: 'LOC-001', name: 'San Francisco HQ', city: 'San Francisco', country: 'US', connectors: 8, activeConnections: 142, usageBandwidth: '680 GB', usagePct: 92, status: 'Online' },
        { id: 'LOC-002', name: 'Seattle DC', city: 'Seattle', country: 'US', connectors: 6, activeConnections: 98, usageBandwidth: '510 GB', usagePct: 74, status: 'Online' },
        { id: 'LOC-003', name: 'Denver Office', city: 'Denver', country: 'US', connectors: 5, activeConnections: 87, usageBandwidth: '390 GB', usagePct: 61, status: 'Online' },
        { id: 'LOC-004', name: 'Toronto Office', city: 'Toronto', country: 'CA', connectors: 4, activeConnections: 76, usageBandwidth: '275 GB', usagePct: 48, status: 'Online' },
        { id: 'LOC-005', name: 'Frankfurt DC', city: 'Frankfurt', country: 'DE', connectors: 5, activeConnections: 64, usageBandwidth: '182 GB', usagePct: 35, status: 'Online' },
        { id: 'LOC-006', name: 'Singapore DC', city: 'Singapore', country: 'SG', connectors: 3, activeConnections: 45, usageBandwidth: '94 GB', usagePct: 22, status: 'Online' },
      ],
      connectorList: [
        { id: 'SF-GW-01', name: 'SF Gateway 1', type: 'gateway', location: 'San Francisco HQ', connectors: 4, usageBandwidth: '360 GB', usagePct: 48, version: '3.4.1', uptime: '100%', lastSeen: 'Just now', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS', 'SSH'] },
        { id: 'SF-GW-02', name: 'SF Gateway 2', type: 'gateway', location: 'San Francisco HQ', connectors: 4, usageBandwidth: '320 GB', usagePct: 44, version: '3.4.1', uptime: '100%', lastSeen: 'Just now', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'SEA-GW-01', name: 'Seattle Gateway 1', type: 'gateway', location: 'Seattle DC', connectors: 6, usageBandwidth: '510 GB', usagePct: 74, version: '3.4.1', uptime: '100%', lastSeen: '1 min ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS', 'RDP'] },
        { id: 'DEN-CL-01', name: 'Denver Clientless 1', type: 'clientless', location: 'Denver Office', connectors: 5, usageBandwidth: '390 GB', usagePct: 61, version: '3.4.0', uptime: '99.99%', lastSeen: '2 min ago', status: 'Online', template: 'Web Portal', hostedApps: ['HTTPS'] },
        { id: 'TOR-GW-01', name: 'Toronto Gateway 1', type: 'gateway', location: 'Toronto Office', connectors: 2, usageBandwidth: '150 GB', usagePct: 27, version: '3.4.1', uptime: '100%', lastSeen: '5 min ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'TOR-Dev-01', name: 'Toronto Device 1', type: 'device', location: 'Toronto Office', connectors: 2, usageBandwidth: '125 GB', usagePct: 21, version: '3.4.0', uptime: '99.90%', lastSeen: '3 min ago', status: 'Online', template: '--', hostedApps: ['RDP'] },
        { id: 'FRA-GW-01', name: 'Frankfurt Gateway 1', type: 'gateway', location: 'Frankfurt DC', connectors: 5, usageBandwidth: '182 GB', usagePct: 35, version: '3.4.1', uptime: '100%', lastSeen: '30 sec ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'SIN-GW-01', name: 'Singapore Gateway 1', type: 'gateway', location: 'Singapore DC', connectors: 2, usageBandwidth: '60 GB', usagePct: 15, version: '3.4.1', uptime: '100%', lastSeen: '1 min ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'SIN-Dev-01', name: 'Singapore Device 1', type: 'device', location: 'Singapore DC', connectors: 1, usageBandwidth: '34 GB', usagePct: 7, version: '3.4.0', uptime: '99.80%', lastSeen: '4 min ago', status: 'Online', template: '--', hostedApps: ['SSH'] },
      ],
      connectionList: [
        { source: 'Linux-Ops-01', sourceType: 'device', destination: 'SF-GW-01', destinationType: 'gateway', app: 'SSH Bastion', throughput: '2.1 MB/s', throughputPct: 55, status: 'Connected' },
        { source: 'MacBook-Admin', sourceType: 'device', destination: 'SEA-GW-01', destinationType: 'gateway', app: 'Admin Console', throughput: '8.4 MB/s', throughputPct: 78, status: 'Connected' },
        { source: 'Win-Dev-04', sourceType: 'sdk', destination: 'DEN-CL-01', destinationType: 'clientless', app: 'Dev Workspace', throughput: '1.2 MB/s', throughputPct: 34, status: 'Connected' },
      ],
      identityList: [
        { id: 'id-001', name: 'Ops Linux Node', type: 'device', status: 'Connected', boundServices: [{ name: 'SSH Bastion', role: 'dial' }], lastConnected: 'Just now', requestsSent: 4820, requestsReceived: 3210, bandwidthSent: '18.2 GB', bandwidthReceived: '42.6 GB', bandwidthSentPct: 74, bandwidthReceivedPct: 88, throughputSent: '2.1 MB/s', throughputReceived: '5.4 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '100%', usageBandwidth: '360 GB', usagePct: 48, connectorStatus: 'Online' },
        { id: 'id-002', name: 'Admin MacBook', type: 'device', status: 'Connected', boundServices: [{ name: 'Admin Console', role: 'dial' }], lastConnected: '1 min ago', requestsSent: 2140, requestsReceived: 1860, bandwidthSent: '8.4 GB', bandwidthReceived: '22.1 GB', bandwidthSentPct: 58, bandwidthReceivedPct: 72, throughputSent: '8.4 MB/s', throughputReceived: '11.2 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '100%', usageBandwidth: '320 GB', usagePct: 44, connectorStatus: 'Online' },
        { id: 'id-003', name: 'Dev Windows 04', type: 'device', status: 'Connected', boundServices: [{ name: 'Dev Workspace', role: 'dial' }], lastConnected: '3 min ago', requestsSent: 680, requestsReceived: 420, bandwidthSent: '2.8 GB', bandwidthReceived: '6.4 GB', bandwidthSentPct: 34, bandwidthReceivedPct: 46, throughputSent: '1.2 MB/s', throughputReceived: '2.8 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '100%', usageBandwidth: '510 GB', usagePct: 74, connectorStatus: 'Online' },
        { id: 'id-004', name: 'SF Gateway 1', type: 'service', status: 'Connected', boundServices: [{ name: 'SSH Bastion', role: 'bind' }], lastConnected: 'Just now', requestsSent: 14200, requestsReceived: 9800, bandwidthSent: '42.0 GB', bandwidthReceived: '86.4 GB', bandwidthSentPct: 92, bandwidthReceivedPct: 96, throughputSent: '12.4 MB/s', throughputReceived: '24.8 MB/s', droppedPackets: 0, droppedConnections: 0 },
        { id: 'id-005', name: 'Denver Dev Portal', type: 'service', status: 'Connected', boundServices: [{ name: 'Dev Workspace', role: 'bind' }], lastConnected: '2 min ago', requestsSent: 5640, requestsReceived: 3120, bandwidthSent: '14.6 GB', bandwidthReceived: '28.2 GB', bandwidthSentPct: 68, bandwidthReceivedPct: 74, throughputSent: '4.8 MB/s', throughputReceived: '9.2 MB/s', droppedPackets: 1, droppedConnections: 0 },
      ],
      userList: [
        { id: 'usr-001', name: 'Raj Patel', email: 'raj@provider.com', role: 'operator', location: 'San Francisco HQ', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'Nina Frost', email: 'nina@provider.com', role: 'operator', location: 'Seattle DC', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'read-only' } },
        { id: 'usr-003', name: 'Omar Hassan', email: 'omar@provider.com', role: 'monitor', location: 'Frankfurt DC', permissions: { locations: 'read-only', connectors: 'read-only' } },
        { id: 'usr-004', name: 'Lena Bauer', email: 'lena@provider.com', role: 'custom', location: 'Toronto Office', permissions: { workflows: 'manage', connectors: 'read-only' } },
        { id: 'usr-005', name: 'Sven Lindqvist', email: 'sven@provider.com', role: 'monitor', location: 'Singapore DC', permissions: { locations: 'read-only', connectors: 'read-only', workflows: 'read-only' } },
        { id: 'usr-006', name: 'Priya Nair', email: 'priya@provider.com', role: 'custom', location: 'Denver Office', permissions: { connectors: 'manage', workflows: 'manage', users: 'read-only' } },
      ],
      bandwidthHistory: {
        tx: [18,20,23,21,25,14,12,19,21,24,22,26,24,20,17,21,24,26,22,20,17,14,19,21,24,22,26,24,20,17],
        rx: [44,48,54,50,58,34,28,46,50,56,52,60,56,48,42,50,56,60,52,48,42,34,46,50,56,52,60,56,48,42],
      },
    },
    {
      id: 'globex-industries',
      name: 'Globex Industries', initials: 'GI', avatarBg: 'bg-violet-500',
      status: 'Active', locations: 2, connectors: 9, activeConnections: 87, bandwidthUsed: '420 GB', uptime: '99.95%', licensesUsed: 87, licensesTotal: 200,
      alertSeverity: 'Warning',
      alerts: [
        { resource: 'NY-Edge-01', resourceIcon: 'gateway', description: 'High latency detected — avg 320ms', createdAt: '18 minutes ago', type: 'Performance', typeIcon: 'performance' },
      ],
      locationList: [
        { id: 'LOC-001', name: 'New York Office', city: 'New York', country: 'US', connectors: 5, activeConnections: 54, usageBandwidth: '247 GB', usagePct: 67, status: 'Degraded' },
        { id: 'LOC-002', name: 'Miami Branch', city: 'Miami', country: 'US', connectors: 4, activeConnections: 33, usageBandwidth: '173 GB', usagePct: 44, status: 'Online' },
      ],
      connectorList: [
        { id: 'NY-Edge-01', name: 'NY Edge 1', type: 'gateway', location: 'New York Office', connectors: 3, usageBandwidth: '140 GB', usagePct: 38, version: '3.3.9', uptime: '97.40%', lastSeen: '18 min ago', status: 'Degraded', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'NY-Dev-01', name: 'NY Device 1', type: 'device', location: 'New York Office', connectors: 2, usageBandwidth: '107 GB', usagePct: 29, version: '3.4.1', uptime: '99.99%', lastSeen: '1 min ago', status: 'Online', template: '--', hostedApps: ['RDP'] },
        { id: 'MIA-GW-01', name: 'Miami Gateway 1', type: 'gateway', location: 'Miami Branch', connectors: 4, usageBandwidth: '173 GB', usagePct: 44, version: '3.4.1', uptime: '100%', lastSeen: 'Just now', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
      ],
      connectionList: [
        { source: 'MacBook-John', sourceType: 'device', destination: 'NY-Dev-01', destinationType: 'device', app: 'Internal Apps', throughput: '5.3 MB/s', throughputPct: 64, status: 'Connected' },
        { source: 'iPad-Sarah', sourceType: 'sdk', destination: 'MIA-GW-01', destinationType: 'gateway', app: 'File Share', throughput: '2.1 MB/s', throughputPct: 38, status: 'Idle' },
      ],
      identityList: [
        { id: 'id-001', name: 'John Reyes', type: 'user', status: 'Connected', boundServices: [{ name: 'Internal Apps', role: 'dial' }], lastConnected: '4 min ago', requestsSent: 920, requestsReceived: 640, bandwidthSent: '3.8 GB', bandwidthReceived: '9.2 GB', bandwidthSentPct: 52, bandwidthReceivedPct: 68, throughputSent: '5.3 MB/s', throughputReceived: '7.1 MB/s', droppedPackets: 4, droppedConnections: 1, uptime: '97.40%', usageBandwidth: '13.0 GB', usagePct: 35, connectorStatus: 'Degraded' },
        { id: 'id-002', name: 'Sarah Okafor', type: 'user', status: 'Connected', boundServices: [{ name: 'File Share', role: 'dial' }], lastConnected: '18 min ago', requestsSent: 214, requestsReceived: 188, bandwidthSent: '1.2 GB', bandwidthReceived: '4.4 GB', bandwidthSentPct: 28, bandwidthReceivedPct: 44, throughputSent: '2.1 MB/s', throughputReceived: '3.6 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.99%', usageBandwidth: '5.6 GB', usagePct: 14, connectorStatus: 'Online' },
        { id: 'id-003', name: 'NY Edge Gateway', type: 'service', status: 'Disconnected', boundServices: [{ name: 'Internal Apps', role: 'bind' }], lastConnected: '18 min ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 22, droppedConnections: 5, uptime: '97.40%', usageBandwidth: '140 GB', usagePct: 38, connectorStatus: 'Degraded' },
        { id: 'id-004', name: 'Miami File Server', type: 'service', status: 'Connected', boundServices: [{ name: 'File Share', role: 'bind' }], lastConnected: 'Just now', requestsSent: 3840, requestsReceived: 2210, bandwidthSent: '9.6 GB', bandwidthReceived: '18.4 GB', bandwidthSentPct: 64, bandwidthReceivedPct: 76, throughputSent: '6.4 MB/s', throughputReceived: '12.2 MB/s', droppedPackets: 0, droppedConnections: 0 },
      ],
      userList: [
        { id: 'usr-001', name: 'John Reyes', email: 'john@provider.com', role: 'operator', location: 'New York Office', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'Sarah Okafor', email: 'sarah@provider.com', role: 'custom', location: 'Miami Branch', permissions: { connectors: 'read-only', workflows: 'manage' } },
        { id: 'usr-003', name: 'Marcus Webb', email: 'marcus@provider.com', role: 'monitor', location: 'New York Office', permissions: { locations: 'read-only', connectors: 'read-only' } },
      ],
      bandwidthHistory: {
        tx: [3,4,5,4,5,3,2,4,4,5,4,5,5,4,3,4,5,5,4,4,3,3,4,4,5,4,5,5,4,3],
        rx: [8,9,11,10,12,7,5,9,10,12,10,12,11,9,8,10,12,12,10,9,8,7,9,10,12,10,12,11,9,8],
      },
    },
    {
      id: 'vandelay-tech',
      name: 'Vandelay Tech', initials: 'VT', avatarBg: 'bg-cyan-600',
      status: 'Active', locations: 2, connectors: 8, activeConnections: 94, bandwidthUsed: '310 GB', uptime: '99.80%', licensesUsed: 94, licensesTotal: 150,
      alertSeverity: 'Warning',
      alerts: [
        { resource: 'Dallas-GW-02', resourceIcon: 'gateway', description: 'Certificate expiring in 7 days', createdAt: '1 hour ago', type: 'Certificate Expired', typeIcon: 'certificate' },
      ],
      locationList: [
        { id: 'LOC-001', name: 'Dallas HQ', city: 'Dallas', country: 'US', connectors: 5, activeConnections: 61, usageBandwidth: '198 GB', usagePct: 72, status: 'Online' },
        { id: 'LOC-002', name: 'Phoenix Office', city: 'Phoenix', country: 'US', connectors: 3, activeConnections: 33, usageBandwidth: '112 GB', usagePct: 41, status: 'Online' },
      ],
      connectorList: [
        { id: 'Dallas-GW-01', name: 'Dallas Gateway 1', type: 'gateway', location: 'Dallas HQ', connectors: 3, usageBandwidth: '120 GB', usagePct: 44, version: '3.4.1', uptime: '99.99%', lastSeen: 'Just now', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS', 'SSH'] },
        { id: 'Dallas-GW-02', name: 'Dallas Gateway 2', type: 'gateway', location: 'Dallas HQ', connectors: 2, usageBandwidth: '78 GB', usagePct: 28, version: '3.3.7', uptime: '99.80%', lastSeen: '5 min ago', status: 'Online', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'PHX-CL-01', name: 'Phoenix Clientless 1', type: 'clientless', location: 'Phoenix Office', connectors: 3, usageBandwidth: '112 GB', usagePct: 41, version: '3.4.1', uptime: '100%', lastSeen: '2 min ago', status: 'Online', template: 'Web Portal', hostedApps: ['HTTPS'] },
      ],
      connectionList: [
        { source: 'MacBook-Art', sourceType: 'device', destination: 'Dallas-GW-01', destinationType: 'gateway', app: 'ERP System', throughput: '9.8 MB/s', throughputPct: 85, status: 'Connected' },
        { source: 'Win-George', sourceType: 'sdk', destination: 'PHX-CL-01', destinationType: 'clientless', app: 'CRM Portal', throughput: '4.2 MB/s', throughputPct: 52, status: 'Connected' },
      ],
      identityList: [
        { id: 'id-001', name: 'Art Vandelay', type: 'user', status: 'Connected', boundServices: [{ name: 'ERP System', role: 'dial' }], lastConnected: 'Just now', requestsSent: 1840, requestsReceived: 1240, bandwidthSent: '6.2 GB', bandwidthReceived: '14.8 GB', bandwidthSentPct: 66, bandwidthReceivedPct: 82, throughputSent: '9.8 MB/s', throughputReceived: '13.4 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.95%', usageBandwidth: '21.0 GB', usagePct: 62, connectorStatus: 'Online' },
        { id: 'id-002', name: 'George Costanza', type: 'user', status: 'Connected', boundServices: [{ name: 'CRM Portal', role: 'dial' }], lastConnected: '7 min ago', requestsSent: 560, requestsReceived: 380, bandwidthSent: '2.1 GB', bandwidthReceived: '5.6 GB', bandwidthSentPct: 38, bandwidthReceivedPct: 52, throughputSent: '4.2 MB/s', throughputReceived: '6.8 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.90%', usageBandwidth: '7.7 GB', usagePct: 28, connectorStatus: 'Online' },
        { id: 'id-003', name: 'Dallas ERP Gateway', type: 'service', status: 'Connected', boundServices: [{ name: 'ERP System', role: 'bind' }], lastConnected: 'Just now', requestsSent: 8420, requestsReceived: 5640, bandwidthSent: '22.4 GB', bandwidthReceived: '44.8 GB', bandwidthSentPct: 80, bandwidthReceivedPct: 88, throughputSent: '14.6 MB/s', throughputReceived: '22.8 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '99.99%', usageBandwidth: '120 GB', usagePct: 44, connectorStatus: 'Online' },
        { id: 'id-004', name: 'Phoenix CRM Portal', type: 'service', status: 'Connected', boundServices: [{ name: 'CRM Portal', role: 'bind' }], lastConnected: '7 min ago', requestsSent: 3120, requestsReceived: 1840, bandwidthSent: '8.8 GB', bandwidthReceived: '16.2 GB', bandwidthSentPct: 56, bandwidthReceivedPct: 62, throughputSent: '6.4 MB/s', throughputReceived: '10.8 MB/s', droppedPackets: 0, droppedConnections: 0 },
      ],
      userList: [
        { id: 'usr-001', name: 'Art Vandelay', email: 'art@provider.com', role: 'operator', location: 'Dallas HQ', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'George Costanza', email: 'george@provider.com', role: 'custom', location: 'Phoenix Office', permissions: { workflows: 'read-only', connectors: 'read-only' } },
        { id: 'usr-003', name: 'Elaine Benes', email: 'elaine@provider.com', role: 'monitor', location: 'Dallas HQ', permissions: { locations: 'read-only', connectors: 'read-only', workflows: 'read-only' } },
      ],
      bandwidthHistory: {
        tx: [2,3,4,3,4,2,2,3,3,4,3,4,4,3,2,3,4,4,3,3,2,2,3,3,4,3,4,4,3,2],
        rx: [6,7,8,7,9,5,4,7,7,9,7,9,8,7,6,7,8,9,7,7,6,5,7,7,8,7,9,8,7,6],
      },
    },
    {
      id: 'initech-llc',
      name: 'Initech LLC', initials: 'IL', avatarBg: 'bg-amber-500',
      status: 'Degraded', locations: 3, connectors: 12, activeConnections: 43, bandwidthUsed: '210 GB', uptime: '97.40%', licensesUsed: 43, licensesTotal: 300,
      alertSeverity: 'Critical',
      alerts: [
        { resource: 'SEA-Core-01', resourceIcon: 'connector', description: 'Connector offline — no heartbeat for 4 hours', createdAt: '4 hours ago', type: 'Connectivity', typeIcon: 'connectivity' },
        { resource: 'SEA-Core-02', resourceIcon: 'connector', description: 'Authentication failures exceeding threshold', createdAt: '3 hours ago', type: 'Auth Failure', typeIcon: 'auth' },
        { resource: 'PDX-Edge-01', resourceIcon: 'gateway', description: 'Packet loss above 15%', createdAt: '30 minutes ago', type: 'Performance', typeIcon: 'performance' },
      ],
      locationList: [
        { id: 'LOC-001', name: 'Seattle DC', city: 'Seattle', country: 'US', connectors: 5, activeConnections: 20, usageBandwidth: '89 GB', usagePct: 38, status: 'Degraded' },
        { id: 'LOC-002', name: 'Portland Office', city: 'Portland', country: 'US', connectors: 4, activeConnections: 23, usageBandwidth: '121 GB', usagePct: 52, status: 'Degraded' },
        { id: 'LOC-003', name: 'Boise Branch', city: 'Boise', country: 'US', connectors: 3, activeConnections: 0, usageBandwidth: '0 GB', usagePct: 0, status: 'Offline' },
      ],
      connectorList: [
        { id: 'SEA-Core-01', name: 'Seattle Core 1', type: 'connector', location: 'Seattle DC', connectors: 2, usageBandwidth: '0 GB', usagePct: 0, version: '3.2.4', uptime: '0%', lastSeen: '4 hours ago', status: 'Offline', template: '--', hostedApps: ['TCP'] },
        { id: 'SEA-Core-02', name: 'Seattle Core 2', type: 'connector', location: 'Seattle DC', connectors: 3, usageBandwidth: '89 GB', usagePct: 38, version: '3.2.4', uptime: '72%', lastSeen: '3 hours ago', status: 'Degraded', template: '--', hostedApps: ['TCP'] },
        { id: 'PDX-Edge-01', name: 'Portland Edge 1', type: 'gateway', location: 'Portland Office', connectors: 2, usageBandwidth: '60 GB', usagePct: 26, version: '3.3.9', uptime: '91%', lastSeen: '30 min ago', status: 'Degraded', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'PDX-Dev-01', name: 'Portland Device 1', type: 'device', location: 'Portland Office', connectors: 2, usageBandwidth: '61 GB', usagePct: 26, version: '3.4.1', uptime: '99.90%', lastSeen: '2 min ago', status: 'Online', template: '--', hostedApps: ['RDP'] },
        { id: 'BOI-GW-01', name: 'Boise Gateway 1', type: 'gateway', location: 'Boise Branch', connectors: 2, usageBandwidth: '0 GB', usagePct: 0, version: '3.3.5', uptime: '0%', lastSeen: '6 hours ago', status: 'Offline', template: 'Office Gateway', hostedApps: ['HTTPS'] },
        { id: 'BOI-Dev-01', name: 'Boise Device 1', type: 'device', location: 'Boise Branch', connectors: 1, usageBandwidth: '0 GB', usagePct: 0, version: '3.3.5', uptime: '0%', lastSeen: '6 hours ago', status: 'Offline', template: '--', hostedApps: ['RDP'] },
      ],
      connectionList: [
        { source: 'Win-Peter', sourceType: 'device', destination: 'PDX-Dev-01', destinationType: 'device', app: 'Office Suite', throughput: '1.1 MB/s', throughputPct: 29, status: 'Connected' },
        { source: 'MacBook-Michael', sourceType: 'device', destination: 'SEA-Core-02', destinationType: 'device', app: 'Intranet', throughput: '0.3 MB/s', throughputPct: 12, status: 'Idle' },
      ],
      identityList: [
        { id: 'id-001', name: 'Peter Gibbons', type: 'user', status: 'Connected', boundServices: [{ name: 'Office Suite', role: 'dial' }], lastConnected: '9 min ago', requestsSent: 320, requestsReceived: 240, bandwidthSent: '0.9 GB', bandwidthReceived: '2.8 GB', bandwidthSentPct: 22, bandwidthReceivedPct: 38, throughputSent: '1.1 MB/s', throughputReceived: '2.4 MB/s', droppedPackets: 8, droppedConnections: 2, uptime: '72%', usageBandwidth: '3.7 GB', usagePct: 22, connectorStatus: 'Degraded' },
        { id: 'id-002', name: 'Michael Bolton', type: 'user', status: 'Connected', boundServices: [{ name: 'Intranet', role: 'dial' }], lastConnected: '22 min ago', requestsSent: 88, requestsReceived: 62, bandwidthSent: '0.2 GB', bandwidthReceived: '0.6 GB', bandwidthSentPct: 8, bandwidthReceivedPct: 14, throughputSent: '0.3 MB/s', throughputReceived: '0.8 MB/s', droppedPackets: 3, droppedConnections: 1, uptime: '72%', usageBandwidth: '0.8 GB', usagePct: 8, connectorStatus: 'Degraded' },
        { id: 'id-003', name: 'Seattle Core 1', type: 'service', status: 'Disconnected', boundServices: [{ name: 'Intranet', role: 'bind' }, { name: 'Office Suite', role: 'bind' }], lastConnected: '4 hours ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 41, droppedConnections: 12, uptime: '0%', usageBandwidth: '0 GB', usagePct: 0, connectorStatus: 'Offline' },
        { id: 'id-004', name: 'Portland Office Node', type: 'service', status: 'Disconnected', boundServices: [{ name: 'Office Suite', role: 'bind' }], lastConnected: '30 min ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 18, droppedConnections: 4 },
      ],
      userList: [
        { id: 'usr-001', name: 'Peter Gibbons', email: 'peter@provider.com', role: 'operator', location: 'Seattle DC', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'Michael Bolton', email: 'michael@provider.com', role: 'monitor', location: 'Portland Office', permissions: { locations: 'read-only', connectors: 'read-only' } },
        { id: 'usr-003', name: 'Samir Nagheenanajar', email: 'samir@provider.com', role: 'custom', location: 'Boise Branch', permissions: { connectors: 'manage', workflows: 'read-only', users: 'read-only' } },
        { id: 'usr-004', name: 'Bill Lumbergh', email: 'bill@provider.com', role: 'operator', location: 'Seattle DC', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
      ],
      bandwidthHistory: {
        tx: [2,2,3,2,3,1,1,2,2,3,2,3,3,2,2,2,3,3,2,2,1,1,2,2,3,2,3,3,2,2],
        rx: [4,5,6,5,7,3,3,5,5,7,5,7,6,5,4,5,6,7,5,5,4,3,5,5,7,5,7,6,5,4],
      },
    },
    {
      id: 'soylent-networks',
      name: 'Soylent Networks', initials: 'SN', avatarBg: 'bg-gray-400',
      status: 'Inactive', locations: 1, connectors: 4, activeConnections: 0, bandwidthUsed: '0 GB', uptime: '—', licensesUsed: 0, licensesTotal: 100,
      alertSeverity: 'None', alerts: [],
      locationList: [
        { id: 'LOC-001', name: 'Los Angeles HQ', city: 'Los Angeles', country: 'US', connectors: 4, activeConnections: 0, usageBandwidth: '0 GB', usagePct: 0, status: 'Offline' },
      ],
      connectorList: [
        { id: 'LA-GW-01', name: 'LA Gateway 1', type: 'gateway', location: 'Los Angeles HQ', connectors: 2, usageBandwidth: '0 GB', usagePct: 0, version: '3.1.0', uptime: '0%', lastSeen: '3 days ago', status: 'Offline', template: '--', hostedApps: ['HTTPS'] },
        { id: 'LA-Dev-01', name: 'LA Device 1', type: 'device', location: 'Los Angeles HQ', connectors: 2, usageBandwidth: '0 GB', usagePct: 0, version: '3.1.0', uptime: '0%', lastSeen: '3 days ago', status: 'Offline', template: '--', hostedApps: ['RDP'] },
      ],
      connectionList: [],
      identityList: [
        { id: 'id-001', name: 'LA Gateway 1', type: 'service', status: 'Disconnected', boundServices: [{ name: 'Web Access', role: 'bind' }], lastConnected: '3 days ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '0%', usageBandwidth: '0 GB', usagePct: 0, connectorStatus: 'Offline' },
        { id: 'id-002', name: 'LA Device Node', type: 'device', status: 'Disconnected', boundServices: [{ name: 'Remote Desktop', role: 'dial' }], lastConnected: '3 days ago', requestsSent: 0, requestsReceived: 0, bandwidthSent: '0 GB', bandwidthReceived: '0 GB', bandwidthSentPct: 0, bandwidthReceivedPct: 0, throughputSent: '0 MB/s', throughputReceived: '0 MB/s', droppedPackets: 0, droppedConnections: 0, uptime: '0%', usageBandwidth: '0 GB', usagePct: 0, connectorStatus: 'Offline' },
      ],
      userList: [
        { id: 'usr-001', name: 'Logan Pierce', email: 'logan@provider.com', role: 'operator', location: 'Los Angeles HQ', permissions: { locations: 'manage', connectors: 'manage', workflows: 'manage', users: 'manage' } },
        { id: 'usr-002', name: 'Maya Chen', email: 'maya@provider.com', role: 'monitor', location: 'Los Angeles HQ', permissions: { locations: 'read-only', connectors: 'read-only' } },
      ],
      bandwidthHistory: {
        tx: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        rx: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      },
    },
  ];

  getAll(): Customer[] { return this.customers; }

  getById(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }
}
