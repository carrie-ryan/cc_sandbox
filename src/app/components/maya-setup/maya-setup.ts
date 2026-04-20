import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maya-setup',
  templateUrl: './maya-setup.html',
})
export class MayaSetupComponent {
  constructor(private router: Router) {}

  downloadJwt() {
    const blob = new Blob([''], { type: 'application/jwt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activation.jwt';
    a.click();
    URL.revokeObjectURL(url);
  }

  goToDashboard() {
    this.router.navigate(['/maya-dashboard']);
  }
}
