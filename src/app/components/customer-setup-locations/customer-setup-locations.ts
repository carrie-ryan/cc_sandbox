import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface ConnectorPool {
  id: string;
  name: string;
  type: 'Device' | 'Gateway' | 'Clientless' | 'SDK Embedded';
  remaining: number;
  total: number;
  allocationInput: number | null;
}

interface Location {
  id: string;
  name: string;
  owner: string;
  ownerType: 'cross' | 'building';
  address: string;
  addressSub: string;
  isCloud: boolean;
  connectors: ConnectorPool[];
}

@Component({
  selector: 'app-customer-setup-locations',
  imports: [RouterLink, FormsModule],
  templateUrl: './customer-setup-locations.html',
})
export class CustomerSetupLocationsComponent {
  showModal = false;
  showAllocateDrawer = false;

  name = '';
  address = '';
  description = '';

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type', 'Owner'];

  expandedLocations = new Set<string>();

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

  locations: Location[] = [
    {
      id: 'loc-3',
      name: 'Riverside Main Clinic',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '789 Medical Plaza',
      addressSub: 'Portland, OR 97201',
      isCloud: false,
      connectors: [
        { id: 'c-1', name: 'Mobile Unit', type: 'Device', remaining: 8, total: 12, allocationInput: null },
        { id: 'c-2', name: 'Ticket Printer', type: 'Device', remaining: 12, total: 12, allocationInput: null },
        { id: 'c-3', name: 'Workstation', type: 'Device', remaining: 5, total: 10, allocationInput: null },
        { id: 'c-4', name: 'Main Gateway', type: 'Gateway', remaining: 2, total: 5, allocationInput: null },
      ],
    },
    {
      id: 'loc-4',
      name: 'Riverside Urgent Care',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '456 Healthcare Way',
      addressSub: 'Beaverton, OR 97005',
      isCloud: false,
      connectors: [
        { id: 'c-5', name: 'Workstation', type: 'Device', remaining: 3, total: 5, allocationInput: null },
        { id: 'c-6', name: 'Gateway Unit', type: 'Gateway', remaining: 1, total: 3, allocationInput: null },
      ],
    },
    {
      id: 'loc-5',
      name: 'Riverside Admin Office',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '123 Business Center',
      addressSub: 'Portland, OR 97201',
      isCloud: false,
      connectors: [
        { id: 'c-7', name: 'Workstation', type: 'Device', remaining: 2, total: 2, allocationInput: null },
        { id: 'c-8', name: 'Admin Portal', type: 'Clientless', remaining: 1, total: 1, allocationInput: null },
      ],
    },
    {
      id: 'loc-6',
      name: 'County General Main Campus',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: '1000 Hospital Drive',
      addressSub: 'Denver, CO 80204',
      isCloud: false,
      connectors: [
        { id: 'c-9',  name: 'Mobile Unit', type: 'Device', remaining: 10, total: 15, allocationInput: null },
        { id: 'c-10', name: 'Workstation', type: 'Device', remaining: 8, total: 10, allocationInput: null },
        { id: 'c-11', name: 'Main Gateway', type: 'Gateway', remaining: 3, total: 5, allocationInput: null },
        { id: 'c-12', name: 'Clientless Portal', type: 'Clientless', remaining: 1, total: 2, allocationInput: null },
      ],
    },
    {
      id: 'loc-7',
      name: 'County General Outpatient Center',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: '2500 Clinic Parkway',
      addressSub: 'Aurora, CO 80012',
      isCloud: false,
      connectors: [
        { id: 'c-13', name: 'Workstation', type: 'Device', remaining: 5, total: 8, allocationInput: null },
        { id: 'c-14', name: 'Gateway Unit', type: 'Gateway', remaining: 2, total: 4, allocationInput: null },
      ],
    },
    {
      id: 'loc-8',
      name: 'County General Data Center',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: 'CoreSite Colocation',
      addressSub: 'Denver, CO 80202',
      isCloud: false,
      connectors: [
        { id: 'c-15', name: 'Server Connector', type: 'Gateway', remaining: 4, total: 5, allocationInput: null },
        { id: 'c-16', name: 'SDK Integration', type: 'SDK Embedded', remaining: 2, total: 2, allocationInput: null },
      ],
    },
  ];

  get totalLocations(): number {
    return this.locations.length;
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
