import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  KBArticle,
  ITAsset,
  UserAccount,
  TicketComment,
  EmployeeNotification,
  ORGANIZATIONAL_DEPARTMENTS,
} from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import { EmployeeTicketModal } from './EmployeeTicketModal';
import { WorkplacePortalsHub } from './WorkplacePortalsHub';
import { WORKPLACE_PORTALS } from '../data/workplacePortals';
import {
  Search,
  Plus,
  Laptop,
  Smartphone,
  Mouse,
  Mic,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  User,
  Building,
  Check,
  Copy,
  HelpCircle,
  Lightbulb,
  Globe,
  LogOut,
  Sparkles,
  X,
  Bell,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LifeBuoy,
  ShieldCheck,
  Layers,
  Wrench,
  Mail,
  Users,
  AtSign,
  Send,
  PhoneCall,
  ThumbsUp,
  BookOpen,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface EmployeePortalPageProps {
  tickets: Ticket[];
  kbArticles: KBArticle[];
  assets: ITAsset[];
  users: UserAccount[];
  currentUser?: UserAccount | null;
  onCreateTicket: (newTicket: Ticket) => void;
  onAddComment: (ticketId: string, comment: Omit<TicketComment, 'id' | 'timestamp'>) => void;
  onUpvoteKBArticle?: (id: string) => void;
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
}

export const EmployeePortalPage: React.FC<EmployeePortalPageProps> = ({
  tickets,
  kbArticles,
  assets,
  users,
  currentUser,
  onCreateTicket,
  onAddComment,
  onUpvoteKBArticle,
  onSwitchToAdmin,
  onLogout,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<'tickets' | 'devices' | 'staff' | 'portals' | 'kb' | 'notifications'>('tickets');

  // Employee Identity (derived from currentUser or localStorage)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>(() => {
    return currentUser?.name || localStorage.getItem('ewf_employee_name') || 'Sarah Chen';
  });
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('ewf_employee_email') || 'sarah.chen@enterprise.io';
  });
  const [selectedEmployeeDept, setSelectedEmployeeDept] = useState<string>(() => {
    return currentUser?.department || localStorage.getItem('ewf_employee_dept') || 'Engineering';
  });

  // Employee Notifications State
  const [notifications, setNotifications] = useState<EmployeeNotification[]>(() => {
    const userKey = currentUser?.id || currentUser?.email || 'default_user';
    const saved = localStorage.getItem(`ewf_emp_notifications_${userKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parse error
      }
    }
    return [
      {
        id: 'notif-welcome',
        title: 'Welcome to Staff Support Portal',
        message: 'You can submit requests, track progress in real-time, and receive updates directly here.',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'info',
      },
    ];
  });

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Persist notifications to localStorage
  useEffect(() => {
    const userKey = currentUser?.id || currentUser?.email || 'default_user';
    localStorage.setItem(`ewf_emp_notifications_${userKey}`, JSON.stringify(notifications));
  }, [notifications, currentUser]);

  // Sync with currentUser
  useEffect(() => {
    if (currentUser) {
      setSelectedEmployeeName(currentUser.name);
      setSelectedEmployeeEmail(currentUser.email);
      setSelectedEmployeeDept(currentUser.department);
      localStorage.setItem('ewf_employee_name', currentUser.name);
      localStorage.setItem('ewf_employee_email', currentUser.email);
      localStorage.setItem('ewf_employee_dept', currentUser.department);
    }
  }, [currentUser]);

  // Automatically detect updates on employee's tickets to create real-time in-portal notifications
  useEffect(() => {
    const myTkts = tickets.filter((t) => {
      return (
        t.reporterName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim() ||
        t.reporterEmail.toLowerCase().trim() === selectedEmployeeEmail.toLowerCase().trim()
      );
    });

    myTkts.forEach((ticket) => {
      // 1. Resolution / Closed Notification
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        const notifId = `notif-status-${ticket.id}-${ticket.status}`;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notifId)) return prev;
          return [
            {
              id: notifId,
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: `Ticket ${ticket.ticketNumber} marked as ${ticket.status}`,
              message: `Your support request "${ticket.title}" has been ${ticket.status.toLowerCase()} by the IT team.`,
              timestamp: ticket.resolvedAt || ticket.updatedAt || new Date().toISOString(),
              isRead: false,
              type: 'status_changed',
            },
            ...prev,
          ];
        });
      }

      // 2. Assignment / In Progress Notification
      if (ticket.status === 'In Progress' && ticket.assignedToName) {
        const notifId = `notif-assigned-${ticket.id}-${ticket.assignedToName}`;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notifId)) return prev;
          return [
            {
              id: notifId,
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: `Ticket ${ticket.ticketNumber} assigned to ${ticket.assignedToName}`,
              message: `IT specialist ${ticket.assignedToName} is actively working on your request "${ticket.title}".`,
              timestamp: ticket.updatedAt || new Date().toISOString(),
              isRead: false,
              type: 'assigned',
            },
            ...prev,
          ];
        });
      }

      // 3. Comments added by IT Staff / Agent
      if (ticket.comments && ticket.comments.length > 1) {
        const staffComments = ticket.comments.filter(
          (c) =>
            c.authorEmail.toLowerCase() !== selectedEmployeeEmail.toLowerCase() &&
            c.authorName.toLowerCase() !== selectedEmployeeName.toLowerCase()
        );
        staffComments.forEach((comm) => {
          const notifId = `notif-comm-${ticket.id}-${comm.id}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notifId)) return prev;
            return [
              {
                id: notifId,
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: `New reply on ${ticket.ticketNumber} from ${comm.authorName}`,
                message: comm.content.slice(0, 140) + (comm.content.length > 140 ? '...' : ''),
                timestamp: comm.timestamp,
                isRead: false,
                type: 'comment_added',
              },
              ...prev,
            ];
          });
        });
      }
    });
  }, [tickets, selectedEmployeeName, selectedEmployeeEmail]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleOpenNotification = (notif: EmployeeNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setShowNotificationDropdown(false);
    if (notif.ticketId) {
      const match = tickets.find((t) => t.id === notif.ticketId || t.ticketNumber === notif.ticketNumber);
      if (match) {
        setSelectedTicketForModal(match);
      } else {
        setActiveTab('tickets');
      }
    }
  };

  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  // Selected Ticket for Modal View
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);

  // Selected Knowledge Base Article for Modal View
  const [selectedArticleForModal, setSelectedArticleForModal] = useState<KBArticle | null>(null);
  const [copiedStepIdx, setCopiedStepIdx] = useState<number | null>(null);

  // Request Form State (When user clicks "+ New Support Request")
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formCategory, setFormCategory] = useState<TicketCategory>('Keyboard or mouse not working');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Search States
  const [globalSearch, setGlobalSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('All');
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('All');

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedArticleForModal) setSelectedArticleForModal(null);
        else if (selectedTicketForModal) setSelectedTicketForModal(null);
        else if (showRequestForm) setShowRequestForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticleForModal, selectedTicketForModal, showRequestForm]);

  const handleCopyStep = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStepIdx(idx);
    setTimeout(() => setCopiedStepIdx(null), 2000);
  };

  // AI Triage hint for employee
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  // Find devices belonging strictly to the selected employee in the 13-field inventory
  const employeeAssets = useMemo(() => {
    return assets.filter(
      (a) => a.employeeName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim()
    );
  }, [assets, selectedEmployeeName]);

  // Breakdown/Categorization of individual physical devices & peripherals issued to this employee
  interface CategorizedItem {
    id: string;
    type: 'Laptop' | 'Phone' | 'Mouse' | 'Lapel Mic' | 'Tripod';
    name: string;
    modelOrSerial: string;
    conditionOrDetails: string;
    additionalInfo?: string;
    reportCategory: TicketCategory;
    reportDefaultSubject: string;
    iconType: 'laptop' | 'smartphone' | 'mouse' | 'mic' | 'camera';
  }

  const categorizedDevices = useMemo(() => {
    const items: CategorizedItem[] = [];

    employeeAssets.forEach((asset, assetIdx) => {
      // 1. Laptop Device
      if (asset.laptopModel && asset.laptopModel.trim() && asset.laptopModel.toLowerCase() !== 'none') {
        items.push({
          id: `${asset.id}-laptop-${assetIdx}`,
          type: 'Laptop',
          name: asset.laptopModel,
          modelOrSerial: asset.laptopSerialNumber ? `S/N: ${asset.laptopSerialNumber}` : 'Registered Laptop',
          conditionOrDetails: asset.laptopConditionComments || 'Good working condition',
          additionalInfo: asset.laptopPrice ? `Value: ${asset.laptopPrice}` : undefined,
          reportCategory: 'Laptop not charging or turning on',
          reportDefaultSubject: `Hardware issue on ${asset.laptopModel} (${asset.laptopSerialNumber || 'No S/N'})`,
          iconType: 'laptop',
        });
      }

      // 2. Phone Device
      if (asset.phoneModel && asset.phoneModel.trim() && asset.phoneModel.toLowerCase() !== 'none' && asset.phoneModel.toLowerCase() !== 'n/a') {
        const lines: string[] = [];
        if (asset.safaricomPhoneNumber && asset.safaricomPhoneNumber.toLowerCase() !== 'n/a') {
          lines.push(`Safaricom: ${asset.safaricomPhoneNumber}`);
        }
        if (asset.airtelPhoneNumber && asset.airtelPhoneNumber.toLowerCase() !== 'n/a') {
          lines.push(`Airtel: ${asset.airtelPhoneNumber}`);
        }
        items.push({
          id: `${asset.id}-phone-${assetIdx}`,
          type: 'Phone',
          name: asset.phoneModel,
          modelOrSerial: lines.length > 0 ? lines.join(' • ') : 'Company Cellular Phone',
          conditionOrDetails: asset.phoneConditionComments || 'Good Condition',
          additionalInfo: asset.phonePrice ? `Value: ${asset.phonePrice}` : undefined,
          reportCategory: 'Hardware',
          reportDefaultSubject: `Phone issue on ${asset.phoneModel} (${asset.safaricomPhoneNumber || asset.airtelPhoneNumber || 'No SIM'})`,
          iconType: 'smartphone',
        });
      }

      // 3. Mouse Accessory / Device
      if (asset.issuedWithMouse === 'Yes') {
        items.push({
          id: `${asset.id}-mouse-${assetIdx}`,
          type: 'Mouse',
          name: 'Optical Ergonomic Mouse',
          modelOrSerial: 'Standard USB / Wireless Mouse',
          conditionOrDetails: 'Issued with primary workstation',
          reportCategory: 'Keyboard or mouse not working',
          reportDefaultSubject: `Mouse not working properly for ${selectedEmployeeName}`,
          iconType: 'mouse',
        });
      }

      // 4. Lapel Mic Accessory / Device
      if (asset.issuedWithMic === 'Yes') {
        items.push({
          id: `${asset.id}-mic-${assetIdx}`,
          type: 'Lapel Mic',
          name: 'Wireless / Lapel Microphone',
          modelOrSerial: 'Audio Recording & Meeting Accessory',
          conditionOrDetails: 'Issued for field / media & meetings',
          reportCategory: 'Hardware',
          reportDefaultSubject: `Microphone issue reported by ${selectedEmployeeName}`,
          iconType: 'mic',
        });
      }

      // 5. Tripod Accessory / Device
      if (asset.issuedWithTripod === 'Yes') {
        items.push({
          id: `${asset.id}-tripod-${assetIdx}`,
          type: 'Tripod',
          name: 'Adjustable Camera / Phone Tripod',
          modelOrSerial: 'Mounting & Media Accessory',
          conditionOrDetails: 'Issued for field media & sessions',
          reportCategory: 'Hardware',
          reportDefaultSubject: `Tripod issue reported by ${selectedEmployeeName}`,
          iconType: 'camera',
        });
      }
    });

    return items;
  }, [employeeAssets, selectedEmployeeName]);

  // Selected filter within the My Devices tab
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'All' | 'Laptop' | 'Phone' | 'Mouse' | 'Lapel Mic' | 'Tripod'>('All');

  const filteredCategorizedDevices = useMemo(() => {
    if (deviceTypeFilter === 'All') return categorizedDevices;
    return categorizedDevices.filter(d => d.type === deviceTypeFilter);
  }, [categorizedDevices, deviceTypeFilter]);

  // Color themes for individual device category cards
  const getDeviceTheme = (type: 'Laptop' | 'Phone' | 'Mouse' | 'Lapel Mic' | 'Tripod') => {
    switch (type) {
      case 'Laptop':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white border-blue-200/90 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/50',
          topBar: 'bg-blue-600',
          iconWrapper: 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100',
          badgeClass: 'bg-blue-600 text-white border-blue-700 shadow-2xs',
          specBox: 'bg-white/85 border-blue-100/90 text-slate-700 shadow-2xs',
          specLabel: 'text-blue-800/70',
          titleHover: 'group-hover:text-blue-700',
          footerBorder: 'border-blue-100',
          reportBtn: 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 font-bold',
        };
      case 'Phone':
        return {
          cardBg: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white border-indigo-200/90 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50',
          topBar: 'bg-indigo-600',
          iconWrapper: 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100',
          badgeClass: 'bg-indigo-600 text-white border-indigo-700 shadow-2xs',
          specBox: 'bg-white/85 border-indigo-100/90 text-slate-700 shadow-2xs',
          specLabel: 'text-indigo-800/70',
          titleHover: 'group-hover:text-indigo-700',
          footerBorder: 'border-indigo-100',
          reportBtn: 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 font-bold',
        };
      case 'Mouse':
        return {
          cardBg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white border-emerald-200/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/50',
          topBar: 'bg-emerald-600',
          iconWrapper: 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100',
          badgeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-2xs',
          specBox: 'bg-white/85 border-emerald-100/90 text-slate-700 shadow-2xs',
          specLabel: 'text-emerald-800/70',
          titleHover: 'group-hover:text-emerald-700',
          footerBorder: 'border-emerald-100',
          reportBtn: 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 font-bold',
        };
      case 'Lapel Mic':
        return {
          cardBg: 'bg-gradient-to-br from-purple-50/90 via-fuchsia-50/60 to-white border-purple-200/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100/50',
          topBar: 'bg-purple-600',
          iconWrapper: 'bg-purple-600 text-white shadow-sm ring-4 ring-purple-100',
          badgeClass: 'bg-purple-600 text-white border-purple-700 shadow-2xs',
          specBox: 'bg-white/85 border-purple-100/90 text-slate-700 shadow-2xs',
          specLabel: 'text-purple-800/70',
          titleHover: 'group-hover:text-purple-700',
          footerBorder: 'border-purple-100',
          reportBtn: 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 font-bold',
        };
      case 'Tripod':
        return {
          cardBg: 'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50',
          topBar: 'bg-amber-600',
          iconWrapper: 'bg-amber-600 text-white shadow-sm ring-4 ring-amber-100',
          badgeClass: 'bg-amber-600 text-white border-amber-700 shadow-2xs',
          specBox: 'bg-white/85 border-amber-100/90 text-slate-700 shadow-2xs',
          specLabel: 'text-amber-800/70',
          titleHover: 'group-hover:text-amber-700',
          footerBorder: 'border-amber-100',
          reportBtn: 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 font-bold',
        };
    }
  };

  // Staff Emails & Directory State
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('All');
  const [copiedStaffEmail, setCopiedStaffEmail] = useState<string | null>(null);
  const staffFilterScrollRef = useRef<HTMLDivElement>(null);

  const scrollStaffFilters = (direction: 'left' | 'right') => {
    if (staffFilterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      staffFilterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopyStaffEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedStaffEmail(email);
    setTimeout(() => setCopiedStaffEmail(null), 2000);
  };

  const staffDepartments = useMemo(() => {
    const depts = new Set<string>(['All', ...ORGANIZATIONAL_DEPARTMENTS]);
    users.forEach((u) => {
      if (u.department && u.department.trim()) {
        depts.add(u.department.trim());
      }
    });
    return Array.from(depts);
  }, [users]);

  const filteredStaff = useMemo(() => {
    return users.filter((u) => {
      const term = staffSearchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term)) ||
        u.role.toLowerCase().includes(term);

      const matchDept = staffDeptFilter === 'All' || u.department === staffDeptFilter;
      return matchSearch && matchDept;
    });
  }, [users, staffSearchTerm, staffDeptFilter]);

  // Tickets for this employee
  const employeeTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchReporter =
        t.reporterName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim() ||
        t.reporterEmail.toLowerCase().trim() === selectedEmployeeEmail.toLowerCase().trim();

      if (!matchReporter) return false;

      if (ticketFilterStatus === 'Active') {
        return t.status !== 'Resolved' && t.status !== 'Closed';
      }
      if (ticketFilterStatus === 'Resolved') {
        return t.status === 'Resolved' || t.status === 'Closed';
      }
      return true;
    });
  }, [tickets, selectedEmployeeName, selectedEmployeeEmail, ticketFilterStatus]);

  // Open Form with Category or Device Reference
  const handleOpenFormWithCategory = (category: TicketCategory, defaultTitle?: string) => {
    setFormCategory(category);
    setFormTitle(defaultTitle || '');
    setFormDescription('');
    setFormPriority('Medium');
    setAiTip(null);
    setShowRequestForm(true);
    setSubmissionSuccess(null);
  };

  // AI Instant Deflection Check on Description
  const handleDescriptionChange = (text: string) => {
    setFormDescription(text);
    if (text.length > 15 && !aiTip) {
      const lower = text.toLowerCase();
      if (lower.includes('vpn') || lower.includes('wifi')) {
        setAiTip('Instant Tip: Try disconnecting & reconnecting to the GlobalProtect VPN client or flushing DNS cache.');
      } else if (lower.includes('password') || lower.includes('login') || lower.includes('okta')) {
        setAiTip('Instant Tip: You can self-service reset your password via the Okta / Azure AD portal.');
      } else if (lower.includes('screen') || lower.includes('freeze') || lower.includes('restart')) {
        setAiTip('Instant Tip: Try holding the laptop power button for 15 seconds to perform a full hardware power cycle.');
      }
    }
  };

  // Submit Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    setIsSubmitting(true);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `INC-${randNum}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      priority: formPriority,
      status: 'Open',
      tier: 'Tier 1 (Helpdesk)',
      assignedAgent: 'Unassigned',
      assignedTeam: 'Workplace Tech',
      reporterName: selectedEmployeeName,
      reporterEmail: selectedEmployeeEmail,
      reporterDepartment: selectedEmployeeDept,
      tags: [formCategory.toLowerCase(), 'employee-portal'],
      createdAt: nowIso,
      updatedAt: nowIso,
      comments: [
        {
          id: `comment-init-${Date.now()}`,
          authorName: selectedEmployeeName,
          authorEmail: selectedEmployeeEmail,
          authorRole: 'User',
          type: 'Public Reply',
          content: formDescription.trim(),
          timestamp: nowIso,
        },
      ],
    };

    onCreateTicket(newTicket);

    // Instant in-portal notification for the employee
    const newEmpNotif: EmployeeNotification = {
      id: `notif-create-${newTicket.id}`,
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      title: `Support Ticket ${newTicket.ticketNumber} Submitted`,
      message: `Your request "${newTicket.title}" was submitted and dispatched to the IT Support team.`,
      timestamp: nowIso,
      isRead: false,
      type: 'created',
    };
    setNotifications((prev) => [newEmpNotif, ...prev]);

    setIsSubmitting(false);
    setShowRequestForm(false);
    setSubmissionSuccess(`Support request ${newTicket.ticketNumber} created successfully! An automated email notification has been dispatched to the IT Support team.`);
    setActiveTab('tickets');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4">
            <div id="navbar-brand-logo" className="flex items-center gap-3.5">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/ilearn-cc226.firebasestorage.app/o/EWF%20Main.png?alt=media&token=3e05f629-7f10-44ba-a0a9-e901a63010c8"
                alt="EWF Logo"
                className="h-12 sm:h-14 md:h-16 max-h-16 w-auto object-contain drop-shadow-2xs transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="h-7 w-px bg-slate-200 hidden sm:block" />
              <span className="text-sm sm:text-base font-medium text-slate-900 tracking-tight hidden sm:block">
                Staff Support Portal
              </span>
            </div>
          </div>

          {/* Right Actions: Notifications Bell, Staff Profile, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown for Employee */}
            <div className="relative">
              <button
                id="employee-header-notifications-btn"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl border border-slate-200/90 transition-all cursor-pointer shadow-2xs"
                title="View ticket updates & notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {unreadNotificationCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsAsRead}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-1">
                          <Inbox className="w-6 h-6 mx-auto text-slate-300" />
                          <p className="text-xs font-medium text-slate-600">No notifications</p>
                          <p className="text-[11px] text-slate-400">Updates regarding your tickets will appear here.</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleOpenNotification(notif)}
                            className={`p-3.5 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-start gap-3 ${
                              notif.isRead ? 'bg-white' : 'bg-blue-50/30'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                                notif.type === 'status_changed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : notif.type === 'assigned'
                                  ? 'bg-blue-100 text-blue-700'
                                  : notif.type === 'comment_added'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {notif.type === 'status_changed' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : notif.type === 'assigned' ? (
                                <User className="w-3.5 h-3.5" />
                              ) : notif.type === 'comment_added' ? (
                                <MessageSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-xs truncate ${notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatTimeAgo(notif.timestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                              {notif.ticketNumber && notif.ticketNumber !== 'SYSTEM' && (
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                  <span>View Ticket {notif.ticketNumber}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          setActiveTab('notifications');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        View all notifications in portal →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 transition-all cursor-pointer text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {selectedEmployeeName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-900 block leading-tight truncate max-w-[120px]">
                    {selectedEmployeeName}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">{selectedEmployeeDept}</span>
                </div>
              </button>

              {/* User Profile Card Dropdown */}
              {showProfileSwitcher && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileSwitcher(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {selectedEmployeeName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{selectedEmployeeName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{selectedEmployeeEmail}</div>
                      </div>
                    </div>

                    <div className="space-y-2 px-1 py-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                        <span className="text-slate-400 text-[11px]">Role</span>
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {currentUser?.role || 'Employee'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                        <span className="text-slate-400 text-[11px]">Department</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{selectedEmployeeDept}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 py-1">
                        <span className="text-slate-400 text-[11px]">Account Status</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </div>
                    </div>

                    {(currentUser?.role === 'Admin' || currentUser?.role === 'IT Staff') && onSwitchToAdmin && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => {
                            setShowProfileSwitcher(false);
                            onSwitchToAdmin();
                          }}
                          className="w-full py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                        >
                          <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
                          <span>Switch to IT Staff Portal</span>
                        </button>
                      </div>
                    )}

                    {onLogout && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => {
                            setShowProfileSwitcher(false);
                            onLogout();
                          }}
                          className="w-full py-2 px-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-red-100"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Direct Sign Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of your account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-slate-200 hover:border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Success Alert Banner */}
        {submissionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{submissionSuccess}</span>
            </div>
            <button
              onClick={() => setSubmissionSuccess(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4 relative overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {selectedEmployeeName.split(' ')[0]}! How can IT Support help you today?
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Submit a new support ticket, track your existing requests in real-time, view your assigned electronic devices, or quickly access staff workplace portals.
          </p>

          {/* Quick Search */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search guides, solutions, portals, or ticket numbers..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Quick Staff Workplace Portals Launcher Strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Workplace Portals:
            </span>
            {WORKPLACE_PORTALS.map((portal) => (
              <a
                key={portal.id}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${portal.colorScheme.bg} ${portal.colorScheme.border} ${portal.colorScheme.text}`}
              >
                <span>{portal.name}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        </div>

        {/* Main Content Card with Solid White Background for Maximum Readability */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 lg:p-7 space-y-6 relative z-10">
          {/* Main Tab Navigation Bar with Horizontal Scrollbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            {/* Horizontal Scrollable Tabs Container */}
            <div className="w-full lg:flex-1 min-w-0">
              <nav 
                aria-label="Portal Tabs" 
                className="portal-tabs-scrollbar flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth"
              >
                <button
                  id="emp-tab-tickets"
                  onClick={() => setActiveTab('tickets')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'tickets'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'tickets' ? 'text-white' : 'text-blue-600'}`} />
                  <span>My Tickets ({employeeTickets.length})</span>
                </button>

                <button
                  id="emp-tab-devices"
                  onClick={() => setActiveTab('devices')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'devices'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <Laptop className={`w-4 h-4 shrink-0 ${activeTab === 'devices' ? 'text-white' : 'text-sky-600'}`} />
                  <span>My Devices ({categorizedDevices.length})</span>
                </button>

                <button
                  id="emp-tab-staff"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'staff'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'staff' ? 'text-white' : 'text-indigo-600'}`} />
                  <span>Staff Emails ({users.length})</span>
                </button>

                <button
                  id="emp-tab-portals"
                  onClick={() => setActiveTab('portals')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'portals'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <Globe className={`w-4 h-4 shrink-0 ${activeTab === 'portals' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Workplace Portals ({WORKPLACE_PORTALS.length})</span>
                </button>

                <button
                  id="emp-tab-guides"
                  onClick={() => setActiveTab('kb')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'kb'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'kb' ? 'text-white' : 'text-amber-600'}`} />
                  <span>Guides ({kbArticles.length})</span>
                </button>

                <button
                  id="emp-tab-notifications"
                  onClick={() => {
                    setActiveTab('notifications');
                    handleMarkAllNotificationsAsRead();
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'notifications'
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  <Bell className={`w-4 h-4 shrink-0 ${activeTab === 'notifications' ? 'text-white' : 'text-purple-600'}`} />
                  <span>Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-2xs">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* "+ Submit New Request" Button */}
            <div className="flex items-center shrink-0">
              <button
                id="emp-btn-new-request"
                onClick={() => handleOpenFormWithCategory('Keyboard or mouse not working')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Support Request</span>
              </button>
            </div>
          </div>

        {/* 1. My Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  My Support Tickets ({employeeTickets.length})
                </h2>
                <p className="text-xs text-slate-500">Live real-time status of tickets submitted by {selectedEmployeeName}</p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['All', 'Active', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ticketFilterStatus === st
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {employeeTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketForModal(ticket)}
                    className="p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {ticket.ticketNumber}
                        </span>
                        <CategoryBadge category={ticket.category} showIcon={false} />
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <h4 className="font-normal text-sm text-slate-900 hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 text-xs text-slate-600 shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Specialist</span>
                        <strong className="text-slate-800 text-xs">{ticket.assignedAgent}</strong>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Updated</span>
                        <strong className="text-slate-800 text-xs">{formatTimeAgo(ticket.updatedAt)}</strong>
                      </div>

                      <button className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer transition-all">
                        View & Reply ({ticket.comments.length})
                      </button>
                    </div>
                  </div>
                ))}

                {employeeTickets.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">No support tickets found for this filter</p>
                    <button
                      onClick={() => handleOpenFormWithCategory('Software')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Submit a New Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. My Issued Devices Tab (Categorized individual device & peripheral view) */}
        {activeTab === 'devices' && !showRequestForm && (
          <div className="space-y-4">
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <span>My Assigned Devices & Accessories</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-2xs">
                    {categorizedDevices.length} Total {categorizedDevices.length === 1 ? 'Device' : 'Devices'}
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Itemized hardware, mobile phones, and peripherals registered strictly under <strong className="text-slate-900">{selectedEmployeeName}</strong>
                </p>
              </div>

              {/* Categorized Filter Pills */}
              {categorizedDevices.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap bg-white/80 p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <button
                    onClick={() => setDeviceTypeFilter('All')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      deviceTypeFilter === 'All'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({categorizedDevices.length})
                  </button>

                  {['Laptop', 'Phone', 'Mouse', 'Lapel Mic', 'Tripod'].map((typeKey) => {
                    const count = categorizedDevices.filter(d => d.type === typeKey).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={typeKey}
                        onClick={() => setDeviceTypeFilter(typeKey as any)}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          deviceTypeFilter === typeKey
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {typeKey === 'Laptop' && <Laptop className="w-3.5 h-3.5" />}
                        {typeKey === 'Phone' && <Smartphone className="w-3.5 h-3.5" />}
                        {typeKey === 'Mouse' && <Mouse className="w-3.5 h-3.5" />}
                        {typeKey === 'Lapel Mic' && <Mic className="w-3.5 h-3.5" />}
                        {typeKey === 'Tripod' && <Camera className="w-3.5 h-3.5" />}
                        <span>{typeKey} ({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Summary Grid of Issued Hardware Categories with Full Vibrant Background Colors */}
            {categorizedDevices.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  {
                    type: 'Laptop',
                    label: 'Laptops',
                    count: categorizedDevices.filter(d => d.type === 'Laptop').length,
                    icon: Laptop,
                    cardBg: 'bg-gradient-to-br from-blue-600 to-sky-700 border-blue-700 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-sky-800 hover:shadow-lg',
                    iconBg: 'bg-white/20 text-white shadow-xs backdrop-blur-xs',
                    countColor: 'text-white font-black',
                    labelColor: 'text-blue-100 font-bold',
                    activeStyle: 'ring-4 ring-offset-2 ring-blue-500 scale-[1.02] shadow-lg',
                  },
                  {
                    type: 'Phone',
                    label: 'Phones & SIMs',
                    count: categorizedDevices.filter(d => d.type === 'Phone').length,
                    icon: Smartphone,
                    cardBg: 'bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-800 hover:shadow-lg',
                    iconBg: 'bg-white/20 text-white shadow-xs backdrop-blur-xs',
                    countColor: 'text-white font-black',
                    labelColor: 'text-indigo-100 font-bold',
                    activeStyle: 'ring-4 ring-offset-2 ring-indigo-500 scale-[1.02] shadow-lg',
                  },
                  {
                    type: 'Mouse',
                    label: 'Mice',
                    count: categorizedDevices.filter(d => d.type === 'Mouse').length,
                    icon: Mouse,
                    cardBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-700 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg',
                    iconBg: 'bg-white/20 text-white shadow-xs backdrop-blur-xs',
                    countColor: 'text-white font-black',
                    labelColor: 'text-emerald-100 font-bold',
                    activeStyle: 'ring-4 ring-offset-2 ring-emerald-500 scale-[1.02] shadow-lg',
                  },
                  {
                    type: 'Lapel Mic',
                    label: 'Lapel Mics',
                    count: categorizedDevices.filter(d => d.type === 'Lapel Mic').length,
                    icon: Mic,
                    cardBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-700 border-purple-700 text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-fuchsia-800 hover:shadow-lg',
                    iconBg: 'bg-white/20 text-white shadow-xs backdrop-blur-xs',
                    countColor: 'text-white font-black',
                    labelColor: 'text-purple-100 font-bold',
                    activeStyle: 'ring-4 ring-offset-2 ring-purple-500 scale-[1.02] shadow-lg',
                  },
                  {
                    type: 'Tripod',
                    label: 'Tripods',
                    count: categorizedDevices.filter(d => d.type === 'Tripod').length,
                    icon: Camera,
                    cardBg: 'bg-gradient-to-br from-amber-600 to-orange-700 border-amber-700 text-white shadow-md shadow-amber-500/20 hover:from-amber-700 hover:to-orange-800 hover:shadow-lg',
                    iconBg: 'bg-white/20 text-white shadow-xs backdrop-blur-xs',
                    countColor: 'text-white font-black',
                    labelColor: 'text-amber-100 font-bold',
                    activeStyle: 'ring-4 ring-offset-2 ring-amber-500 scale-[1.02] shadow-lg',
                  },
                ].map((cat) => (
                  <div
                    key={cat.type}
                    onClick={() => setDeviceTypeFilter(deviceTypeFilter === cat.type ? 'All' : cat.type as any)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center sm:text-left flex items-center gap-3 ${
                      cat.count > 0 ? cat.cardBg : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                    } ${deviceTypeFilter === cat.type ? cat.activeStyle : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-base ${cat.countColor}`}>{cat.count}</div>
                      <div className={`text-[11px] truncate ${cat.labelColor}`}>{cat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Categorized Devices Grid with Tailored Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategorizedDevices.map((item) => {
                const theme = getDeviceTheme(item.type);
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 shadow-xs border transition-all flex flex-col justify-between group ${theme.cardBg}`}
                  >
                    <div className="space-y-3.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconWrapper}`}>
                            {item.type === 'Laptop' && <Laptop className="w-5 h-5" />}
                            {item.type === 'Phone' && <Smartphone className="w-5 h-5" />}
                            {item.type === 'Mouse' && <Mouse className="w-5 h-5" />}
                            {item.type === 'Lapel Mic' && <Mic className="w-5 h-5" />}
                            {item.type === 'Tripod' && <Camera className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide mb-1 ${theme.badgeClass}`}
                            >
                              {item.type}
                            </span>
                            <h3 className={`font-bold text-sm text-slate-900 truncate leading-snug transition-colors ${theme.titleHover}`}>
                              {item.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Meta Specs & Status */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${theme.specBox}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-semibold ${theme.specLabel}`}>Identifier / Spec</span>
                          <span className="font-bold text-slate-900 font-mono text-[11px] truncate max-w-[170px]" title={item.modelOrSerial}>
                            {item.modelOrSerial}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-semibold ${theme.specLabel}`}>Condition / Note</span>
                          <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px]" title={item.conditionOrDetails}>
                            {item.conditionOrDetails}
                          </span>
                        </div>

                        {item.additionalInfo && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
                            <span className={`text-[11px] font-semibold ${theme.specLabel}`}>Asset Value</span>
                            <span className="font-extrabold text-emerald-700 text-[11px]">
                              {item.additionalInfo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`pt-3.5 mt-3.5 border-t flex items-center justify-between gap-2 ${theme.footerBorder}`}>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Assigned to you
                      </span>

                      <button
                        onClick={() => handleOpenFormWithCategory(item.reportCategory, item.reportDefaultSubject)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${theme.reportBtn}`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Report Issue</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCategorizedDevices.length === 0 && categorizedDevices.length > 0 && (
                <div className="col-span-full p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    No {deviceTypeFilter} devices found in your inventory.
                  </p>
                  <button
                    onClick={() => setDeviceTypeFilter('All')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer hover:bg-blue-700"
                  >
                    View all {categorizedDevices.length} devices
                  </button>
                </div>
              )}

              {categorizedDevices.length === 0 && (
                <div className="col-span-full p-10 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
                  <Laptop className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    No hardware assets or peripherals registered under {selectedEmployeeName}.
                  </p>
                  <p className="text-xs text-slate-400">
                    If you have received equipment that is not listed, please submit a ticket under "Equipment Request".
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Staff Emails & Colleague Directory Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Header & Search Banner */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Staff Email Directory</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-2xs">
                        {users.length} Colleague{users.length === 1 ? '' : 's'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Find workplace email addresses and departments for all colleagues across Elimisha Watoto Foundation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or dept..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                />
                {staffSearchTerm && (
                  <button
                    onClick={() => setStaffSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Department Filter Pills with Horizontal Scroll & Navigation Controls */}
            <div className="relative flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => scrollStaffFilters('left')}
                className="hidden sm:flex p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs transition-all shrink-0 cursor-pointer"
                title="Scroll departments left"
                aria-label="Scroll departments left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={staffFilterScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 w-full"
                style={{ scrollbarWidth: 'thin' }}
              >
                {staffDepartments.map((dept) => {
                  const count = dept === 'All' ? users.length : users.filter(u => u.department === dept).length;
                  return (
                    <button
                      key={dept}
                      onClick={() => setStaffDeptFilter(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        staffDeptFilter === dept
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span>{dept}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                          staffDeptFilter === dept ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollStaffFilters('right')}
                className="hidden sm:flex p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs transition-all shrink-0 cursor-pointer"
                title="Scroll departments right"
                aria-label="Scroll departments right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((user) => {
                const isCurrentUser = user.email.toLowerCase() === selectedEmployeeEmail.toLowerCase();
                const isCopied = copiedStaffEmail === user.email;

                // Initials
                const initials = user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={user.id}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between hover:shadow-md ${
                      isCurrentUser
                        ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* User Top Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {user.name}
                              </h3>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-600 text-white uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{user.department || 'Elimisha Foundation'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email container box */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/90 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs font-bold text-slate-900 truncate select-all" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar: Copy Email */}
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleCopyStaffEmail(user.email)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredStaff.length === 0 && (
                <div className="col-span-full p-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 space-y-3">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No staff members found matching "{staffSearchTerm}"</p>
                  <p className="text-xs text-slate-400">Try searching by a different name, department, or clearing your filter.</p>
                  <button
                    onClick={() => {
                      setStaffSearchTerm('');
                      setStaffDeptFilter('All');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer hover:bg-blue-700"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Staff Workplace Portals & Services Tab */}
        {activeTab === 'portals' && (
          <WorkplacePortalsHub
            onOpenPortal={(portalUrl) => {
              if (portalUrl === '/' || portalUrl === '/admin') {
                if (onSwitchToAdmin) {
                  onSwitchToAdmin();
                }
              }
            }}
            onRequestHelpWithPortal={(portalName, portalUrl) => {
              setFormCategory('Software (App errors, Activation Keys)');
              setFormTitle(`Issue accessing ${portalName} (${portalUrl})`);
              setFormDescription(`I am encountering an issue when attempting to sign into / access ${portalName} at ${portalUrl}.`);
              setFormPriority('Medium');
              setShowRequestForm(true);
            }}
          />
        )}

        {/* 4. Self-Help Knowledge Base Tab */}
        {activeTab === 'kb' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Self-Help Knowledge Base & Guides
                </h2>
                <p className="text-xs text-slate-500">
                  Step-by-step troubleshooting articles and official IT procedures. Click any guide to view full instructions.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', 'Network & VPN', 'Access & IAM', 'Hardware', 'Software'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setKbCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      kbCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            {(() => {
              const filteredArticles = kbArticles.filter((a) => {
                const matchesCategory = kbCategoryFilter === 'All' ? true : a.category === kbCategoryFilter;
                const query = globalSearch.trim().toLowerCase();
                const matchesSearch = query
                  ? a.title.toLowerCase().includes(query) ||
                    a.summary.toLowerCase().includes(query) ||
                    (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(query))) ||
                    (a.symptoms && a.symptoms.some((s) => s.toLowerCase().includes(query)))
                  : true;
                return matchesCategory && matchesSearch;
              });

              if (filteredArticles.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No matching self-help guides found</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Try adjusting your category filter or search keywords, or submit a support request directly to our IT desk.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setKbCategoryFilter('All');
                          setGlobalSearch('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reset Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        Submit Support Ticket
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      id={`emp-kb-article-${article.id}`}
                      onClick={() => setSelectedArticleForModal(article)}
                      className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between cursor-pointer transition-all group"
                      title="Click to read full troubleshooting guide"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <CategoryBadge category={article.category} />
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-slate-400" />
                              {article.views} views
                            </span>
                            <span>•</span>
                            <span>{formatTimeAgo(article.createdAt)}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{article.summary}</p>

                        {/* Resolution Steps Preview */}
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Key Resolution Steps ({article.resolutionSteps.length}):
                          </span>
                          <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                            {article.resolutionSteps.slice(0, 3).map((step, idx) => (
                              <li key={idx} className="line-clamp-1">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Authored by <strong className="text-slate-600">{article.author}</strong>
                        </span>
                        <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                          Read full guide <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Your Support Notifications & Updates
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time ticket confirmations, agent assignments, and resolution alerts for {selectedEmployeeName}
                </p>
              </div>

              {unreadNotificationCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you submit a support ticket or an IT specialist updates your issue, you will receive alerts here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenNotification(notif)}
                    className={`p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-4 ${
                      notif.isRead ? 'bg-white' : 'bg-blue-50/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        notif.type === 'status_changed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : notif.type === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : notif.type === 'comment_added'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {notif.type === 'status_changed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : notif.type === 'assigned' ? (
                        <User className="w-4 h-4" />
                      ) : notif.type === 'comment_added' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.ticketNumber && notif.ticketNumber !== 'SYSTEM' && (
                        <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <span>Open Ticket {notif.ticketNumber} Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        </section>
      </main>

      {/* Support Request Popup Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Submit IT Support Request</h2>
                  <p className="text-xs text-slate-500">An incident ticket will be created and dispatched to IT support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1 text-xs">
              {/* Live AI Instant Deflection Hint */}
              {aiTip && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 animate-in fade-in">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="block font-semibold text-amber-900 mb-0.5">Quick Self-Service Suggestion:</strong>
                    <span>{aiTip}</span>
                  </div>
                </div>
              )}

              {/* Category & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="font-semibold text-slate-700 block mb-1">Issue Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white cursor-pointer truncate"
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

                <div className="min-w-0">
                  <label className="font-semibold text-slate-700 block mb-1">Urgency / Impact *</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white cursor-pointer truncate"
                  >
                    <option value="Low">Low - General inquiry / minor request</option>
                    <option value="Medium">Medium - Standard issue (Work can continue)</option>
                    <option value="High">High - Significant disruption / Blocked from work</option>
                    <option value="Critical">Critical - Complete outage / Work blocked</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Incident Summary / Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mouse cursor freezing intermittently or unable to access Outlook"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Please describe what happened, any error messages, and what you were trying to do..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Submitting info banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                Submitting as <strong className="text-slate-800 font-semibold">{selectedEmployeeName}</strong> ({selectedEmployeeEmail})
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formTitle.trim() || !formDescription.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Ticket Details Modal */}
      {selectedTicketForModal && (
        <EmployeeTicketModal
          ticket={selectedTicketForModal}
          assets={assets}
          onClose={() => setSelectedTicketForModal(null)}
          onAddComment={onAddComment}
        />
      )}

      {/* Employee Knowledge Base Article Reader Modal */}
      {selectedArticleForModal && (
        <div
          id="emp-kb-article-reader-backdrop"
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticleForModal(null);
          }}
        >
          <div
            id="emp-kb-article-reader-modal"
            className="bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar - Sticky & Pinned */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <CategoryBadge category={selectedArticleForModal.category} />
                <span className="text-xs text-slate-500 font-medium truncate">
                  Authored by <strong className="text-slate-700">{selectedArticleForModal.author}</strong>
                </span>
                <span className="text-xs text-slate-400">• {formatTimeAgo(selectedArticleForModal.createdAt)}</span>
              </div>
              <button
                id="close-emp-kb-article-btn"
                type="button"
                onClick={() => setSelectedArticleForModal(null)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shrink-0 flex items-center justify-center shadow-2xs"
                title="Close article (Esc)"
                aria-label="Close article dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Content - Smooth Internal Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs min-h-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                  {selectedArticleForModal.title}
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedArticleForModal.summary}
                </p>
              </div>

              {/* Symptoms */}
              {selectedArticleForModal.symptoms && selectedArticleForModal.symptoms.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Observed Symptoms & Indicators:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticleForModal.symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Root Cause Analysis */}
              {selectedArticleForModal.rootCause && (
                <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700">Root Cause / Technical Context:</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedArticleForModal.rootCause}</p>
                </div>
              )}

              {/* Step-by-Step Resolution Steps */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Step-by-Step Resolution Procedure:
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {selectedArticleForModal.resolutionSteps.length} step(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedArticleForModal.resolutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-slate-800 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyStep(step, idx)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer transition-colors shadow-2xs"
                        title="Copy step to clipboard"
                        aria-label="Copy step"
                      >
                        {copiedStepIdx === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention / Best Practices */}
              {selectedArticleForModal.prevention && (
                <div className="space-y-1 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 text-emerald-950">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Prevention & Best Practices:
                  </h4>
                  <p className="leading-relaxed text-[11px] text-emerald-900/90">
                    {selectedArticleForModal.prevention}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-3.5 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shrink-0 sticky bottom-0 z-20">
              <span className="text-slate-500 text-center sm:text-left">
                Did this guide resolve your issue?
              </span>
              <div className="flex items-center justify-end gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const article = selectedArticleForModal;
                    setSelectedArticleForModal(null);
                    setFormCategory(article.category);
                    setFormTitle(`Follow-up assistance regarding: ${article.title}`);
                    setFormDescription(`I followed the guide "${article.title}" but I am still having trouble.`);
                    setFormPriority('Medium');
                    setShowRequestForm(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-all"
                >
                  Still stuck? Submit Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpvoteKBArticle) {
                      onUpvoteKBArticle(selectedArticleForModal.id);
                    }
                    setSelectedArticleForModal((prev) =>
                      prev ? { ...prev, helpfulVotes: (prev.helpfulVotes || 0) + 1 } : null
                    );
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({selectedArticleForModal.helpfulVotes || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedArticleForModal(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
