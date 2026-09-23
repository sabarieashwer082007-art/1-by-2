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
  SlidersHorizontal,
  Mail
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Booking, BookingStatus } from '../../types';
import { AdminAvailabilityCalendar } from '../../components/admin/AdminAvailabilityCalendar';
import {
  approveBooking,
  rejectBooking,
  exportBookingsToExcel,
  exportBookingsToCsv,
  previewApprovalEmail
} from '../../services/bookingService';

interface AdminBookingsProps {
  onNavigate: (page: string, params?: { bookingId?: string }) => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({ onNavigate }) => {
  const { design } = useStudio();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'list' or 'calendar'
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');

  // Quick action states
  const [approvingBooking, setApprovingBooking] = useState<Booking | null>(null);
  const [processingApprove, setProcessingApprove] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [processingReject, setProcessingReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Date unavailable / Fully booked');
  const [customReason, setCustomReason] = useState('');
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  // Summary counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      rejected: bookings.filter((b) => b.status === 'rejected').length,
    };
  }, [bookings]);

  const approvedBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'approved');
  }, [bookings]);

  // Download Approved Bookings (Excel .xlsx)
  const handleDownloadApprovedExcel = () => {
    const toExport = statusFilter === 'approved' ? filteredBookings : approvedBookings;
    if (toExport.length === 0) {
      showError('No approved bookings found to export.');
      return;
    }
    const filename = `1by2_Studio_Approved_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportBookingsToExcel(toExport, filename);
    showSuccess(`Exported ${toExport.length} approved bookings to Excel.`);
  };

  // Download Approved Bookings (CSV .csv)
  const handleDownloadApprovedCsv = () => {
    const toExport = statusFilter === 'approved' ? filteredBookings : approvedBookings;
    if (toExport.length === 0) {
      showError('No approved bookings found to export.');
      return;
    }
    const filename = `1by2_Studio_Approved_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
    exportBookingsToCsv(toExport, filename);
    showSuccess(`Exported ${toExport.length} approved bookings to CSV.`);
  };

  // Download Generic Selection (Excel .xlsx)
  const handleDownloadFilteredExcel = () => {
    if (filteredBookings.length === 0) {
      showError('No bookings match current filter.');
      return;
    }
    const filename = `1by2_Studio_Filtered_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportBookingsToExcel(filteredBookings, filename);
    showSuccess(`Exported ${filteredBookings.length} bookings to Excel.`);
  };

  // Quick Approve Flow
  const handleQuickApproveClick = (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovingBooking(b);
  };

  const handleConfirmQuickApprove = async () => {
    if (!approvingBooking) return;
    const docId = approvingBooking.id;
    if (!docId) {
      showError('Missing Firestore document ID.');
      return;
    }
    setProcessingApprove(true);
    try {
      const adminInfo = user ? { uid: user.uid, email: user.email } : { uid: 'studio-admin', email: 'brucetamilyt@gmail.com' };
      const res = await approveBooking(docId, approvingBooking, adminInfo);
      if (res.success) {
        showSuccess(`Booking ${approvingBooking.bookingId} approved and confirmation dispatched!`);
        setApprovingBooking(null);
      } else {
        showError(res.error || 'Failed to approve booking.');
      }
    } catch (err: any) {
      showError(err.message || 'Error occurred while approving.');
    } finally {
      setProcessingApprove(false);
    }
  };

  // Quick Reject Flow
  const handleQuickRejectClick = (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectingBooking(b);
    setRejectionReason('Date unavailable / Fully booked');
    setCustomReason('');
  };

  const handleConfirmQuickReject = async () => {
    if (!rejectingBooking) return;
    const docId = rejectingBooking.id;
    if (!docId) {
      showError('Missing Firestore document ID.');
      return;
    }
    setProcessingReject(true);
    try {
      const adminInfo = user ? { uid: user.uid, email: user.email } : { uid: 'studio-admin', email: 'brucetamilyt@gmail.com' };
      const finalReason = rejectionReason === 'Other' && customReason.trim() ? customReason.trim() : rejectionReason;
      const res = await rejectBooking(docId, rejectingBooking, finalReason, adminInfo);
      if (res.success) {
        showSuccess(`Booking ${rejectingBooking.bookingId} set to Rejected (${finalReason}).`);
        setRejectingBooking(null);
      } else {
        showError(res.error || 'Failed to reject booking.');
      }
    } catch (err: any) {
      showError(err.message || 'Error occurred while rejecting.');
    } finally {
      setProcessingReject(false);
    }
  };

  // Email Preview Flow
  const handleOpenPreviewEmail = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewBooking(b);
    setLoadingPreview(true);
    try {
      const html = await previewApprovalEmail(b);
      setPreviewHtml(html);
    } catch (err) {
      console.warn('Failed to load email preview:', err);
    } finally {
      setLoadingPreview(false);
    }
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
            onClick={() => { setActiveTab('list'); setStatusFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'list' && statusFilter !== 'approved'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>All Bookings ({bookings.length})</span>
          </button>

          {/* DEDICATED APPROVED BOOKINGS TAB */}
          <button
            type="button"
            id="admin-approved-bookings-tab"
            onClick={() => { setActiveTab('list'); setStatusFilter('approved'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'list' && statusFilter === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved Bookings ({counts.approved})</span>
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
          {/* Action Header with Dedicated Download Approved Bookings Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span>Showing</span>
              <span className="font-bold text-amber-400">{filteredBookings.length}</span>
              <span>of {bookings.length} bookings</span>
              {statusFilter === 'approved' && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Approved Dossier Mode
                </span>
              )}
            </div>

            {/* PROMINENT DOWNLOAD BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Prominent Download Approved Bookings (Excel) */}
              <button
                type="button"
                id="download-approved-bookings-excel-btn"
                onClick={handleDownloadApprovedExcel}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white transition shadow hover:shadow-emerald-900/40 active:scale-95"
                title="Download formatted Excel (.xlsx) sheet of approved bookings"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Approved (.xlsx)</span>
              </button>

              {/* Prominent Download Approved Bookings (CSV) */}
              <button
                type="button"
                id="download-approved-bookings-csv-btn"
                onClick={handleDownloadApprovedCsv}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-emerald-700/60 text-emerald-300 transition shadow hover:border-emerald-500 active:scale-95"
                title="Download CSV (.csv) file of approved bookings"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Approved (.csv)</span>
              </button>

              {/* Export Filtered */}
              <button
                type="button"
                id="export-filtered-bookings-btn"
                onClick={handleDownloadFilteredExcel}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition shadow"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Filtered ({filteredBookings.length})</span>
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
                    <tr className="border-b border-[#D8D2C8] bg-[#F4F1EC] text-[#66645F] uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3.5 px-4">Ref ID</th>
                      <th className="py-3.5 px-4">Patron Details</th>
                      <th className="py-3.5 px-4">Service Category</th>
                      <th className="py-3.5 px-4">Session Date &amp; Slot</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Alerts</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C8] text-[#1C1C1A]">
                    {filteredBookings.map((b) => (
                      <tr
                        key={b.bookingId}
                        className="hover:bg-[#F4F1EC]/60 transition-colors cursor-pointer"
                        onClick={() => onNavigate('admin-booking-detail', { bookingId: b.bookingId })}
                      >
                        <td className="py-4 px-4 font-mono font-bold text-[#6B4F3A] whitespace-nowrap">
                          {b.bookingId}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#1C1C1A]">{b.clientName}</div>
                          <div className="text-[11px] text-[#66645F]">{b.clientPhone}</div>
                          <div className="text-[11px] text-[#66645F]">{b.clientEmail}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-[3px] bg-[#F4F1EC] border border-[#D8D2C8] text-[#1C1C1A] text-[11px]">
                            {b.service}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-medium text-[#1C1C1A]">{b.preferredDate}</div>
                          <div className="text-[11px] text-[#66645F]">{b.preferredTime}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-[3px] border inline-block ${
                              b.status === 'approved'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : b.status === 'pending'
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : b.status === 'completed'
                                ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                                : 'bg-rose-50 border-rose-300 text-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-[11px] text-[#66645F]">
                          <div>
                            Email: <span className={b.emailStatus === 'sent' ? 'text-emerald-700 font-semibold' : 'text-[#66645F]'}>{b.emailStatus || 'pending'}</span>
                          </div>
                          <div>
                            WA: <span className={b.whatsappStatus === 'sent' ? 'text-emerald-700 font-semibold' : 'text-[#66645F]'}>{b.whatsappStatus || 'pending'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Preview Email button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenPreviewEmail(b, e)}
                              className="px-2.5 py-1.5 rounded-[4px] text-xs font-semibold border border-[#D8D2C8] bg-white hover:bg-[#F4F1EC] text-[#66645F] hover:text-[#1C1C1A] inline-flex items-center gap-1 transition cursor-pointer"
                              title="Preview Approval Email card"
                            >
                              <Mail className="w-3 h-3 text-amber-600" />
                              <span>Preview Email</span>
                            </button>

                            {/* Quick Approve & Reject buttons for pending */}
                            {b.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickApproveClick(b, e)}
                                  className="px-3 py-1.5 rounded-[4px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm transition cursor-pointer"
                                  title="Approve booking immediately"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickRejectClick(b, e)}
                                  className="px-2.5 py-1.5 rounded-[4px] text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center gap-1 transition cursor-pointer"
                                  title="Reject booking with reason"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Manage / Dossier button */}
                            <button
                              onClick={() => onNavigate('admin-booking-detail', { bookingId: b.bookingId })}
                              className="px-3 py-1.5 rounded-[4px] text-xs font-semibold border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] hover:bg-[#E8E3DB] inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#6B4F3A]" />
                              <span>Dossier</span>
                            </button>
                          </div>
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

      {/* Quick Approve Confirmation Modal */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1A]/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] shadow-2xl overflow-hidden space-y-0">
            <div className="p-4 border-b border-[#D8D2C8] bg-emerald-50 text-emerald-950 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold font-heading">Confirm Booking Approval</h3>
                <p className="text-[11px] text-emerald-800 font-mono">{approvingBooking.bookingId}</p>
              </div>
            </div>

            <div className="p-5 text-xs text-[#1C1C1A] space-y-3 bg-white">
              <div className="p-3 bg-[#F4F1EC] rounded-[4px] border border-[#D8D2C8] space-y-1.5 text-xs">
                <p>
                  Patron: <strong>{approvingBooking.clientName}</strong>
                </p>
                <p>
                  Service: <strong className="text-[#6B4F3A]">{approvingBooking.service}</strong>
                </p>
                <p>
                  Session: <strong>{approvingBooking.preferredDate} ({approvingBooking.preferredTime || 'Flexible'})</strong>
                </p>
                <p className="text-[11px] text-[#66645F] pt-1 border-t border-[#D8D2C8]/70">
                  Approving this reservation will lock the studio slot on the availability calendar and send a branded approval confirmation email to <strong>{approvingBooking.clientEmail}</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setApprovingBooking(null)}
                disabled={processingApprove}
                className="px-3.5 py-2 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] hover:bg-[#F4F1EC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickApprove}
                disabled={processingApprove}
                className="px-4 py-2 rounded-[4px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                {processingApprove ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reject Confirmation Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1A]/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] shadow-2xl overflow-hidden space-y-0">
            <div className="p-4 border-b border-[#D8D2C8] bg-rose-50 text-rose-950 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold font-heading">Reject Booking Request</h3>
                <p className="text-[11px] text-rose-800 font-mono">{rejectingBooking.bookingId}</p>
              </div>
            </div>

            <div className="p-5 text-xs text-[#1C1C1A] space-y-3 bg-white">
              <p>
                Are you sure you want to decline this booking for <strong>{rejectingBooking.clientName}</strong>?
              </p>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Reason for Rejection *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                >
                  <option value="Date unavailable / Fully booked">Date unavailable / Fully booked</option>
                  <option value="Outside service area">Outside service area</option>
                  <option value="Client requested cancellation">Client requested cancellation</option>
                  <option value="Studio maintenance or holiday">Studio maintenance or holiday</option>
                  <option value="Other">Other (custom explanation)</option>
                </select>
              </div>

              {rejectionReason === 'Other' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Custom Explanation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                disabled={processingReject}
                className="px-3.5 py-2 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] hover:bg-[#F4F1EC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickReject}
                disabled={processingReject}
                className="px-4 py-2 rounded-[4px] bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                {processingReject ? 'Declining...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1C1A]/85 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#6B4F3A]" />
                <h3 className="text-sm font-semibold font-heading text-[#1C1C1A]">
                  Approval Email Card Preview · {previewBooking.bookingId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBooking(null)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#E8E3DB]/40">
              {loadingPreview ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#6B4F3A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#66645F]">Rendering high-fidelity email card...</p>
                </div>
              ) : previewHtml ? (
                <div
                  className="rounded-[4px] overflow-hidden border border-[#D8D2C8] shadow-sm bg-white"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-xs text-[#66645F] text-center py-12">No preview available.</p>
              )}
            </div>

            <div className="p-4 border-t border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC] text-xs">
              <span className="text-[#66645F]">
                Recipient: <strong className="text-[#1C1C1A]">{previewBooking.clientName}</strong> ({previewBooking.clientEmail})
              </span>
              <button
                type="button"
                onClick={() => setPreviewBooking(null)}
                className="px-4 py-2 text-xs uppercase font-semibold rounded-[4px] bg-[#1C1C1A] hover:bg-[#6B4F3A] text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
