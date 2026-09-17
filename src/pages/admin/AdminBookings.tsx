import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  ArrowUpDown,
  CalendarDays,
  ListFilter,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';
import { Booking, BookingStatus } from '../../types';
import { AdminAvailabilityCalendar } from '../../components/admin/AdminAvailabilityCalendar';

interface AdminBookingsProps {
  onNavigate: (page: string, params?: { bookingId?: string }) => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({ onNavigate }) => {
  const { design } = useStudio();
  const { showSuccess, showError, showInfo } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'list' or 'calendar'
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Available years from bookings data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    bookings.forEach((b) => {
      const d = b.preferredDate || b.createdAt;
      if (d) {
        const yr = new Date(d).getFullYear().toString();
        if (yr && !isNaN(Number(yr))) years.add(yr);
      }
    });
    return Array.from(years).sort().reverse();
  }, [bookings]);

  // Filter pipeline
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search by customer name, phone, email, booking reference
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = b.clientName?.toLowerCase().includes(q);
        const matchEmail = b.clientEmail?.toLowerCase().includes(q);
        const matchPhone = b.clientPhone?.includes(q);
        const matchId = b.bookingId?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (b.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 3. Service filter
      if (serviceFilter !== 'all' && b.service !== serviceFilter) return false;

      // 4. Date range (from / to)
      if (dateFrom && b.preferredDate && b.preferredDate < dateFrom) return false;
      if (dateTo && b.preferredDate && b.preferredDate > dateTo) return false;

      // 5. Month & Year filter
      if (monthFilter !== 'all' && b.preferredDate) {
        const m = (new Date(b.preferredDate).getMonth() + 1).toString().padStart(2, '0');
        if (m !== monthFilter) return false;
      }
      if (yearFilter !== 'all' && b.preferredDate) {
        const y = new Date(b.preferredDate).getFullYear().toString();
        if (y !== yearFilter) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, serviceFilter, dateFrom, dateTo, monthFilter, yearFilter]);

  // Helper to format RFC 4180 CSV cell
  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // CSV Export Function adhering to RFC 4180 and real Firestore data
  const handleExportCsv = (listToExport: Booking[], label: string) => {
    if (listToExport.length === 0) {
      showError('No bookings match the selected criteria for export.');
      return;
    }

    const headers = [
      'Booking Reference',
      'Customer Name',
      'Phone',
      'Email',
      'Service',
      'Date',
      'Time',
      'Status',
      'Created At',
      'Updated At',
      'Approved At',
      'Admin Notes',
      'Email Notification Status',
      'WhatsApp Notification Status',
      'Gallery Token'
    ];

    const rows = listToExport.map((b) => [
      escapeCsvCell(b.bookingId),
      escapeCsvCell(b.clientName),
      escapeCsvCell(b.clientPhone),
      escapeCsvCell(b.clientEmail),
      escapeCsvCell(b.service),
      escapeCsvCell(b.preferredDate),
      escapeCsvCell(b.preferredTime),
      escapeCsvCell((b.status || 'pending').toUpperCase()),
      escapeCsvCell(b.createdAt),
      escapeCsvCell(b.updatedAt || b.createdAt),
      escapeCsvCell(b.approvedAt || ''),
      escapeCsvCell(b.adminNotes || ''),
      escapeCsvCell(b.emailStatus || 'pending'),
      escapeCsvCell(b.whatsappStatus || 'pending'),
      escapeCsvCell(b.galleryToken || '')
    ]);

    const csvBody = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `1by2studio_${label.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(`Successfully exported ${listToExport.length} bookings to CSV.`);
  };

  const services = Array.from(new Set(bookings.map((b) => b.service).filter(Boolean)));

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setServiceFilter('all');
    setDateFrom('');
    setDateTo('');
    setMonthFilter('all');
    setYearFilter('all');
    showInfo('Filters reset to default.');
  };

  return (
    <div id="admin-bookings-table-page" className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Booking &amp; Availability Operations
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time management, acceptance workflows, studio closures, and client directory.
          </p>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Bookings &amp; Inquiries ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Studio Calendar &amp; Blocked Dates</span>
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
        /* Availability & Blocked Dates Tab */
        <AdminAvailabilityCalendar bookings={bookings} />
      ) : (
        /* Bookings List & Export Tab */
        <div className="space-y-6">
          {/* Action Header with Export Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-300 font-medium">
              Showing <span className="font-bold text-amber-400">{filteredBookings.length}</span> of {bookings.length} bookings
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                id="export-filtered-bookings-btn"
                onClick={() => handleExportCsv(filteredBookings, 'filtered_bookings')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition shadow"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Filtered ({filteredBookings.length})</span>
              </button>

              <button
                type="button"
                id="export-all-bookings-btn"
                onClick={() => handleExportCsv(bookings, 'all_bookings')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export All Bookings</span>
              </button>
            </div>
          </div>

          {/* Filter Matrix (Status, Service, Date Range, Month, Year, Search) */}
          <div
            className="p-5 rounded-xl border space-y-4"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter &amp; Query Controls</span>
              </span>

              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>

            {/* Row 1: Search, Status, Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search name, phone, email, reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                >
                  <option value="all">Status: ALL ({bookings.length})</option>
                  <option value="pending">Status: PENDING</option>
                  <option value="approved">Status: APPROVED</option>
                  <option value="rejected">Status: REJECTED</option>
                  <option value="completed">Status: COMPLETED</option>
                  <option value="cancelled">Status: CANCELLED</option>
                </select>
              </div>

              {/* Service Filter */}
              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                >
                  <option value="all">Service: All Categories</option>
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Date Range (From / To), Month, Year */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Date Range From:
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Date Range To:
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Specific Month:
                </label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                >
                  <option value="all">All Months</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Specific Year:
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div
            className="rounded-xl border overflow-hidden shadow-xl"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 animate-pulse">
                Loading real-time bookings from Firestore...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
                <p className="font-semibold text-neutral-300">No bookings match the selected criteria.</p>
                <p>Try resetting filters or adjusting search parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b text-neutral-400 uppercase tracking-wider font-semibold text-[11px]"
                      style={{
                        backgroundColor: `${design.primaryColor}90`,
                        borderColor: design.borderColor,
                      }}
                    >
                      <th className="py-3.5 px-4">Ref ID</th>
                      <th className="py-3.5 px-4">Patron Details</th>
                      <th className="py-3.5 px-4">Service Category</th>
                      <th className="py-3.5 px-4">Session Date &amp; Slot</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Alerts</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-neutral-200" style={{ borderColor: design.borderColor }}>
                    {filteredBookings.map((b) => (
                      <tr
                        key={b.bookingId}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => onNavigate('admin-booking-detail', { bookingId: b.bookingId })}
                      >
                        <td className="py-4 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {b.bookingId}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-neutral-100">{b.clientName}</div>
                          <div className="text-[11px] text-neutral-400">{b.clientPhone}</div>
                          <div className="text-[11px] text-neutral-400">{b.clientEmail}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded bg-black/40 border text-[11px]" style={{ borderColor: design.borderColor }}>
                            {b.service}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-medium text-neutral-200">{b.preferredDate}</div>
                          <div className="text-[11px] text-neutral-400">{b.preferredTime}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border inline-block ${
                              b.status === 'approved'
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : b.status === 'pending'
                                ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                                : b.status === 'completed'
                                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                                : b.status === 'cancelled'
                                ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                                : 'bg-red-950/60 border-red-800 text-red-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-[11px] text-neutral-400">
                          <div>
                            Email: <span className={b.emailStatus === 'sent' ? 'text-emerald-400' : 'text-slate-400'}>{b.emailStatus || 'pending'}</span>
                          </div>
                          <div>
                            WA: <span className={b.whatsappStatus === 'sent' ? 'text-emerald-400' : 'text-slate-400'}>{b.whatsappStatus || 'pending'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onNavigate('admin-booking-detail', { bookingId: b.bookingId })}
                            className="px-3 py-1.5 rounded text-xs font-semibold border hover:bg-white/10 text-neutral-200 inline-flex items-center gap-1.5 transition cursor-pointer"
                            style={{ borderColor: design.borderColor }}
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
