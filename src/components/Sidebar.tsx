import React from 'react';
import { AppViewMode, UserAccount } from '../types';
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  BookOpen,
  Laptop2,
  HelpCircle,
  Plus,
  Globe,
  ListTodo,
  X,
  LifeBuoy,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  currentView: AppViewMode;
  currentUser?: UserAccount | null;
  onSelectView: (view: AppViewMode) => void;
  onOpenCreateTicket: () => void;
  openTicketsCount?: number;
  onSwitchToEmployeePortal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentUser,
  onSelectView,
  onOpenCreateTicket,
  openTicketsCount,
  onSwitchToEmployeePortal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'Admin';

  const primaryNavItems = [
    { id: 'dashboard' as AppViewMode, label: currentUser?.role === 'IT Staff' ? 'IT Staff Dashboard' : 'Dashboard' },
    { id: 'tickets' as AppViewMode, label: 'Tickets', count: openTicketsCount },
    ...(isAdmin ? [
      { id: 'users' as AppViewMode, label: 'Users' },
      { id: 'reports' as AppViewMode, label: 'Reports' },
    ] : []),
  ];

  const secondaryNavItems = [
    { id: 'employee-portal', label: 'Employee Portal', icon: UserCheck, isAction: true },
    { id: 'portals' as AppViewMode, label: 'Workplace Portals', icon: Globe },
    { id: 'kb' as AppViewMode, label: 'Knowledge Base', icon: BookOpen },
    { id: 'assets' as AppViewMode, label: 'Asset Inventory', icon: Laptop2 },
  ];

  const handleNavClick = (viewId: AppViewMode) => {
    onSelectView(viewId);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:min-h-[calc(100vh-65px)] lg:z-auto shrink-0 shadow-2xl lg:shadow-none text-slate-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Mobile Header with Brand & Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-lg">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/ilearn-cc226.firebasestorage.app/o/EWF%20Main.png?alt=media&token=3e05f629-7f10-44ba-a0a9-e901a63010c8"
                  alt="EWF Logo"
                  className="h-6 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-sm font-semibold text-white">IT Workspace</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1.5">
            {primaryNavItems.map(item => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm sm:text-base transition-all cursor-pointer flex items-center justify-between font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs sm:text-sm px-2.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Modules */}
          <div>
            <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Operations & Tools
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map(item => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'employee-portal' && onSwitchToEmployeePortal) {
                        onSwitchToEmployeePortal();
                        onCloseMobile?.();
                      } else {
                        handleNavClick(item.id as AppViewMode);
                      }
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-3 font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* New Ticket Button at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          <button
            onClick={() => {
              onOpenCreateTicket();
              onCloseMobile?.();
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-xl text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </aside>
    </>
  );
};
