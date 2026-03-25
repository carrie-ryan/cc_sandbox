import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';

type Tab = 'summary' | 'connections' | 'locations' | 'connectors' | 'identities' | 'users' | 'alerts';

@Component({
  selector: 'app-customer-detail',
  imports: [],
  templateUrl: './customer-detail.html',
})
export class CustomerDetailComponent {
  customer: Customer | undefined;
  activeTab: Tab = 'summary';
  expandedLocationIds = new Set<string>();
  activeRange: '24h' | '7d' | '30d' | 'custom' = '30d';
  customStart = '';
  customEnd = '';

  tabs: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'connections', label: 'Connections' },
    { key: 'locations', label: 'Locations' },
    { key: 'connectors', label: 'Connectors' },
    { key: 'identities', label: 'Identities' },
    { key: 'users', label: 'Users' },
    { key: 'alerts', label: 'Recent Alerts' },
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
