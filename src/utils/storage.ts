import { Ticket, KBArticle, ITAsset, UserAccount } from '../types';
import { INITIAL_TICKETS, INITIAL_KB_ARTICLES, INITIAL_ASSETS, INITIAL_USERS } from '../data/mockData';

const TICKETS_KEY = 'it_desk_tickets_v1';
const KB_KEY = 'it_desk_kb_articles_v1';
const ASSETS_KEY = 'it_desk_assets_v1';
const USERS_KEY = 'it_desk_users_v1';
const DELETED_USERS_KEY = 'it_desk_deleted_user_ids_v1';
const INITIALIZED_FLAG = 'it_desk_db_initialized_v3';

export function getDeletedUserIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to parse deleted user IDs from localStorage:', e);
  }
  return new Set();
}

export function recordDeletedUserId(userId: string): void {
  try {
    const set = getDeletedUserIds();
    set.add(userId);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted user ID in localStorage:', e);
  }
}

export function clearDeletedUserIds(): void {
  try {
    localStorage.removeItem(DELETED_USERS_KEY);
  } catch (e) {
    console.error('Failed to clear deleted user IDs in localStorage:', e);
  }
}

// Only keep default admin as base user
const DEFAULT_ADMIN_USER: UserAccount = {
  id: 'usr-admin-1',
  name: 'Elimisha IT Administrator',
  email: 'it@elimishawatoto.org',
  role: 'Admin',
  department: 'IT',
  status: 'Active',
  dateAdded: '1/15/2026',
  password: 'ITEWF@2026',
};

export function loadUsers(): UserAccount[] {
  const deletedIds = getDeletedUserIds();
  try {
    const raw = localStorage.getItem(USERS_KEY);
    let parsed: UserAccount[] = [];
    if (raw !== null) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length > 0) {
        parsed = stored;
      }
    }

    const userMap = new Map<string, UserAccount>();

    // Default admin user
    if (!deletedIds.has(DEFAULT_ADMIN_USER.id)) {
      userMap.set(DEFAULT_ADMIN_USER.id, DEFAULT_ADMIN_USER);
    }

    // Stored/created users take priority
    parsed.forEach(u => {
      if (!deletedIds.has(u.id)) {
        userMap.set(u.id, u);
      }
    });

    const merged = Array.from(userMap.values());

    // Ensure it@elimishawatoto.org exists and has correct admin credentials
    const adminIndex = merged.findIndex(u => u.email.toLowerCase() === 'it@elimishawatoto.org');
    if (adminIndex >= 0) {
      merged[adminIndex].password = merged[adminIndex].password === 'admin123' ? 'ITEWF@2026' : (merged[adminIndex].password || 'ITEWF@2026');
      merged[adminIndex].role = 'Admin';
    } else {
      merged.unshift(DEFAULT_ADMIN_USER);
    }

    return merged.map(u => ({
      ...u,
      password: u.password || (u.email.toLowerCase() === 'it@elimishawatoto.org' ? 'ITEWF@2026' : (u.role === 'Admin' ? 'ITEWF@2026' : u.role === 'IT Staff' ? 'staff123' : 'password123')),
    }));
  } catch (e) {
    console.error('Failed to load users from localStorage:', e);
  }
  return [DEFAULT_ADMIN_USER];
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage:', e);
  }
}

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load tickets from localStorage:', e);
  }
  return [];
}

export function saveTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    localStorage.setItem(INITIALIZED_FLAG, 'true');
  } catch (e) {
    console.error('Failed to save tickets to localStorage:', e);
  }
}

export function loadKBArticles(): KBArticle[] {
  try {
    const raw = localStorage.getItem(KB_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load KB articles from localStorage:', e);
  }
  return INITIAL_KB_ARTICLES;
}

export function saveKBArticles(articles: KBArticle[]): void {
  try {
    localStorage.setItem(KB_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save KB articles to localStorage:', e);
  }
}

export function loadAssets(): ITAsset[] {
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load assets from localStorage:', e);
  }
  return [];
}

export function saveAssets(assets: ITAsset[]): void {
  try {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    localStorage.setItem(INITIALIZED_FLAG, 'true');
  } catch (e) {
    console.error('Failed to save assets to localStorage:', e);
  }
}

/**
 * Resets local cache and state with default sample data
 */
export function resetToDefaults() {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
  localStorage.setItem(KB_KEY, JSON.stringify(INITIAL_KB_ARTICLES));
  localStorage.setItem(ASSETS_KEY, JSON.stringify(INITIAL_ASSETS));
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(INITIALIZED_FLAG, 'true');
  return {
    tickets: INITIAL_TICKETS,
    kbArticles: INITIAL_KB_ARTICLES,
    assets: INITIAL_ASSETS,
    users: INITIAL_USERS,
  };
}

/**
 * Completely purges all demo tickets and hardware assets from local storage
 */
export function purgeLocalDemoData() {
  localStorage.setItem(TICKETS_KEY, JSON.stringify([]));
  localStorage.setItem(ASSETS_KEY, JSON.stringify([]));
  localStorage.setItem(INITIALIZED_FLAG, 'true');
  
  // Keep admin user so active administrator stays authenticated
  const currentUsers = loadUsers();
  const adminUsers = currentUsers.filter(u => u.role === 'Admin');
  const safeUsers = adminUsers.length > 0 ? adminUsers : INITIAL_USERS.filter(u => u.role === 'Admin');
  localStorage.setItem(USERS_KEY, JSON.stringify(safeUsers));

  return {
    tickets: [],
    assets: [],
    users: safeUsers,
  };
}

export function exportAllDataAsJSON(tickets: Ticket[], kbArticles: KBArticle[], assets: ITAsset[]) {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    tickets,
    kbArticles,
    assets,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `it_support_desk_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTicketsToCSV(tickets: Ticket[]) {
  const headers = ['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Tier', 'Assignee', 'Reporter', 'Department', 'Asset Tag', 'Created At'];
  const rows = tickets.map(t => [
    `"${t.ticketNumber}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${t.tier}"`,
    `"${t.assignedAgent}"`,
    `"${t.reporterName}"`,
    `"${t.reporterDepartment}"`,
    `"${t.assetId || ''}"`,
    `"${t.createdAt}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodeURI(csvContent));
  downloadAnchor.setAttribute('download', `it_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
