import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  navItems = [
    { label: 'Overview', route: '/provider-setup/overview' },
    { label: 'Define Connector Templates', route: '/provider-setup/connector-templates' },
    { label: 'Define Connections', route: '/provider-setup/define-connections' },
    { label: 'Define Locations & Connectors', route: '/provider-setup/locations' },
    { label: 'Invite Users', route: '/provider-setup/invite-users' },
  ];
}
