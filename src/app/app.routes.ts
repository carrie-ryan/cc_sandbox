import { Routes } from '@angular/router';
import { OverviewPageComponent } from './components/overview-page/overview-page';
import { ConnectorTemplatesComponent } from './components/connector-templates/connector-templates';
import { LocationsComponent } from './components/locations/locations';
import { CustomerLocationsComponent } from './components/customer-locations/customer-locations';
import { CustomerOnboardingComponent } from './components/customer-onboarding/customer-onboarding';
import { ProviderDashboardComponent } from './components/provider-dashboard/provider-dashboard';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'provider-setup/overview', pathMatch: 'full' },
  { path: 'dashboard', component: ProviderDashboardComponent },
  { path: 'customers/:id', component: CustomerDetailComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  { path: 'provider-setup/overview', component: OverviewPageComponent },
  { path: 'provider-setup/connector-templates', component: ConnectorTemplatesComponent },
  { path: 'provider-setup/locations', component: LocationsComponent },
  { path: 'customer-portal/locations', component: CustomerLocationsComponent },
  { path: 'customer-portal/onboarding', component: CustomerOnboardingComponent },
];
