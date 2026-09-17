import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { getUnavailableDates, formatDateKey } from '../services/availabilityService';

interface BookingCalendarPickerProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  accentColor?: string;
}

export const BookingCalendarPicker: React.FC<BookingCalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDates() {
      setLoading(true);
      try {
        let dates: string[] = [];
        try {
          const res = await fetch('/api/availability/unavailable-dates');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.unavailableDates)) {
              dates = data.unavailableDates;
            }
          }
        } catch {
          // fallback
        }

        if (dates.length === 0) {
          dates = await getUnavailableDates();
        }

        if (isMounted) {
          setUnavailableDates(new Set(dates));
        }
      } catch (err) {
        console.error('Failed to load unavailable dates:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDates();
    return () => {
      isMounted = false;
    };
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const targetMonth = new Date(year, month - 1, 1);
    if (targetMonth >= currentMonthStart) {
      setCurrentMonthDate(targetMonth);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padArray = Array.from({ length: firstDayIndex }, (_, i) => i);

  const todayStr = formatDateKey(new Date());

  return (
    <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] p-5 shadow-sm max-w-md w-full mx-auto font-sans">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D8D2C8]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#6B4F3A]" />
          <h4 className="text-sm font-semibold text-[#1C1C1A] tracking-wide font-heading">
            {monthNames[month]} {year}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={new Date(year, month, 1) <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            className="p-1.5 rounded text-[#66645F] hover:text-[#1C1C1A] hover:bg-[#E8E3DB] disabled:opacity-25 disabled:cursor-not-allowed transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded text-[#66645F] hover:text-[#1C1C1A] hover:bg-[#E8E3DB] transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[11px] font-semibold text-[#66645F] uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {padArray.map((i) => (
          <div key={`pad-${i}`} className="h-9" />
        ))}

        {daysArray.map((dayNum) => {
          const dateObj = new Date(year, month, dayNum);
          const dateKey = formatDateKey(dateObj);
          const isPast = dateKey < todayStr;
          const isUnavailable = unavailableDates.has(dateKey);
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === todayStr;

          const isDisabled = isPast || isUnavailable;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateKey)}
              className={`h-9 rounded-[4px] text-xs font-medium flex flex-col items-center justify-center relative transition-all duration-150 ${
                isSelected
                  ? 'bg-[#1C1C1A] text-[#F4F1EC] font-bold shadow-sm scale-105 z-10'
                  : isDisabled
                  ? 'text-[#66645F]/40 bg-[#F4F1EC]/60 cursor-not-allowed line-through'
                  : 'text-[#1C1C1A] hover:bg-[#E8E3DB] hover:text-[#6B4F3A] cursor-pointer'
              } ${isToday && !isSelected ? 'border border-[#6B4F3A] font-semibold text-[#6B4F3A]' : ''}`}
            >
              <span>{dayNum}</span>

              {/* Status indicator dot */}
              {isUnavailable && (
                <span className="w-1 h-1 rounded-full bg-rose-500/80 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend & Selected indicator */}
      <div className="mt-4 pt-3 border-t border-[#D8D2C8] text-[11px] flex flex-wrap items-center justify-between gap-2 text-[#66645F]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1C1C1A]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8E3DB] border border-[#D8D2C8]" />
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Booked</span>
          </div>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-1 text-[#6B4F3A] font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>{selectedDate}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-2 text-center text-[10px] text-[#66645F] animate-pulse">
          Syncing studio schedule...
        </div>
      )}
    </div>
  );
};
