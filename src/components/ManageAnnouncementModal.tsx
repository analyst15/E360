import React, { useState, useMemo } from 'react';
import {
  X,
  Radio,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Send,
  Plus,
  Sparkles,
  Clock,
  Check,
  Mail,
  Users,
  Search,
  CheckSquare,
  Square,
  AtSign,
  Filter,
  UserCheck,
  Building2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { PortalAnnouncement, AnnouncementSeverity, UserAccount } from '../types';
import { loadUsers } from '../utils/storage';
import { sendBroadcastAlertNotification } from '../utils/notifications';

interface ManageAnnouncementModalProps {
  announcements: PortalAnnouncement[];
  currentUser?: UserAccount | null;
  users?: UserAccount[];
  onSaveAnnouncement: (announcement: PortalAnnouncement) => Promise<void> | void;
  onDeleteAnnouncement: (id: string) => Promise<void> | void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void> | void;
  onClose: () => void;
}

export const ManageAnnouncementModal: React.FC<ManageAnnouncementModalProps> = ({
  announcements,
  currentUser,
  users,
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

  // Email Notification State
  const [sendEmailAlert, setSendEmailAlert] = useState<boolean>(true);
  const [emailTargetMode, setEmailTargetMode] = useState<'all' | 'selected'>('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customEmails, setCustomEmails] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);

  // Load all registered staff members
  const allStaffUsers = useMemo(() => {
    const list = users && users.length > 0 ? users : loadUsers();
    // Return active or valid users with emails, sorted alphabetically
    return [...list]
      .filter((u) => u.email && u.email.includes('@'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // List of all unique staff emails
  const allStaffEmails = useMemo(() => {
    return Array.from(new Set(allStaffUsers.map((u) => u.email.trim().toLowerCase())));
  }, [allStaffUsers]);

  // Unique departments for quick filtering
  const departments = useMemo(() => {
    const depts = new Set<string>();
    allStaffUsers.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return ['All', ...Array.from(depts).sort()];
  }, [allStaffUsers]);

  // Filtered staff list for the interactive selection checklist
  const filteredStaff = useMemo(() => {
    return allStaffUsers.filter((u) => {
      const matchesDept = selectedDeptFilter === 'All' || u.department === selectedDeptFilter;
      const term = staffSearchTerm.toLowerCase().trim();
      if (!term) return matchesDept;

      const matchesSearch =
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term)) ||
        (u.role && u.role.toLowerCase().includes(term));

      return matchesDept && matchesSearch;
    });
  }, [allStaffUsers, selectedDeptFilter, staffSearchTerm]);

  // Final list of recipients depending on mode
  const effectiveRecipients = useMemo(() => {
    if (!sendEmailAlert || !isActive) return [];
    if (emailTargetMode === 'all') {
      return Array.from(new Set([...allStaffEmails, ...customEmails.map((e) => e.toLowerCase())]));
    }
    return Array.from(new Set([...selectedEmails.map((e) => e.toLowerCase()), ...customEmails.map((e) => e.toLowerCase())]));
  }, [sendEmailAlert, isActive, emailTargetMode, allStaffEmails, selectedEmails, customEmails]);

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
      setSendEmailAlert(true);
      setEmailTargetMode('all');
      setSelectedEmails([]);
      setCustomEmails([]);
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
        setSendEmailAlert(true);
        break;

      case 'secondary_resolved':
        setTitle('Secondary System Operational - Resolved');
        setMessage(
          'The database issues affecting the Elimisha Secondary School portal have been successfully resolved. All grading, student records, and staff portals are fully operational.'
        );
        setSeverity('info');
        setAffectedSystem('Secondary System');
        setExpectedResolution('All services restored to normal operations');
        setIsActive(false);
        setSendEmailAlert(true);
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
        setSendEmailAlert(true);
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
        setSendEmailAlert(true);
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
        setSendEmailAlert(true);
        break;
    }
  };

  // Toggle individual staff email selection
  const handleToggleStaffEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    setSelectedEmails((prev) =>
      prev.includes(clean) ? prev.filter((e) => e !== clean) : [...prev, clean]
    );
  };

  // Select all currently filtered staff
  const handleSelectAllFiltered = () => {
    const emailsToAdd = filteredStaff.map((u) => u.email.trim().toLowerCase());
    setSelectedEmails((prev) => Array.from(new Set([...prev, ...emailsToAdd])));
  };

  // Deselect all currently filtered staff
  const handleDeselectFiltered = () => {
    const emailsToRemove = new Set(filteredStaff.map((u) => u.email.trim().toLowerCase()));
    setSelectedEmails((prev) => prev.filter((e) => !emailsToRemove.has(e)));
  };

  // Add custom email address
  const handleAddCustomEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customEmailInput.trim()) return;

    // Support comma or semicolon separated entries
    const candidates = customEmailInput
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes('@') && s.includes('.'));

    if (candidates.length > 0) {
      setCustomEmails((prev) => Array.from(new Set([...prev, ...candidates])));
      setCustomEmailInput('');
      setEmailErrorMessage(null);
    } else {
      setEmailErrorMessage('Please enter a valid email address (e.g. name@elimishawatoto.org)');
      setTimeout(() => setEmailErrorMessage(null), 3000);
    }
  };

  const handleRemoveCustomEmail = (emailToRemove: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (sendEmailAlert && isActive && emailTargetMode === 'selected' && effectiveRecipients.length === 0) {
      setEmailErrorMessage('Please select at least one staff email or switch to "All Staff Emails".');
      return;
    }

    setIsSaving(true);
    setEmailErrorMessage(null);

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

      // 1. Save announcement in database / state
      await onSaveAnnouncement(payload);
      setSelectedId(idToUse);

      // 2. Dispatch email alerts if configured and active
      let emailDispatchedCount = 0;
      let emailWarning: string | undefined = undefined;

      if (sendEmailAlert && isActive && effectiveRecipients.length > 0) {
        const result = await sendBroadcastAlertNotification({
          announcement: payload,
          recipients: effectiveRecipients,
          broadcastMode: emailTargetMode,
          senderName: currentUser?.name || 'IT Administration',
        });

        if (result) {
          emailDispatchedCount = result.recipientCount || effectiveRecipients.length;
          if (result.status === 'simulated' || result.warning) {
            emailWarning = result.warning || 'Alert recorded; live SMTP delivery simulated.';
          }
        }
      }

      // 3. User feedback message
      if (isActive) {
        if (sendEmailAlert && emailDispatchedCount > 0) {
          setSaveSuccessMessage(
            `Alert broadcast to Employee Portal and sent to ${emailDispatchedCount} staff ${
              emailDispatchedCount === 1 ? 'inbox' : 'inboxes'
            } (${emailTargetMode === 'all' ? 'All Staff' : 'Selected Staff'})!${
              emailWarning ? ` [${emailWarning}]` : ''
            }`
          );
        } else {
          setSaveSuccessMessage('Alert successfully broadcast to Employee Portal banner.');
        }
      } else {
        setSaveSuccessMessage('Announcement saved and set to Inactive (hidden from employees).');
      }

      setTimeout(() => setSaveSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Failed to save announcement or dispatch emails:', err);
      setEmailErrorMessage('An error occurred while saving the alert. Please verify connection.');
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
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs font-bold shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="manage-announcement-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                IT Outage Broadcast & Staff Email Alert System
              </h2>
              <p className="text-xs text-slate-500">
                Publish emergency notices to the Employee Portal and immediately dispatch email alerts to staff.
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
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {emailErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{emailErrorMessage}</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
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
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Broadcast Live to Employee Portal
                </span>
                <span className="text-[11px] text-slate-500 block">
                  When active, this banner is displayed at the top of the portal for all staff.
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
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
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
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
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
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500 shadow-2xs"
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
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
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
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* EMAIL BROADCASTING SECTION */}
            <div className="pt-3 border-t border-slate-200">
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 sm:p-5 space-y-4">
                {/* Email Section Header & Master Toggle */}
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                        <span>Send Alert to Staff Emails</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          Email Dispatch
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        Deliver this urgent broadcast directly into staff Google Workspace / Outlook mailboxes.
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                    <input
                      type="checkbox"
                      checked={sendEmailAlert}
                      onChange={(e) => setSendEmailAlert(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Settings: All vs Selected */}
                {sendEmailAlert && (
                  <div className="space-y-4 pt-3 border-t border-blue-200/70 animate-in fade-in">
                    {/* Audience Selector Tabs */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Choose Email Audience:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Option 1: All Staff Emails */}
                        <div
                          onClick={() => setEmailTargetMode('all')}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            emailTargetMode === 'all'
                              ? 'border-blue-600 bg-white shadow-xs ring-2 ring-blue-500/10'
                              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="emailTargetMode"
                              checked={emailTargetMode === 'all'}
                              onChange={() => setEmailTargetMode('all')}
                              className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                <span>All Staff Emails</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                  {allStaffEmails.length} staff
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Broadcasts to every registered staff mailbox across all departments.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Select Specific Emails */}
                        <div
                          onClick={() => setEmailTargetMode('selected')}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            emailTargetMode === 'selected'
                              ? 'border-blue-600 bg-white shadow-xs ring-2 ring-blue-500/10'
                              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="emailTargetMode"
                              checked={emailTargetMode === 'selected'}
                              onChange={() => setEmailTargetMode('selected')}
                              className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                <span>Select Specific Staff</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                  {selectedEmails.length} selected
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Choose specific individuals, departments, or custom email addresses.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Selection List (Only when 'selected' mode is active) */}
                    {emailTargetMode === 'selected' && (
                      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3 shadow-2xs animate-in fade-in">
                        {/* Search and Filters Bar */}
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={staffSearchTerm}
                              onChange={(e) => setStaffSearchTerm(e.target.value)}
                              placeholder="Search staff by name, email, department..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSelectAllFiltered}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Select Filtered
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectFiltered}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Deselect
                            </button>
                            {selectedEmails.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedEmails([])}
                                className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Department Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                          <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0 mr-1 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Dept:
                          </span>
                          {departments.map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => setSelectedDeptFilter(dept)}
                              className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                                selectedDeptFilter === dept
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>

                        {/* Staff Checkbox List */}
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 pr-1">
                          {filteredStaff.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">
                              No staff members match "{staffSearchTerm}".
                            </div>
                          ) : (
                            filteredStaff.map((u) => {
                              const email = u.email.trim().toLowerCase();
                              const isChecked = selectedEmails.includes(email);
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => handleToggleStaffEmail(email)}
                                  className={`px-3 py-2 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                    isChecked ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="shrink-0 text-blue-600">
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-300" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                                        <span>{u.name}</span>
                                        {u.role !== 'Employee' && (
                                          <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-700">
                                            {u.role}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                        <span className="text-blue-600 font-mono">{email}</span>
                                        {u.department && (
                                          <>
                                            <span>•</span>
                                            <span className="text-slate-600 font-medium">{u.department}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 text-[10px] font-bold text-slate-400">
                                    {isChecked && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                        Included
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Optional: Add custom external email address */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={customEmailInput}
                              onChange={(e) => setCustomEmailInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomEmail();
                                }
                              }}
                              placeholder="Add custom email (e.g. director@school.org)..."
                              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomEmail}
                              className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              Add
                            </button>
                          </div>

                          {/* Chips for custom added emails */}
                          {customEmails.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {customEmails.map((cEmail) => (
                                <span
                                  key={cEmail}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[11px] font-medium"
                                >
                                  <span>{cEmail}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomEmail(cEmail)}
                                    className="hover:text-rose-600 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email Dispatch Summary Strip */}
                    <div className="p-3 bg-white/90 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-slate-700">
                          Recipient Count:{' '}
                          <strong className="text-blue-700 font-bold">
                            {effectiveRecipients.length} {effectiveRecipients.length === 1 ? 'mailbox' : 'mailboxes'}
                          </strong>{' '}
                          ({emailTargetMode === 'all' ? 'All Registered Staff' : 'Selected Recipients'})
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate max-w-sm">
                        Subject: <span className="font-mono text-slate-700">{title || 'Service Interruption'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                <span>Delete Notice</span>
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
              disabled={
                isSaving ||
                !title.trim() ||
                !message.trim() ||
                (sendEmailAlert && isActive && emailTargetMode === 'selected' && effectiveRecipients.length === 0)
              }
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>Publishing & Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isActive
                      ? sendEmailAlert && effectiveRecipients.length > 0
                        ? `Broadcast & Email (${effectiveRecipients.length})`
                        : 'Broadcast Alert'
                      : 'Save as Inactive'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
