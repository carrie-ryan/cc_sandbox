import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Connector {
  id: string;
  name: string;
  type: 'Device' | 'Gateway' | 'Clientless' | 'SDK Embedded';
  template: string | null;
  hostedApps: number;
}

interface Location {
  id: string;
  name: string;
  owner: string;
  ownerType: 'provider' | 'cross' | 'building';
  address: string;
  addressSub: string;
  isCloud: boolean;
  connectors: Connector[];
}

@Component({
  selector: 'app-locations',
  imports: [RouterLink, FormsModule],
  templateUrl: './locations.html',
})
export class LocationsComponent {
  showModal = false;

  name = '';
  address = '';
  description = '';

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type', 'Owner'];

  expandedLocations = new Set<string>();

  locations: Location[] = [
    {
      id: 'loc-1',
      name: 'Provider Operations Center',
      owner: 'Acme Medical Solutions',
      ownerType: 'provider',
      address: '123 Healthcare Ave',
      addressSub: 'Chicago, IL 60601',
      isCloud: false,
      connectors: [
        { id: 'c-1', name: 'IT Support Workstation 1', type: 'Device', template: null, hostedApps: 3 },
        { id: 'c-2', name: 'IT Support Workstation 2', type: 'Device', template: null, hostedApps: 3 },
        { id: 'c-3', name: 'IT Support Workstation 3', type: 'Device', template: null, hostedApps: 3 },
        { id: 'c-4', name: 'Security Analyst Workstation', type: 'Device', template: null, hostedApps: 3 },
      ],
    },
    {
      id: 'loc-2',
      name: 'Cloud Management VPC',
      owner: 'Acme Medical Solutions',
      ownerType: 'provider',
      address: 'us-east-1',
      addressSub: 'Amazon Web Services',
      isCloud: true,
      connectors: [
        { id: 'c-5', name: 'API Gateway Connector', type: 'Gateway', template: 'Secure Gateway', hostedApps: 5 },
        { id: 'c-6', name: 'Admin Portal Connector', type: 'Clientless', template: null, hostedApps: 2 },
      ],
    },
  ];

  get totalLocations(): number {
    return this.locations.length;
  }

  toggleExpanded(id: string): void {
    if (this.expandedLocations.has(id)) {
      this.expandedLocations.delete(id);
    } else {
      this.expandedLocations.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedLocations.has(id);
  }

  connectorTypeStyle(type: string): string {
    switch (type) {
      case 'Device':       return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Gateway':      return 'bg-green-50 text-green-700 border border-green-200';
      case 'Clientless':   return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'SDK Embedded': return 'bg-orange-50 text-orange-700 border border-orange-200';
      default:             return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  }

  openModal(): void {
    this.showModal = true;
    this.name = '';
    this.address = '';
    this.description = '';
  }

  closeModal(): void {
    this.showModal = false;
  }
}
