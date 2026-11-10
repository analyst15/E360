import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Wrench,
  Info,
  X,
  Clock,
  Radio,
  ExternalLink,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PortalAnnouncement, UserAccount } from '../types';
import { formatTimeAgo } from '../utils/time';

interface PortalAnnouncementBannerProps {
  announcements: PortalAnnouncement[];
  currentUser?: UserAccount | null;
  onManageAnnouncement?: () => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}

export const PortalAnnouncementBanner: React.FC<PortalAnnouncementBannerProps> = ({
  announcements,
  currentUser,
  onManageAnnouncement,
  onToggleActive,
}) => {
  // Find currently active announcements, sorted newest updated first
  const activeAnnouncements = useMemo(() => {
    return [...announcements]
      .filter((a) => a.isActive)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [announcements]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Track dismissed state per announcement ID + update timestamp
  const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (typeof window !== 'undefined') {
      announcements.forEach((a) => {
        const key = `ewf_dismissed_announcement_${a.id}_${a.updatedAt || a.createdAt}`;
        if (localStorage.getItem(key) === 'true') {
          map[a.id] = true;
        }
      });
    }
    return map;
  });

  // Re-sync dismissed map and reset to latest alert whenever announcements change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const map: Record<string, boolean> = {};
      announcements.forEach((a) => {
        const key = `ewf_dismissed_announcement_${a.id}_${a.updatedAt || a.createdAt}`;
        if (localStorage.getItem(key) === 'true') {
          map[a.id] = true;
        }
      });
      setDismissedMap(map);
    }
    setActiveIndex(0);
  }, [announcements]);

  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  const isStaffOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'IT Staff';

  // Primary active announcement to display (newest first, or activeIndex)
  const currentAnnouncement = activeAnnouncements[activeIndex] || activeAnnouncements[0] || null;

  if (!currentAnnouncement) {
    return null;
  }

  const isDismissed = Boolean(dismissedMap[currentAnnouncement.id]) && !isManuallyExpanded;

  const handleDismiss = () => {
    const key = `ewf_dismissed_announcement_${currentAnnouncement.id}_${currentAnnouncement.updatedAt || currentAnnouncement.createdAt}`;
    localStorage.setItem(key, 'true');
    setDismissedMap((prev) => ({ ...prev, [currentAnnouncement.id]: true }));
    setIsManuallyExpanded(false);
  };

  const handleRestore = () => {
    setIsManuallyExpanded(true);
  };

  // Severity-based theme configurations
  const getSeverityConfig = (severity: PortalAnnouncement['severity']) => {
    switch (severity) {
      case 'outage':
        return {
          wrapperBg: 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white shadow-md shadow-rose-900/15',
          pillBg: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
          accentText: 'text-rose-100',
          cardSubBg: 'bg-black/15 border-white/15 text-rose-50',
          icon: <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-bounce" />,
          label: 'SYSTEM OUTAGE',
          pulseColor: 'bg-rose-300',
        };
      case 'maintenance':
        return {
          wrapperBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md shadow-amber-900/15',
          pillBg: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
          accentText: 'text-amber-100',
          cardSubBg: 'bg-black/15 border-white/15 text-amber-50',
          icon: <Wrench className="w-5 h-5 text-white shrink-0" />,
          label: 'MAINTENANCE IN PROGRESS',
          pulseColor: 'bg-amber-300',
        };
      case 'warning':
        return {
          wrapperBg: 'bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-600 text-white shadow-md shadow-yellow-900/15',
          pillBg: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
          accentText: 'text-yellow-100',
          cardSubBg: 'bg-black/15 border-white/15 text-yellow-50',
          icon: <AlertCircle className="w-5 h-5 text-white shrink-0" />,
          label: 'SERVICE DEGRADATION',
          pulseColor: 'bg-yellow-200',
        };
      case 'info':
      default:
        return {
          wrapperBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-900/15',
          pillBg: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs',
          accentText: 'text-blue-100',
          cardSubBg: 'bg-black/15 border-white/15 text-blue-50',
          icon: <Info className="w-5 h-5 text-white shrink-0" />,
          label: 'IT NOTICE',
          pulseColor: 'bg-blue-300',
        };
    }
  };

  const config = getSeverityConfig(currentAnnouncement.severity);

  // If employee dismissed it, show a discreet, compact reminder strip with option to re-open
  if (isDismissed) {
    return (
      <aside 
        aria-label="Temporary System Alert Notice"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
            <span className="font-semibold truncate">
              Active notice: {currentAnnouncement.title}
              {currentAnnouncement.affectedSystem && ` (${currentAnnouncement.affectedSystem})`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRestore}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer flex items-center gap-1"
            >
              <span>View Alert Details</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {isStaffOrAdmin && onManageAnnouncement && (
              <button
                onClick={onManageAnnouncement}
                className="text-[11px] font-medium bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section 
      aria-label="Temporary System Outage and Maintenance Alert"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1 transition-all duration-300"
    >
      <div
        className={`relative rounded-2xl p-4 sm:p-5 border border-white/20 overflow-hidden ${config.wrapperBg}`}
      >
        {/* Decorative Background Elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Column: Icon + Core Announcement Content */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner border border-white/25 mt-0.5">
              {config.icon}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              {/* Badge Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${config.pillBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.pulseColor} animate-pulse`} />
                  {config.label}
                </span>

                {currentAnnouncement.affectedSystem && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white border border-white/25">
                    Affected System: <strong className="font-bold underline decoration-white/40">{currentAnnouncement.affectedSystem}</strong>
                  </span>
                )}

                {activeAnnouncements.length > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20 text-white border border-white/25">
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1))}
                      className="hover:text-amber-200 cursor-pointer px-1"
                      title="Previous alert notice"
                    >
                      ◀
                    </button>
                    <span>Notice {activeIndex + 1} of {activeAnnouncements.length}</span>
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0))}
                      className="hover:text-amber-200 cursor-pointer px-1"
                      title="Next alert notice"
                    >
                      ▶
                    </button>
                  </span>
                )}

                <span className="text-[11px] opacity-80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Posted {formatTimeAgo(currentAnnouncement.updatedAt || currentAnnouncement.createdAt)}</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug drop-shadow-2xs">
                {currentAnnouncement.title}
              </h2>

              {/* Message Body */}
              <p className="text-xs sm:text-sm text-white/95 leading-relaxed max-w-4xl font-normal">
                {currentAnnouncement.message}
              </p>

              {/* Extra Details / Resolution Estimate Bar */}
              {currentAnnouncement.expectedResolution && (
                <div
                  className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-medium border ${config.cardSubBg}`}
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                  <span>
                    Status Update: <strong>{currentAnnouncement.expectedResolution}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dismiss Button & IT Staff Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t border-white/20 md:border-t-0 w-full md:w-auto justify-between md:justify-end">
            {/* IT Staff Quick Deactivate / Manage Buttons */}
            {isStaffOrAdmin && (
              <div className="flex items-center gap-1.5">
                {onToggleActive && (
                  <button
                    onClick={() => onToggleActive(currentAnnouncement.id, false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all cursor-pointer backdrop-blur-xs"
                    title="Mark resolved and hide announcement from all employees"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Deactivate</span>
                  </button>
                )}

                {onManageAnnouncement && (
                  <button
                    onClick={onManageAnnouncement}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                    title="Edit or broadcast system announcements"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Manage</span>
                  </button>
                )}
              </div>
            )}

            {/* Employee Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/20 hover:bg-black/35 text-white border border-white/25 transition-all cursor-pointer"
              title="Temporarily dismiss this alert on your screen"
              aria-label="Dismiss Announcement"
            >
              <span>Dismiss</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
