import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Location {
  id: string;
  name: string;
  owner: string;
  ownerType: 'provider' | 'cross' | 'building';
  address: string;
  addressSub: string;
  isCloud: boolean;
  seatLimit: number | null;
}

@Component({
  selector: 'app-locations',
  imports: [RouterLink, FormsModule],
  templateUrl: './locations.html',
})
export class LocationsComponent {
  showModal = false;
  showSeatModal = false;

  name = '';
  address = '';
  description = '';
  licenseAllocation: number | null = null;

  seatLimitInput: number | null = null;
  editingSeatLocationId: string | null = null;

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type', 'Owner'];
  locations: Location[] = [
    {
      id: 'loc-1',
      name: 'Provider Operations Center',
      owner: 'Acme Medical Solutions',
      ownerType: 'provider',
      address: '123 Healthcare Ave',
      addressSub: 'Chicago, IL 60601',
      isCloud: false,
      seatLimit: 10,
    },
    {
      id: 'loc-2',
      name: 'Cloud Management VPC',
      owner: 'Acme Medical Solutions',
      ownerType: 'provider',
      address: 'us-east-1',
      addressSub: 'Amazon Web Services',
      isCloud: true,
      seatLimit: null,
    },
    {
      id: 'loc-3',
      name: 'Riverside Main Clinic',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '789 Medical Plaza',
      addressSub: 'Portland, OR 97201',
      isCloud: false,
      seatLimit: 20,
    },
    {
      id: 'loc-4',
      name: 'Riverside Urgent Care',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '456 Healthcare Way',
      addressSub: 'Beaverton, OR 97005',
      isCloud: false,
      seatLimit: 15,
    },
    {
      id: 'loc-5',
      name: 'Riverside Admin Office',
      owner: 'Riverside Medical Group',
      ownerType: 'cross',
      address: '123 Business Center',
      addressSub: 'Portland, OR 97201',
      isCloud: false,
      seatLimit: null,
    },
    {
      id: 'loc-6',
      name: 'County General Main Campus',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: '1000 Hospital Drive',
      addressSub: 'Denver, CO 80204',
      isCloud: false,
      seatLimit: 25,
    },
    {
      id: 'loc-7',
      name: 'County General Outpatient Center',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: '2500 Clinic Parkway',
      addressSub: 'Aurora, CO 80012',
      isCloud: false,
      seatLimit: 10,
    },
    {
      id: 'loc-8',
      name: 'County General Data Center',
      owner: 'County General Hospital',
      ownerType: 'building',
      address: 'CoreSite Colocation',
      addressSub: 'Denver, CO 80202',
      isCloud: false,
      seatLimit: null,
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
    this.licenseAllocation = null;
  }

  closeModal(): void {
    this.showModal = false;
  }

  openSeatModal(locationId: string, currentLimit: number | null): void {
    this.editingSeatLocationId = locationId;
    this.seatLimitInput = currentLimit;
    this.showSeatModal = true;
  }

  closeSeatModal(): void {
    this.showSeatModal = false;
    this.editingSeatLocationId = null;
    this.seatLimitInput = null;
  }

  saveSeatLimit(): void {
    const loc = this.locations.find(l => l.id === this.editingSeatLocationId);
    if (loc) {
      loc.seatLimit = this.seatLimitInput;
    }
    this.closeSeatModal();
  }
}
