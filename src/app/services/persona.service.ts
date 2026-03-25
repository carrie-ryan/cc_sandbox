import { Injectable, signal } from '@angular/core';

export type Persona = 'ian' | 'maya';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  activePersona = signal<Persona>('ian');
  showSettings = signal(false);

  setPersona(persona: Persona) {
    this.activePersona.set(persona);
  }
}
