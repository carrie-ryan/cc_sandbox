import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showSidebar = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = e.urlAfterRedirects;
      this.showSidebar = url.startsWith('/provider-setup') || url.startsWith('/customer-setup');
    });
  }
}
