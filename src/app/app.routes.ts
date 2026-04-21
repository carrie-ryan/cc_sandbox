import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { MayaSetupComponent } from './components/maya-setup/maya-setup';
import { CustomerLocationsComponent } from './components/customer-locations/customer-locations';
import { CustomerOnboardingComponent } from './components/customer-onboarding/customer-onboarding';
import { ProviderDashboardComponent } from './components/provider-dashboard/provider-dashboard';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail';
import { IanDashboardComponent } from './components/ian-dashboard/ian-dashboard';
import { MayaDashboardComponent } from './components/maya-dashboard/maya-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'maya-setup', component: MayaSetupComponent },
  { path: 'dashboard', component: ProviderDashboardComponent },
  { path: 'customers/:id', component: CustomerDetailComponent },
  { path: 'ian-dashboard', component: IanDashboardComponent },
  { path: 'maya-dashboard', component: MayaDashboardComponent },
  { path: 'customer-portal/locations', component: CustomerLocationsComponent },
  { path: 'customer-portal/onboarding', component: CustomerOnboardingComponent },
];
