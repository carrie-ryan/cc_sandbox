import { Component, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';

interface CustomerConnector {
  id: string;
  name: string;
  type: string;
  template: string;
  hostedApps: number;
  hostedAppNames: string[];
  status: 'Online' | 'Degraded' | 'Offline';
  uptime: string;
  lastConnected: string;
  allocation: string;
  version: string;
}


interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  addressSub: string;
  licensesAllocated: number;
  connectors: CustomerConnector[];
}

interface ConnectorApp {
  protocol: string;
  name: string;
  roles: string[];
}

@Component({
  selector: 'app-customer-locations',
  imports: [FormsModule],
  templateUrl: './customer-locations.html',
})
export class CustomerLocationsComponent {
  private readonly el = inject(ElementRef);
  private readonly customerService = inject(CustomerService);
  private previouslyFocusedEl: HTMLElement | null = null;

  get isAnyModalOpen(): boolean {
    return this.showAddConnectorModal;
  }

  private saveFocus(): void {
    this.previouslyFocusedEl = document.activeElement as HTMLElement;
  }

  private restoreFocus(): void {
    // Defer focus() past Angular's change detection cycle so the [attr.inert]
    // binding on the main content div is removed before we attempt to focus.
    // Calling focus() on an element inside an inert subtree is a silent no-op.
    const target = this.previouslyFocusedEl;
    this.previouslyFocusedEl = null;
    setTimeout(() => target?.focus());
  }

