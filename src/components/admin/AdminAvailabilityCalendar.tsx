import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldAlert, Lock, Unlock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AvailabilityRecord, setBlockedDate, unblockDate, formatDateKey } from '../../services/availabilityService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';

interface AdminAvailabilityCalendarProps {
  bookings: Booking[];
}

export const AdminAvailabilityCalendar: React.FC<AdminAvailabilityCalendarProps> = ({ bookings }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [availabilityMap, setAvailabilityMap] = useState<Map<string, AvailabilityRecord>>(new Map());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string>('Studio Maintenance / Closed');
  const [saving, setSaving] = useState<boolean>(false);

  // Real-time listener on availability collection
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'availability')),
      (snapshot) => {
        const map = new Map<string, AvailabilityRecord>();
        snapshot.docs.forEach((doc) => {
          map.set(doc.id, doc.data() as AvailabilityRecord);
        });
        setAvailabilityMap(map);
      },
      (err) => {
        console.error('Availability listener error:', err);
      }
    );
    return () => unsub();
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padArray = Array.from({ length: firstDayIndex }, (_, i) => i);
  const todayStr = formatDateKey(new Date());

  // Find booked booking for date if any
  const getBookingForDate = (dateKey: string) => {
    return bookings.find(
      (b) => b.preferredDate === dateKey && (b.status === 'approved' || b.status === 'pending')
    );
  };

  const selectedRecord = selectedDateKey ? availabilityMap.get(selectedDateKey) : null;
  const selectedBooking = selectedDateKey ? getBookingForDate(selectedDateKey) : null;

  const handleBlockDate = async () => {
    if (!selectedDateKey) return;
    setSaving(true);
    try {
      await setBlockedDate(selectedDateKey, blockReason, user?.email || 'admin');
      showSuccess(`Date ${selectedDateKey} is now blocked.`);
    } catch (err: any) {
      showError(err.message || 'Failed to block date');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async () => {
    if (!selectedDateKey) return;
    setSaving(true);
    try {
      await unblockDate(selectedDateKey);
      showSuccess(`Date ${selectedDateKey} is now available.`);
    } catch (err: any) {
      showError(err.message || 'Failed to unblock date');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span>Master Availability &amp; Studio Calendar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Control available booking dates, manage studio closures, and prevent customer double bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold text-white">
              {monthNames[month]} {year}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar + Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-xs font-semibold text-slate-500 uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {padArray.map((i) => (
              <div key={`pad-${i}`} className="h-14 rounded-lg bg-slate-950/20" />
            ))}

            {daysArray.map((dayNum) => {
              const dateObj = new Date(year, month, dayNum);
              const dateKey = formatDateKey(dateObj);
              const isToday = dateKey === todayStr;
              const isSelected = selectedDateKey === dateKey;

              const avail = availabilityMap.get(dateKey);
              const isBlocked = avail?.status === 'BLOCKED';
              const isBooked = avail?.status === 'BOOKED' || !!getBookingForDate(dateKey);

              // Styling according to status
              let statusBg = 'bg-slate-950/50 hover:bg-slate-800/80 text-slate-200 border-slate-800/60';
              let badgeColor = 'bg-emerald-500';
              let statusText = 'Available';

              if (isBlocked) {
                statusBg = 'bg-slate-800/80 text-slate-400 border-slate-700/60';
                badgeColor = 'bg-slate-500';
                statusText = 'Blocked';
              } else if (isBooked) {
                statusBg = 'bg-rose-950/40 text-rose-200 border-rose-900/60 hover:bg-rose-950/60';
                badgeColor = 'bg-rose-500';
                statusText = 'Booked';
              } else {
                badgeColor = 'bg-emerald-500';
              }

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`h-14 rounded-lg p-1.5 text-left border flex flex-col justify-between transition-all cursor-pointer relative ${statusBg} ${
                    isSelected ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.02] z-10 shadow-lg' : ''
                  } ${isToday ? 'font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs ${isToday ? 'text-amber-400' : ''}`}>
                      {dayNum}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${badgeColor}`} />
                  </div>

                  <div className="text-[10px] truncate leading-tight font-medium opacity-80">
                    {statusText}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-3 flex flex-wrap items-center gap-5 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Green: Available for client bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Red: Booked (Session reserved)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Gray: Blocked (Studio closed / maintenance)</span>
            </div>
          </div>
        </div>

        {/* Date Inspector & Actions (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          {selectedDateKey ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Date Inspection
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{selectedDateKey}</h4>
                </div>
                <button
                  onClick={() => setSelectedDateKey(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Display */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedRecord?.status === 'BLOCKED'
                        ? 'bg-slate-700 text-slate-200'
                        : selectedRecord?.status === 'BOOKED' || selectedBooking
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-800'
                        : 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {selectedRecord?.status === 'BLOCKED'
                      ? 'BLOCKED'
                      : selectedRecord?.status === 'BOOKED' || selectedBooking
                      ? 'BOOKED'
                      : 'AVAILABLE'}
                  </span>
                </div>

                {selectedRecord?.status === 'BLOCKED' && selectedRecord.reason && (
                  <div className="text-slate-300 pt-1 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-500">Reason:</span> {selectedRecord.reason}
                  </div>
                )}

                {selectedBooking && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                    <p className="text-amber-400 font-semibold">{selectedBooking.clientName}</p>
                    <p className="text-slate-400">{selectedBooking.service}</p>
                    <p className="text-slate-500 text-[10px]">ID: {selectedBooking.bookingId}</p>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              {selectedRecord?.status === 'BLOCKED' ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-400">
                    This date is currently blocked from public bookings.
                  </p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleUnblockDate}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unblock &amp; Mark Available</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Block Reason (Studio closure, maintenance, holiday)
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g. Studio Closed, Equipment Maintenance"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleBlockDate}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Block Date for Public</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-slate-500 p-4 space-y-2">
              <CalendarIcon className="w-8 h-8 opacity-40 text-amber-400" />
              <p className="text-xs">Click any calendar date to inspect details, block dates, or view reservations.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            Changes sync instantly to the public booking calendar.
          </div>
        </div>
      </div>
    </div>
  );
};
