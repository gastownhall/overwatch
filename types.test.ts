import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseTitle,
  mapStatus,
  formatRelativeTime,
  extractWorkerName,
  transformGtConvoy,
  calculateStats,
  GtConvoyStatus,
  GtTrackedItem,
} from './types';

describe('parseTitle', () => {
  it('extracts name from "Work: " prefixed titles', () => {
    const result = parseTitle('Work: Infrastructure setup');
    expect(result.name).toBe('Infrastructure setup');
    expect(result.description).toBe('Infrastructure setup');
  });

  it('uses full title when no "Work: " prefix', () => {
    const result = parseTitle('Website v1');
    expect(result.name).toBe('Website v1');
    expect(result.description).toBe('Website v1');
  });

  it('handles empty string', () => {
    const result = parseTitle('');
    expect(result.name).toBe('');
    expect(result.description).toBe('');
  });
});

describe('mapStatus', () => {
  it('returns COMPLETE for closed convoys', () => {
    const convoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'closed',
      tracked: null,
      completed: 1,
      total: 1,
    };
    expect(mapStatus(convoy)).toBe('COMPLETE');
  });

  it('returns RUNNING for open convoys with incomplete progress', () => {
    const convoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'open',
      tracked: null,
      completed: 2,
      total: 5,
    };
    expect(mapStatus(convoy)).toBe('RUNNING');
  });

  it('returns STALE for open convoys with no tracked items', () => {
    const convoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'open',
      tracked: null,
      completed: 0,
      total: 0,
    };
    expect(mapStatus(convoy)).toBe('STALE');
  });

  it('returns COMPLETE for open convoys with all items completed', () => {
    const convoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'open',
      tracked: null,
      completed: 3,
      total: 3,
    };
    expect(mapStatus(convoy)).toBe('COMPLETE');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times within the last minute', () => {
    const result = formatRelativeTime('2026-01-21T11:59:30Z');
    expect(result).toBe('just now');
  });

  it('returns minutes ago for times within the last hour', () => {
    const result = formatRelativeTime('2026-01-21T11:45:00Z');
    expect(result).toBe('15m ago');
  });

  it('returns hours ago for times within the last day', () => {
    const result = formatRelativeTime('2026-01-21T09:00:00Z');
    expect(result).toBe('3h ago');
  });

  it('returns days ago for older times', () => {
    const result = formatRelativeTime('2026-01-19T12:00:00Z');
    expect(result).toBe('2d ago');
  });
});

describe('extractWorkerName', () => {
  it('extracts and capitalizes worker name from assignee path', () => {
    const tracked: GtTrackedItem[] = [
      {
        id: 'task-1',
        title: 'Task',
        status: 'open',
        dependency_type: 'tracks',
        issue_type: 'task',
        assignee: 'website_cc/polecats/obsidian',
      },
    ];
    expect(extractWorkerName(tracked)).toBe('Obsidian');
  });

  it('returns undefined for null tracked array', () => {
    expect(extractWorkerName(null)).toBeUndefined();
  });

  it('returns undefined for empty tracked array', () => {
    expect(extractWorkerName([])).toBeUndefined();
  });

  it('returns undefined when first tracked item has no assignee', () => {
    const tracked: GtTrackedItem[] = [
      {
        id: 'task-1',
        title: 'Task',
        status: 'open',
        dependency_type: 'tracks',
        issue_type: 'task',
      },
    ];
    expect(extractWorkerName(tracked)).toBeUndefined();
  });
});

describe('transformGtConvoy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transforms a complete gt convoy to app format', () => {
    const gtConvoy: GtConvoyStatus = {
      id: 'hq-cv-abc123',
      title: 'Work: Infrastructure setup',
      status: 'open',
      tracked: [
        {
          id: 'task-1',
          title: 'Infrastructure setup',
          status: 'closed',
          dependency_type: 'tracks',
          issue_type: 'task',
          assignee: 'website_cc/polecats/obsidian',
        },
      ],
      completed: 1,
      total: 1,
      created_at: '2026-01-21T11:00:00Z',
    };

    const result = transformGtConvoy(gtConvoy);

    expect(result).toEqual({
      id: 'hq-cv-abc123',
      name: 'Infrastructure setup',
      description: 'Infrastructure setup',
      status: 'COMPLETE',
      progress: { current: 1, total: 1 },
      lastActivity: '1h ago',
      worker: 'Obsidian',
    });
  });

  it('defaults total to 1 when total is 0', () => {
    const gtConvoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'open',
      tracked: null,
      completed: 0,
      total: 0,
    };

    const result = transformGtConvoy(gtConvoy);
    expect(result.progress.total).toBe(1);
  });

  it('returns "idle" for lastActivity when no created_at', () => {
    const gtConvoy: GtConvoyStatus = {
      id: 'test',
      title: 'Test',
      status: 'open',
      tracked: null,
      completed: 0,
      total: 1,
    };

    const result = transformGtConvoy(gtConvoy);
    expect(result.lastActivity).toBe('idle');
  });
});

