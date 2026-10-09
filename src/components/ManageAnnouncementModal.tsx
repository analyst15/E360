import React, { useState } from 'react';
import {
  X,
  Radio,
  AlertTriangle,
  Wrench,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Send,
  Plus,
  Layers,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';
import { PortalAnnouncement, AnnouncementSeverity, UserAccount } from '../types';

interface ManageAnnouncementModalProps {
  announcements: PortalAnnouncement[];
  currentUser?: UserAccount | null;
  onSaveAnnouncement: (announcement: PortalAnnouncement) => Promise<void> | void;
  onDeleteAnnouncement: (id: string) => Promise<void> | void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void> | void;
  onClose: () => void;
}

export const ManageAnnouncementModal: React.FC<ManageAnnouncementModalProps> = ({
  announcements,
  currentUser,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onToggleActive,
  onClose,
}) => {
  // Primary announcement to edit (defaults to first active announcement, or first announcement, or new)
  const activeAnnouncement = announcements.find((a) => a.isActive) || announcements[0];

  const [selectedId, setSelectedId] = useState<string>(activeAnnouncement ? activeAnnouncement.id : 'new');
  const [title, setTitle] = useState(activeAnnouncement?.title || 'Secondary System Service Interruption');
  const [message, setMessage] = useState(
    activeAnnouncement?.message ||
      'The Elimisha Secondary School academic grading and student portal is temporarily offline due to database maintenance. Our IT engineering team is actively working on restoration.'
  );
  const [severity, setSeverity] = useState<AnnouncementSeverity>(activeAnnouncement?.severity || 'outage');
  const [affectedSystem, setAffectedSystem] = useState(activeAnnouncement?.affectedSystem || 'Secondary System');
  const [expectedResolution, setExpectedResolution] = useState(
    activeAnnouncement?.expectedResolution || 'Estimated restoration within 45 minutes'
  );
  const [isActive, setIsActive] = useState<boolean>(activeAnnouncement ? activeAnnouncement.isActive : true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Switch between existing announcements or creating new
  const handleSelectAnnouncement = (item: PortalAnnouncement | 'new') => {
    if (item === 'new') {
      setSelectedId('new');
      setTitle('');
      setMessage('');
      setSeverity('outage');
      setAffectedSystem('Secondary System');
      setExpectedResolution('');
      setIsActive(true);
    } else {
      setSelectedId(item.id);
      setTitle(item.title);
      setMessage(item.message);
      setSeverity(item.severity);
      setAffectedSystem(item.affectedSystem || '');
      setExpectedResolution(item.expectedResolution || '');
      setIsActive(item.isActive);
    }
  };

  // Quick incident preset templates
  const applyPreset = (presetType: 'secondary_outage' | 'secondary_resolved' | 'maintenance' | 'network' | 'm365') => {
    switch (presetType) {
      case 'secondary_outage':
        setTitle('Secondary System Service Interruption');
        setMessage(
          'The Elimisha Secondary School academic grading and student portal is temporarily offline due to database maintenance. Our IT engineering team is actively working on restoration.'
        );
        setSeverity('outage');
        setAffectedSystem('Secondary System');
        setExpectedResolution('Estimated restoration within 45 minutes');
        setIsActive(true);
        break;

      case 'secondary_resolved':
        setTitle('Secondary System Operational - Resolved');
        setMessage(
          'The database issues affecting the Elimisha Secondary School portal have been successfully resolved. All grading, student records, and staff portals are fully operational.'
        );
        setSeverity('info');
        setAffectedSystem('Secondary System');
        setExpectedResolution('All services restored to normal operations');
        setIsActive(false); // Can be toggled or kept as resolved notice
        break;

      case 'maintenance':
        setTitle('Scheduled IT System Maintenance');
        setMessage(
          'Core enterprise servers and storage arrays will be undergoing scheduled optimization tonight from 8:00 PM to 9:30 PM. Brief intermittent login pauses may occur.'
        );
        setSeverity('maintenance');
        setAffectedSystem('All Enterprise Portals');
        setExpectedResolution('Completed by 9:30 PM EAT');
        setIsActive(true);
        break;

      case 'network':
        setTitle('Campus Network & Wi-Fi Degradation');
        setMessage(
          'Our upstream Internet Service Provider is currently experiencing intermittent fiber link packet loss. Local network access remains functional while ISP technicians troubleshoot.'
        );
        setSeverity('warning');
        setAffectedSystem('Campus Wi-Fi / Internet');
        setExpectedResolution('Under ISP technician review');
        setIsActive(true);
        break;

      case 'm365':
        setTitle('Microsoft 365 / Outlook Authentication Notice');
        setMessage(
          'Staff experiencing two-factor authentication prompts when accessing Outlook or Teams should re-verify via the Microsoft Authenticator app on their registered mobile device.'
        );
        setSeverity('info');
        setAffectedSystem('Microsoft 365 & Email');
        setExpectedResolution('Self-service guidance available in KB');
        setIsActive(true);
        break;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSaving(true);
    try {
      const idToUse = selectedId === 'new' ? `announcement-${Date.now()}` : selectedId;
      const now = new Date().toISOString();

      const existing = announcements.find((a) => a.id === idToUse);

      const payload: PortalAnnouncement = {
        id: idToUse,
        title: title.trim(),
        message: message.trim(),
        severity,
        affectedSystem: affectedSystem.trim() || undefined,
        expectedResolution: expectedResolution.trim() || undefined,
        isActive,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        authorName: currentUser?.name || 'IT Operations',
      };

      await onSaveAnnouncement(payload);
      setSelectedId(idToUse);
      setSaveSuccessMessage(
        isActive
          ? 'Announcement successfully broadcast to all employees!'
          : 'Announcement saved and set to Inactive (hidden from employees).'
      );
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save announcement:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedId === 'new') return;
    if (window.confirm('Are you sure you want to permanently delete this announcement?')) {
      await onDeleteAnnouncement(selectedId);
      handleSelectAnnouncement('new');
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="manage-announcement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="manage-announcement-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                Employee Portal Outage & Broadcast Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Issue temporary announcements (e.g. secondary system down). Deactivate when resolved.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Existing Announcements Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Notice to Edit or Broadcast:
              </label>
              <button
                type="button"
                onClick={() => handleSelectAnnouncement('new')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Alert</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleSelectAnnouncement(a)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    selectedId === a.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          a.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {a.isActive ? 'Active Live' : 'Inactive (Hidden)'}
                      </span>
                      {a.affectedSystem && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded truncate">
                          {a.affectedSystem}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{a.title}</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive(a.id, !a.isActive);
                    }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 transition-colors cursor-pointer border ${
                      a.isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {a.isActive ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Preset Incident Templates */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Fill Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('secondary_outage')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
              >
                🔴 Secondary System Down
              </button>
              <button
                type="button"
                onClick={() => applyPreset('secondary_resolved')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
              >
                🟢 Secondary System Resolved
              </button>
              <button
                type="button"
                onClick={() => applyPreset('maintenance')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition-colors"
              >
                🟠 System Maintenance
              </button>
              <button
                type="button"
                onClick={() => applyPreset('network')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 cursor-pointer transition-colors"
              >
                🟡 Wi-Fi / Network Issue
              </button>
              <button
                type="button"
                onClick={() => applyPreset('m365')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-colors"
              >
                🔵 Office 365 Notice
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="announcement-form" onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
            {/* Active Broadcasting Switch */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Broadcast to Employee Portal</span>
                <span className="text-[11px] text-slate-500 block">
                  When enabled, this banner shows for all staff until dismissed or resolved.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Severity and Affected System Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Severity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alert Severity Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="outage">🔴 Critical Outage (System Down)</option>
                  <option value="maintenance">🟠 Scheduled Maintenance</option>
                  <option value="warning">🟡 Service Degradation / Warning</option>
                  <option value="info">🔵 Informational Notice</option>
                </select>
              </div>

              {/* Affected System */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Affected System / Department
                </label>
                <input
                  type="text"
                  value={affectedSystem}
                  onChange={(e) => setAffectedSystem(e.target.value)}
                  placeholder="e.g. Secondary System, Wi-Fi, Office 365"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Announcement Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Secondary System Service Interruption"
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Message for Employees <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what is happening, what staff should do, and reassurance that IT is working on it..."
                rows={3}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Expected Resolution / Status Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status / Estimated Resolution Time
              </label>
              <input
                type="text"
                value={expectedResolution}
                onChange={(e) => setExpectedResolution(e.target.value)}
                placeholder="e.g. Estimated restoration within 45 minutes / Today by 2:30 PM"
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {selectedId !== 'new' && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="announcement-form"
              disabled={isSaving || !title.trim() || !message.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Broadcast Alert' : 'Save as Inactive'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
