import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Permissions {
  locations: 'Manage' | 'Read Only';
  connectors: 'Manage' | 'Read Only';
  workflows: 'Manage' | 'Read Only';
  users: 'Manage' | 'Read Only';
}

interface ConfirmedAssignment {
  role: string;
  location: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  badge: string;
  roleAssignments: ConfirmedAssignment[];
}

@Component({
  selector: 'app-customer-setup-invite-users',
  imports: [RouterLink, FormsModule],
  templateUrl: './customer-setup-invite-users.html',
})
export class CustomerSetupInviteUsersComponent {
  users: User[] = [
    { id: 'u-1', name: 'Admin', email: 'admin@riversidemedical.com', initials: 'AD', avatarColor: 'bg-purple-100 text-purple-700', badge: 'ADMIN', roleAssignments: [] },
    { id: 'u-2', name: 'It',    email: 'it@riversidemedical.com',    initials: 'IT', avatarColor: 'bg-green-100 text-green-700',  badge: 'ADMIN', roleAssignments: [] },
  ];

  newUserName = '';
  newUserEmail = '';

  currentRole = 'Operator';
  currentLocation = '';
  currentPermissions: Permissions = { locations: 'Manage', connectors: 'Manage', workflows: 'Manage', users: 'Manage' };

  confirmedAssignments: ConfirmedAssignment[] = [];

  roles = ['Operator', 'Viewer', 'Admin'];

  locations: { name: string; address: string; iconBg: string; iconColor: string }[] = [
    { name: 'Riverside Main Clinic',            address: '789 Medical Plaza, Portland, OR 97201',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'   },
    { name: 'Riverside Urgent Care',            address: '456 Healthcare Way, Beaverton, OR 97005', iconBg: 'bg-amber-100',  iconColor: 'text-amber-600'  },
    { name: 'Riverside Admin Office',           address: '123 Business Center, Portland, OR 97201', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { name: 'County General Main Campus',       address: '1000 Hospital Drive, Denver, CO 80204',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'   },
    { name: 'County General Outpatient Center', address: '2500 Clinic Parkway, Aurora, CO 80012',   iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'   },
    { name: 'County General Data Center',       address: 'CoreSite Colocation, Denver, CO 80202',   iconBg: 'bg-gray-100',   iconColor: 'text-gray-500'   },
  ];

  locationSearch = '';
  showLocationDropdown = false;

  get filteredLocations() {
    const q = this.locationSearch.toLowerCase();
    return this.locations.filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q));
  }

  selectLocation(name: string): void {
    this.currentLocation = name;
    this.showLocationDropdown = false;
    this.locationSearch = '';
  }

  permissionCategories: { key: keyof Permissions; label: string; icon: string }[] = [
    { key: 'locations',  label: 'Locations',  icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
    { key: 'connectors', label: 'Connectors', icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5' },
    { key: 'workflows',  label: 'Workflows',  icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
    { key: 'users',      label: 'Users',      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  ];

  roleBadgeStyle(role: string): string {
    switch (role.toLowerCase()) {
      case 'operator': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'admin':    return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'viewer':   return 'bg-gray-50 text-gray-600 border border-gray-200';
      default:         return 'bg-green-50 text-green-700 border border-green-200';
    }
  }

  addRoleAssignment(): void {
    if (!this.currentLocation) return;
    this.confirmedAssignments.push({
      role: this.currentRole,
      location: this.currentLocation,
    });
    this.currentLocation = '';
    this.locationSearch = '';
  }

  removeConfirmedAssignment(index: number): void {
    this.confirmedAssignments.splice(index, 1);
  }

  clearForm(): void {
    this.newUserName = '';
    this.newUserEmail = '';
    this.currentRole = 'Operator';
    this.currentLocation = '';
    this.currentPermissions = { locations: 'Manage', connectors: 'Manage', workflows: 'Manage', users: 'Manage' };
    this.confirmedAssignments = [];
    this.locationSearch = '';
    this.showLocationDropdown = false;
  }

  addUser(): void {
    if (!this.newUserName.trim() || !this.newUserEmail.trim()) return;
    const initials = this.newUserName.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700'];
    this.users.push({
      id: 'u-' + Date.now(),
      name: this.newUserName.trim(),
      email: this.newUserEmail.trim(),
      initials,
      avatarColor: colors[this.users.length % colors.length],
      badge: (this.confirmedAssignments[0]?.role ?? 'USER').toUpperCase(),
      roleAssignments: [...this.confirmedAssignments],
    });
    this.clearForm();
  }
}
