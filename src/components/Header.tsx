import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  Download,
  FileSpreadsheet,
  RotateCcw,
  SlidersHorizontal,
  Globe,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Menu,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Ticket, UserAccount } from '../types';
import { WORKPLACE_PORTALS } from '../data/workplacePortals';

interface HeaderProps {
  tickets: Ticket[];
  currentUser?: UserAccount | null;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onPurgeDemoData?: () => void;
  onLogout?: () => void;
  isAiEnabled?: boolean;
  onSelectTicket?: (ticket: Ticket) => void;
  onSwitchToEmployeePortal?: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tickets,
  currentUser,
  onExportJSON,
  onExportCSV,
  onResetData,
  onPurgeDemoData,
  onLogout,
  isAiEnabled,
  onSelectTicket,
  onSwitchToEmployeePortal,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showPortalsMenu, setShowPortalsMenu] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Critical / Overdue notifications
  const urgentTickets = tickets.filter(
    t => (t.priority === 'Critical') && t.status !== 'Resolved' && t.status !== 'Closed'
  ).slice(0, 5);

  const notificationCount = urgentTickets.length;

  const displayName = currentUser ? currentUser.name : 'Admin User';
  const displayRole = currentUser ? currentUser.role : 'Admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Hamburger (mobile/tablet) + Brand & User Identity */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
          {/* Mobile Sidebar Hamburger Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div id="navbar-brand-logo" className="flex items-center gap-2 shrink-0">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/ilearn-cc226.firebasestorage.app/o/EWF%20Main.png?alt=media&token=3e05f629-7f10-44ba-a0a9-e901a63010c8"
              alt="EWF Logo"
              className="h-9 sm:h-11 max-h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="hidden xl:flex items-center gap-2.5 text-sm text-slate-600">
            <span>Logged in as:</span>
            <span className="font-normal text-slate-900 text-sm sm:text-base">{displayName}</span>
            <span className={`text-xs font-normal px-2.5 py-1 rounded-md ${
              displayRole === 'Admin'
                ? 'bg-[#dbeafe] text-[#1d4ed8]'
                : displayRole === 'IT Staff'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {displayRole}
            </span>
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
              title="Firebase Firestore Cloud Database Connected: elimisha-2739f (ai-studio-itsupportdesk-cc4c29aa-867a-4231-939f-0a38c52e4baa)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Cloud DB Active</span>
            </div>
          </div>

          {/* Quick Workplace Portals Menu */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowPortalsMenu(!showPortalsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Workplace Apps</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPortalsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPortalsMenu(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Organizational Portals</span>
                    <span className="text-[10px] text-slate-400 font-normal">Direct Access</span>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {WORKPLACE_PORTALS.map(portal => (
                      portal.url.startsWith('/') ? (
                        <button
                          key={portal.id}
                          type="button"
                          onClick={() => {
                            setShowPortalsMenu(false);
                          }}
                          className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 group transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                                {portal.name}
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">Active</span>
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{portal.category}</div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <a
                          key={portal.id}
                          href={portal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                                {portal.name}
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{portal.category}</div>
                            </div>
                          </div>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Data Tools, Notification Bell, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Data Actions */}
          <div className="relative">
            <button
              onClick={() => setShowDataMenu(!showDataMenu)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Export & Data Settings"
            >
              <SlidersHorizontal className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            {showDataMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDataMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                    Data Management
                  </div>
                  <button
                    onClick={() => {
                      onExportJSON();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-xs"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    Export Backup (.json)
                  </button>
                  <button
                    onClick={() => {
                      onExportCSV();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Export CSV (.csv)
                  </button>
                  <div className="my-1.5 border-t border-slate-100" />
                  
                  {/* Purge Demo Data (No re-appearance) */}
                  <button
                    onClick={() => {
                      setShowDataMenu(false);
                      setShowPurgeConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-xs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Clear All Demo / Dummy Data
                  </button>

                  {/* Reload Demo Data */}
                  <button
                    onClick={() => {
                      if (confirm('Load sample demo data? This will add initial test tickets and sample hardware inventory.')) {
                        onResetData();
                        setShowDataMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-slate-500 hover:bg-slate-50 font-normal flex items-center gap-2.5 transition-colors cursor-pointer text-[11px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    Load Sample Test Data
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center border-2 border-white">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                    <span>Incident Notifications</span>
                    <span className="text-xs font-normal text-slate-500">{notificationCount} urgent alerts</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {urgentTickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTicket?.(t);
                          setShowNotifications(false);
                        }}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-600 text-sm">{t.ticketNumber}</span>
                          <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-slate-800 text-sm font-medium line-clamp-1">{t.title}</p>
                        <span className="text-xs text-slate-500 mt-1 block">From {t.reporterName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="Sign out of IT Console"
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-red-600 hover:text-red-700 font-normal px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-red-50/80 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Purging Demo Data */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clear All Demo Data?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              This will permanently remove all sample tickets and demo asset inventory records across both Firestore and your browser cache.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Clean State:</strong> Your database will be completely empty and ready for you to key in genuine staff profiles, laptops, serial numbers, phones, and live support tickets with no dummy data reappearing.
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPurgeConfirm(false);
                  if (onPurgeDemoData) {
                    onPurgeDemoData();
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Clear All Dummy Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
