import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  imports: [FormsModule],
})
export class HeaderComponent {
  appSwitcherOpen = false;
  userMenuOpen = false;

  alexNotifMode: 'quiet' | 'focused' | 'standard' = 'standard';
  alexQuietHours = { enabled: false, from: '22:00', to: '08:00' };
  alexNotifChannels = { email: true, slack: true };
  alexNotifAlerts = {
    customerOffline: true,
    customerDegraded: true,
    certificateExpiring: true,
    newCustomerProvisioned: false,
    licenseThreshold: true,
    slaBreach: true,
    billingAlert: true,
    maintenanceWindow: false,
  };
  alexNotifSaved = false;

  saveAlexNotifPrefs() {
    this.alexNotifSaved = true;
    setTimeout(() => {
      this.alexNotifSaved = false;
      this.personaService.showSettings.set(false);
    }, 800);
  }

  constructor(private router: Router, public personaService: PersonaService) {}

  toggleAppSwitcher() {
    this.appSwitcherOpen = !this.appSwitcherOpen;
    this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    this.appSwitcherOpen = false;
  }

  switchPersona(persona: 'ian' | 'maya') {
    this.personaService.setPersona(persona);
    this.userMenuOpen = false;
    this.router.navigate([persona === 'maya' ? '/login' : '/ian-dashboard']);
  }

  navigateToDashboard() {
    this.appSwitcherOpen = false;
    this.router.navigate(['/dashboard']);
  }

  navigateToCustomerDashboard() {
    this.appSwitcherOpen = false;
    const route = this.personaService.activePersona() === 'maya' ? '/maya-dashboard' : '/ian-dashboard';
    this.router.navigate([route]);
  }

  navigateToOnboarding() {
    this.appSwitcherOpen = false;
    this.router.navigate(['/customer-portal/onboarding']);
  }

  get isCustomerDashboard(): boolean {
    return this.router.url.startsWith('/ian-dashboard') || this.router.url.startsWith('/maya-dashboard');
  }

  get isProviderContext(): boolean {
    return this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/customers');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('#app-switcher-container')) {
      this.appSwitcherOpen = false;
    }
    if (!target.closest('#user-menu-container')) {
      this.userMenuOpen = false;
    }
  }
}
