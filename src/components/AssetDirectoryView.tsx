import React, { useState, useEffect } from 'react';
import { ITAsset, Ticket, UserAccount, ORGANIZATIONAL_DEPARTMENTS } from '../types';
import {
  Laptop,
  Smartphone,
  Mouse,
  Mic,
  Video,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Phone,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface AssetDirectoryViewProps {
  assets: ITAsset[];
  users?: UserAccount[];
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  onAddAsset?: (asset: Omit<ITAsset, 'id' | 'dateAdded'>) => void;
  onUpdateAsset?: (asset: ITAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  onOpenCreateTicketForAsset?: (assetTag: string) => void;
}

// Helpers for KES currency and Kenyan +254 phone number formatting
export const formatKESCurrency = (val: string): string => {
  if (!val || !val.trim()) return '';
  const trimmed = val.trim();
  if (trimmed === 'KES' || trimmed === 'KSh' || trimmed === 'KES ' || trimmed === 'KSh ') return 'KES ';
  const numPart = trimmed.replace(/^(KES|KSh|ksh|kes|\$|USD)?\s*/i, '').trim();
  if (!numPart) return 'KES ';
  return `KES ${numPart}`;
};

export const cleanKESForSaving = (val: string): string => {
  const trimmed = (val || '').trim();
  if (!trimmed || trimmed === 'KES' || trimmed === 'KSh' || trimmed === 'KES ' || trimmed === 'KSh ') return '';
  return formatKESCurrency(trimmed);
};

export const formatKenyanPhone = (val: string): string => {
  if (!val || !val.trim()) return '';
  const trimmed = val.trim();
  if (trimmed === '+' || trimmed === '+254' || trimmed === '+254 ') return '+254 ';
  
  // If starts with 07xx or 01xx
  if (/^0[17]\d*/.test(trimmed)) {
    return `+254 ${trimmed.slice(1)}`;
  }
  // If starts with 254
  if (/^254\d*/.test(trimmed)) {
    return `+${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
  }
  // If already starts with +254
  if (trimmed.startsWith('+254')) {
    const rest = trimmed.slice(4).trim();
    return rest ? `+254 ${rest}` : '+254 ';
  }
  // If starts with 7 or 1
  if (/^[17]\d*/.test(trimmed)) {
    return `+254 ${trimmed}`;
  }
  return `+254 ${trimmed.replace(/^\+?\d{0,3}\s*/, '')}`;
};

export const cleanPhoneForSaving = (val: string): string => {
  const trimmed = (val || '').trim();
  if (!trimmed || trimmed === '+' || trimmed === '+254' || trimmed === '+254 ') return '';
  return formatKenyanPhone(trimmed);
};

export const AssetDirectoryView: React.FC<AssetDirectoryViewProps> = ({
  assets,
  users = [],
  tickets,
  onSelectTicket,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onOpenCreateTicketForAsset,
}) => {
  const [search, setSearch] = useState('');
  const [peripheralFilter, setPeripheralFilter] = useState<'All' | 'Mouse' | 'Tripod' | 'Mic'>('All');

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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ITAsset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<ITAsset | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ITAsset | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    employeeName: string;
    department: string;
    laptopModel: string;
    laptopPrice: string;
    laptopSerialNumber: string;
    laptopConditionComments: string;
    issuedWithMouse: 'Yes' | 'No';
    issuedWithTripod: 'Yes' | 'No';
    issuedWithMic: 'Yes' | 'No';
    phoneModel: string;
    phonePrice: string;
    safaricomPhoneNumber: string;
    airtelPhoneNumber: string;
    phoneConditionComments: string;
  }>({
    employeeName: '',
    department: '',
    laptopModel: '',
    laptopPrice: '',
    laptopSerialNumber: '',
    laptopConditionComments: '',
    issuedWithMouse: 'Yes',
    issuedWithTripod: 'No',
    issuedWithMic: 'No',
    phoneModel: '',
    phonePrice: '',
    safaricomPhoneNumber: '',
    airtelPhoneNumber: '',
    phoneConditionComments: '',
  });

  const [formError, setFormError] = useState('');

  // Filtering
  const filteredAssets = assets.filter(asset => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        asset.employeeName.toLowerCase().includes(q) ||
        asset.laptopModel.toLowerCase().includes(q) ||
        asset.laptopSerialNumber.toLowerCase().includes(q) ||
        asset.phoneModel.toLowerCase().includes(q) ||
        asset.safaricomPhoneNumber.toLowerCase().includes(q) ||
        asset.airtelPhoneNumber.toLowerCase().includes(q) ||
        (asset.department && asset.department.toLowerCase().includes(q)) ||
        asset.laptopConditionComments.toLowerCase().includes(q) ||
        asset.phoneConditionComments.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (peripheralFilter === 'Mouse' && asset.issuedWithMouse !== 'Yes') return false;
    if (peripheralFilter === 'Tripod' && asset.issuedWithTripod !== 'Yes') return false;
    if (peripheralFilter === 'Mic' && asset.issuedWithMic !== 'Yes') return false;

    return true;
  });

  // Reset page when filters, search query, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, peripheralFilter, pageSize]);

  // Pagination calculation: 5 per page on laptop (>=1024px), 10 on small devices (<1024px)
  const totalFilteredCount = filteredAssets.length;
  const isPaginationThresholdHit = isLaptopOrDesktop
    ? totalFilteredCount >= 5
    : totalFilteredCount >= 10;

  const totalPages = isPaginationThresholdHit ? Math.max(1, Math.ceil(totalFilteredCount / pageSize)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isPaginationThresholdHit ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = isPaginationThresholdHit ? Math.min(startIndex + pageSize, totalFilteredCount) : totalFilteredCount;
  const displayedAssets = isPaginationThresholdHit ? filteredAssets.slice(startIndex, endIndex) : filteredAssets;

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

  // Calculate summary counts
  const totalEmployees = assets.length;
  const miceIssued = assets.filter(a => a.issuedWithMouse === 'Yes').length;
  const tripodsIssued = assets.filter(a => a.issuedWithTripod === 'Yes').length;
  const micsIssued = assets.filter(a => a.issuedWithMic === 'Yes').length;

  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setFormData({
      employeeName: '',
      department: 'Secondary',
      laptopModel: '',
      laptopPrice: 'KES ',
      laptopSerialNumber: '',
      laptopConditionComments: '',
      issuedWithMouse: 'Yes',
      issuedWithTripod: 'No',
      issuedWithMic: 'No',
      phoneModel: '',
      phonePrice: 'KES ',
      safaricomPhoneNumber: '+254 ',
      airtelPhoneNumber: '+254 ',
      phoneConditionComments: '',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (asset: ITAsset) => {
    setEditingAsset(asset);
    setFormData({
      employeeName: asset.employeeName,
      department: asset.department || '',
      laptopModel: asset.laptopModel,
      laptopPrice: asset.laptopPrice ? formatKESCurrency(asset.laptopPrice) : 'KES ',
      laptopSerialNumber: asset.laptopSerialNumber,
      laptopConditionComments: asset.laptopConditionComments,
      issuedWithMouse: asset.issuedWithMouse,
      issuedWithTripod: asset.issuedWithTripod,
      issuedWithMic: asset.issuedWithMic,
      phoneModel: asset.phoneModel,
      phonePrice: asset.phonePrice ? formatKESCurrency(asset.phonePrice) : 'KES ',
      safaricomPhoneNumber: asset.safaricomPhoneNumber ? formatKenyanPhone(asset.safaricomPhoneNumber) : '+254 ',
      airtelPhoneNumber: asset.airtelPhoneNumber ? formatKenyanPhone(asset.airtelPhoneNumber) : '+254 ',
      phoneConditionComments: asset.phoneConditionComments,
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName.trim()) {
      setFormError('Please enter the employee name.');
      return;
    }
    if (!formData.laptopModel.trim()) {
      setFormError('Please specify the laptop model.');
      return;
    }
    if (!formData.laptopSerialNumber.trim()) {
      setFormError('Please provide the laptop serial number.');
      return;
    }

    const cleanedPayload = {
      ...formData,
      laptopPrice: cleanKESForSaving(formData.laptopPrice),
      phonePrice: cleanKESForSaving(formData.phonePrice),
      safaricomPhoneNumber: cleanPhoneForSaving(formData.safaricomPhoneNumber),
      airtelPhoneNumber: cleanPhoneForSaving(formData.airtelPhoneNumber),
    };

    if (editingAsset && onUpdateAsset) {
      onUpdateAsset({
        ...editingAsset,
        ...cleanedPayload,
      });
    } else if (onAddAsset) {
      onAddAsset(cleanedPayload);
    }

    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDeleteAsset) {
      onDeleteAsset(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee Name',
      'Department',
      'Laptop Model',
      'Laptop Price',
      'Laptop Serial Number',
      'Laptop Condition Comments',
      'Issued with Mouse',
      'Issued with Tripod',
      'Issued with Mic',
      'Phone Model',
      'Phone Price',
      'Safaricom Phone Number',
      'Airtel Phone Number',
      'Phone Condition Comments',
    ];

    const rows = assets.map(a => [
      `"${a.employeeName || ''}"`,
      `"${a.department || ''}"`,
      `"${a.laptopModel || ''}"`,
      `"${a.laptopPrice || ''}"`,
      `"${a.laptopSerialNumber || ''}"`,
      `"${(a.laptopConditionComments || '').replace(/"/g, '""')}"`,
      `"${a.issuedWithMouse}"`,
      `"${a.issuedWithTripod}"`,
      `"${a.issuedWithMic}"`,
      `"${a.phoneModel || ''}"`,
      `"${a.phonePrice || ''}"`,
      `"${a.safaricomPhoneNumber || ''}"`,
      `"${a.airtelPhoneNumber || ''}"`,
      `"${(a.phoneConditionComments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Electronic_Device_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            Staff Electronic Device Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Capture and manage electronic equipment in possession of staff across laptops, phones, telecom lines, and peripherals
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Device Record
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid with Vibrant Background Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff with Devices */}
        <div className="bg-blue-600 rounded-xl p-4 shadow-sm text-white hover:bg-blue-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-50 uppercase tracking-wider">Staff with Devices</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalEmployees}</span>
            <span className="text-xs text-blue-100 font-medium">assigned records</span>
          </div>
          <p className="text-xs text-blue-100/90 mt-1">100% hardware inventory tracked</p>
        </div>

        {/* Mice Issued */}
        <div
          onClick={() => setPeripheralFilter(peripheralFilter === 'Mouse' ? 'All' : 'Mouse')}
          className={`rounded-xl p-4 shadow-sm transition-all cursor-pointer text-white ${
            peripheralFilter === 'Mouse'
              ? 'bg-emerald-700 ring-4 ring-emerald-300 ring-offset-2 scale-[1.02]'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-50 uppercase tracking-wider">Mice Issued</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Mouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{miceIssued}</span>
            <span className="text-xs text-emerald-100 font-medium">
              {Math.round((miceIssued / (totalEmployees || 1)) * 100)}% of staff
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">Wireless & USB desktop mice</p>
        </div>

        {/* Tripods Issued */}
        <div
          onClick={() => setPeripheralFilter(peripheralFilter === 'Tripod' ? 'All' : 'Tripod')}
          className={`rounded-xl p-4 shadow-sm transition-all cursor-pointer text-white ${
            peripheralFilter === 'Tripod'
              ? 'bg-indigo-700 ring-4 ring-indigo-300 ring-offset-2 scale-[1.02]'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-50 uppercase tracking-wider">Tripods Issued</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{tripodsIssued}</span>
            <span className="text-xs text-indigo-100 font-medium">Studio / Remote stands</span>
          </div>
          <p className="text-xs text-indigo-100/90 mt-1">Video & media recording equipment</p>
        </div>

        {/* Microphones Issued */}
        <div
          onClick={() => setPeripheralFilter(peripheralFilter === 'Mic' ? 'All' : 'Mic')}
          className={`rounded-xl p-4 shadow-sm transition-all cursor-pointer text-white ${
            peripheralFilter === 'Mic'
              ? 'bg-purple-700 ring-4 ring-purple-300 ring-offset-2 scale-[1.02]'
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-50 uppercase tracking-wider">Microphones Issued</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{micsIssued}</span>
            <span className="text-xs text-purple-100 font-medium">Headsets & USB mics</span>
          </div>
          <p className="text-xs text-purple-100/90 mt-1">Conferencing & acoustic gear</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee, laptop model, serial, phone, or Safaricom/Airtel..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Filter Peripherals:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Mouse', 'Tripod', 'Mic'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPeripheralFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  peripheralFilter === tab
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'All' ? 'All Records' : `Has ${tab}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Asset Directory Table with all 13 fields */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[160px]">
                  1. EMPLOYEE NAME
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[240px]">
                  2-5. LAPTOP DETAILS
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[170px]">
                  6-8. ACCESSORIES
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[240px]">
                  9, 10, 13. PHONE DETAILS
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[200px]">
                  11-12. TELECOM LINES
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {assets.length === 0 ? 'No Staff Device Records Found' : 'No records match current filter'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {assets.length === 0
                          ? 'Your inventory database is completely clear of dummy data and ready for you to input real staff laptops, serial numbers, phones, and telecom lines.'
                          : 'Try clearing your search query or peripheral filters.'}
                      </p>
                      {assets.length === 0 && (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Staff Device Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* 1. Employee Name & Department */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-sm text-slate-900">{asset.employeeName}</div>
                      {asset.department && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {asset.department}
                        </div>
                      )}
                    </td>

                    {/* 2-5. Laptop Model, Price, Serial Number, Condition */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                        <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{asset.laptopModel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">
                          S/N: {asset.laptopSerialNumber}
                        </span>
                        {asset.laptopPrice && (
                          <span className="text-emerald-700 font-semibold">{formatKESCurrency(asset.laptopPrice)}</span>
                        )}
                      </div>
                      {asset.laptopConditionComments && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-0.5">
                          "{asset.laptopConditionComments}"
                        </p>
                      )}
                    </td>

                    {/* 6-8. Peripherals (Mouse, Tripod, Mic) */}
                    <td className="py-4 px-4 align-top space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Mouse className="w-3.5 h-3.5 text-slate-400" /> Mouse:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            asset.issuedWithMouse === 'Yes'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {asset.issuedWithMouse}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-slate-400" /> Tripod:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            asset.issuedWithTripod === 'Yes'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {asset.issuedWithTripod}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5 text-slate-400" /> Mic:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            asset.issuedWithMic === 'Yes'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {asset.issuedWithMic}
                        </span>
                      </div>
                    </td>

                    {/* 9, 10, 13. Phone Model, Price, and Comments on Phone Condition directly under phone */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{asset.phoneModel || 'Not Issued'}</span>
                      </div>
                      {asset.phonePrice && (
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          Price: {formatKESCurrency(asset.phonePrice)}
                        </div>
                      )}
                      {asset.phoneConditionComments && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1 pt-1 border-t border-slate-100">
                          "{asset.phoneConditionComments}"
                        </p>
                      )}
                    </td>

                    {/* 11-12. Safaricom & Airtel Telecom Lines */}
                    <td className="py-4 px-4 align-top space-y-1.5">
                      <div className="text-[11px] flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Safaricom:
                        </span>
                        <span className="font-mono text-slate-800 text-xs">{asset.safaricomPhoneNumber || '—'}</span>
                      </div>
                      <div className="text-[11px] flex items-center gap-1.5">
                        <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                          Airtel:
                        </span>
                        <span className="font-mono text-slate-800 text-xs">{asset.airtelPhoneNumber || '—'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setViewingAsset(asset)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="View Full Device Manifest"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(asset)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Device Record"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(asset)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Device Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                <strong className="text-slate-800 font-semibold">{totalFilteredCount}</strong> {totalFilteredCount === 1 ? 'device record' : 'device records'}
                {totalFilteredCount !== assets.length && ` (filtered from ${assets.length})`}
              </span>
            ) : (
              <span>No device records to display</span>
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

      {/* Add / Edit Device Inventory Record Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingAsset ? 'Edit Electronic Device Record' : 'Capture New Staff Device Record'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record all electronic assets in possession of this staff member
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form with Scrollable Content Body and Sticky Footer */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Staff Info */}
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        1. Employee Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="employee-names"
                        value={formData.employeeName}
                        onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                        placeholder="e.g. Sarah Chen"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      />
                      <datalist id="employee-names">
                        {users.map(u => (
                          <option key={u.id} value={u.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="">-- Select Department --</option>
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
                </div>

                {/* Section 2: Laptop Details (2-5) */}
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                    Laptop Details (Fields 2 - 5)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2. Laptop Model <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.laptopModel}
                        onChange={e => setFormData({ ...formData, laptopModel: e.target.value })}
                        placeholder="e.g. MacBook Pro 14&quot; M3 Pro, Dell XPS 15"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>3. Laptop Price (KES)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">KES</span>
                      </label>
                      <input
                        type="text"
                        value={formData.laptopPrice}
                        onFocus={() => {
                          if (!formData.laptopPrice || !formData.laptopPrice.trim()) {
                            setFormData(prev => ({ ...prev, laptopPrice: 'KES ' }));
                          }
                        }}
                        onChange={e => setFormData({ ...formData, laptopPrice: e.target.value })}
                        placeholder="e.g. KES 185,000"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Serial Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.laptopSerialNumber}
                      onChange={e => setFormData({ ...formData, laptopSerialNumber: e.target.value })}
                      placeholder="e.g. C02GL01XMD6R"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      5. Comments on Laptop Condition
                    </label>
                    <textarea
                      rows={2}
                      value={formData.laptopConditionComments}
                      onChange={e => setFormData({ ...formData, laptopConditionComments: e.target.value })}
                      placeholder="e.g. Excellent condition, screen protector applied, zero scratches."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Section 3: Peripherals (6-8) */}
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                    Issued Peripherals & Accessories (Fields 6 - 8)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Mouse */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        6. Issued with Mouse
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithMouse"
                            value="Yes"
                            checked={formData.issuedWithMouse === 'Yes'}
                            onChange={() => setFormData({ ...formData, issuedWithMouse: 'Yes' })}
                            className="text-blue-600"
                          />
                          Yes
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithMouse"
                            value="No"
                            checked={formData.issuedWithMouse === 'No'}
                            onChange={() => setFormData({ ...formData, issuedWithMouse: 'No' })}
                            className="text-blue-600"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    {/* Tripod */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        7. Issued with Tripod
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithTripod"
                            value="Yes"
                            checked={formData.issuedWithTripod === 'Yes'}
                            onChange={() => setFormData({ ...formData, issuedWithTripod: 'Yes' })}
                            className="text-blue-600"
                          />
                          Yes
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithTripod"
                            value="No"
                            checked={formData.issuedWithTripod === 'No'}
                            onChange={() => setFormData({ ...formData, issuedWithTripod: 'No' })}
                            className="text-blue-600"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    {/* Mic */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        8. Issued with Mic
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithMic"
                            value="Yes"
                            checked={formData.issuedWithMic === 'Yes'}
                            onChange={() => setFormData({ ...formData, issuedWithMic: 'Yes' })}
                            className="text-blue-600"
                          />
                          Yes
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="issuedWithMic"
                            value="No"
                            checked={formData.issuedWithMic === 'No'}
                            onChange={() => setFormData({ ...formData, issuedWithMic: 'No' })}
                            className="text-blue-600"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Phone & Telecom Details (9-13) */}
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">4</span>
                    Mobile Phone Details (Fields 9, 10, 13)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        9. Phone Model
                      </label>
                      <input
                        type="text"
                        value={formData.phoneModel}
                        onChange={e => setFormData({ ...formData, phoneModel: e.target.value })}
                        placeholder="e.g. iPhone 15 Pro, Samsung S24"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>10. Phone Price (KES)</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">KES</span>
                      </label>
                      <input
                        type="text"
                        value={formData.phonePrice}
                        onFocus={() => {
                          if (!formData.phonePrice || !formData.phonePrice.trim()) {
                            setFormData(prev => ({ ...prev, phonePrice: 'KES ' }));
                          }
                        }}
                        onChange={e => setFormData({ ...formData, phonePrice: e.target.value })}
                        placeholder="e.g. KES 45,000"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      13. Comments on Phone Condition
                    </label>
                    <textarea
                      rows={2}
                      value={formData.phoneConditionComments}
                      onChange={e => setFormData({ ...formData, phoneConditionComments: e.target.value })}
                      placeholder="e.g. Pristine condition in official MagSafe case."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Section 5: Telecom Lines (11-12) */}
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">5</span>
                    Telecom SIM Lines (Autofilled with +254 Country Code)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>11. Safaricom Phone Number</span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">+254 KE</span>
                      </label>
                      <input
                        type="text"
                        value={formData.safaricomPhoneNumber}
                        onFocus={() => {
                          if (!formData.safaricomPhoneNumber || !formData.safaricomPhoneNumber.trim()) {
                            setFormData(prev => ({ ...prev, safaricomPhoneNumber: '+254 ' }));
                          }
                        }}
                        onChange={e => setFormData({ ...formData, safaricomPhoneNumber: e.target.value })}
                        placeholder="e.g. +254 712 345678"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>12. Airtel Phone Number</span>
                        <span className="text-[10px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">+254 KE</span>
                      </label>
                      <input
                        type="text"
                        value={formData.airtelPhoneNumber}
                        onFocus={() => {
                          if (!formData.airtelPhoneNumber || !formData.airtelPhoneNumber.trim()) {
                            setFormData(prev => ({ ...prev, airtelPhoneNumber: '+254 ' }));
                          }
                        }}
                        onChange={e => setFormData({ ...formData, airtelPhoneNumber: e.target.value })}
                        placeholder="e.g. +254 733 112233"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Submit Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingAsset ? 'Save Changes' : 'Save Device Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Manifest Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Equipment Manifest: {viewingAsset.employeeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewingAsset.department || 'Staff Member'}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Laptop Section */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Laptop Specification
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model</span>
                    <strong>{viewingAsset.laptopModel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Serial Number</span>
                    <strong className="font-mono">{viewingAsset.laptopSerialNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valuation / Price</span>
                    <strong className="text-emerald-700">{viewingAsset.laptopPrice ? formatKESCurrency(viewingAsset.laptopPrice) : '—'}</strong>
                  </div>
                </div>
                {viewingAsset.laptopConditionComments && (
                  <div className="pt-1 text-[11px] text-slate-600 border-t border-blue-100/60">
                    <span className="text-slate-400">Condition Notes: </span>
                    {viewingAsset.laptopConditionComments}
                  </div>
                )}
              </div>

              {/* Peripherals Section */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mouse className="w-4 h-4 text-slate-600" />
                  Peripherals & Accessories
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Mouse</span>
                    <strong className={viewingAsset.issuedWithMouse === 'Yes' ? 'text-emerald-700' : 'text-slate-400'}>
                      {viewingAsset.issuedWithMouse}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Tripod</span>
                    <strong className={viewingAsset.issuedWithTripod === 'Yes' ? 'text-emerald-700' : 'text-slate-400'}>
                      {viewingAsset.issuedWithTripod}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Microphone</span>
                    <strong className={viewingAsset.issuedWithMic === 'Yes' ? 'text-emerald-700' : 'text-slate-400'}>
                      {viewingAsset.issuedWithMic}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Phone Section */}
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Mobile Phone Specification
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone Model</span>
                    <strong>{viewingAsset.phoneModel || 'None'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valuation / Price</span>
                    <strong className="text-emerald-700">{viewingAsset.phonePrice ? formatKESCurrency(viewingAsset.phonePrice) : '—'}</strong>
                  </div>
                </div>
                {viewingAsset.phoneConditionComments && (
                  <div className="pt-1 text-[11px] text-slate-600 border-t border-indigo-100/60">
                    <span className="text-slate-400">Condition Notes: </span>
                    {viewingAsset.phoneConditionComments}
                  </div>
                )}
              </div>

              {/* Telecom Lines Section */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-600" />
                  Telecom SIM Lines
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Safaricom Line</span>
                    <strong className="font-mono text-emerald-800">{viewingAsset.safaricomPhoneNumber || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Airtel Line</span>
                    <strong className="font-mono text-rose-800">{viewingAsset.airtelPhoneNumber || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Manifest Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingAsset;
                  setViewingAsset(null);
                  handleOpenEditModal(toEdit);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                Edit Record
              </button>
              <button
                type="button"
                onClick={() => setViewingAsset(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Device Record</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove the electronic device record for <strong className="text-slate-800 font-semibold">{deleteCandidate.employeeName}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
