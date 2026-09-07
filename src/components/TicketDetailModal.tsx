import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketTier, CommentType, TicketComment, ITAsset } from '../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import { IT_AGENTS, CANNED_RESPONSES } from '../data/mockData';
import {
  X,
  Send,
  Lock,
  MessageSquare,
  Sparkles,
  Terminal,
  FileText,
  User,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCw,
  Clock,
  Shield,
  Layers,
  HelpCircle,
  BookPlus,
  Paperclip,
  Share2,
  ChevronRight,
  UserCheck,
  Mail,
  Trash2,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateTicket: (updated: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onAddComment: (ticketId: string, comment: Omit<TicketComment, 'id' | 'timestamp'>) => void;
  assets: ITAsset[];
  onGenerateKBArticle?: (ticket: Ticket, resolutionNotes: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateTicket,
  onDeleteTicket,
  onAddComment,
  assets,
  onGenerateKBArticle,
}) => {
  const [commentType, setCommentType] = useState<'Public Reply' | 'Internal Note'>('Public Reply');
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'internal' | 'audit'>('all');
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedCanned, setSelectedCanned] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI State
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiDiagnosis, setAiDiagnosis] = useState<{
    diagnosticSteps?: string[];
    cliScript?: string;
    suggestedReply?: string;
    internalNotes?: string;
    recommendedAction?: string;
    isAiGenerated?: boolean;
  } | null>(null);

  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    summary: string;
    keyTakeaways: string[];
    nextBestAction?: string;
  } | null>(null);

  // Resolution Modal State
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');

  // Find associated asset info
  const assetInfo = assets.find(
    a =>
      (ticket.assetId && (a.laptopSerialNumber === ticket.assetId || a.id === ticket.assetId)) ||
      a.employeeName.toLowerCase() === ticket.reporterName.toLowerCase()
  );

  // Handle comment submit
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(ticket.id, {
      authorName: 'IT Specialist (You)',
      authorEmail: 'support@enterprise.io',
      authorRole: 'Agent',
      type: commentType,
      content: commentText.trim(),
    });

    setCommentText('');
  };

  // Trigger Gemini AI Diagnostic
  const handleRunAiDiagnosis = async () => {
    setIsAiDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          comments: ticket.comments,
          agentPrompt: aiCustomPrompt || 'Provide complete technical diagnostic, CLI command fix, and suggested user reply',
        }),
      });

      if (!res.ok) throw new Error('AI Diagnosis request failed');
      const data = await res.json();
      setAiDiagnosis(data);
    } catch (err) {
      console.error('AI diagnose failed:', err);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Trigger Gemini AI Summarizer
  const handleRunAiSummarize = async () => {
    setIsAiSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          comments: ticket.comments,
        }),
      });

      if (!res.ok) throw new Error('AI Summarize failed');
      const data = await res.json();
      setAiSummary(data);
    } catch (err) {
      console.error('AI summarize failed:', err);
    } finally {
      setIsAiSummarizing(false);
    }
  };

  // Copy CLI Script
  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Handle Resolution
  const handleConfirmResolve = () => {
    const updated: Ticket = {
      ...ticket,
      status: 'Resolved',
      resolutionNotes,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTicket(updated);

    // Also add an audit comment
    onAddComment(ticket.id, {
      authorName: 'IT Specialist (You)',
      authorEmail: 'support@enterprise.io',
      authorRole: 'Agent',
      type: 'Public Reply',
      content: `Ticket resolved. Resolution Notes:\n${resolutionNotes || 'Issue remediated and verified with user.'}`,
    });

    setShowResolveDialog(false);
  };

  // Filtered comments
  const filteredComments = ticket.comments.filter(c => {
    if (activeTab === 'public') return c.type === 'Public Reply';
    if (activeTab === 'internal') return c.type === 'Internal Note';
    if (activeTab === 'audit') return c.type === 'System Audit' || c.type === 'AI Triage';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              {ticket.ticketNumber}
            </span>
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>

          <div className="flex items-center gap-2">
            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <button
                onClick={() => setShowResolveDialog(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve Ticket
              </button>
            )}
            {onDeleteTicket && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                title="Delete this ticket"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls & Fast Property Adjusters */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Status Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Status</label>
            <select
              value={ticket.status}
              onChange={e => onUpdateTicket({ ...ticket, status: e.target.value as TicketStatus, updatedAt: new Date().toISOString() })}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on User">Waiting on User</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Priority</label>
            <select
              value={ticket.priority}
              onChange={e => onUpdateTicket({ ...ticket, priority: e.target.value as TicketPriority, updatedAt: new Date().toISOString() })}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Assignee Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Assigned Agent</label>
            <select
              value={ticket.assignedAgent}
              onChange={e => onUpdateTicket({ ...ticket, assignedAgent: e.target.value, updatedAt: new Date().toISOString() })}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="Unassigned">Unassigned</option>
              {IT_AGENTS.map(agent => (
                <option key={agent.name} value={agent.name}>
                  {agent.name} ({agent.role})
                </option>
              ))}
            </select>
          </div>

          {/* Tier Level */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Support Tier</label>
            <select
              value={ticket.tier}
              onChange={e => onUpdateTicket({ ...ticket, tier: e.target.value as TicketTier, updatedAt: new Date().toISOString() })}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="Tier 1 (Helpdesk)">Tier 1 (Helpdesk)</option>
              <option value="Tier 2 (SysAdmin)">Tier 2 (SysAdmin)</option>
              <option value="Tier 3 (DevOps / SecOps)">Tier 3 (DevOps / SecOps)</option>
              <option value="Field Support">Field Support</option>
            </select>
          </div>
        </div>

        {/* Main Split-Screen Workbench Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Ticket Details, SLA, & Conversation Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col p-5 space-y-4 overflow-y-auto">
            {/* Title & Metadata Card */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2.5">{ticket.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Reporter:</span> <strong className="text-slate-800">{ticket.reporterName}</strong>
                    <div className="text-[11px] text-slate-500">{ticket.reporterDepartment}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Asset:</span> <strong className="text-slate-800">{ticket.assetId || 'N/A'}</strong>
                    <div className="text-[11px] text-slate-500">{ticket.operatingSystem || 'Not Specified'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Created:</span> <strong className="text-slate-800">{formatTimeAgo(ticket.createdAt)}</strong>
                    <div className="text-[11px] text-slate-500">Updated: {formatTimeAgo(ticket.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Automated Email Alert Dispatch Status */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-sky-700 font-medium">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Email Alerts: Dispatched to <strong>it@elimishawatoto.org</strong> & IT Staff</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Delivered
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial Incident Report</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                  {ticket.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Banner if resolved */}
            {ticket.resolutionNotes && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Summary
                </div>
                <p className="text-emerald-900 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                {onGenerateKBArticle && (
                  <button
                    onClick={() => onGenerateKBArticle(ticket, ticket.resolutionNotes || '')}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    <BookPlus className="w-3.5 h-3.5" />
                    Convert this resolution to a Knowledge Base Article
                  </button>
                )}
              </div>
            )}

            {/* Conversation / Activity Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Activity History & Communication ({ticket.comments.length})
                </h3>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'all' ? 'bg-slate-200 text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('public')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'public' ? 'bg-blue-100 text-blue-700 border border-blue-200 font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Public Replies
                  </button>
                  <button
                    onClick={() => setActiveTab('internal')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'internal' ? 'bg-amber-100 text-amber-800 border border-amber-200 font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Internal Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'audit' ? 'bg-slate-200 text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Audits & AI
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {filteredComments.map(comment => {
                  const isInternal = comment.type === 'Internal Note';
                  const isAudit = comment.type === 'System Audit';
                  const isAi = comment.type === 'AI Triage';

                  let bubbleStyle = 'bg-slate-50 border-slate-200 text-slate-800';
                  let headerBadge = null;

                  if (isInternal) {
                    bubbleStyle = 'bg-amber-50/80 border-amber-200 text-amber-950';
                    headerBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        <Lock className="w-2.5 h-2.5" /> Internal Tech Note
                      </span>
                    );
                  } else if (isAi) {
                    bubbleStyle = 'bg-indigo-50 border-indigo-200 text-indigo-950';
                    headerBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" /> AI Copilot
                      </span>
                    );
                  } else if (isAudit) {
                    bubbleStyle = 'bg-slate-50 border-slate-200 text-slate-500 text-xs italic';
                  }

                  return (
                    <div
                      key={comment.id}
                      className={`p-3.5 rounded-xl border text-xs ${bubbleStyle} transition-all`}
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2">
                          <strong className="font-semibold text-slate-900">{comment.authorName}</strong>
                          <span className="text-[11px] text-slate-500">({comment.authorRole})</span>
                          {headerBadge}
                        </div>
                        <span className="text-[11px] text-slate-400">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  );
                })}

                {filteredComments.length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-400 italic">No activity matching this filter.</p>
                )}
              </div>
            </div>

            {/* Reply Composer */}
            <div className="mt-4 pt-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Type Switcher & Canned Responses */}
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCommentType('Public Reply')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      commentType === 'Public Reply'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Public Reply to User
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentType('Internal Note')}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      commentType === 'Internal Note'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Internal Tech Note
                  </button>
                </div>

                {/* Canned Responses Dropdown */}
                <select
                  value={selectedCanned}
                  onChange={e => {
                    setSelectedCanned(e.target.value);
                    if (e.target.value) {
                      setCommentText(prev => (prev ? `${prev}\n\n${e.target.value}` : e.target.value));
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Insert Canned Response Template...</option>
                  {CANNED_RESPONSES.map(c => (
                    <option key={c.title} value={c.content}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Textarea */}
              <textarea
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={
                  commentType === 'Public Reply'
                    ? 'Write response to user (sent via email / portal notification)...'
                    : 'Add internal technician notes, diagnostic logs, or handover steps (hidden from end-user)...'
                }
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 leading-relaxed shadow-xs"
              />

              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-slate-500">
                  {commentType === 'Public Reply' ? 'Visible to reporter' : '🔒 Techs only'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSendComment()}
                  disabled={!commentText.trim()}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                    commentType === 'Public Reply'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                      : 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {commentType === 'Public Reply' ? 'Send Reply' : 'Post Internal Note'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Diagnostic Copilot & Knowledge Tools (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-slate-50/50 flex flex-col space-y-4 overflow-y-auto">
            {/* Copilot Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">IT Copilot & Diagnostics</h3>
                  <span className="text-[11px] text-indigo-600">Gemini 3.7 Flash Engine</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleRunAiSummarize}
                  disabled={isAiSummarizing}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Summarize entire ticket thread"
                >
                  {isAiSummarizing ? <RotateCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 text-sky-600" />}
                  Summarize Thread
                </button>
              </div>
            </div>

            {/* AI Thread Summary Display (if triggered) */}
            {aiSummary && (
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-sky-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    Executive Summary
                  </span>
                  <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
                </div>
                <p className="text-slate-700 leading-relaxed">{aiSummary.summary}</p>
                {aiSummary.keyTakeaways && (
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                    {aiSummary.keyTakeaways.map((k, idx) => (
                      <li key={idx}>{k}</li>
                    ))}
                  </ul>
                )}
                {aiSummary.nextBestAction && (
                  <div className="bg-sky-100/70 p-2.5 rounded-lg border border-sky-200 text-[11px] text-sky-900">
                    <strong>Next Recommended Action:</strong> {aiSummary.nextBestAction}
                  </div>
                )}
              </div>
            )}

            {/* Run Diagnostic Trigger Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
              <label className="text-[11px] font-semibold text-slate-700">Custom Technician Query (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiCustomPrompt}
                  onChange={e => setAiCustomPrompt(e.target.value)}
                  placeholder="e.g. Generate macOS Terminal commands to reset MDM..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleRunAiDiagnosis}
                  disabled={isAiDiagnosing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isAiDiagnosing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Diagnose
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Diagnosis Output Card */}
            {aiDiagnosis ? (
              <div className="space-y-3 animate-in fade-in">
                {/* Steps */}
                {aiDiagnosis.diagnosticSteps && (
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs shadow-2xs">
                    <h4 className="font-semibold text-indigo-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Step-by-Step Diagnostic Protocol
                    </h4>
                    <div className="space-y-1.5">
                      {aiDiagnosis.diagnosticSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-700 leading-snug">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CLI Script Block */}
                {aiDiagnosis.cliScript && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs shadow-md">
                    <div className="px-3.5 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                      <span className="font-mono text-indigo-300 text-[11px] flex items-center gap-1.5 font-semibold">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        CLI Remediation Script
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyScript(aiDiagnosis.cliScript || '')}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
                      >
                        {copiedScript ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Script
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {aiDiagnosis.cliScript}
                    </pre>
                  </div>
                )}

                {/* Suggested User Reply */}
                {aiDiagnosis.suggestedReply && (
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-blue-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        AI Drafted User Response
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setCommentType('Public Reply');
                          setCommentText(aiDiagnosis.suggestedReply || '');
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                      >
                        Insert in Composer
                      </button>
                    </div>
                    <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap text-[11px] leading-relaxed">
                      {aiDiagnosis.suggestedReply}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Default AI Assistant Placeholder / Initial Triage Card */
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Initial Triage Evaluation
                </div>

                {ticket.aiTriage ? (
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <span className="text-slate-500">Root Cause Theory:</span>{' '}
                      <span className="text-slate-900 font-medium">{ticket.aiTriage.rootCauseHypothesis}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Urgency Assessment:</span>{' '}
                      <span>{ticket.aiTriage.urgencyReasoning}</span>
                    </div>
                    {ticket.aiTriage.autoDeflectionHint && (
                      <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 text-[11px] text-indigo-900">
                        <strong>Self-Service Hint:</strong> {ticket.aiTriage.autoDeflectionHint}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 leading-relaxed">
                    Click <strong>Diagnose</strong> to generate step-by-step troubleshooting, executable CLI scripts, and user-facing replies tailored for this ticket.
                  </p>
                )}

                <button
                  onClick={handleRunAiDiagnosis}
                  className="w-full py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Run Full AI Incident Diagnostics
                </button>
              </div>
            )}

            {/* Asset Metadata Sidebar Card if available */}
            {assetInfo && (
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    Workstation Asset Telemetry
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {assetInfo.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>Model: <strong className="text-slate-800">{assetInfo.deviceModel}</strong></div>
                  <div>IP: <strong className="text-slate-800">{assetInfo.ipAddress}</strong></div>
                  <div>MAC: <strong className="text-slate-800">{assetInfo.macAddress}</strong></div>
                  <div>Last Seen: <strong className="text-slate-800">{formatTimeAgo(assetInfo.lastCheckIn)}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Confirmation Modal */}
      {showResolveDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolve Ticket #{ticket.ticketNumber}
              </h3>
              <button onClick={() => setShowResolveDialog(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Provide resolution notes explaining the fix. This will be recorded in the audit trail and emailed directly to the employee.
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                An automated resolution email will be dispatched to <strong>{ticket.reporterEmail || ticket.reporterName}</strong>.
              </span>
            </div>

            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced faulty fan bearing, ran Apple Diagnostics with 0 errors, and confirmed with engineer."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveDialog(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={!resolutionNotes.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer transition-all shadow-xs"
              >
                Confirm & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Ticket {ticket.ticketNumber}?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete ticket <span className="font-semibold text-slate-800">"{ticket.title}"</span>? This will remove all ticket correspondence, notes, and activity history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTicket?.(ticket.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
