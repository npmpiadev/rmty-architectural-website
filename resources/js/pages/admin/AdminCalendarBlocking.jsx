import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

/* ──────────────── CONSTANTS ──────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "";
const MONTH_NAMES = [
    "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
    "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];
const DAYS_OF_WEEK = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
        for (const m of [0, 30]) {
            if (h === 17 && m > 0) break;
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
})();

const springTransition = { type: "spring", damping: 25, stiffness: 300 };

const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const MAX_VISIBLE_EVENTS = 3;

const fmtTime12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const hr = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
};

/* ──────────────── COMPONENT ──────────────── */
export default function AdminCalendarBlocking() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [popoverDate, setPopoverDate] = useState(null);
    const popoverRef = useRef(null);
    const toastRef = useRef(null);

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const showToast = (msg) => {
        setSuccessMessage(msg);
        if (toastRef.current) clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setSuccessMessage(""), 3000);
    };

    useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

    // Close popover on outside click
    useEffect(() => {
        if (!popoverDate) return;
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setPopoverDate(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [popoverDate]);

    /* ── Fetch data with proper auth headers ── */
    const fetchSlots = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [blockedRes, bookedRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/blocked-slots`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        ...getAuthHeaders(),
                        "Accept": "application/json",
                    },
                }),
                fetch(`${API_BASE}/api/booked-slots`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                    },
                }),
            ]);

            if (blockedRes.ok) {
                const data = await blockedRes.json();
                setBlockedSlots(Array.isArray(data) ? data : []);
            } else {
                console.error("Blocked slots fetch failed:", await blockedRes.text());
            }

            if (bookedRes.ok) {
                const data = await bookedRes.json();
               const primaries = Array.isArray(data)
                    ? data
                    : [];
                setBookedSlots(primaries);
            } else {
                console.error("Booked slots fetch failed:", await bookedRes.text());
            }
        } catch (err) {
            console.error("Failed to fetch slots:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: "include" });
            } catch {}
            await fetchSlots(true);
        })();

        const interval = setInterval(() => fetchSlots(false), 30000);
        return () => clearInterval(interval);
    }, []);

    /* ── Calendar days ── */
    const calendarDays = useMemo(() => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));
        return days;
    }, [currentYear, currentMonth]);

    const isPrevDisabled =
        viewDate.getFullYear() === today.getFullYear() &&
        viewDate.getMonth() <= today.getMonth();

    const isPastDate = (date) => !date || date < today;

    /* ── Helpers ── */
    const normDate = (s) => s?.blocked_date?.split("T")[0] || s?.blocked_date || "";

    const isBlocked = (dateStr, time) =>
        blockedSlots.some((s) => normDate(s) === dateStr && s.blocked_time === time);

    const isBooked = (dateStr, time) =>
        bookedSlots.some((s) => normDate(s) === dateStr && s.blocked_time === time);

    const getBookingForSlot = (dateStr, time) =>
        bookedSlots.find((s) => normDate(s) === dateStr && s.blocked_time === time) || null;

    const getBlockedCount = (dateStr) =>
        blockedSlots.filter((s) => normDate(s) === dateStr).length;

    const getBookingsForDate = (dateStr) =>
    bookedSlots
        .filter((s) => normDate(s) === dateStr)
        .sort((a, b) => (a.blocked_time || "").localeCompare(b.blocked_time || ""))
        .map((slot) => {

            // blocked/admin slot
            if (slot.type === "blocked") {
                return {
                    ...slot,
                    client_name: "Admin Blocked",
                };
            }

            // booked consultation
            return {
                ...slot,
                client_name:
                    slot.client_name ||
                    slot.first_name && slot.last_name
                        ? `${slot.first_name || ""} ${slot.last_name || ""}`.trim()
                        : "Client",
            };
        });

    /* ── Block / Unblock ── */
    const toggleSlot = async (dateStr, time) => {
        if (isBooked(dateStr, time)) return;
        const wasBlocked = isBlocked(dateStr, time);

        if (wasBlocked) {
            setBlockedSlots((prev) =>
                prev.filter((s) => !(normDate(s) === dateStr && s.blocked_time === time))
            );
            showToast("Slot unblocked");
        } else {
            setBlockedSlots((prev) => [...prev, { blocked_date: dateStr, blocked_time: time }]);
            showToast("Slot blocked");
        }

        try {
            if (wasBlocked) {
                await fetch(`${API_BASE}/api/admin/blocked-slots/by-date-time`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ date: dateStr, time }),
                });
            } else {
                await fetch(`${API_BASE}/api/admin/blocked-slots`, {
                    method: "POST",
                    credentials: "include",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ slots: [{ date: dateStr, time }] }),
                });
            }
            await fetchSlots();
        } catch (err) {
            console.error(err);
            await fetchSlots();
            showToast("Something went wrong — reverted");
        }
    };

    const blockAllForDate = async (dateStr) => {
        const slotsToBlock = TIME_SLOTS.filter(
            (s) => !isBlocked(dateStr, s.value) && !isBooked(dateStr, s.value)
        ).map((s) => ({ date: dateStr, time: s.value }));

        if (slotsToBlock.length === 0) return;

        setBlockedSlots((prev) => [
            ...prev,
            ...slotsToBlock.map((s) => ({ blocked_date: s.date, blocked_time: s.time })),
        ]);
        showToast(`Blocked ${slotsToBlock.length} slot(s)`);

        try {
            await fetch(`${API_BASE}/api/admin/blocked-slots`, {
                method: "POST",
                credentials: "include",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ slots: slotsToBlock }),
            });
            await fetchSlots();
        } catch (err) {
            console.error(err);
            await fetchSlots();
            showToast("Something went wrong — reverted");
        }
    };

    const unblockAllForDate = async (dateStr) => {
        const blockedForDate = blockedSlots.filter(
            (s) => (s.blocked_date?.split("T")[0] || s.blocked_date) === dateStr
        );
        if (blockedForDate.length === 0) return;

        const idsToRemove = new Set(blockedForDate.map((s) => s.id).filter(Boolean));
        setBlockedSlots((prev) =>
            prev.filter((s) => {
                if (idsToRemove.size > 0) return !idsToRemove.has(s.id);
                return normDate(s) !== dateStr;
            })
        );
        showToast(`Unblocked ${blockedForDate.length} slot(s)`);

        try {
            await Promise.all(
                blockedForDate.map((s) =>
                    fetch(`${API_BASE}/api/admin/blocked-slots/${s.id}`, {
                        method: "DELETE",
                        credentials: "include",
                        headers: getAuthHeaders(),
                    })
                )
            );
            await fetchSlots();
        } catch (err) {
            console.error(err);
            await fetchSlots();
            showToast("Something went wrong — reverted");
        }
    };

    /* ── Labels & Stats ── */
    const selectedDateLabel = selectedDate
        ? new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
          })
        : "Select a date";

    const totalBlocked = blockedSlots.length;
    const totalBooked = bookedSlots.length;
    const todayStr = formatDate(today);
    const appointmentsToday = bookedSlots.filter((s) => normDate(s) === todayStr).length;

    const statCards = [
        { label: "Blocked Slots",       value: totalBlocked,               icon: <BanIcon      className="w-5 h-5 text-red-500" /> },
        { label: "Booked Slots",         value: totalBooked,                icon: <CalendarIcon className="w-5 h-5 text-blue-500" /> },
        { label: "Today's Appointments", value: appointmentsToday,          icon: <ClockIcon    className="w-5 h-5 text-emerald-500" /> },
        { label: "Total Unavailable",    value: totalBlocked + totalBooked, icon: <LockIcon     className="w-5 h-5 text-neutral-500" /> },
    ];

    const selectedDateBookings = selectedDate
    ? getBookingsForDate(selectedDate)
        .filter((b) => !b.is_buffer)
    : [];
    const isSelectedPast = selectedDate ? new Date(selectedDate) < today : false;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 [font-family:var(--font-neue)]">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Calendar
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10">
            {/* Toast */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={springTransition}
                        className="fixed top-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 shadow-lg"
                    >
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Stats */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Block time slots to prevent clients from booking. Already booked slots are shown as unavailable.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px] hover:border-neutral-300"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className="text-neutral-300">{s.icon}</div>
                            </div>
                            <p className="text-3xl font-black text-neutral-900 mt-2">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════ MONTH CALENDAR GRID ═══════════ */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-visible">
                {/* Month header + nav */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                    <h3 className="text-lg font-black tracking-tight text-neutral-900">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const t = new Date();
                                t.setHours(0, 0, 0, 0);
                                setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
                                setSelectedDate(formatDate(t));
                            }}
                            type="button"
                            className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                            disabled={isPrevDisabled}
                            type="button"
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isPrevDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-neutral-100"
                            }`}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                            type="button"
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Day of week headers */}
                <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/60">
                    {DAYS_OF_WEEK.map((day) => (
                        <div
                            key={day}
                            className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 text-center py-2.5 uppercase"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 auto-rows-fr" style={{ overflow: "visible" }}>
                    {calendarDays.map((date, idx) => {
                        const dateStr = date ? formatDate(date) : null;
                        const past = isPastDate(date);
                        const selected = dateStr === selectedDate;
                        const isToday = date && date.getTime() === today.getTime();

                        const bookings = dateStr
                                    ? getBookingsForDate(dateStr)
                                        .filter((b) => !b.is_buffer)
                                    : [];
                        const blockedCount = dateStr ? getBlockedCount(dateStr) : 0;

                        const events = [];
                        bookings.forEach((b) => {
                            events.push({
                                type: b.type === "blocked" ? "blocked" : "booked",

                                label:
                                    b.type === "blocked"
                                        ? `Blocked • ${fmtTime12(b.blocked_time)}`
                                        : `${b.client_name || "Client"} • ${fmtTime12(b.blocked_time)}`,

                                time:
                                    b.type === "blocked"
                                        ? "Blocked"
                                        : b.is_buffer
                                            ? "Buffer"
                                            : "Booked",

                                data: b,
                            });
                        });
                        if (blockedCount > 0) {
                            events.push({
    type: "blocked",
    label: `${blockedCount} Blocked`, time: "", data: null });
                        }

                        const visible = events.slice(0, MAX_VISIBLE_EVENTS);
                        const overflow = events.length - MAX_VISIBLE_EVENTS;
                        const isPopoverOpen = popoverDate === dateStr;

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (date) {
                                        setSelectedDate(dateStr);
                                        setPopoverDate(null);
                                    }
                                }}
                                className={`
                                    min-h-[120px] border-b border-r border-neutral-100 p-1.5 flex flex-col transition-colors relative
                                    ${!date ? "bg-neutral-50/40" : "cursor-pointer hover:bg-blue-50/30"}
                                    ${past && !selected ? "bg-neutral-50/40" : ""}
                                    ${selected ? "bg-blue-50/60 ring-2 ring-inset ring-blue-500/30" : ""}
                                `}
                            >
                                {date && (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`
                                                    inline-flex items-center justify-center w-6 h-6 text-[11px] font-bold rounded-full
                                                    ${isToday ? "bg-black text-white" : ""}
                                                    ${past && !isToday ? "text-neutral-300" : ""}
                                                    ${!past && !isToday ? "text-neutral-700" : ""}
                                                `}
                                            >
                                                {date.getDate()}
                                            </span>
                                            {bookings.length > 0 && (
                                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 rounded px-1">
                                                    {bookings.filter((b) => b.type !== "blocked").length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-[3px] flex-1 min-w-0">
                                            {visible.map((ev, i) => (
                                                <div
                                                    key={i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (ev.type === "booked" && ev.data) {
                                                            setSelectedBooking(ev.data);
                                                        } else {
                                                            setSelectedDate(dateStr);
                                                        }
                                                    }}
                                                    className={`
                                                        truncate rounded px-1.5 py-[2px] text-[9px] font-bold leading-tight cursor-pointer transition-opacity
                                                        ${ev.type === "booked"
                                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            : "bg-red-100 text-red-500 hover:bg-red-200"
                                                        }
                                                        ${past && ev.type !== "booked" ? "opacity-40" : ""}
                                                    `}
                                                    title={
                                                        ev.type === "booked"
                                                            ? `${ev.time} — ${ev.label}`
                                                            : ev.label
                                                    }
                                                >
                                                    {ev.time && (
                                                        <span className="mr-0.5 font-medium">{ev.time}</span>
                                                    )}
                                                    {ev.label}
                                                </div>
                                            ))}
                                            {overflow > 0 && (
                                                <span
                                                    className="text-[9px] font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-[2px] cursor-pointer hover:bg-blue-100 transition-colors inline-block"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPopoverDate(isPopoverOpen ? null : dateStr);
                                                    }}
                                                >
                                                    +{overflow} more
                                                </span>
                                            )}
                                        </div>

                                        {/* Popover */}
                                        {isPopoverOpen && events.length > 0 && (
                                            <div
                                                ref={popoverRef}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 w-[260px] max-h-[280px] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl"
                                            >
                                                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60 sticky top-0">
                                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-500 uppercase">
                                                        {date.toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}{" "}
                                                        — {bookings.length} client
                                                        {bookings.length !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <div className="divide-y divide-neutral-100">
                                                    {events.map((ev, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                if (ev.type === "booked" && ev.data) {
                                                                    setSelectedBooking(ev.data);
                                                                    setPopoverDate(null);
                                                                }
                                                            }}
                                                            className={`px-4 py-2.5 flex items-center gap-3 transition-colors ${
                                                                ev.type === "booked"
                                                                    ? "cursor-pointer hover:bg-blue-50"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {ev.type === "booked" ? (
                                                                <>
                                                                    <img
                                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                            ev.data?.client_name || "Client"
                                                                        )}&background=dbeafe&color=1d4ed8&rounded=true&size=28`}
                                                                        alt=""
                                                                        className="w-7 h-7 rounded-full shrink-0"
                                                                    />

                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-bold text-neutral-900 truncate">
                                                                            {ev.data?.client_name || "Client"}
                                                                        </p>

                                                                        <p className="text-[10px] font-medium text-neutral-400">
                                                                            {fmtTime12(ev.data?.blocked_time)}
                                                                        </p>
                                                        </div>
                                                                    <span
                                                                        className={`shrink-0 px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase rounded border ${
                                                                            ev.data?.status === "accepted"
                                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                                                                : ev.data?.status === "rescheduled"
                                                                                ? "border-blue-200 bg-blue-50 text-blue-600"
                                                                                : "border-amber-200 bg-amber-50 text-amber-600"
                                                                        }`}
                                                                    >
                                                                        {ev.data?.status || "pending"}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                                                    {ev.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-5 px-6 py-3 border-t border-neutral-100 bg-neutral-50/40">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-blue-100 border border-blue-200" />
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                            Booked
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-red-100 border border-red-200" />
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                            Blocked
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                            Today
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════ TIME SLOTS PANEL ═══════════ */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        key="time-panel"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={springTransition}
                        className="mt-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                            <h3 className="text-sm font-bold tracking-[0.2em] uppercase">
                                {selectedDateLabel}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isSelectedPast && (
                                    <span className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                                        Past date
                                    </span>
                                )}
                                {!isSelectedPast && (
                                    <>
                                        <button
                                            onClick={() => blockAllForDate(selectedDate)}
                                            disabled={updating}
                                            className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            Block All
                                        </button>
                                        <button
                                            onClick={() => unblockAllForDate(selectedDate)}
                                            disabled={updating}
                                            className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            Unblock All
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                            {TIME_SLOTS.map((slot) => {
                                const blocked = isBlocked(selectedDate, slot.value);
                                const booked = isBooked(selectedDate, slot.value);
                                const unavailable = blocked || booked;
                                const booking = booked
                                    ? getBookingForSlot(selectedDate, slot.value)
                                    : null;
                                const canToggle = !isSelectedPast && !booked;

                                return (
                                    <button
                                        key={slot.value}
                                        type="button"
                                        disabled={(updating || isSelectedPast) && !booked}
                                        onClick={() => {
                                            if (booked && booking) {
                                                setSelectedBooking(booking);
                                            } else if (!isSelectedPast) {
                                                toggleSlot(selectedDate, slot.value);
                                            }
                                        }}
                                        className={`
                                            py-3 px-4 text-[11px] font-bold tracking-[0.15em] uppercase transition-all rounded-xl flex items-center justify-between
                                            ${booked
                                                ? "bg-blue-50 text-blue-600 border border-blue-200 cursor-pointer hover:bg-blue-100"
                                                : blocked
                                                ? `bg-red-50 text-red-500 border border-red-300 ${canToggle ? "cursor-pointer hover:bg-red-100" : "opacity-50"}`
                                                : `bg-transparent border border-neutral-200 ${canToggle ? "text-black hover:border-black cursor-pointer" : "text-neutral-300 opacity-50"}`
                                            }
                                            ${updating && !booked ? "opacity-50 pointer-events-none" : ""}
                                        `}
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span>{slot.label}</span>
                                            {booked && booking?.client_name && (
                                                <span className="text-[9px] tracking-normal normal-case font-medium text-blue-400 truncate max-w-[120px]">
                                                    {booking.client_name}
                                                </span>
                                            )}
                                        </div>
                                        {booked && (
                                            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                                    {booking.type === "blocked"
                                                        ? "Blocked"
                                                        : "Booked"}
                                                </span>
                                        )}
                                        {blocked && !booked && (
                                            <span className="text-[9px] tracking-[0.1em] bg-red-100 text-red-500 px-2 py-0.5 rounded">
                                                BLOCKED
                                            </span>
                                        )}
                                        {!unavailable && (
                                            <span className="text-[9px] tracking-[0.1em] text-neutral-400">
                                                {isSelectedPast ? "—" : "OPEN"}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Appointments for selected date */}
            {selectedDate && selectedDateBookings.length > 0 && (
                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-600">
                            Appointments on{" "}
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {selectedDateBookings.map((b, i) => {
                            const hour = parseInt(b.blocked_time?.split(":")[0] || 0);
                            const min = b.blocked_time?.split(":")[1] || "00";
                            const hour12 = hour % 12 || 12;
                            const ampm = hour < 12 ? "AM" : "PM";
                            const timeLabel = `${hour12}:${min} ${ampm}`;
                            const statusColors = {
                                accepted:    "bg-emerald-50 text-emerald-600 border-emerald-200",
                                pending:     "bg-amber-50 text-amber-600 border-amber-200",
                                rescheduled: "bg-blue-50 text-blue-600 border-blue-200",
                            };

                            return (
                                <div
                                    key={i}
                                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedBooking(b)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.client_name || "?")}&background=f3f4f6&color=000000&rounded=true&size=32`}
                                            alt=""
                                            className="w-8 h-8 rounded-full shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-neutral-900 truncate">
                                                {b.client_name}
                                            </p>
                                            <p className="text-[11px] font-medium text-neutral-400 truncate">
                                                {b.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-bold text-neutral-600">{timeLabel}</span>
                                        <span
                                            className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${
                                                statusColors[b.status] || statusColors.pending
                                            }`}
                                        >
                                            {b.type === "blocked"
                                                ? "blocked"
                                                : b.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Booking Detail Drawer */}
            <AnimatePresence>
                {selectedBooking && (
                    <>
                        <motion.div
                            key="booking-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[70] cursor-pointer"
                            onClick={() => setSelectedBooking(null)}
                        />
                        <motion.div
                            key="booking-drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[80] flex flex-col border-l border-neutral-200 [font-family:var(--font-neue)]"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">
                                    Appointment Details
                                </h3>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.client_name || "?")}&background=f3f4f6&color=000000&rounded=true&size=64`}
                                        alt=""
                                        className="w-14 h-14 rounded-full shrink-0"
                                    />
                                    <div>
                                        <p className="text-xl font-black text-neutral-900">
                                            {selectedBooking.client_name}
                                        </p>
                                        <p className="text-sm font-medium text-neutral-500 mt-0.5">
                                            {selectedBooking.email}
                                        </p>
                                        {selectedBooking.phone && (
                                            <p className="text-sm font-medium text-neutral-500 mt-0.5">
                                                {selectedBooking.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Date
                                        </p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {new Date(selectedBooking.blocked_date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Time
                                        </p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {(() => {
                                                const h = parseInt(
                                                    selectedBooking.blocked_time?.split(":")[0] || 0
                                                );
                                                const m =
                                                    selectedBooking.blocked_time?.split(":")[1] || "00";
                                                return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Project Type
                                        </p>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                            {selectedBooking.project_type || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Status
                                        </p>
                                        {(() => {
                                            const colors = {
                                                accepted:    "border-emerald-200 bg-emerald-50 text-emerald-700",
                                                pending:     "border-amber-200 bg-amber-50 text-amber-700",
                                                rescheduled: "border-blue-200 bg-blue-50 text-blue-700",
                                            };
                                            return (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                        colors[selectedBooking.status] || colors.pending
                                                    }`}
                                                >
                                                    {selectedBooking.status}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* ✅ FIXED: was missing the opening <a tag */}
                            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                                <a
                                    href="/admin/consultations"
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    View in Appointments
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d1d1; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
            `}</style>
        </div>
    );
}

/* ──────────────── ICONS ──────────────── */
function CalendarIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
function ClockIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    );
}
function BanIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M5.64 5.64l12.72 12.72" />
        </svg>
    );
}
function ChevronLeftIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}
function ChevronRightIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}
function LockIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
function CloseIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}