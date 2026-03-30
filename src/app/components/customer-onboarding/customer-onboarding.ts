import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';

interface WizardLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: { name: string; type: string }[];
}

@Component({
  selector: 'app-customer-onboarding',
  imports: [FormsModule],
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
    { id: 'cloc-1', name: 'Riverside Main Clinic',  address: '789 Medical Plaza',   addressSub: 'Portland, OR 97201',   licensesAllocated: 20, connectors: [] },
    { id: 'cloc-2', name: 'Riverside Urgent Care',  address: '456 Healthcare Way',  addressSub: 'Beaverton, OR 97005',  licensesAllocated: 15, connectors: [] },
    { id: 'cloc-3', name: 'Riverside Admin Office', address: '123 Business Center', addressSub: 'Portland, OR 97201',   licensesAllocated: 5,  connectors: [] },
  ];

  constructor(private router: Router, private onboardingService: OnboardingService) {}

  get activeLocation(): WizardLocation | null {
    return this.locations.find(l => l.id === this.activeLocationId) ?? null;
  }

  get totalConnectorsAdded(): number {
    return this.locations.reduce((sum, l) => sum + l.connectors.length, 0);
  }

  goToStep2(): void { this.currentStep = 2; }

  goToStep3(): void {
    this.onboardingService.setupReviewed.set(true);
    this.currentStep = 3;
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
    if (loc) loc.connectors.push({ name: this.connectorName, type: this.connectorType });
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
