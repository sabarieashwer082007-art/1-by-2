import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Booking } from '../../types';
import { TrendingUp, PieChart as PieIcon, BarChart3, Filter, Award } from 'lucide-react';

interface AdminAnalyticsChartsProps {
  bookings: Booking[];
  accentColor?: string;
}

const PALETTE = ['#c59b27', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({
  bookings,
  accentColor = '#c59b27',
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Available years from bookings data
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    bookings.forEach((b) => {
      if (b.createdAt) {
        const y = new Date(b.createdAt).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
      if (b.preferredDate) {
        const y = new Date(b.preferredDate).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [bookings, currentYear]);

  // Filter bookings for the selected year
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const dateStr = b.preferredDate || b.createdAt;
      if (!dateStr) return true;
      return new Date(dateStr).getFullYear() === selectedYear;
    });
  }, [bookings, selectedYear]);

  // 1. Aggregate Monthly Booking Volume (Jan - Dec)
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = monthNames.map((month) => ({
      month,
      total: 0,
      approved: 0,
      pending: 0,
    }));

    filteredBookings.forEach((b) => {
      const dateStr = b.preferredDate || b.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        counts[m].total += 1;
        if (b.status === 'approved' || b.status === 'completed') {
          counts[m].approved += 1;
        } else if (b.status === 'pending') {
          counts[m].pending += 1;
        }
      }
    });

    return counts;
  }, [filteredBookings]);

  // 2. Aggregate Service Popularity
  const serviceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const svc = b.service || 'Custom Assignment';
      map[svc] = (map[svc] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredBookings]);

  // Key KPI stats for the selected period
  const totalPeriod = filteredBookings.length;
  const approvedPeriod = filteredBookings.filter((b) => b.status === 'approved' || b.status === 'completed').length;
  const approvalRate = totalPeriod > 0 ? Math.round((approvedPeriod / totalPeriod) * 100) : 0;
  const topService = serviceData[0]?.name || 'N/A';

  // Custom Dark Tooltip for Monthly Volume
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs text-slate-200">
          <p className="font-bold text-amber-400 mb-1.5">{label} {selectedYear}</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Total Bookings:</span>
              <span className="font-semibold text-white">{payload[0]?.value || 0}</span>
            </p>
            {payload[1] && (
              <p className="flex items-center justify-between gap-4 text-emerald-400">
                <span>Approved:</span>
                <span className="font-semibold">{payload[1]?.value || 0}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dark Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = totalPeriod > 0 ? Math.round((data.value / totalPeriod) * 100) : 0;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs text-slate-200">
          <p className="font-bold text-white mb-1" style={{ color: data.payload.fill }}>{data.name}</p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Inquiries:</span>
            <span className="font-semibold text-white">{data.value} ({pct}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>Studio Performance &amp; Demand Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated booking volume, conversion rate, and service popularity from Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Fiscal Year:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Year Volume</span>
          <div className="text-2xl font-bold text-white mt-1">{totalPeriod}</div>
          <span className="text-[11px] text-slate-500">Inquiries in {selectedYear}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Confirmed Shoots</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedPeriod}</div>
          <span className="text-[11px] text-emerald-500/80">Approved or completed</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-medium">Approval Rate</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{approvalRate}%</div>
          <span className="text-[11px] text-amber-500/80">Inquiry-to-booking conversion</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 truncate">
          <span className="text-xs uppercase tracking-wider text-blue-400 font-medium">Top Category</span>
          <div className="text-lg font-bold text-white mt-1 truncate" title={topService}>{topService}</div>
          <span className="text-[11px] text-blue-400/80">Highest demand service</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Booking Volume Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Monthly Booking Volume ({selectedYear})</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Total</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Approved</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="total" fill="#c59b27" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Popularity Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Service Popularity Breakdown</h3>
            </div>
          </div>

          {serviceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No service data available for {selectedYear}
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
