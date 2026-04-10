import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';

type Tab = 'summary' | 'connections' | 'locations' | 'connectors' | 'users' | 'alerts';

interface TableColumn {
  id: string;
  label: string;
  enabled: boolean;
  required?: boolean;
}

interface LogEntry {
  timestamp: Date;
  url: string;
  port: number;
  status: 'success' | 'fail';
}

interface Widget {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  size: 'third' | 'full';
}

@Component({
  selector: 'app-customer-detail',
  imports: [FormsModule],
  templateUrl: './customer-detail.html',
})
export class CustomerDetailComponent {
  customer: Customer | undefined;
  activeTab: Tab = 'summary';
  expandedLocationIds = new Set<string>();
  activeRange: '24h' | '7d' | '30d' | 'custom' = '30d';
  customStart = '';
  customEnd = '';

  showCustomizePanel = false;
  showColumnPicker: string | null = null;
  connectorMenuOpenId: string | null = null;
  menuPositionTop: number | null = null;
  menuPositionBottom: number | null = null;
  disabledIdentityIds = new Set<string>();

  // Logs panel
  showLogsPanel = false;
  logsIdentityId: string | null = null;
  logsTimeframe: '24h' | '7d' | '30d' = '7d';
  logsStatusFilter: 'all' | 'success' | 'fail' = 'all';
  logsSearch = '';
  private allLogs: LogEntry[] = [];

  get logsIdentity() {
    return this.customer?.connectorList.find(c => c.id === this.logsIdentityId) ?? null;
  }

  get filteredLogs(): LogEntry[] {
    const cutoff = new Date();
    if (this.logsTimeframe === '24h') cutoff.setHours(cutoff.getHours() - 24);
    else if (this.logsTimeframe === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);

    return this.allLogs.filter(l => {
      if (l.timestamp < cutoff) return false;
      if (this.logsStatusFilter !== 'all' && l.status !== this.logsStatusFilter) return false;
      if (this.logsSearch) {
        const q = this.logsSearch.toLowerCase();
        return l.url.toLowerCase().includes(q) || String(l.port).includes(q);
      }
      return true;
    });
  }

  openLogs(id: string): void {
    this.connectorMenuOpenId = null;
    this.logsIdentityId = id;
    this.logsTimeframe = '7d';
    this.logsStatusFilter = 'all';
    this.logsSearch = '';
    this.allLogs = this.generateLogs(id);
    this.showLogsPanel = true;
  }

  private generateLogs(seed: string): LogEntry[] {
    const urls = [
      'app.salesforce.com', 'mail.google.com', 'github.com',
      'api.internal.corp', 'jira.company.io', 'confluence.company.io',
      'vpn.corp.net', 's3.amazonaws.com', 'login.microsoftonline.com',
      'slack.com', 'zoom.us', 'drive.google.com',
    ];
    const ports = [443, 443, 443, 8443, 80, 22, 3389, 5432, 8080];
    const hash = (s: string) => s.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    const rand = (n: number, i: number) => Math.abs(hash(seed + i)) % n;

    const entries: LogEntry[] = [];
    const now = Date.now();
    for (let i = 0; i < 120; i++) {
      const minsAgo = rand(43200, i * 3) + i * 2; // up to 30 days
      entries.push({
        timestamp: new Date(now - minsAgo * 60000),
        url: urls[rand(urls.length, i * 7)],
        port: ports[rand(ports.length, i * 13)],
        status: rand(10, i * 17) < 8 ? 'success' : 'fail',
      });
    }
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  formatLogTimestamp(d: Date): string {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  get activeConnector() {
    return this.customer?.connectorList.find(c => c.id === this.connectorMenuOpenId) ?? null;
  }

  openConnectorMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.connectorMenuOpenId === id) {
      this.connectorMenuOpenId = null;
      return;
    }
    // Position relative to the card (position:relative ancestor)
    const card = (event.target as HTMLElement).closest('[data-connector-card]') as HTMLElement;
    const cardRect = card?.getBoundingClientRect() ?? new DOMRect();
    const relY = event.clientY - cardRect.top;
    const spaceBelow = window.innerHeight - event.clientY;
    if (spaceBelow < 180) {
      // Open upward: anchor menu bottom to the click row
      this.menuPositionTop = null;
      this.menuPositionBottom = cardRect.height - relY;
    } else {
      // Open downward: anchor menu top just below the click row
      this.menuPositionBottom = null;
      this.menuPositionTop = relY + 4;
    }
    this.connectorMenuOpenId = id;
  }

