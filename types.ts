// Domain types (what the app works with)
export type ConvoyStatus = 'COMPLETE' | 'STALE' | 'RUNNING' | 'FAILED';

export interface Convoy {
  id: string;
  name: string;
  description: string;
  status: ConvoyStatus;
  progress: {
    current: number;
    total: number;
  };
  lastActivity: string;
  worker?: string;
}

export interface SystemStats {
  completionRate: number;  // % of items completed across all convoys (Guzzoline)
  activePolecats: number;  // count of unique polecats (*/polecats/*) on open convoys
  activeCrew: number;      // count of unique crew members (*/crew/*) on open convoys
  hasRunningConvoys: boolean;  // true if any convoy is currently running
}

// API response types from gt CLI
export interface GtTrackedItem {
  id: string;
  title: string;
  status: string;
  dependency_type: string;
  issue_type: string;
  assignee?: string;
}

export interface GtConvoyStatus {
  id: string;
  title: string;
  status: 'open' | 'closed';
  tracked: GtTrackedItem[] | null;
  completed: number;
  total: number;
  created_at?: string;
}

// Transformation helpers (exported for testing)
export function parseTitle(title: string): { name: string; description: string } {
  if (title.startsWith('Work: ')) {
    const name = title.replace('Work: ', '');
    return { name, description: name };
  }
  return { name: title, description: title };
}

export function mapStatus(gtConvoy: GtConvoyStatus): ConvoyStatus {
  if (gtConvoy.status === 'closed') {
    return 'COMPLETE';
  }
  if (gtConvoy.total > 0 && gtConvoy.completed < gtConvoy.total) {
    return 'RUNNING';
  }
  if (gtConvoy.total === 0) {
    return 'STALE';
  }
  return 'COMPLETE';
}

export function formatRelativeTime(dateString: string): string {
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export function extractWorkerName(tracked: GtTrackedItem[] | null): string | undefined {
  const firstTracked = tracked?.[0];
  const assignee = firstTracked?.assignee;
  if (!assignee) return undefined;

  const parts = assignee.split('/');
  const name = parts[parts.length - 1];
  if (!name) return undefined;

  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Calculate system stats from convoy data
export function calculateStats(data: GtConvoyStatus[]): SystemStats {
  const totalCompleted = data.reduce((sum, c) => sum + c.completed, 0);
  const totalItems = data.reduce((sum, c) => sum + (c.total || 0), 0);
  const completionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const openConvoys = data.filter((c) => c.status === 'open');
  const hasRunningConvoys = openConvoys.some((c) => c.total > 0 && c.completed < c.total);

  const uniquePolecats = new Set<string>();
  const uniqueCrew = new Set<string>();
  for (const convoy of openConvoys) {
    if (convoy.tracked) {
      for (const item of convoy.tracked) {
        if (item.assignee) {
          if (item.assignee.includes('/polecats/')) {
            uniquePolecats.add(item.assignee);
          }
          if (item.assignee.includes('/crew/')) {
            uniqueCrew.add(item.assignee);
          }
        }
      }
    }
  }

  return {
    completionRate,
    activePolecats: uniquePolecats.size,
    activeCrew: uniqueCrew.size,
    hasRunningConvoys,
  };
}

// Transform gt CLI data to app format
export function transformGtConvoy(gtConvoy: GtConvoyStatus): Convoy {
  const { name, description } = parseTitle(gtConvoy.title);

  return {
    id: gtConvoy.id,
    name,
    description,
    status: mapStatus(gtConvoy),
    progress: {
      current: gtConvoy.completed,
      total: gtConvoy.total || 1,
    },
    lastActivity: gtConvoy.created_at ? formatRelativeTime(gtConvoy.created_at) : 'idle',
    worker: extractWorkerName(gtConvoy.tracked),
  };
}