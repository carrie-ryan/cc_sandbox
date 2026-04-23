import { Injectable, signal, computed, WritableSignal } from '@angular/core';

export type Persona = 'ian' | 'maya';

function readPersistedBool(key: string): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(key) === 'true';
}

@Injectable({ providedIn: 'root' })
export class PersonaService {
  activePersona = signal<Persona>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('active-persona') as Persona) || 'ian'
  );
  showSettings = signal(false);
  providerContext = signal(false);

  ianDarkMode = signal<boolean>(readPersistedBool('ian-dark-mode'));
  mayaDarkMode = signal<boolean>(readPersistedBool('maya-dark-mode'));
  alexDarkMode = signal<boolean>(readPersistedBool('alex-dark-mode'));
  ianBetaMode = signal<boolean>(readPersistedBool('ian-beta-mode'));
  ianPowerUserMode = signal<boolean>(readPersistedBool('ian-power-user-mode'));
  alexBetaMode = signal<boolean>(readPersistedBool('alex-beta-mode'));
  alexPowerUserMode = signal<boolean>(readPersistedBool('alex-power-user-mode'));

  activeDarkMode = computed(() => {
    if (this.providerContext()) return this.alexDarkMode();
    return this.activePersona() === 'maya' ? this.mayaDarkMode() : this.ianDarkMode();
  });

  impersonating = signal(false);
  impersonatedCustomerName = signal('');
  impersonatedCustomerId = signal('');

  startImpersonation(customerId: string, customerName: string) {
    this.impersonating.set(true);
    this.impersonatedCustomerId.set(customerId);
    this.impersonatedCustomerName.set(customerName);
  }

  endImpersonation() {
    this.impersonating.set(false);
    this.impersonatedCustomerId.set('');
    this.impersonatedCustomerName.set('');
  }

  setPersona(persona: Persona) {
    this.activePersona.set(persona);
    localStorage.setItem('active-persona', persona);
  }

  toggleIanDarkMode() { this.persistToggle(this.ianDarkMode, 'ian-dark-mode'); }
  toggleMayaDarkMode() { this.persistToggle(this.mayaDarkMode, 'maya-dark-mode'); }
  toggleAlexDarkMode() { this.persistToggle(this.alexDarkMode, 'alex-dark-mode'); }
  toggleIanBetaMode() { this.persistToggle(this.ianBetaMode, 'ian-beta-mode'); }
  toggleIanPowerUserMode() { this.persistToggle(this.ianPowerUserMode, 'ian-power-user-mode'); }
  toggleAlexBetaMode() { this.persistToggle(this.alexBetaMode, 'alex-beta-mode'); }
  toggleAlexPowerUserMode() { this.persistToggle(this.alexPowerUserMode, 'alex-power-user-mode'); }

  private persistToggle(sig: WritableSignal<boolean>, key: string) {
    sig.update(v => !v);
    localStorage.setItem(key, String(sig()));
  }
}
