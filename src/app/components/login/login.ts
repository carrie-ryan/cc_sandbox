import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [FormsModule],
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  constructor(private router: Router, private personaService: PersonaService) {}

  signIn() {
    this.personaService.setPersona('maya');
    this.router.navigate(['/maya-setup']);
  }
}
