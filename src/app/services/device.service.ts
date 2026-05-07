import { Injectable } from '@angular/core';

export interface Device {
  id: string;
  name: string;
  connection: 'Online' | 'Offline';
  status: 'Enrolled' | 'Pending' | 'Expired Token';
  enabled: boolean;
  connectors: string[];
  tokenExpirationWeeks: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  devices: Device[] = [
    { id: 'dv-1',  name: 'LAPTOP-JSmith-01',    connection: 'Online',  status: 'Enrolled',      enabled: true,  connectors: ['rms-gateway', 'gis-gateway'], tokenExpirationWeeks: 4 },
    { id: 'dv-2',  name: 'LAPTOP-SLee-02',       connection: 'Online',  status: 'Enrolled',      enabled: true,  connectors: ['cad-gateway'],                tokenExpirationWeeks: 4 },
    { id: 'dv-3',  name: 'MOBILE-MJohnson-01',   connection: 'Offline', status: 'Enrolled',      enabled: true,  connectors: ['mobile-device-unit'],          tokenExpirationWeeks: 4 },
    { id: 'dv-4',  name: 'WORKSTATION-IT-03',    connection: 'Online',  status: 'Enrolled',      enabled: true,  connectors: ['cad-gateway', 'rms-gateway'],  tokenExpirationWeeks: 4 },
    { id: 'dv-5',  name: 'LAPTOP-RKumar-01',     connection: 'Offline', status: 'Expired Token', enabled: true,  connectors: ['gis-gateway'],                tokenExpirationWeeks: 4 },
    { id: 'dv-6',  name: 'MOBILE-TChen-02',      connection: 'Offline', status: 'Pending',       enabled: false, connectors: [],                              tokenExpirationWeeks: 4 },
    { id: 'dv-7',  name: 'WORKSTATION-HR-01',    connection: 'Online',  status: 'Enrolled',      enabled: true,  connectors: ['workstation-device'],          tokenExpirationWeeks: 4 },
    { id: 'dv-8',  name: 'LAPTOP-APorter-03',    connection: 'Offline', status: 'Expired Token', enabled: true,  connectors: ['cim-gateway'],                tokenExpirationWeeks: 4 },
    { id: 'dv-9',  name: 'MOBILE-LGarcia-01',    connection: 'Online',  status: 'Pending',       enabled: false, connectors: [],                              tokenExpirationWeeks: 4 },
    { id: 'dv-10', name: 'WORKSTATION-OPS-02',   connection: 'Online',  status: 'Enrolled',      enabled: true,  connectors: ['rms-gateway', 'cad-gateway'], tokenExpirationWeeks: 4 },
  ];

  toggle(id: string): void {
    const d = this.devices.find(d => d.id === id);
    if (d) d.enabled = !d.enabled;
  }

  resetIdentity(id: string): void {
    const d = this.devices.find(d => d.id === id);
    if (d) { d.status = 'Pending'; d.connection = 'Offline'; }
  }

  remove(id: string): void {
    this.devices = this.devices.filter(d => d.id !== id);
  }

  add(name: string, connectors: string[] = [], tokenExpirationWeeks = 4): void {
    const id = `dv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.devices.push({ id, name, connection: 'Offline', status: 'Pending', enabled: true, connectors, tokenExpirationWeeks });
  }

  addBulk(names: string[]): void {
    names.forEach(name => this.add(name));
  }
}