  toggleIdentityEnabled(id: string): void {
    if (this.disabledIdentityIds.has(id)) {
      this.disabledIdentityIds.delete(id);
    } else {
      this.disabledIdentityIds.add(id);
    }
    this.connectorMenuOpenId = null;
  }

  tableColumns: Record<string, TableColumn[]> = {
    connections: [
      { id: 'source',      label: 'Source',      enabled: true, required: true },
      { id: 'destination', label: 'Destination',  enabled: true },
      { id: 'application', label: 'Application',  enabled: true },
      { id: 'throughput',  label: 'Throughput',   enabled: true },
      { id: 'status',      label: 'Status',           enabled: true, required: true },
    ],
    locations: [
      { id: 'location',          label: 'Location',           enabled: true, required: true },
      { id: 'city',              label: 'City',               enabled: true },
      { id: 'country',           label: 'Country',            enabled: true },
      { id: 'connectors',        label: 'Connectors',         enabled: true },
      { id: 'activeConnections', label: 'Active Connections', enabled: true },
      { id: 'usage',             label: 'Usage',              enabled: true },
      { id: 'status',            label: 'Status',                 enabled: true, required: true },
    ],
    connectors: [
      { id: 'identity',      label: 'Identity',       enabled: true, required: true },
      { id: 'application',   label: 'Application',    enabled: true },
      { id: 'lastConnected', label: 'Last Connected',  enabled: true },
      { id: 'requests',      label: 'Requests',       enabled: true },
      { id: 'bandwidth',     label: 'Bandwidth',      enabled: true },
      { id: 'throughput',    label: 'Throughput',     enabled: true },
      { id: 'uptime',        label: 'Uptime',         enabled: true },
      { id: 'usage',         label: 'Usage',          enabled: true },
      { id: 'enrollmentStatus', label: 'Status',           enabled: true },
    ],
    users: [
      { id: 'user',           label: 'User',           enabled: true, required: true },
      { id: 'locationRoles',  label: 'Location Roles', enabled: true },
      { id: 'permissions',    label: 'Permissions',    enabled: true },
      { id: 'actions',        label: 'Actions',        enabled: true, required: true },
    ],
    alerts: [
      { id: 'description', label: 'Alert Description', enabled: true, required: true },
      { id: 'created',     label: 'Created',            enabled: true },
      { id: 'type',        label: 'Type',               enabled: true },
      { id: 'actions',     label: 'Actions',            enabled: true, required: true },
    ],
  };

  col(tab: string, id: string): boolean {
    return this.tableColumns[tab]?.find(c => c.id === id)?.enabled ?? true;
  }

  toggleTableColumn(tab: string, id: string): void {
    const c = this.tableColumns[tab]?.find(c => c.id === id);
    if (c && !c.required) c.enabled = !c.enabled;
  }

  visibleColCount(tab: string): number {
    return this.tableColumns[tab]?.filter(c => c.enabled).length ?? 0;
  }

  widgets: Widget[] = [
    { id: 'network-health',      label: 'Network Health',      description: 'Uptime, active connections, bandwidth, and open alerts at a glance.', enabled: true,  size: 'third' },
    { id: 'locations',           label: 'Locations',           description: 'Status overview of all locations for this customer.',                   enabled: true,  size: 'third' },
    { id: 'connectors',          label: 'Connectors',          description: 'Live status of every connector deployed for this customer.',            enabled: true,  size: 'third' },
    { id: 'data-usage',          label: 'Data Usage',          description: 'Transmitted and received bandwidth chart over the selected date range.', enabled: true,  size: 'full'  },
    { id: 'active-connections',  label: 'Active Connections',  description: 'Count and type breakdown of current active connections.',               enabled: false, size: 'third' },
    { id: 'recent-alerts',       label: 'Recent Alerts',       description: 'Latest alerts and warnings across all locations.',                      enabled: false, size: 'third' },
  ];

  widgetDragId: string | null = null;
  widgetDragOverId: string | null = null;

  get enabledWidgets(): Widget[] {
    return this.widgets.filter(w => w.enabled);
  }

  onWidgetDragStart(id: string): void {
    this.widgetDragId = id;
  }

