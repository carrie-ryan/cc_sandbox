import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-setup-profile',
  templateUrl: './customer-setup-profile.html',
  imports: [RouterLink, FormsModule],
})
export class CustomerSetupProfileComponent {
  customerName = '';
  managementModel: 'provider' | 'self' | null = null;
  logoPreview: string | null = null;
  logoFileName = '';

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => { this.logoPreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  clearLogo() {
    this.logoPreview = null;
    this.logoFileName = '';
  }

  get canContinue(): boolean {
    return this.customerName.trim().length > 0 && this.managementModel !== null;
  }
}
