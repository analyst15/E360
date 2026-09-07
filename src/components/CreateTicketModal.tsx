import React, { useState, useEffect } from 'react';
import { Ticket, TicketCategory, TicketPriority, TicketTier, ITAsset, AITriageData, ORGANIZATIONAL_DEPARTMENTS } from '../types';
import {
  X,
  Plus,
  Sparkles,
  Laptop,
  User,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  RotateCw,
  Lightbulb,
  Building,
} from 'lucide-react';

interface CreateTicketModalProps {
  onClose: () => void;
  onCreateTicket: (newTicket: Ticket) => void;
  assets: ITAsset[];
  initialCategory?: TicketCategory;
  initialTitle?: string;
  initialDescription?: string;
  defaultReporter?: { name: string; email: string; department: string };
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  onClose,
  onCreateTicket,
  assets,
  initialCategory,
  initialTitle,
  initialDescription,
  defaultReporter,
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [category, setCategory] = useState<TicketCategory>(initialCategory || 'Keyboard or mouse not working');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [reporterName, setReporterName] = useState(defaultReporter?.name || 'Staff Member');
  const [reporterEmail, setReporterEmail] = useState(defaultReporter?.email || 'staff@elimishawatoto.org');
  const [reporterDepartment, setReporterDepartment] = useState(defaultReporter?.department || 'Secondary');
  const [tier, setTier] = useState<TicketTier>('Tier 1 (Helpdesk)');
  const [customTags, setCustomTags] = useState('');

  // AI Triage State
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiTriage, setAiTriage] = useState<AITriageData | null>(null);

  // Trigger Smart Triage with debounce
  useEffect(() => {
    if (title.length < 5 && description.length < 10) return;

    const timer = setTimeout(async () => {
      setIsTriaging(true);
      try {
        const res = await fetch('/api/ai/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            department: reporterDepartment,
          }),
        });

        if (res.ok) {
          const data: AITriageData = await res.json();
          setAiTriage(data);
          if (data.detectedCategory) setCategory(data.detectedCategory);
          if (data.recommendedPriority) setPriority(data.recommendedPriority);
          if (data.suggestedTags && !customTags) {
            setCustomTags(data.suggestedTags.join(', '));
          }
        }
      } catch (err) {
        console.error('Smart Triage error:', err);
      } finally {
        setIsTriaging(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();
    const parsedTags = customTags
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `INC-${randNum}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'Open',
      tier,
      assignedAgent: 'Unassigned',
      assignedTeam: 'Workplace Tech',
      reporterName: reporterName.trim() || 'Enterprise Employee',
      reporterEmail: reporterEmail.trim() || 'employee@enterprise.io',
      reporterDepartment: reporterDepartment.trim() || 'General',
      tags: parsedTags.length > 0 ? parsedTags : [category.toLowerCase()],
      createdAt: nowIso,
      updatedAt: nowIso,
      comments: [
        {
          id: `comment-init-${Date.now()}`,
          authorName: reporterName || 'Employee',
          authorEmail: reporterEmail || 'employee@enterprise.io',
          authorRole: 'User',
          type: 'Public Reply',
          content: description.trim(),
          timestamp: nowIso,
        },
      ],
      aiTriage: aiTriage || undefined,
    };

    onCreateTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New IT Support Request</h2>
              <p className="text-xs text-slate-500">Auto-routes to support queue & dispatches email to it@elimishawatoto.org and IT Staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* AI Pre-submission Deflection Hint (if detected) */}
          {aiTriage?.autoDeflectionHint && (
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-900 flex items-start gap-3 animate-in fade-in">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-indigo-950 block mb-0.5">
                  AI Instant Troubleshooting Recommendation:
                </strong>
                <p className="text-xs text-indigo-800 leading-relaxed">{aiTriage.autoDeflectionHint}</p>
                <span className="text-[10px] text-indigo-600 block mt-1">
                  Try this self-service fix or proceed with submitting the ticket below.
                </span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Incident Subject / Summary <span className="text-red-500">*</span>
              </label>
              {isTriaging && (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 animate-spin" /> AI Analyzing...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. VPN GlobalProtect authentication error 403 or Outlook calendar sync delay"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Detailed Description & Symptoms <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please describe the issue, error codes, when it started, and steps already attempted..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white leading-relaxed transition-all shadow-xs"
            />
          </div>

          {/* Categorization & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            {/* Category */}
            <div className="min-w-0">
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TicketCategory)}
                className="w-full max-w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs truncate"
              >
                <option value="Keyboard or mouse not working">Keyboard or mouse not working</option>
                <option value="Laptop not charging or turning on">Laptop not charging or turning on</option>
                <option value="Email Password">Email Password</option>
                <option value="Microsoft Office( Word, Powerpoint & Excel)">Microsoft Office( Word, Powerpoint & Excel)</option>
                <option value="Software (App errors, Activation Keys)">Software (App errors, Activation Keys)</option>
                <option value="Network Connectivity">Network Connectivity</option>
                <option value="Equipment Request">Equipment Request</option>
                <option value="Printer Toner depleted">Printer Toner depleted</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div className="min-w-0">
              <label className="font-semibold text-slate-700 block mb-1">Priority / Urgency</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TicketPriority)}
                className="w-full max-w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs truncate"
              >
                <option value="Low">Low (P4 - Minor question / Routine request)</option>
                <option value="Medium">Medium (P3 - Individual degraded functionality)</option>
                <option value="High">High (P2 - Individual blocked / Team impacted)</option>
                <option value="Critical">Critical (P1 - Major outage / Work blocked)</option>
              </select>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reporter Name</label>
              <input
                type="text"
                value={reporterName}
                onChange={e => setReporterName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reporter Email</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={e => setReporterEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={reporterDepartment}
                onChange={e => setReporterDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
              >
                {reporterDepartment && !ORGANIZATIONAL_DEPARTMENTS.includes(reporterDepartment as any) && (
                  <option value={reporterDepartment}>{reporterDepartment} (Current)</option>
                )}
                {ORGANIZATIONAL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={customTags}
              onChange={e => setCustomTags(e.target.value)}
              placeholder="e.g. vpn, okta, certificate, macos"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Ticket will be triaged and assigned to an available technician.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Create Incident Ticket
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