describe('calculateStats', () => {
  it('calculates completion rate from all convoys', () => {
    const convoys: GtConvoyStatus[] = [
      { id: '1', title: 'A', status: 'open', tracked: null, completed: 2, total: 4 },
      { id: '2', title: 'B', status: 'open', tracked: null, completed: 3, total: 6 },
    ];
    const result = calculateStats(convoys);
    expect(result.completionRate).toBe(50); // 5/10 = 50%
  });

  it('returns 0 completion rate when no items', () => {
    const convoys: GtConvoyStatus[] = [
      { id: '1', title: 'A', status: 'open', tracked: null, completed: 0, total: 0 },
    ];
    const result = calculateStats(convoys);
    expect(result.completionRate).toBe(0);
  });

  it('counts unique polecats from open convoys only', () => {
    const convoys: GtConvoyStatus[] = [
      {
        id: '1',
        title: 'A',
        status: 'open',
        tracked: [
          { id: 't1', title: 'T1', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/polecats/alpha' },
          { id: 't2', title: 'T2', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/polecats/beta' },
        ],
        completed: 0,
        total: 2,
      },
      {
        id: '2',
        title: 'B',
        status: 'closed',
        tracked: [
          { id: 't3', title: 'T3', status: 'closed', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/polecats/gamma' },
        ],
        completed: 1,
        total: 1,
      },
    ];
    const result = calculateStats(convoys);
    expect(result.activePolecats).toBe(2); // Only alpha and beta from open convoy
  });

  it('counts unique crew from open convoys only', () => {
    const convoys: GtConvoyStatus[] = [
      {
        id: '1',
        title: 'A',
        status: 'open',
        tracked: [
          { id: 't1', title: 'T1', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/crew/alice' },
          { id: 't2', title: 'T2', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/crew/bob' },
        ],
        completed: 0,
        total: 2,
      },
    ];
    const result = calculateStats(convoys);
    expect(result.activeCrew).toBe(2);
  });

  it('deduplicates assignees across convoys', () => {
    const convoys: GtConvoyStatus[] = [
      {
        id: '1',
        title: 'A',
        status: 'open',
        tracked: [
          { id: 't1', title: 'T1', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/polecats/alpha' },
        ],
        completed: 0,
        total: 1,
      },
      {
        id: '2',
        title: 'B',
        status: 'open',
        tracked: [
          { id: 't2', title: 'T2', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'rig/polecats/alpha' },
        ],
        completed: 0,
        total: 1,
      },
    ];
    const result = calculateStats(convoys);
    expect(result.activePolecats).toBe(1); // Same polecat across both
  });

  it('ignores non-polecat and non-crew assignees', () => {
    const convoys: GtConvoyStatus[] = [
      {
        id: '1',
        title: 'A',
        status: 'open',
        tracked: [
          { id: 't1', title: 'T1', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'deacon/' },
          { id: 't2', title: 'T2', status: 'open', dependency_type: 'tracks', issue_type: 'task', assignee: 'mayor/' },
        ],
        completed: 0,
        total: 2,
      },
    ];
    const result = calculateStats(convoys);
    expect(result.activePolecats).toBe(0);
    expect(result.activeCrew).toBe(0);
  });

  it('sets hasRunningConvoys true when open convoy has incomplete work', () => {
    const convoys: GtConvoyStatus[] = [
      { id: '1', title: 'A', status: 'open', tracked: null, completed: 1, total: 3 },
    ];
    const result = calculateStats(convoys);
    expect(result.hasRunningConvoys).toBe(true);
  });

  it('sets hasRunningConvoys false when all work is complete', () => {
    const convoys: GtConvoyStatus[] = [
      { id: '1', title: 'A', status: 'open', tracked: null, completed: 3, total: 3 },
      { id: '2', title: 'B', status: 'closed', tracked: null, completed: 1, total: 1 },
    ];
    const result = calculateStats(convoys);
    expect(result.hasRunningConvoys).toBe(false);
  });

  it('handles empty convoy list', () => {
    const result = calculateStats([]);
    expect(result.completionRate).toBe(0);
    expect(result.activePolecats).toBe(0);
    expect(result.activeCrew).toBe(0);
    expect(result.hasRunningConvoys).toBe(false);
  });
});
