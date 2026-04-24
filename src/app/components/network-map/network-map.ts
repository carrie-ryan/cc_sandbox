import { Component, input, signal, computed } from '@angular/core';
import { CustomerLocation, CustomerConnector, CustomerIdentity } from '../../services/customer.service';

export interface ConnectorWithWarnings {
  connector: CustomerConnector;
  droppedPackets: number;
  droppedConnections: number;
  severity: 'none' | 'warning' | 'critical';
}

export interface MapNode {
  location: CustomerLocation;
  connectors: ConnectorWithWarnings[];
  x: number;
  y: number;
  severity: 'none' | 'warning' | 'critical';
}

// Real lat/lon for equirectangular projection matching world-map.svg viewBox 0 0 1000 500
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Chicago':       { lat: 41.88,  lon: -87.63  },
  'Austin':        { lat: 30.27,  lon: -97.74  },
  'New York':      { lat: 40.71,  lon: -74.01  },
  'London':        { lat: 51.51,  lon: -0.13   },
  'San Francisco': { lat: 37.77,  lon: -122.42 },
  'Seattle':       { lat: 47.61,  lon: -122.33 },
  'Denver':        { lat: 39.74,  lon: -104.98 },
  'Toronto':       { lat: 43.65,  lon: -79.38  },
  'Frankfurt':     { lat: 50.11,  lon: 8.68    },
  'Singapore':     { lat: 1.35,   lon: 103.82  },
  'Tokyo':         { lat: 35.69,  lon: 139.69  },
  'Sydney':        { lat: -33.87, lon: 151.21  },
};

function connectorSeverity(packets: number, connections: number): 'none' | 'warning' | 'critical' {
  if (connections >= 3) return 'critical';
  if (connections > 0 || packets > 0) return 'warning';
  return 'none';
}

function getCityCoords(city: string): { x: number; y: number } {
  const ll = CITY_COORDS[city];
  if (!ll) return { x: 500, y: 250 };
  return {
    x: ((ll.lon + 180) / 360) * 1000,
    y: ((90 - ll.lat) / 180) * 500,
  };
}

@Component({
  selector: 'app-network-map',
  standalone: true,
  templateUrl: './network-map.html',
})
export class NetworkMapComponent {
  locations  = input.required<CustomerLocation[]>();
  connectors = input.required<CustomerConnector[]>();
  identities = input.required<CustomerIdentity[]>();

  selectedNode = signal<MapNode | null>(null);

  // Index identities by name for O(1) lookup
  private identityByName = computed<Map<string, CustomerIdentity>>(() => {
    const map = new Map<string, CustomerIdentity>();
    for (const id of this.identities()) map.set(id.name, id);
    return map;
  });

  nodes = computed<MapNode[]>(() => {
    const byName = this.identityByName();
    return this.locations().map(loc => {
      const connectorsWithWarnings: ConnectorWithWarnings[] = this.connectors()
        .filter(c => c.location === loc.name)
        .map(c => {
          const identity = byName.get(c.name);
          const packets     = identity?.droppedPackets     ?? 0;
          const connections = identity?.droppedConnections ?? 0;
          return { connector: c, droppedPackets: packets, droppedConnections: connections, severity: connectorSeverity(packets, connections) };
        });

      // Location severity = worst connector severity
      const severity = connectorsWithWarnings.some(c => c.severity === 'critical') ? 'critical'
        : connectorsWithWarnings.some(c => c.severity === 'warning') ? 'warning'
        : 'none';

      return { location: loc, connectors: connectorsWithWarnings, severity, ...getCityCoords(loc.city) };
    });
  });

  selectNode(node: MapNode) {
    const current = this.selectedNode();
    this.selectedNode.set(current?.location.id === node.location.id ? null : node);
  }

  isSelected(node: MapNode): boolean {
    return this.selectedNode()?.location.id === node.location.id;
  }

  closePanel() {
    this.selectedNode.set(null);
  }

  statusColor(status: 'Online' | 'Degraded' | 'Offline'): string {
    if (status === 'Online')   return '#22c55e';
    if (status === 'Degraded') return '#f59e0b';
    return '#ef4444';
  }

  connectorStatusColor(status: string): string {
    if (status === 'Online')   return 'text-green-600 dark:text-green-400';
    if (status === 'Degraded') return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  connectorStatusDot(status: string): string {
    if (status === 'Online')   return 'bg-green-500';
    if (status === 'Degraded') return 'bg-amber-500';
    return 'bg-red-500';
  }

  connectorTypeLabel(type: string): string {
    const map: Record<string, string> = {
      gateway: 'Gateway', device: 'Device', clientless: 'Clientless', sdk: 'SDK', connector: 'Connector',
    };
    return map[type] ?? type;
  }

  locationStatusClass(status: 'Online' | 'Degraded' | 'Offline'): string {
    if (status === 'Online')   return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    if (status === 'Degraded') return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
    return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  }
}
