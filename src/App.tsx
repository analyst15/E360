import React, { useState, useEffect } from 'react';
import {
  Ticket,
  KBArticle,
  ITAsset,
  UserAccount,
  AppViewMode,
  FilterState,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketComment,
} from './types';
import {
  loadTickets,
  saveTickets,
  loadKBArticles,
  saveKBArticles,
  loadAssets,
  saveAssets,
  loadUsers,
  saveUsers,
  resetToDefaults,
  purgeLocalDemoData,
  exportAllDataAsJSON,
  exportTicketsToCSV,
} from './utils/storage';
import {
  subscribeTickets,
  subscribeAssets,
  subscribeUsers,
  subscribeKBArticles,
  saveTicketToFirestore,
  deleteTicketFromFirestore,
  addCommentToTicketInFirestore,
  saveAssetToFirestore,
  deleteAssetFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveKBArticleToFirestore,
  deleteKBArticleFromFirestore,
  purgeAllDemoDataFromFirestore,
  deleteAllTicketsFromFirestore,
  seedSampleDataToFirestore,
} from './firebase/dbService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AdminDashboardView } from './components/AdminDashboardView';
import { UsersView } from './components/UsersView';
import { TicketTableView } from './components/TicketTableView';
import { TicketKanbanView } from './components/TicketKanbanView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SelfServicePortalView } from './components/SelfServicePortalView';
import { AssetDirectoryView } from './components/AssetDirectoryView';
import { EmployeePortalPage } from './components/EmployeePortalPage';
import { WorkplacePortalsHub } from './components/WorkplacePortalsHub';
import { LoginPage } from './components/LoginPage';
import { ITStaffDashboardView } from './components/ITStaffDashboardView';
import { sendTicketCreatedNotification, sendTicketResolvedNotification } from './utils/notifications';

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [kbArticles, setKBArticles] = useState<KBArticle[]>(() => loadKBArticles());
  const [assets, setAssets] = useState<ITAsset[]>(() => loadAssets());
  const [users, setUsers] = useState<UserAccount[]>(() => loadUsers());

  // Current Authenticated User Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ewf_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse auth user from localStorage:', e);
    }
    return null;
  });

  // Dual Web Portal Mode: 'admin' (IT Staff Console) vs 'employee' (Employee Helpdesk Portal)
  const [portalMode, setPortalMode] = useState<'admin' | 'employee'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      if (
        path.includes('/portal') ||
        path.includes('/employee') ||
        path.includes('/support') ||
        params.get('portal') === 'employee' ||
        params.get('view') === 'portal' ||
        hash.includes('portal') ||
        hash.includes('employee')
      ) {
        return 'employee';
      }
      const saved = localStorage.getItem('ewf_active_portal');
      if (saved === 'employee') return 'employee';
    }
    return 'admin';
  });

  const [currentView, setCurrentView] = useState<AppViewMode>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<{
    category?: TicketCategory;
    title?: string;
    description?: string;
    assetTag?: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterDepartment?: string;
  }>({});

  const [isAiEnabled, setIsAiEnabled] = useState(true);

  // Global Filter State for Table
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'All',
    priority: 'All',
    category: 'All',
    assignedAgent: 'All',
    tier: 'All',
    sortBy: 'newest',
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubTickets = subscribeTickets((liveTickets) => {
      setTickets(liveTickets);
    });
    const unsubAssets = subscribeAssets((liveAssets) => {
      setAssets(liveAssets);
    });
    const unsubUsers = subscribeUsers((liveUsers) => {
      setUsers(liveUsers);
    });
    const unsubKB = subscribeKBArticles((liveArticles) => {
      setKBArticles(liveArticles);
    });

    return () => {
      unsubTickets();
      unsubAssets();
      unsubUsers();
      unsubKB();
    };
  }, []);

  // Handle Browser URL & Back/Forward Navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      if (
        path.includes('/portal') ||
        path.includes('/employee') ||
        path.includes('/support') ||
        params.get('portal') === 'employee' ||
        params.get('view') === 'portal' ||
        hash.includes('portal') ||
        hash.includes('employee')
      ) {
        setPortalMode('employee');
      } else {
        setPortalMode('admin');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchPortalMode = (mode: 'admin' | 'employee') => {
    setPortalMode(mode);
    localStorage.setItem('ewf_active_portal', mode);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', mode === 'employee' ? '/portal' : '/');
    }
  };

  // Check health and AI availability
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setIsAiEnabled(Boolean(data.aiConfigured));
      })
      .catch(() => {
        setIsAiEnabled(false);
      });
  }, []);

  // Sync state to local storage as fallback cache
  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    saveKBArticles(kbArticles);
  }, [kbArticles]);

  useEffect(() => {
    saveAssets(assets);
  }, [assets]);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Authentication Handlers
  const handleLogin = (user: UserAccount, targetPortal: 'admin' | 'employee') => {
    setCurrentUser(user);
    setPortalMode(targetPortal);
    localStorage.setItem('ewf_auth_user', JSON.stringify(user));
    localStorage.setItem('ewf_active_portal', targetPortal);
    localStorage.setItem('ewf_employee_name', user.name);
    localStorage.setItem('ewf_employee_email', user.email);
    localStorage.setItem('ewf_employee_dept', user.department);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPortal === 'employee' ? '/portal' : '/');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ewf_auth_user');
  };

  // User Operations
  const handleAddUser = (newUser: Omit<UserAccount, 'id' | 'dateAdded'>) => {
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const user: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      dateAdded: formattedDate,
    };
    setUsers(prev => [user, ...prev]);
    saveUserToFirestore(user);
  };

  const handleAddUserAndReturn = (newUser: Omit<UserAccount, 'id' | 'dateAdded'>): UserAccount => {
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const user: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      dateAdded: formattedDate,
    };
    setUsers(prev => [user, ...prev]);
    saveUserToFirestore(user);
    return user;
  };

  const handleUpdateUser = (updated: UserAccount) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    saveUserToFirestore(updated);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUserFromFirestore(userId);
  };

  // Asset Operations
  const handleAddAsset = (newAsset: Omit<ITAsset, 'id' | 'dateAdded'>) => {
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const asset: ITAsset = {
      ...newAsset,
      id: `ast-${Date.now()}`,
      dateAdded: formattedDate,
    };
    setAssets(prev => [asset, ...prev]);
    saveAssetToFirestore(asset);
  };

  const handleUpdateAsset = (updated: ITAsset) => {
    setAssets(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    saveAssetToFirestore(updated);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    deleteAssetFromFirestore(assetId);
  };

  // Keep selectedTicket synchronized with master state
  useEffect(() => {
    if (selectedTicket) {
      const fresh = tickets.find(t => t.id === selectedTicket.id);
      if (fresh) setSelectedTicket(fresh);
    }
  }, [tickets]);

  // Ticket Operations
  const handleCreateTicket = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    saveTicketToFirestore(newTicket);

    // Extract all IT staff & admin email addresses
    const itStaffEmails = users
      .filter(u => u.role === 'IT Staff' || u.role === 'Admin')
      .map(u => u.email)
      .filter(Boolean);

    // Send email alert to IT Admin (it@elimishawatoto.org) and IT Staff
    sendTicketCreatedNotification(newTicket, itStaffEmails).then(result => {
      if (result?.success) {
        console.log(`Email notification dispatched for ticket ${newTicket.ticketNumber} to IT admin & staff:`, result.recipients);
      }
    }).catch(err => {
      console.error('Failed to dispatch ticket notification email:', err);
    });
  };

  const handleUpdateTicket = (updated: Ticket) => {
    const prev = tickets.find(t => t.id === updated.id);
    const wasResolved = prev && (prev.status === 'Resolved' || prev.status === 'Closed');
    const isNowResolved = updated.status === 'Resolved' || updated.status === 'Closed';

    setTickets(prevList => prevList.map(t => (t.id === updated.id ? updated : t)));
    saveTicketToFirestore(updated);

    // If ticket transitioned to Resolved or Closed, send notification email to the employee
    if (!wasResolved && isNowResolved) {
      sendTicketResolvedNotification(
        updated,
        updated.resolutionNotes,
        currentUser?.name || updated.assignedAgent
      ).then(result => {
        if (result?.success) {
          console.log(`Resolution email dispatched to employee (${updated.reporterEmail}) for ticket ${updated.ticketNumber}`);
        }
      }).catch(err => {
        console.error('Failed to send resolution email notification to employee:', err);
      });
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => {
      const next = prev.filter(t => t.id !== ticketId);
      saveTickets(next);
      return next;
    });
    deleteTicketFromFirestore(ticketId);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(null);
    }
  };

  const handleAddComment = (ticketId: string, commentData: Omit<TicketComment, 'id' | 'timestamp'>) => {
    const newComment: TicketComment = {
      ...commentData,
      id: `c-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const targetTicket = tickets.find(t => t.id === ticketId);
    if (targetTicket) {
      const updatedStatus =
        targetTicket.status === 'Open' && commentData.authorRole === 'Agent' ? 'In Progress' : targetTicket.status;
      const updated: Ticket = {
        ...targetTicket,
        status: updatedStatus,
        updatedAt: new Date().toISOString(),
        comments: [...targetTicket.comments, newComment],
      };
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      saveTicketToFirestore(updated);
    }
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    const target = tickets.find(t => t.id === ticketId);
    if (target) {
      const wasResolved = target.status === 'Resolved' || target.status === 'Closed';
      const isNowResolved = newStatus === 'Resolved' || newStatus === 'Closed';
      const nowIso = new Date().toISOString();

      const updated: Ticket = {
        ...target,
        status: newStatus,
        updatedAt: nowIso,
        resolvedAt: isNowResolved && !target.resolvedAt ? nowIso : target.resolvedAt,
      };
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      saveTicketToFirestore(updated);

      // If ticket transitioned to Resolved or Closed, send resolution email to employee
      if (!wasResolved && isNowResolved) {
        sendTicketResolvedNotification(
          updated,
          updated.resolutionNotes,
          currentUser?.name || updated.assignedAgent
        ).then(result => {
          if (result?.success) {
            console.log(`Resolution email dispatched to employee (${updated.reporterEmail}) for ticket ${updated.ticketNumber}`);
          }
        }).catch(err => {
          console.error('Failed to send resolution email notification to employee:', err);
        });
      }
    }
  };

  const handleBulkUpdateStatus = (ticketIds: string[], newStatus: TicketStatus) => {
    const isNowResolved = newStatus === 'Resolved' || newStatus === 'Closed';
    const nowIso = new Date().toISOString();

    setTickets(prev =>
      prev.map(t => {
        if (!ticketIds.includes(t.id)) return t;
        const wasResolved = t.status === 'Resolved' || t.status === 'Closed';
        const updated: Ticket = {
          ...t,
          status: newStatus,
          updatedAt: nowIso,
          resolvedAt: isNowResolved && !t.resolvedAt ? nowIso : t.resolvedAt,
        };
        saveTicketToFirestore(updated);

        // Send email to employee if transitioning to Resolved
        if (!wasResolved && isNowResolved) {
          sendTicketResolvedNotification(
            updated,
            updated.resolutionNotes,
            currentUser?.name || updated.assignedAgent
          ).catch(err => {
            console.error(`Failed to send resolution email to employee for ${updated.ticketNumber}:`, err);
          });
        }

        return updated;
      })
    );
  };

  const handleBulkAssign = (ticketIds: string[], newAgent: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (!ticketIds.includes(t.id)) return t;
        const updated: Ticket = {
          ...t,
          assignedAgent: newAgent,
          updatedAt: new Date().toISOString(),
        };
        saveTicketToFirestore(updated);
        return updated;
      })
    );
  };

  const handleBulkDelete = (ticketIds: string[]) => {
    setTickets(prev => {
      const next = prev.filter(t => !ticketIds.includes(t.id));
      saveTickets(next);
      return next;
    });
    ticketIds.forEach(id => deleteTicketFromFirestore(id));
  };

  // KB Article Operations
  const handleAddKBArticle = (article: KBArticle) => {
    setKBArticles(prev => [article, ...prev]);
    saveKBArticleToFirestore(article);
  };

  const handleDeleteKBArticle = (id: string) => {
    setKBArticles(prev => prev.filter(a => a.id !== id));
    deleteKBArticleFromFirestore(id);
  };

  const handleUpvoteKBArticle = (id: string) => {
    setKBArticles(prev =>
      prev.map(a => {
        if (a.id === id) {
          const updated = { ...a, helpfulVotes: a.helpfulVotes + 1 };
          saveKBArticleToFirestore(updated);
          return updated;
        }
        return a;
      })
    );
  };

  // Convert resolved ticket to KB article using AI
  const handleGenerateKBArticleFromTicket = async (ticket: Ticket, resolutionNotes: string) => {
    try {
      const res = await fetch('/api/ai/generate-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket, resolutionNotes }),
      });

      if (res.ok) {
        const data = await res.json();
        const article: KBArticle = {
          id: `kb-gen-${Date.now()}`,
          title: data.title || `Troubleshooting Guide: ${ticket.title}`,
          category: data.category || ticket.category,
          summary: data.summary || `Resolution guide for ${ticket.title}`,
          symptoms: data.symptoms || [ticket.description],
          rootCause: data.rootCause || 'Root cause identified and remediated.',
          resolutionSteps: data.resolutionSteps || [resolutionNotes || 'Follow standard remediation.'],
          prevention: data.prevention || 'Perform regular maintenance.',
          keywords: data.keywords || [ticket.category.toLowerCase(), 'resolved'],
          helpfulVotes: 1,
          views: 1,
          createdAt: new Date().toISOString(),
          author: `IT Desk (Converted from #${ticket.ticketNumber})`,
        };

        handleAddKBArticle(article);
        alert(`Successfully created and published Knowledge Base article: "${article.title}"`);
        setCurrentView('kb');
      }
    } catch (e) {
      console.error('Failed to generate KB article:', e);
    }
  };

  // Data management
  const handleResetData = async () => {
    try {
      const res = resetToDefaults();
      setTickets(res.tickets);
      setKBArticles(res.kbArticles);
      setAssets(res.assets);
      setUsers(res.users);
      await seedSampleDataToFirestore();
    } catch (e) {
      console.error('Failed to reset sample data:', e);
    }
  };

  const handlePurgeAllDemoData = async () => {
    try {
      const res = purgeLocalDemoData();
      setTickets([]);
      setAssets([]);
      setUsers(res.users);
      await purgeAllDemoDataFromFirestore();
    } catch (e) {
      console.error('Failed to purge demo data:', e);
    }
  };

  const handleClearAllTickets = async () => {
    try {
      setTickets([]);
      saveTickets([]);
      await deleteAllTicketsFromFirestore();
    } catch (e) {
      console.error('Failed to clear tickets:', e);
    }
  };

  const openTicketsCount = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;

  // Unauthenticated Gate: Show Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={handleLogin}
      />
    );
  }

  // Employee Helpdesk Portal
  if (portalMode === 'employee') {
    return (
      <EmployeePortalPage
        tickets={tickets}
        kbArticles={kbArticles}
        assets={assets}
        users={users}
        currentUser={currentUser}
        onCreateTicket={handleCreateTicket}
        onAddComment={handleAddComment}
        onUpvoteKBArticle={handleUpvoteKBArticle}
        onSwitchToAdmin={() => switchPortalMode('admin')}
        onLogout={handleLogout}
      />
    );
  }

  // IT Staff & Admin Console
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching Screenshot */}
      <Header
        tickets={tickets}
        currentUser={currentUser}
        onExportJSON={() => exportAllDataAsJSON(tickets, kbArticles, assets)}
        onExportCSV={() => exportTicketsToCSV(tickets)}
        onResetData={handleResetData}
        onPurgeDemoData={handlePurgeAllDemoData}
        onLogout={handleLogout}
        isAiEnabled={isAiEnabled}
        onSelectTicket={t => setSelectedTicket(t)}
        onSwitchToEmployeePortal={() => switchPortalMode('employee')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* App Body with Sidebar & Content */}
      <div className="flex-1 flex min-w-0">
        <Sidebar
          currentView={currentView}
          currentUser={currentUser}
          onSelectView={view => setCurrentView(view)}
          onOpenCreateTicket={() => {
            setCreatePrefill({});
            setShowCreateModal(true);
          }}
          openTicketsCount={openTicketsCount}
          onSwitchToEmployeePortal={() => switchPortalMode('employee')}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main View Container */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {currentView === 'dashboard' && (
            <ITStaffDashboardView
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={t => setSelectedTicket(t)}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
              onOpenCreateTicket={() => {
                setCreatePrefill({});
                setShowCreateModal(true);
              }}
            />
          )}

          {currentView === 'tickets' && (
            <TicketTableView
              tickets={tickets}
              onSelectTicket={t => setSelectedTicket(t)}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkAssign={handleBulkAssign}
              onBulkDelete={handleBulkDelete}
              filters={filters}
              onFilterChange={setFilters}
            />
          )}

          {currentView === 'users' && (
            <UsersView
              users={users}
              tickets={tickets}
              onSelectTicket={t => setSelectedTicket(t)}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onOpenCreateTicketForUser={(name, email, dept) => {
                setCreatePrefill({
                  reporterName: name,
                  reporterEmail: email,
                  reporterDepartment: dept,
                });
                setShowCreateModal(true);
              }}
            />
          )}

          {currentView === 'reports' && (
            <AnalyticsDashboardView
              tickets={tickets}
              onSelectTicket={t => setSelectedTicket(t)}
              onClearAllTickets={handleClearAllTickets}
              onExportCSV={() => exportTicketsToCSV(tickets)}
              onOpenCreateTicket={() => {
                setCreatePrefill({});
                setShowCreateModal(true);
              }}
            />
          )}

          {currentView === 'kanban' && (
            <TicketKanbanView
              tickets={tickets}
              onSelectTicket={t => setSelectedTicket(t)}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onOpenCreateTicket={() => {
                setCreatePrefill({});
                setShowCreateModal(true);
              }}
            />
          )}

          {currentView === 'portals' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
              <WorkplacePortalsHub
                onOpenPortal={(url) => {
                  if (url === '/' || url === '/admin') {
                    setCurrentView('dashboard');
                  }
                }}
                onRequestHelpWithPortal={(portalName, portalUrl) => {
                  setCreatePrefill({
                    category: 'Software (App errors, Activation Keys)',
                    title: `Issue accessing ${portalName} (${portalUrl})`,
                    description: `Staff member experiencing access or login issue with ${portalName} (${portalUrl}).`,
                  });
                  setShowCreateModal(true);
                }}
              />
            </div>
          )}

          {currentView === 'portal' && (
            <SelfServicePortalView
              tickets={tickets}
              onOpenCreateWithCategory={(category, initialTitle) => {
                setCreatePrefill({ category, title: initialTitle });
                setShowCreateModal(true);
              }}
              onSelectTicket={t => setSelectedTicket(t)}
              onSwitchToEmployeePortal={() => switchPortalMode('employee')}
            />
          )}

          {currentView === 'kb' && (
            <KnowledgeBaseView
              articles={kbArticles}
              onAddArticle={handleAddKBArticle}
              onDeleteArticle={handleDeleteKBArticle}
              onUpvoteArticle={handleUpvoteKBArticle}
            />
          )}

          {currentView === 'assets' && (
            <AssetDirectoryView
              assets={assets}
              users={users}
              tickets={tickets}
              onSelectTicket={t => setSelectedTicket(t)}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
              onOpenCreateTicketForAsset={assetTag => {
                setCreatePrefill({ assetTag, category: 'Hardware' });
                setShowCreateModal(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Ticket Detail / AI Workbench Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
          onAddComment={handleAddComment}
          assets={assets}
          onGenerateKBArticle={handleGenerateKBArticleFromTicket}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreateTicket={handleCreateTicket}
          assets={assets}
          initialCategory={createPrefill.category}
          initialTitle={createPrefill.title}
          initialDescription={createPrefill.description}
        />
      )}
    </div>
  );
}

