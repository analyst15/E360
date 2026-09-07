import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, UserStatus, Ticket, ORGANIZATIONAL_DEPARTMENTS } from '../types';
import {
  Search,
  UserCheck,
  Plus,
  Users,
  Headphones,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Shield,
  Ticket as TicketIcon,
  Eye,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Laptop,
  Smartphone,
} from 'lucide-react';

interface UsersViewProps {
  users: UserAccount[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onAddUser?: (user: Omit<UserAccount, 'id' | 'dateAdded'>) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onOpenCreateTicketForUser?: (userName: string, userEmail: string, department: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  tickets,
  onSelectTicket,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onOpenCreateTicketForUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Employee' | 'IT Staff' | 'Admin'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Responsive Device & Pagination State: 5 per page on laptop (>=1024px), 10 on small devices (<1024px)
  const [isLaptopOrDesktop, setIsLaptopOrDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLaptopOrDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageSize = isLaptopOrDesktop ? 5 : 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<UserAccount | null>(null);
  const [viewingTicketsUser, setViewingTicketsUser] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    department: string;
    status: UserStatus;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Secondary',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');

  // Calculate stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const itStaffCount = users.filter(u => u.role === 'IT Staff' || u.role === 'Admin').length;
  const departmentCount = new Set(users.map(u => u.department)).size;

  // Filter users list
  const filteredUsers = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    return true;
  });

  // Reset page when filters, search query, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  // Pagination calculation: 5 per page on laptop (>=1024px), 10 on small devices (<1024px)
  const totalFilteredCount = filteredUsers.length;
  const isPaginationThresholdHit = isLaptopOrDesktop
    ? totalFilteredCount >= 5
    : totalFilteredCount >= 10;

