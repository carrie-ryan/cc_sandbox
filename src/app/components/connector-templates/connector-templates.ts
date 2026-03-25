import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface ConnectorType {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
}

interface Application {
  appType: string;
  name: string;
  protocol: string;
  listenAddress: string;
  forwardAddress: string;
  listenPort: string;
  forwardPort: string;
}

@Component({
  selector: 'app-connector-templates',
  imports: [RouterLink, FormsModule],
  templateUrl: './connector-templates.html',
})
export class ConnectorTemplatesComponent {
  showModal = false;
  typeDropdownOpen = false;
  applications: Application[] = [];

  connectorTypes: ConnectorType[] = [
    { id: 'device', label: 'Device', description: 'Runs on a device to expose local services', icon: 'device', iconColor: 'text-blue-600' },
    { id: 'gateway', label: 'Gateway', description: 'Acts as a network gateway for subnet access', icon: 'gateway', iconColor: 'text-green-600' },
    { id: 'clientless', label: 'Clientless', description: 'Internet-accessible clientless endpoint', icon: 'clientless', iconColor: 'text-purple-600' },
    { id: 'sdk', label: 'SDK Embedded', description: 'Embedded directly in an application', icon: 'sdk', iconColor: 'text-orange-500' },
  ];

  selectedType: ConnectorType = this.connectorTypes[0];

  get isDevice(): boolean {
    return this.selectedType.id === 'device';
  }

  selectType(type: ConnectorType) {
    this.selectedType = type;
    this.typeDropdownOpen = false;
    // Clear apps when type changes
    this.applications = [];
  }

  addApplication() {
    this.applications.push({
      appType: '',
      name: '',
      protocol: 'TCP',
      listenAddress: '0.0.0.0',
      forwardAddress: this.isDevice ? '127.0.0.1' : '',
      listenPort: '80',
      forwardPort: '8080',
    });
  }

  removeApplication(index: number) {
    this.applications.splice(index, 1);
  }

  openModal() {
    this.showModal = true;
    this.typeDropdownOpen = false;
    this.selectedType = this.connectorTypes[0];
    this.applications = [];
  }

  closeModal() {
    this.showModal = false;
    this.typeDropdownOpen = false;
    this.applications = [];
  }
}
