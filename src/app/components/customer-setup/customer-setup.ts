import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-setup',
  imports: [RouterLink],
  templateUrl: './customer-setup.html',
})
export class CustomerSetupComponent {
  keySteps = [
    {
      number: 1,
      icon: 'profile',
      title: 'Create Customer Profile',
      description: 'Define the customer organization and their account settings.',
    },
    {
      number: 2,
      icon: 'locations',
      title: 'Assign Locations & Connectors',
      description: 'Assign provider locations and allocate connector pools to the customer.',
    },
    {
      number: 3,
      icon: 'connections',
      title: 'Define Connections',
      description: 'Create connections to enable secure access between connectors.',
    },
    {
      number: 4,
      icon: 'users',
      title: 'Invite Users',
      description: 'Invite the customer site administrator to manage their network.',
    },
    {
      number: 5,
      icon: 'summary',
      title: 'Deployment Summary',
      description: 'Review the full configuration before finalizing the customer deployment.',
    },
  ];
}