  const totalPages = isPaginationThresholdHit ? Math.max(1, Math.ceil(totalFilteredCount / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isPaginationThresholdHit ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = isPaginationThresholdHit ? Math.min(startIndex + pageSize, totalFilteredCount) : totalFilteredCount;
  const displayedUsers = isPaginationThresholdHit ? filteredUsers.slice(startIndex, endIndex) : filteredUsers;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'employee123',
      role: 'Employee',
      department: 'Secondary',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || (user.role === 'Admin' ? 'admin123' : user.role === 'IT Staff' ? 'staff123' : 'employee123'),
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter a user name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.department.trim()) {
      setFormError('Please enter a department.');
      return;
    }
    if (formData.password && formData.password.trim().length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    const defaultPw = formData.role === 'Admin' ? 'admin123' : formData.role === 'IT Staff' ? 'staff123' : 'employee123';
    const finalPassword = formData.password?.trim() || defaultPw;

    if (editingUser && onUpdateUser) {
      onUpdateUser({
        ...editingUser,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: finalPassword,
        role: formData.role,
        department: formData.department.trim(),
        status: formData.status,
      });
    } else if (onAddUser) {
      onAddUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: finalPassword,
        role: formData.role,
        department: formData.department.trim(),
        status: formData.status,
      });
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      if (onDeleteUser) {
        onDeleteUser(deleteCandidate.id);
      }
      setDeleteCandidate(null);
    }
  };

  // Helper to count tickets for a user
  const getUserTickets = (user: UserAccount) => {
    return tickets.filter(
      t =>
        (t.requesterEmail && t.requesterEmail.toLowerCase() === user.email.toLowerCase()) ||
        (t.requesterName && t.requesterName.toLowerCase() === user.name.toLowerCase()) ||
        (t.assignee && t.assignee.toLowerCase() === user.name.toLowerCase())
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Staff Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage user accounts, roles, departments, and access permissions</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => {
            setRoleFilter('All');
            setStatusFilter('All');
          }}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'All' && statusFilter === 'All'
              ? 'border-blue-500/40 ring-2 ring-blue-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalUsersCount}</span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Across {departmentCount} departments</p>
        </div>

        {/* Active Users */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Active'
              ? 'border-emerald-500/40 ring-2 ring-emerald-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeUsersCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {Math.round((activeUsersCount / (totalUsersCount || 1)) * 100)}% active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Operational status</p>
        </div>

        {/* Employees */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'Employee' ? 'All' : 'Employee')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'Employee'
              ? 'border-indigo-500/40 ring-2 ring-indigo-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {users.filter(u => u.role === 'Employee').length}
            </span>
            <span className="text-xs text-indigo-600 font-medium">Staff Members</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Submitters & Requestors</p>
        </div>

        {/* IT Staff & Admins */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'IT Staff' ? 'All' : 'IT Staff')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'IT Staff'
              ? 'border-purple-500/40 ring-2 ring-purple-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IT Staff & Admin</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{itStaffCount}</span>
            <span className="text-xs text-purple-600 font-medium">Technicians</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Helpdesk & Administrators</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, department, or role..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            {(['All', 'Employee', 'IT Staff', 'Admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  roleFilter === role
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            {(['All', 'Active', 'Inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  NAME & ROLE
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  EMAIL & DEPT
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TICKETS
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  DATE ADDED
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-700">No users found matching current filters.</p>
                      <p className="text-slate-400 text-[11px]">Try adjusting your search criteria or add a new user.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedUsers.map(user => {
                  const userTickets = getUserTickets(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Role */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900">{user.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {user.role === 'Admin' && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                  Admin
                                </span>
                              )}
                              {user.role === 'IT Staff' && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  IT Staff
                                </span>
                              )}
                              {user.role === 'Employee' && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  Employee
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Dept */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800">{user.email}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{user.department}</div>
                      </td>

                      {/* Tickets */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {userTickets.length > 0 ? (
                          <button
                            onClick={() => setViewingTicketsUser(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <TicketIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>{userTickets.length} ticket{userTickets.length > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">0 tickets</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {user.status === 'Active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-5 text-xs text-slate-600 whitespace-nowrap font-mono">
                        {user.dateAdded}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {onOpenCreateTicketForUser && (
                            <button
                              onClick={() => onOpenCreateTicketForUser(user.name, user.email, user.department)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Create Support Ticket for User"
                            >
                              <TicketIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(user)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Responsive Pagination */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Range & Device indicator */}
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            {totalFilteredCount > 0 ? (
              <span>
                Showing <strong className="text-slate-800 font-semibold">{isPaginationThresholdHit ? startIndex + 1 : 1}</strong> to{' '}
                <strong className="text-slate-800 font-semibold">{isPaginationThresholdHit ? endIndex : totalFilteredCount}</strong> of{' '}
                <strong className="text-slate-800 font-semibold">{totalFilteredCount}</strong> {totalFilteredCount === 1 ? 'user' : 'users'}
                {totalFilteredCount !== users.length && ` (filtered from ${users.length})`}
              </span>
            ) : (
              <span>No users to display</span>
            )}

            {/* Device Page Size Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 text-[11px] font-medium text-slate-700">
              {isLaptopOrDesktop ? (
                <>
                  <Laptop className="w-3 h-3 text-slate-600" />
                  <span>5 / page (Laptop view)</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3 text-slate-600" />
                  <span>10 / page (Small device view)</span>
                </>
              )}
            </span>
          </div>

          {/* Pagination Controls (active when threshold hit) */}
          {isPaginationThresholdHit && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => {
                  if (typeof page === 'string') {
                    return (
                      <span key={`dots-${idx}`} className="px-1.5 py-1 text-slate-400 text-xs select-none">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = page === safeCurrentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure employee details, role permissions, and sign-in credentials
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sarah.chen@elimishawatoto.org"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="IT Staff">IT Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white"
                    required
                  >
                    {/* Preserve custom legacy department if editing */}
                    {formData.department && !ORGANIZATIONAL_DEPARTMENTS.includes(formData.department as any) && (
                      <option value={formData.department}>{formData.department} (Current)</option>
                    )}
                    {ORGANIZATIONAL_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. employee123"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Default login passwords: Admin (<code className="text-purple-600 font-bold font-mono">admin123</code>), IT Staff (<code className="text-blue-600 font-bold font-mono">staff123</code>), Employee (<code className="text-slate-700 font-bold font-mono">employee123</code>).
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User's Tickets Modal */}
      {viewingTicketsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tickets related to {viewingTicketsUser.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingTicketsUser.email} · {viewingTicketsUser.department}
                </p>
              </div>
              <button
                onClick={() => setViewingTicketsUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-3">
              {getUserTickets(viewingTicketsUser).map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setViewingTicketsUser(null);
                    onSelectTicket(ticket);
                  }}
                  className="p-3 bg-slate-50/70 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{ticket.id}</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{ticket.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Priority: <strong className="text-slate-700">{ticket.priority}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className="text-slate-700">{ticket.status}</strong></span>
                      <span>•</span>
                      <span>Assignee: <strong className="text-slate-700">{ticket.assignee || 'Unassigned'}</strong></span>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors shrink-0">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 leading-relaxed">
              Are you sure you want to delete user account <strong className="text-slate-900">{deleteCandidate.name}</strong> ({deleteCandidate.email})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
