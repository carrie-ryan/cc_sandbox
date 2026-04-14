export interface LogEntry {
  timestamp: Date;
  url: string;
  port: number;
  status: 'success' | 'fail';
}

export function generateLogs(seed: string): LogEntry[] {
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
    const minsAgo = rand(43200, i * 3) + i * 2;
    entries.push({
      timestamp: new Date(now - minsAgo * 60000),
      url: urls[rand(urls.length, i * 7)],
      port: ports[rand(ports.length, i * 13)],
      status: rand(10, i * 17) < 8 ? 'success' : 'fail',
    });
  }
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function formatLogTimestamp(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function filterLogs(
  logs: LogEntry[],
  timeframe: '24h' | '7d' | '30d',
  statusFilter: 'all' | 'success' | 'fail',
  search: string,
): LogEntry[] {
  const cutoff = new Date();
  if (timeframe === '24h') cutoff.setHours(cutoff.getHours() - 24);
  else if (timeframe === '7d') cutoff.setDate(cutoff.getDate() - 7);
  else cutoff.setDate(cutoff.getDate() - 30);
  return logs.filter(l => {
    if (l.timestamp < cutoff) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.url.toLowerCase().includes(q) || String(l.port).includes(q);
    }
    return true;
  });
}
