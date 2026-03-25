import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';

interface KpiStat {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-provider-dashboard',
  templateUrl: './provider-dashboard.html',
})
export class ProviderDashboardComponent {
  expandedCustomerIndex: number | null = null;
  customers: Customer[];

  stats: KpiStat[] = [
    { label: 'Total Customers', value: '24', sub: '+2 this month', icon: 'customers', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Network Uptime', value: '99.97%', sub: 'Last 30 days', icon: 'uptime', iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Active Connections', value: '1,284', sub: 'Across all customers', icon: 'connections', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Data Transferred', value: '4.7 TB', sub: 'This month', icon: 'data', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Active Connectors', value: '312', sub: 'Across all locations', icon: 'connectors', iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
  ];

  constructor(private customerService: CustomerService, private router: Router) {
    this.customers = this.customerService.getAll();
  }

  toggleExpanded(index: number) {
    this.expandedCustomerIndex = this.expandedCustomerIndex === index ? null : index;
  }

  navigateToCustomer(id: string) {
    this.router.navigate(['/customers', id]);
  }
}
