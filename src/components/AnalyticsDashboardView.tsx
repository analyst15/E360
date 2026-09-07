import React, { useState } from 'react';
import { Ticket } from '../types';
import {
  Activity,
  TrendingUp,
  Clock,
  ThumbsUp,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Download,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsDashboardViewProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  onClearAllTickets?: () => Promise<void> | void;
  onOpenCreateTicket?: () => void;
  onExportCSV?: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  tickets,
  onClearAllTickets,
  onOpenCreateTicket,
  onExportCSV,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const totalTickets = tickets.length;

  // Status counts
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(
    t => t.status === 'In Progress' || t.status === 'Waiting on User' || t.status === 'Escalated'
  ).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Priority counts
  const priorityCounts = {
    Low: tickets.filter(t => t.priority === 'Low').length,
    Medium: tickets.filter(t => t.priority === 'Medium').length,
    High: tickets.filter(t => t.priority === 'High').length,
    Critical: tickets.filter(t => t.priority === 'Critical').length,
  };

  // Category counts
  const hardwareCount = tickets.filter(
    t => t.category === 'Hardware' || t.category === 'Equipment Request'
  ).length;
  const softwareCount = tickets.filter(t => t.category === 'Software').length;
  const networkCount = tickets.filter(t => t.category === 'Network & VPN').length;
  const accessCount = tickets.filter(
    t => t.category === 'Access & IAM' || t.category === 'Security Incident'
  ).length;
  const emailCount = tickets.filter(t => t.category === 'Email & Cloud').length;
  const otherCount = tickets.filter(
    t =>
      t.category !== 'Hardware' &&
      t.category !== 'Equipment Request' &&
      t.category !== 'Software' &&
      t.category !== 'Network & VPN' &&
      t.category !== 'Access & IAM' &&
      t.category !== 'Security Incident' &&
      t.category !== 'Email & Cloud'
  ).length;

  // Average Resolution Time Calculation
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
  let avgResolutionText = '0.0 days';
  let avgResolutionSubtitle = '0 tickets resolved';

  if (resolvedTickets.length > 0) {
    let totalDurationHours = 0;
    let validResolvedCount = 0;

    resolvedTickets.forEach(t => {
      const created = new Date(t.createdAt).getTime();
      const updated = new Date(t.updatedAt).getTime();
      if (!isNaN(created) && !isNaN(updated) && updated >= created) {
        totalDurationHours += (updated - created) / (1000 * 60 * 60);
        validResolvedCount++;
      }
    });

    if (validResolvedCount > 0) {
      const avgHours = totalDurationHours / validResolvedCount;
      if (avgHours < 24) {
        avgResolutionText = `${avgHours.toFixed(1)} hrs`;
      } else {
        const avgDays = avgHours / 24;
        avgResolutionText = `${avgDays.toFixed(1)} days`;
      }
      avgResolutionSubtitle = `Based on ${validResolvedCount} resolved ticket${validResolvedCount === 1 ? '' : 's'}`;
    }
  }

  // Satisfaction Rate
  let satisfactionRateText = '—';
  let satisfactionSubtitle = 'Clean slate — 0 tickets logged';

  if (totalTickets > 0) {
    if (resolvedCount > 0) {
      const rate = Math.round((resolvedCount / totalTickets) * 100);
      satisfactionRateText = `${rate}%`;
      satisfactionSubtitle = `${resolvedCount} of ${totalTickets} tickets resolved`;
    } else {
      satisfactionRateText = '100%';
      satisfactionSubtitle = 'Active queue in progress';
    }
  }

  // Chart Data: Status Pie Chart
  const statusPieData = [
    { name: 'Open', value: openCount, color: '#f59e0b' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Resolved', value: resolvedCount, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Custom Label Renderer for Pie Chart
  const renderPieLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    name?: string;
    value?: number;
    color?: string;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 80, name = '', value = 0, color = '#64748b' } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 24;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={color}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-[11px] font-semibold"
        fontSize={11}
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  // Chart Data: Priority Bar Chart
  const priorityBarData = [
    { name: 'Low', count: priorityCounts.Low, color: '#6b7280' },
    { name: 'Medium', count: priorityCounts.Medium, color: '#3b82f6' },
    { name: 'High', count: priorityCounts.High, color: '#f97316' },
    { name: 'Critical', count: priorityCounts.Critical, color: '#ef4444' },
  ];

  // Chart Data: Category Horizontal Bar Chart
  const categoryBarData = [
    { name: 'Hardware', count: hardwareCount },
    { name: 'Software', count: softwareCount },
    { name: 'Network', count: networkCount },
    { name: 'Access & Security', count: accessCount },
    { name: 'Email & Cloud', count: emailCount },
    { name: 'Other', count: otherCount },
  ];

  // Chart Data: Dynamic Volume Trend
  const trendLineData = [
    { name: 'W-4', tickets: 0 },
    { name: 'W-3', tickets: 0 },
    { name: 'W-2', tickets: 0 },
    { name: 'W-1', tickets: 0 },
    { name: 'Current', tickets: totalTickets },
  ];

  const maxPriorityCount = Math.max(...priorityBarData.map(p => p.count), 1);
  const maxCategoryCount = Math.max(...categoryBarData.map(c => c.count), 1);

  const handleConfirmClear = async () => {
    if (!onClearAllTickets) return;
    try {
      setIsClearing(true);
      await onClearAllTickets();
      setShowClearConfirm(false);
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to clear tickets:', e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Reports & Analytics
            </h1>
            {totalTickets === 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Clean Slate
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time organizational support performance metrics & ticket volume distribution
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onExportCSV && totalTickets > 0 && (
            <button
              onClick={onExportCSV}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}

          {onOpenCreateTicket && (
            <button
              onClick={onOpenCreateTicket}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Ticket
            </button>
          )}

          {onClearAllTickets && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all ticket records to start on a fresh clean slate"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Clear Ticket Records
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {clearedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All ticket records have been cleared. Reports and analytics are now on a 100% clean slate.</span>
          </div>
          <button
            onClick={() => setClearedSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Slate Notice Banner */}
      {totalTickets === 0 && !clearedSuccess && (
        <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-5 text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Support Desk is in Clean Slate Mode (0 Records)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                All sample and demo tickets are cleared. Reports, SLA resolution trends, and department breakdowns will dynamically populate in real-time as genuine staff requests are submitted.
              </p>
            </div>
          </div>
          {onOpenCreateTicket && (
            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Submit First Ticket
            </button>
          )}
        </div>
      )}

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets - Blue */}
        <div className="bg-blue-600 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between hover:bg-blue-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Total Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">{totalTickets}</div>
            <div className="text-xs text-blue-100 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalTickets === 0 ? 'Clean slate active' : `${totalTickets} recorded in system`}</span>
            </div>
          </div>
        </div>

        {/* Avg Resolution Time - Emerald */}
        <div className="bg-emerald-600 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between hover:bg-emerald-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">{avgResolutionText}</div>
            <div className="text-xs text-emerald-100 font-medium mt-1">{avgResolutionSubtitle}</div>
          </div>
        </div>

        {/* Satisfaction Rate - Purple */}
        <div className="bg-purple-600 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between hover:bg-purple-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">Resolution Rate</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">{satisfactionRateText}</div>
            <div className="text-xs text-purple-100 font-medium mt-1">{satisfactionSubtitle}</div>
          </div>
        </div>

        {/* Open Tickets - Amber */}
        <div className="bg-amber-500 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between hover:bg-amber-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">Open Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">{openCount}</div>
            <div className="text-xs text-amber-100 font-medium mt-1">
              {openCount === 0 ? 'Queue clear — 0 pending' : `${openCount} requiring triage`}
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tickets by Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tickets by Status</h2>
              <p className="text-[11px] text-slate-500">Live distribution of ticket workload</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full h-64 flex items-center justify-center">
            {totalTickets > 0 && statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 mb-2">
                  <span className="text-xs font-bold text-slate-400">0</span>
                </div>
                <p className="text-xs font-semibold text-slate-700">No Tickets Recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Status breakdown will display as tickets are created.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3 mt-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Open: <strong className="text-slate-800">{openCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              In Progress: <strong className="text-slate-800">{inProgressCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Resolved: <strong className="text-slate-800">{resolvedCount}</strong>
            </span>
          </div>
        </div>

        {/* Chart 2: Tickets by Priority */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tickets by Priority</h2>
              <p className="text-[11px] text-slate-500">Urgency level breakdown across active queue</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBarData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  allowDecimals={false}
                  domain={[0, maxPriorityCount > 2 ? maxPriorityCount : 2]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {priorityBarData.map((entry, index) => (
                    <Cell key={`priority-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs font-medium text-slate-600 border-t border-slate-100 pt-3 mt-auto">
            <span>Low: <strong>{priorityCounts.Low}</strong></span>
            <span>Med: <strong>{priorityCounts.Medium}</strong></span>
            <span>High: <strong>{priorityCounts.High}</strong></span>
            <span className="text-red-600">Critical: <strong>{priorityCounts.Critical}</strong></span>
          </div>
        </div>

        {/* Chart 3: Tickets by Category */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tickets by Category</h2>
              <p className="text-[11px] text-slate-500">Categorical division of IT support requests</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBarData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  allowDecimals={false}
                  domain={[0, maxCategoryCount > 2 ? maxCategoryCount : 2]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" barSize={16} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Ticket Volume Trend */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ticket Volume Trend</h2>
              <p className="text-[11px] text-slate-500">Weekly ticket volume progression</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendLineData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  allowDecimals={false}
                  domain={[0, totalTickets > 5 ? totalTickets + 2 : 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
            <span className="w-3 h-0.5 bg-blue-500 inline-block" />
            <span>Volume ({totalTickets} total recorded)</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Clear All Records */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear All Ticket Records?</h3>
                <p className="text-xs text-slate-500">Start fresh on a clean slate</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              This will permanently delete all <strong className="text-slate-900">{totalTickets} ticket records</strong> and comment histories from both Firestore and local storage. Reports and analytics will reset to 0.
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mb-5">
              <strong>Note:</strong> User accounts, staff profiles, and asset inventories will remain intact. Only ticket request records will be cleared.
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClear}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isClearing ? (
                  <>Clearing Records...</>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Clear All Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
