import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maya-setup',
  templateUrl: './maya-setup.html',
})
export class MayaSetupComponent {
  urlCopied = false;

  private readonly activationUrl =
    'https://enroll.acmecorp.netfoundry.io/enroll?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.acme-maya-device-token';

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

  copyUrl() {
    navigator.clipboard.writeText(this.activationUrl).then(() => {
      this.urlCopied = true;
      setTimeout(() => (this.urlCopied = false), 2000);
    });
  }

  goToDashboard() {
    this.router.navigate(['/maya-dashboard']);
  }
}
