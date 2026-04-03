import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  constructor(private router: Router) {}

  get isCustomerSetup(): boolean {
    return this.router.url.startsWith('/customer-setup');
  }

  providerNavItems = [
    { label: 'Overview', route: '/provider-setup/overview' },
    { label: 'Define Connector Templates', route: '/provider-setup/connector-templates' },
    { label: 'Define Locations & Connectors', route: '/provider-setup/locations' },
    { label: 'Define Connections', route: '/provider-setup/define-connections' },
    { label: 'Invite Users', route: '/provider-setup/invite-users' },
  ];

  customerNavItems = [
    { label: 'Overview', route: '/customer-setup' },
    { label: 'Create Customer Profile', route: '/customer-setup/profile' },
    { label: 'Assign Locations & Connectors', route: '/customer-setup/locations' },
    { label: 'Define Connections', route: '/customer-setup/connections' },
    { label: 'Invite Users', route: '/customer-setup/invite' },
    { label: 'Deployment Summary', route: '/customer-setup/deployment-summary' },
  ];

  get navItems() {
    return this.isCustomerSetup ? this.customerNavItems : this.providerNavItems;
  }
}
