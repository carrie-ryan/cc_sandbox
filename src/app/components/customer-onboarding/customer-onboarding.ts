import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { OnboardingService } from '../../services/onboarding.service';

interface WizardLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: { name: string; type: string; apps: string[]; isDuplicate?: boolean }[];
}

@Component({
  selector: 'app-customer-onboarding',
  imports: [FormsModule, NgClass],
  templateUrl: './customer-onboarding.html',
})
export class CustomerOnboardingComponent {
  currentStep = 1;
  showAddModal = false;
  activeLocationId: string | null = null;
  connectorName = '';
  connectorType = '';
  selectedTemplate = 'No Template';
  saveAsTemplate = false;
  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  locations: WizardLocation[] = [
    { id: 'cloc-1', name: 'Riverside Main Clinic',  address: '789 Medical Plaza',   addressSub: 'Portland, OR 97201',  licensesAllocated: 20, connectors: [{ name: 'Chicago Gateway 1', type: 'Gateway', apps: ['Patient Records Portal', 'Scheduling System', 'Imaging Viewer'] }, { name: 'Chicago Gateway 2', type: 'Gateway', apps: ['Lab Results Portal', 'Pharmacy System'] }, { name: 'Chicago Device 1', type: 'Device', apps: ['Remote Desktop', 'File Share'] }] },
    { id: 'cloc-2', name: 'Riverside Urgent Care',  address: '456 Healthcare Way',  addressSub: 'Beaverton, OR 97005', licensesAllocated: 15, connectors: [{ name: 'Austin Host 3', type: 'Device', apps: ['Patient Records Portal', 'Telehealth Platform'] }, { name: 'New York Clientless 1', type: 'Clientless', apps: ['Web Portal', 'Patient Records Portal', 'Scheduling System'] }] },
    { id: 'cloc-3', name: 'Riverside Admin Office', address: '123 Business Center', addressSub: 'Portland, OR 97201',  licensesAllocated: 5,  connectors: [{ name: 'London Gateway 1', type: 'Gateway', apps: ['Patient Records Portal', 'Imaging Viewer'] }, { name: 'London Device 1', type: 'Device', apps: ['Remote Desktop'] }] },
  ];

  connectorTypeColor(type: string): string {
    const map: { [key: string]: string } = {
      'Device':       'bg-blue-100 text-blue-700',
      'Gateway':      'bg-green-100 text-green-700',
      'Clientless':   'bg-purple-100 text-purple-700',
      'SDK Embedded': 'bg-orange-100 text-orange-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  constructor(private router: Router, private onboardingService: OnboardingService) {}

  get activeLocation(): WizardLocation | null {
    return this.locations.find(l => l.id === this.activeLocationId) ?? null;
  }

  get totalConnectorsAdded(): number {
    return this.locations.reduce((sum, l) => sum + l.connectors.length, 0);
  }

  goToStep2(): void { this.currentStep = 2; }

  private baseConnectorCounts: { [id: string]: number } = {};

  goToStep3(): void {
    this.onboardingService.setupReviewed.set(true);
    this.baseConnectorCounts = Object.fromEntries(this.locations.map(l => [l.id, l.connectors.length]));
    this.currentStep = 3;
  }

  duplicatesAdded(loc: WizardLocation): number {
    return loc.connectors.length - (this.baseConnectorCounts[loc.id] ?? 0);
  }

  editingWizardKey: string | null = null;
  editingWizardName = '';

  duplicateWizardConnector(loc: WizardLocation, conn: { name: string; type: string; apps: string[]; isDuplicate?: boolean }): void {
    const idx = loc.connectors.indexOf(conn);
    loc.connectors.splice(idx + 1, 0, { name: conn.name + ' (Copy)', type: conn.type, apps: [...conn.apps], isDuplicate: true });
  }

  startRenameWizardConnector(key: string, name: string): void {
    this.editingWizardKey = key;
    this.editingWizardName = name;
  }

  commitRenameWizardConnector(conn: { name: string; type: string; apps: string[]; isDuplicate?: boolean }): void {
    const trimmed = this.editingWizardName.trim();
    if (trimmed) conn.name = trimmed;
    this.editingWizardKey = null;
  }

  cancelRenameWizardConnector(): void {
    this.editingWizardKey = null;
  }

  deleteWizardDuplicate(loc: WizardLocation, conn: { name: string; type: string; apps: string[]; isDuplicate?: boolean }): void {
    const idx = loc.connectors.indexOf(conn);
    if (idx !== -1) loc.connectors.splice(idx, 1);
  }

  openAddModal(locationId: string): void {
    this.activeLocationId = locationId;
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
    this.activeLocationId = null;
  }

  addConnector(): void {
    if (!this.connectorName || !this.connectorType || !this.activeLocationId) return;
    const loc = this.locations.find(l => l.id === this.activeLocationId);
    if (loc) loc.connectors.push({ name: this.connectorName, type: this.connectorType, apps: [] });
    if (this.totalConnectorsAdded > 0) this.onboardingService.connectorsAdded.set(true);
    this.closeModal();
  }

  finish(): void {
    if (this.totalConnectorsAdded > 0) this.onboardingService.connectorsAdded.set(true);
    this.router.navigate(['/customer-dashboard']);
  }

  skip(): void {
    this.router.navigate(['/customer-dashboard']);
  }
}