  private focusFirstInDialog(): void {
    setTimeout(() => {
      const dialog = this.el.nativeElement.parentElement?.querySelector('[role="dialog"]') as HTMLElement | null;
      if (!dialog) return;
      const first = dialog.querySelector(
        'button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      first?.focus();
    }, 50);
  }

  showAddConnectorModal = false;

  rowMenuOpenId: string | null = null;
  editingConnectorId: string | null = null;
  editingConnectorName = '';
  activeLocationId: string | null = null;
  pausedConnectors = new Set<string>();

  connectorName = '';
  connectorType = '';
  selectedTemplate = 'No Template';
  saveAsTemplate = false;

  searchQuery = '';
  activeFilter = 'All';
  filters = ['All', 'Location', 'Template', 'Type'];

  connectorTypes = ['Device', 'Gateway', 'Clientless', 'SDK Embedded'];
  templates = ['No Template', 'Standard Device', 'Secure Gateway'];

  private readonly typeLabel: Record<string, string> = {
    gateway: 'Gateway', device: 'Device', clientless: 'Clientless', sdk: 'SDK Embedded', connector: 'Connector',
  };

  locations: CustomerLocation[] = (() => {
    const customer = this.customerService.getById('acme-corp')!;
    return customer.locationList.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.city,
      addressSub: loc.country,
      licensesAllocated: loc.connectors,
      connectors: customer.connectorList
        .filter(c => c.location === loc.name)
        .map(c => ({
          id: c.id,
          name: c.name,
          type: this.typeLabel[c.type] ?? c.type,
          template: c.template,
          hostedApps: c.hostedApps.length,
          hostedAppNames: c.hostedApps,
          status: c.status,
          uptime: c.uptime,
          lastConnected: c.lastSeen,
          allocation: '0/0',
          version: c.version,
        })),
    }));
  })();

  expanded: { [id: string]: boolean } = { [this.locations[0]?.id ?? '']: true };
  connectorExpanded: Record<string, boolean> = {};
  appEnabled: Record<string, boolean> = {};

  readonly providerName = 'Central Square';

  private readonly appRoleMap: Record<string, Record<string, string[]>> = {
    'Chicago-GW-01': { CAD: ['End User', 'IT Admin'] },
    'Chicago-GW-02': { RMS: ['IT Admin', 'Supervisor'] },
    'Chicago-Dev-02': { 'Criminal Profiling System': ['IT Admin', 'Supervisor'], 'Patrol Route Optimizer': ['End User', 'IT Admin'] },
    'NY-CL-01':      { GIS: ['End User', 'IT Admin', 'Supervisor'] },
    'London-GW-01':  { CIM: ['IT Admin', 'Supervisor'] },
  };

  private locationTotals(loc: CustomerLocation): { used: number; total: number } {
    let used = 0, total = 0;
    for (const conn of loc.connectors) {
      const [u, t] = conn.allocation.split('/').map(Number);
      used += u;
      total += t;
    }
    return { used, total };
  }

  locationAllocation(loc: CustomerLocation): string {
    const { used, total } = this.locationTotals(loc);
    return `${used}/${total}`;
  }

  locationUsagePct(loc: CustomerLocation): number {
    const { used, total } = this.locationTotals(loc);
    return total > 0 ? used / total : 0;
  }

  get totalLicenses(): number {
    return this.locations.reduce((sum, loc) =>
      sum + loc.connectors.reduce((s, c) => s + Number(c.allocation.split('/')[1]), 0), 0);
  }

  get usedLicenses(): number {
    return this.locations.reduce((sum, loc) =>
      sum + loc.connectors.reduce((s, c) => s + Number(c.allocation.split('/')[0]), 0), 0);
  }

  get availableLicenses(): number {
    return this.totalLicenses - this.usedLicenses;
  }

  get licenseWarning(): boolean {
    return this.totalLicenses > 0 && this.usedLicenses / this.totalLicenses >= 0.8;
  }

  get licenseUsagePct(): number {
    return this.totalLicenses > 0 ? Math.round((this.usedLicenses / this.totalLicenses) * 100) : 0;
  }

  get activeLocation(): CustomerLocation | null {
    return this.locations.find(l => l.id === this.activeLocationId) ?? null;
  }

  readonly appFriendlyNames: Record<string, string> = {
    'CAD': 'Computer-Aided Dispatch',
    'RMS': 'Records Management System',
    'GIS': 'GIS Mapping',
    'CIM': 'Common Informatics Module',
  };

  readonly appLabel = (tech: string): string => {
    const friendly = this.appFriendlyNames[tech];
    return friendly ? `${tech} / ${friendly}` : tech;
  };

  private readonly LATEST_VERSION = '3.4.1';

  private readonly versionOverrides: Record<string, 'required' | 'failed'> = {
    'Chicago-Dev-01': 'required',
    'Austin-Host-03': 'failed',
  };

  versionStatusLabel(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'required') return 'Update required';
    if (override === 'failed') return 'Update failed';
    if (conn.version === this.LATEST_VERSION) return 'Version up to date';
    return 'Needs updating';
  }

  versionStatusClasses(conn: CustomerConnector): string {
    const override = this.versionOverrides[conn.id];
    if (override === 'required') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    if (override === 'failed') return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
    if (conn.version === this.LATEST_VERSION) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
  }

  connectorTypeColor(type: string): string {
    const map: { [key: string]: string } = {
      'Device': 'bg-blue-100 text-blue-700',
      'Gateway': 'bg-green-100 text-green-700',
      'Clientless': 'bg-purple-100 text-purple-700',
      'SDK Embedded': 'bg-orange-100 text-orange-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  deleteConnector(conn: CustomerConnector, loc: CustomerLocation): void {
    loc.connectors.splice(loc.connectors.indexOf(conn), 1);
  }

  duplicateConnector(conn: CustomerConnector, loc: CustomerLocation): void {
    const newId = 'c-dup-' + Date.now();
    const copy: CustomerConnector = { ...conn, id: newId, name: conn.name + ' (Copy)' };
    const idx = loc.connectors.indexOf(conn);
    loc.connectors.splice(idx + 1, 0, copy);
    this.editingConnectorId = newId;
    this.editingConnectorName = copy.name;
  }

  commitConnectorName(conn: CustomerConnector): void {
    const trimmed = this.editingConnectorName.trim();
    if (trimmed) conn.name = trimmed;
    this.editingConnectorId = null;
  }

  toggleExpand(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  toggleConnectorPause(id: string): void {
    if (this.pausedConnectors.has(id)) {
      this.pausedConnectors.delete(id);
    } else {
      this.pausedConnectors.add(id);
    }
  }

  isConnectorPaused(id: string): boolean {
    return this.pausedConnectors.has(id);
  }

  toggleConnectorExpand(connId: string, event: Event): void {
    event.stopPropagation();
    this.connectorExpanded[connId] = !this.connectorExpanded[connId];
  }

  getConnectorApps(conn: CustomerConnector): ConnectorApp[] {
    return conn.hostedAppNames.map(protocol => ({
      protocol,
      name: this.appFriendlyNames[protocol] ?? protocol,
      roles: this.appRoleMap[conn.id]?.[protocol] ?? [],
    }));
  }

  getConnectorRoles(conn: CustomerConnector): string[] {
    const roles = new Set<string>();
    for (const protocol of conn.hostedAppNames) {
      for (const r of (this.appRoleMap[conn.id]?.[protocol] ?? [])) {
        roles.add(r);
      }
    }
    return [...roles];
  }

  isAppEnabled(connId: string, protocol: string): boolean {
    return this.appEnabled[`${connId}::${protocol}`] !== false;
  }

  toggleAppEnabled(connId: string, protocol: string): void {
    const key = `${connId}::${protocol}`;
    this.appEnabled[key] = !this.isAppEnabled(connId, protocol);
  }

  openAddConnector(locationId: string): void {
    this.saveFocus();
    this.activeLocationId = locationId;
    this.connectorName = '';
    this.connectorType = '';
    this.selectedTemplate = 'No Template';
    this.saveAsTemplate = false;
    this.showAddConnectorModal = true;
    this.focusFirstInDialog();
  }

  closeAddConnector(): void {
    this.showAddConnectorModal = false;
    this.activeLocationId = null;
    this.restoreFocus();
  }

}