  onWidgetDragOver(id: string, event: DragEvent): void {
    event.preventDefault();
    this.widgetDragOverId = id;
    if (!this.widgetDragId || this.widgetDragId === id) return;
    const from = this.widgets.findIndex(w => w.id === this.widgetDragId);
    const to   = this.widgets.findIndex(w => w.id === id);
    if (from === -1 || to === -1) return;
    const list = [...this.widgets];
    list.splice(to, 0, list.splice(from, 1)[0]);
    this.widgets = list;
  }

  onWidgetDragEnd(): void {
    this.widgetDragId    = null;
    this.widgetDragOverId = null;
  }

  toggleWidget(id: string): void {
    const w = this.widgets.find(w => w.id === id);
    if (w) w.enabled = !w.enabled;
  }

  tabs: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'alerts', label: 'Recent Alerts' },
    { key: 'connections', label: 'Connections' },
    { key: 'locations', label: 'Locations' },
    { key: 'connectors', label: 'Connectors' },
    { key: 'users', label: 'User Permissions' },
    
  ];

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private router: Router,
  ) {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.customer = this.customerService.getById(id);
    if (!this.customer) {
      this.router.navigate(['/dashboard']);
    }
  }

  setTab(tab: Tab) { this.activeTab = tab; }
  setRange(r: '24h' | '7d' | '30d' | 'custom') { this.activeRange = r; }

  get rangeDays(): number {
    if (this.activeRange === '24h') return 1;
    if (this.activeRange === '7d') return 7;
    if (this.activeRange === '30d') return 30;
    if (this.customStart && this.customEnd) {
      const diff = (new Date(this.customEnd).getTime() - new Date(this.customStart).getTime()) / 86400000;
      return Math.max(1, Math.min(30, Math.round(diff) + 1));
    }
    return 30;
  }

  get rangeMultiplier(): number { return this.rangeDays / 30; }

  scaleNum(n: number): number { return Math.round(n * this.rangeMultiplier); }

  scaleBw(raw: string): string {
    const m = raw.match(/^([\d.]+)\s*(GB|TB|MB)$/);
    if (!m) return raw;
    let gb = parseFloat(m[1]);
    if (m[2] === 'TB') gb *= 1024;
    if (m[2] === 'MB') gb /= 1024;
    gb *= this.rangeMultiplier;
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    if (gb < 1 && gb > 0) return `${(gb * 1024).toFixed(0)} MB`;
    return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
  }

  toggleLocation(id: string) {
    if (this.expandedLocationIds.has(id)) {
      this.expandedLocationIds.delete(id);
    } else {
      this.expandedLocationIds.add(id);
    }
  }

  connectorsForLocation(locationName: string) {
    return this.customer?.connectorList.filter(c => c.location === locationName) ?? [];
  }

  goBack() { this.router.navigate(['/dashboard']); }

  isUptimeDegraded(uptime: string): boolean {
    return uptime.startsWith('9') && parseFloat(uptime) < 98;
  }

  get bandwidthChart() {
    const h = this.customer?.bandwidthHistory;
    if (!h) return null;
    const tx = h.tx.slice(-this.rangeDays);
    const rx = h.rx.slice(-this.rangeDays);
    const maxVal = Math.max(...tx, ...rx, 1) * 1.15;
    // SVG viewBox 0 0 760 180 — chart area x:52..748, y:12..152
    const oX = 52, oY = 12, W = 696, H = 140;
    const n = tx.length;
    const px = (i: number) => oX + (i / (n - 1)) * W;
    const py = (v: number) => oY + H - (v / maxVal) * H;
    const line = (arr: number[]) =>
      arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
    const area = (arr: number[]) =>
      `${line(arr)} L${(oX + W).toFixed(1)} ${(oY + H).toFixed(1)} L${oX} ${(oY + H).toFixed(1)}Z`;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    return {
      txLine: line(tx), rxLine: line(rx),
      txArea: area(tx), rxArea: area(rx),
      txTotal: sum(tx), rxTotal: sum(rx),
      baseY: (oY + H).toFixed(1),
      gridLines: [0.25, 0.5, 0.75, 1].map(f => ({
        y: (oY + H - f * H).toFixed(1),
        label: `${Math.round(maxVal * f)} GB`,
      })),
      xLabels: [0, 5, 10, 15, 20, 25, 29].map(i => ({
        x: px(i).toFixed(1),
        label: `Day ${i + 1}`,
      })),
    };
  }
}
