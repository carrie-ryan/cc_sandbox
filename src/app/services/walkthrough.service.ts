import { Injectable, signal } from '@angular/core';

export interface WalkthroughStep {
  id: string;
  title: string;
  body: string;
  targetSelector: string;
  preferredPlacement: 'above' | 'below' | 'left' | 'right';
  sectionToActivate?: 'overview' | 'connectors' | 'audit' | 'alerts' | 'access' | 'licenses' | 'locations' | 'identities';
}

const STORAGE_KEY = 'ian-tour-completed';

export const IAN_TOUR_STEPS: WalkthroughStep[] = [
  {
    id: 'overview',
    title: 'Welcome to Your Dashboard',
    body: "This is your central command center for Acme Corp's zero-trust network. Everything you need to monitor and control site connectivity is right here.",
    targetSelector: '[data-tour="overview-heading"]',
    preferredPlacement: 'below',
    sectionToActivate: 'overview',
  },
  {
    id: 'kpi-stats',
    title: 'Site Health at a Glance',
    body: 'These cards show your live connection count, connector health, and bandwidth usage. At a glance you can see if anything needs attention.',
    targetSelector: '[data-tour="kpi-stats"]',
    preferredPlacement: 'below',
    sectionToActivate: 'overview',
  },
  {
    id: 'network-status',
    title: 'Network Status',
    body: 'This indicator reflects your current network state — Online, Degraded, or Paused. It updates in real time as connector health changes.',
    targetSelector: '[data-tour="network-status"]',
    preferredPlacement: 'right',
    sectionToActivate: 'overview',
  },
  {
    id: 'audit',
    title: 'Full Activity Trail',
    body: 'Live Audit captures every event across your network in real time — connections, disconnections, policy changes, and access grants.',
    targetSelector: '[data-tour="nav-audit"]',
    preferredPlacement: 'right',
    sectionToActivate: 'overview',
  },
  {
    id: 'locations',
    title: 'Locations & Connectors',
    body: 'Manage your physical sites and the connectors deployed at each one. You can pause individual connectors or entire locations from here.',
    targetSelector: '[data-tour="nav-locations"]',
    preferredPlacement: 'right',
    sectionToActivate: 'overview',
  },
  {
    id: 'identities',
    title: 'User Access Management',
    body: 'View and manage the identities enrolled in your network — employees, devices, and external contractors. Revoke access instantly from this panel.',
    targetSelector: '[data-tour="nav-identities"]',
    preferredPlacement: 'right',
    sectionToActivate: 'overview',
  },
];

@Injectable({ providedIn: 'root' })
export class WalkthroughService {
  isActive = signal(false);
  currentStepIndex = signal(0);

  get steps(): WalkthroughStep[] {
    return IAN_TOUR_STEPS;
  }

  get currentStep(): WalkthroughStep {
    return IAN_TOUR_STEPS[this.currentStepIndex()];
  }

  get totalSteps(): number {
    return IAN_TOUR_STEPS.length;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex() === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex() === IAN_TOUR_STEPS.length - 1;
  }

  hasCompletedTour(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  startTour() {
    this.currentStepIndex.set(0);
    this.isActive.set(true);
  }

  restartTour() {
    localStorage.removeItem(STORAGE_KEY);
    this.startTour();
  }

  next() {
    if (this.isLastStep) {
      this.completeTour();
    } else {
      this.currentStepIndex.update(i => i + 1);
    }
  }

  prev() {
    if (!this.isFirstStep) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  skip() {
    this.completeTour();
  }

  private completeTour() {
    this.isActive.set(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }
}
