import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CalendarScheduler - Date & time picker that shows blocked and unavailable slots.
 * Used by end-users when booking appointments.
 */
export default function CalendarScheduler({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
    unavailableSlots = [],
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const initialDate = selectedDate ? new Date(selectedDate) : new Date();
    const [viewDate, setViewDate] = useState(
        new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
    ];

    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    // Generate days for the current month view
    const calendarDays = useMemo(() => {
        const days = [];
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(currentYear, currentMonth, i));
        }

        return days;
    }, [currentYear, currentMonth]);

    const handlePrevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const isPrevDisabled =
        viewDate.getFullYear() === today.getFullYear() &&
        viewDate.getMonth() <= today.getMonth();

    const isPastDate = (date) => {
        if (!date) return true;
        return date < today;
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        const d = new Date(selectedDate);
        return (
            date.getDate() === d.getDate() &&
            date.getMonth() === d.getMonth() &&
            date.getFullYear() === d.getFullYear()
        );
    };

    const isToday = (date) => {
        if (!date) return false;
        return date.getTime() === today.getTime();
    };

    // Build a Set of "YYYY-MM-DD|HH:mm" keys for O(1) lookup
    const unavailableSet = useMemo(() => {
        const set = new Set();
        unavailableSlots.forEach((s) => {
            const d = (s.blocked_date || "").split("T")[0];
            const t = s.blocked_time || "";
            if (d && t) set.add(`${d}|${t}`);
        });
        return set;
    }, [unavailableSlots]);

    const isSlotUnavailable = (dateStr, timeValue) =>
        unavailableSet.has(`${dateStr}|${timeValue}`);

const TOTAL_SLOTS = 16;

    const getUnavailableCountForDate = (dateStr) => {
        let count = 0;
        unavailableSlots.forEach((s) => {
            const d = (s.blocked_date || "").split("T")[0];
            if (d === dateStr) count++;
        });
        return count;
    };

    const isDateFullyUnavailable = (dateStr) =>
        getUnavailableCountForDate(dateStr) >= TOTAL_SLOTS;

    // Time slots: 9:00 AM to 5:00 PM in 30-min increments
    const timeSlots = useMemo(() => {
        const slots = [];
        const now = new Date();

        const isTodaySelected =
            selectedDate &&
            new Date(selectedDate).toDateString() === now.toDateString();

        for (let h = 9; h <= 17; h++) {
            for (let m of [0, 30]) {
                if (h === 17 && m > 0) break;

                if (isTodaySelected) {
                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();
                    if (
                        h < currentHour ||
                        (h === currentHour && m <= currentMin)
                    ) {
                        continue;
                    }
                }

                const hour24 = String(h).padStart(2, "0");
                const min = String(m).padStart(2, "0");
                const hour12 = h % 12 || 12;
                const ampm = h < 12 ? "AM" : "PM";

                slots.push({
                    value: `${hour24}:${min}`,
                    label: `${hour12}:${min === "0" ? "00" : min} ${ampm}`,
                });
            }
        }
        return slots;
    }, [selectedDate]);

    const selectedDateLabel = selectedDate
        ? new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
          })
        : "Select a date";

    const handleDateSelect = (dateStr) => {
        onDateChange(dateStr);
        onTimeChange("");
    };

    return (
        <div className="w-full bg-white border border-neutral-300 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-300">
            {/* Left Column: Calendar */}
            <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold tracking-[0.2em] uppercase">
                        {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevMonth}
                            disabled={isPrevDisabled}
                            type="button"
                            className={`p-2 transition-colors ${isPrevDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-neutral-100"}`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            type="button"
                            className="p-2 hover:bg-neutral-100 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                    {daysOfWeek.map((day) => (
                        <div
                            key={day}
                            className="text-[10px] font-bold tracking-widest text-neutral-400 text-center py-2"
                        >
                            {day}
                        </div>
                    ))}
                    {calendarDays.map((date, idx) => {
                        const past = isPastDate(date);
                        const selected = isSelected(date);
                        const todayFlag = isToday(date);
                        const dateStr = date ? formatDate(date) : null;
                        const fullyUnavailable = dateStr && !past ? isDateFullyUnavailable(dateStr) : false;
                        const disabled = past || fullyUnavailable;

                        return (
                            <div
                                key={idx}
                                className="aspect-square flex items-center justify-center"
                            >
                                {date ? (
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleDateSelect(formatDate(date))}
                                        className={`
                                            w-10 h-10 flex items-center justify-center text-xs font-medium transition-all rounded-full
                                            ${disabled ? "text-neutral-300 cursor-not-allowed" : "cursor-pointer"}
                                            ${!disabled && !selected ? "hover:bg-neutral-200 text-black" : ""}
                                            ${selected ? "bg-black text-white" : ""}
                                            ${todayFlag && !selected ? "border border-neutral-300" : ""}
                                            ${fullyUnavailable && !past ? "line-through" : ""}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                ) : (
                                    <div className="w-10 h-10" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Column: Time Slots */}
            <div className="p-6 md:p-8 flex flex-col h-[500px]">
                <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-8">
                    {selectedDateLabel}
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-3">
                        <AnimatePresence mode="wait">
                            {!selectedDate ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center h-full text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase text-center mt-20"
                                >
                                    Select a date <br /> to view available times
                                </motion.div>
                            ) : timeSlots.length === 0 ? (
                                <motion.div
                                    key="none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center h-full text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase text-center mt-20"
                                >
                                    No available slots <br /> remaining for this date
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="slots"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-2"
                                >
                                    {timeSlots.map((slot) => {
                                        const slotUnavailable = selectedDate && isSlotUnavailable(selectedDate, slot.value);
                                        return (
                                            <button
                                                key={slot.value}
                                                type="button"
                                                disabled={slotUnavailable}
                                                onClick={() => onTimeChange(slot.value)}
                                                className={`
                                                    w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all rounded-none
                                                    ${slotUnavailable
                                                        ? "bg-neutral-100 text-neutral-300 border border-neutral-200 cursor-not-allowed line-through"
                                                        : selectedTime === slot.value
                                                            ? "bg-black text-white border-black cursor-pointer"
                                                            : "bg-transparent text-black border border-neutral-300 hover:border-black cursor-pointer"
                                                    }
                                                `}
                                            >
                                                {slotUnavailable ? `${slot.label} — UNAVAILABLE` : slot.label}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d1d1; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
            `}</style>
        </div>
    );
}