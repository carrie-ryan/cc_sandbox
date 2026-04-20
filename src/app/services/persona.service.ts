import { Injectable, signal, computed } from '@angular/core';

export type Persona = 'ian' | 'maya';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  activePersona = signal<Persona>('ian');
  showSettings = signal(false);

  ianDarkMode = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('ian-dark-mode') === 'true'
  );

  mayaDarkMode = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('maya-dark-mode') === 'true'
  );

  ianBetaMode = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('ian-beta-mode') === 'true'
  );

  activeDarkMode = computed(() =>
    this.activePersona() === 'maya' ? this.mayaDarkMode() : this.ianDarkMode()
  );

  setPersona(persona: Persona) {
    this.activePersona.set(persona);
  }

  toggleIanDarkMode() {
    this.ianDarkMode.update(v => !v);
    localStorage.setItem('ian-dark-mode', String(this.ianDarkMode()));
  }

  toggleMayaDarkMode() {
    this.mayaDarkMode.update(v => !v);
    localStorage.setItem('maya-dark-mode', String(this.mayaDarkMode()));
  }

  toggleIanBetaMode() {
    this.ianBetaMode.update(v => !v);
    localStorage.setItem('ian-beta-mode', String(this.ianBetaMode()));
  }
}
