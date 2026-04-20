import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class HeaderComponent {
  appSwitcherOpen = false;
  userMenuOpen = false;

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

  navigateToProviderSetup() {
    this.appSwitcherOpen = false;
    this.router.navigate(['/provider-setup/overview']);
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

  navigateToCustomerSetup() {
    this.appSwitcherOpen = false;
    this.router.navigate(['/customer-setup/profile']);
  }

  get isCustomerDashboard(): boolean {
    return this.router.url.startsWith('/ian-dashboard') || this.router.url.startsWith('/maya-dashboard');
  }

  get isProviderContext(): boolean {
    const url = this.router.url;
    return url.startsWith('/provider-setup') ||
           url.startsWith('/customer-setup') ||
           url.startsWith('/dashboard');
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
