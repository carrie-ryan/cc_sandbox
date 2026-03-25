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
    this.router.navigate(['/customer-dashboard']);
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
    this.router.navigate(['/customer-dashboard']);
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
