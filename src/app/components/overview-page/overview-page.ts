import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-overview-page',
  imports: [RouterLink],
  templateUrl: './overview-page.html',
})
export class OverviewPageComponent {
  keySteps = [
    {
      number: 1,
      icon: 'templates',
      title: 'Define Templates',
      description: 'Reusable configurations for creating network components',
    },
    {
      number: 2,
      icon: 'locations',
      title: 'Add Locations',
      description: 'Map your physical or logical network locations',
    },
    {
      number: 3,
      icon: 'connectors',
      title: 'Add Connectors',
      description: 'Attach software agents to your provider locations',
    },
    {
      number: 4,
      icon: 'connections',
      title: 'Define Connections',
      description: 'Define Zero Trust connections to segment network traffic',
    },
    {
      number: 5,
      icon: 'users',
      title: 'Invite Users',
      description: 'Invite and assign roles to your team members',
    },
  ];
}
