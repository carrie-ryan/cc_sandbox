import { Injectable, signal } from '@angular/core';

export type Persona = 'ian' | 'maya';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  activePersona = signal<Persona>('ian');
  showSettings = signal(false);
  darkMode = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('maya-dark-mode') === 'true'
  );

  setPersona(persona: Persona) {
    this.activePersona.set(persona);
  }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    localStorage.setItem('maya-dark-mode', String(this.darkMode()));
  }
}
