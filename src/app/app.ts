import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header';
import { PersonaService } from './services/persona.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showChrome = true;

  private personaService = inject(PersonaService);

  constructor(private router: Router) {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.personaService.activeDarkMode());
    });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = e.urlAfterRedirects;
      this.showChrome = !url.startsWith('/login') && !url.startsWith('/maya-setup');
      this.personaService.providerContext.set(
        url.startsWith('/dashboard') || url.startsWith('/customers')
      );
    });
  }
}
