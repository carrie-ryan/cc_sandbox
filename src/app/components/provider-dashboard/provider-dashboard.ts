import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { CustomerService, Customer } from '../../services/customer.service';

interface KpiStat {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface Column {
  id: string;
  label: string;
  align: 'left' | 'right';
}

@Component({
  selector: 'app-provider-dashboard',
  templateUrl: './provider-dashboard.html',
  imports: [FormsModule, NgTemplateOutlet],
})
export class ProviderDashboardComponent {
  expandedCustomerIndex: number | null = null;
  customers: Customer[];

  searchQuery = '';
  filterStatus: 'All' | 'Active' | 'Degraded' | 'Inactive' = 'All';
  filterAlerts: 'All' | 'Has Alerts' | 'No Alerts' = 'All';
  showFilters = false;

  sortCol = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  setSort(col: string): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
  }

  get activeFilterCount(): number {
    return (this.filterStatus !== 'All' ? 1 : 0) + (this.filterAlerts !== 'All' ? 1 : 0);
  }

  get filteredCustomers(): Customer[] {
    const filtered = this.customers.filter(c => {
      const matchesSearch = !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.filterStatus === 'All' || c.status === this.filterStatus;
      const matchesAlerts = this.filterAlerts === 'All' ||
        (this.filterAlerts === 'Has Alerts' ? c.alerts.length > 0 : c.alerts.length === 0);
      return matchesSearch && matchesStatus && matchesAlerts;
    });

    return [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      switch (this.sortCol) {
        case 'name':              valA = a.name;               valB = b.name;               break;
        case 'status':            valA = a.status;             valB = b.status;             break;
        case 'locations':         valA = a.locations;          valB = b.locations;          break;
        case 'connectors':        valA = a.connectors;         valB = b.connectors;         break;
        case 'activeConnections': valA = a.activeConnections;  valB = b.activeConnections;  break;
        case 'bandwidthUsed':     valA = parseFloat(a.bandwidthUsed) || 0; valB = parseFloat(b.bandwidthUsed) || 0; break;
        case 'uptime':            valA = parseFloat(a.uptime)  || 0; valB = parseFloat(b.uptime)  || 0; break;
        case 'alerts':            valA = a.alerts.length;      valB = b.alerts.length;      break;
        default: return 0;
      }
      if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  clearFilters(): void {
    this.filterStatus = 'All';
    this.filterAlerts = 'All';
    this.searchQuery = '';
  }

  columns: Column[] = [
    { id: 'status',            label: 'Connection',             align: 'left'  },
    { id: 'locations',         label: 'Locations',          align: 'right' },
    { id: 'connectors',        label: 'Connectors',         align: 'right' },
    { id: 'activeConnections', label: 'Active Connections', align: 'right' },
    { id: 'bandwidthUsed',     label: 'Bandwidth Used',     align: 'right' },
    { id: 'uptime',            label: 'Uptime',             align: 'right' },
  ];

  draggedColId: string | null = null;
  dragOverColId: string | null = null;

  onDragStart(id: string): void {
    this.draggedColId = id;
  }

  onDragOver(id: string, event: DragEvent): void {
    event.preventDefault();
    this.dragOverColId = id;
    if (!this.draggedColId || this.draggedColId === id) return;
    const from = this.columns.findIndex(c => c.id === this.draggedColId);
    const to   = this.columns.findIndex(c => c.id === id);
    if (from === -1 || to === -1) return;
    const cols = [...this.columns];
    cols.splice(to, 0, cols.splice(from, 1)[0]);
    this.columns = cols;
  }

  onDragEnd(): void {
    this.draggedColId  = null;
    this.dragOverColId = null;
  }

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
