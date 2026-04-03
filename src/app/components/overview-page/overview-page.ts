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
      title: 'Define Connector Templates',
      description: 'Reusable connector templates for your customers.',
    },
    {
      number: 2,
      icon: 'locations',
      title: 'Define Locations & Connectors',
      description: 'Define provider network locations that can access customer resources.',
    },
    {
      number: 3,
      icon: 'connections',
      title: 'Define Connections',
      description: 'Create connections to enable access between connectors.',
    },
    {
      number: 4,
      icon: 'users',
      title: 'Invite Users',
      description: 'Define provider users who can manage and access customer resources.',
    },
  ];
}
