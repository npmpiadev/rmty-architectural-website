import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const API_BASE   = import.meta.env.VITE_API_URL ?? "";
const smoothEase = [0.22, 1, 0.36, 1];
const MIN_RESCHEDULE_DATE = new Date().toISOString().slice(0, 10);

// ── 30-minute interval time slots 9AM–5PM ─────────────────────────────────
// Matches Appointments.jsx and AdminCalendarBlocking.jsx exactly.
// The backend expands each confirmed booking into 4 × 30-min buffer slots,
// so unavailable slots passed to this grid will reflect the 2-hour window.
const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
        for (const m of [0, 30]) {
            if (h === 17 && m > 0) break;
            const hour24 = String(h).padStart(2, "0");
            const min    = String(m).padStart(2, "0");
            const hour12 = h % 12 || 12;
            const ampm   = h < 12 ? "AM" : "PM";
            slots.push({
                value: `${hour24}:${min}`,
                label: `${hour12}:${min === "0" ? "00" : min} ${ampm}`,
            });
        }
    }
    return slots;
})();

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(dateTime, opts) {
    if (!dateTime) return "—";
    const d = new Date(String(dateTime).replace(" ", "T"));
    return isNaN(d) ? String(dateTime) : d.toLocaleString("en-US", opts);
}
const fmtDateTime = (dt) => fmt(dt, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const fmtDate     = (dt) => fmt(dt, { month: "long", day: "numeric", year: "numeric" });
const fmtTime     = (dt) => fmt(dt, { hour: "numeric", minute: "2-digit" });

function fmtStatus(s) {
    const v = String(s || "pending").toLowerCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
}

function statusClasses(s) {
    const v = String(s || "").toLowerCase();
    if (v === "accepted" || v === "confirmed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (v === "rescheduled")  return "border-blue-200 bg-blue-50 text-blue-700";
    if (v === "cancelled")    return "border-red-200 bg-red-50 text-red-700";
    if (v === "completed")    return "border-neutral-300 bg-neutral-100 text-neutral-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
}

function buildTimeOptions() {
    return Array.from({ length: 17 }).map((_, i) => {
        const total = 9 * 60 + i * 30;
        const h = Math.floor(total / 60), m = total % 60;
        const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const label = `${h % 12 || 12}:${m === 0 ? "00" : m} ${h < 12 ? "AM" : "PM"}`;
        return { value, label };
    });
}

function splitDT(dt) {
    if (!dt) return { date: "", time: "" };
    const d = new Date(String(dt).replace(" ", "T"));
    if (isNaN(d)) return { date: "", time: "" };
    return {
        date: d.toISOString().slice(0, 10),
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    };
}

// ── Auth-guard hook ───────────────────────────────────────────────────────────
function useAuthGuard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user  = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

    useEffect(() => {
        if (!token || !user) navigate("/auth", { replace: true });
    }, [token, user, navigate]);

    return { token, user };
}

// ── API helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, token, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers ?? {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// ── Normalize API consultation → dashboard shape ──────────────────────────────
function normalizeConsult(c) {
    return {
        id:               c.id,
        status:           c.status ?? "pending",
        firstName:        c.first_name ?? "",
        lastName:         c.last_name ?? "",
        email:            c.email ?? "",
        phone:            c.phone ?? "",
        location:         c.location ?? "",
        projectType:      c.project_type ?? "",
        message:          c.message ?? "",
        consultationDate: c.consultation_date ?? "",
        rescheduleReason: c.reschedule_reason ?? "",
        createdAt:        c.created_at ?? "",
        updatedAt:        c.updated_at ?? "",
        // ── new fields ──
        consultationType: String(c.consultation_type ?? "onsite").toLowerCase(),
        zoomLink:         c.zoom_link ?? null,
    };
}

// ── Fetch unavailable slots (public endpoints — no credentials) ───────────────
async function fetchUnavailableSlots() {
    try {
        const [blockedRes, bookedRes] = await Promise.all([
            fetch(`${API_BASE}/api/blocked-slots`, { headers: { Accept: "application/json" } }),
            fetch(`${API_BASE}/api/booked-slots`,  { headers: { Accept: "application/json" } }),
        ]);
        const blocked = blockedRes.ok ? await blockedRes.json() : [];
        const booked  = bookedRes.ok  ? await bookedRes.json()  : [];
        return [
            ...(Array.isArray(blocked) ? blocked : []),
            ...(Array.isArray(booked)  ? booked  : []),
        ];
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
    const navigate = useNavigate();
    const { token, user } = useAuthGuard();

    const profileDropdownRef = useRef(null);

    const [loading,             setLoading]             = useState(true);
    const [appointments,        setAppointments]        = useState([]);
    const [selectedId,          setSelectedId]          = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showProfileModal,    setShowProfileModal]    = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    const [profileForm, setProfileForm] = useState({
        firstName: "", lastName: "", email: "", phone: "",
    });

    const [rescheduleForm, setRescheduleForm] = useState({
        consultationDate: "", consultationTime: "", rescheduleReason: "",
    });

    // ── Load appointments ─────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const data = await apiFetch("/api/consultations/my-all", token);
                const list = Array.isArray(data.consultations)
                    ? data.consultations.map(normalizeConsult)
                    : Array.isArray(data)
                    ? data.map(normalizeConsult)
                    : [];
                setAppointments(list);
                setSelectedId(list[0]?.id ?? null);
            } catch (err) {
                console.warn("Could not load appointments:", err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    // ── Prefill profile form ──────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const parts = (user.name ?? "").split(" ");
        setProfileForm({
            firstName: user.first_name ?? parts[0] ?? "",
            lastName:  user.last_name  ?? parts.slice(1).join(" ") ?? "",
            email:     user.email ?? "",
            phone:     user.phone ?? "",
        });
    }, []);

    // ── Close dropdown on outside click ──────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
                setShowProfileDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = useMemo(
        () => appointments.find((a) => a.id === selectedId) ?? null,
        [appointments, selectedId],
    );

    const isOnline = selected?.consultationType === "online";

    const displayName = profileForm.firstName?.trim() || user?.email?.split("@")[0] || "Client";
    const initials    = `${profileForm.firstName?.[0] ?? "C"}${profileForm.lastName?.[0] ?? ""}`.toUpperCase();

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const notifications = useMemo(() => {
        if (!selected) return [];
        const items = [
            {
                id: 1,
                title: "Appointment submitted",
                desc:  "Your consultation request has been recorded.",
                time:  fmtDateTime(selected.createdAt),
            },
            {
                id: 2,
                title: `Status: ${fmtStatus(selected.status)}`,
                desc:  selected.status === "rescheduled"
                    ? "Your appointment schedule was updated."
                    : selected.status === "cancelled"
                    ? "Your appointment has been cancelled."
                    : "Track your latest appointment status here.",
                time: fmtDateTime(selected.updatedAt || selected.createdAt),
            },
        ];
        if (selected.rescheduleReason?.trim()) {
            items.push({
                id: 3,
                title: "Reschedule reason",
                desc:  selected.rescheduleReason,
                time:  fmtDateTime(selected.updatedAt),
            });
        }
        return items;
    }, [selected]);

    // ── Check if a slot is unavailable ───────────────────────────────────
    // Excludes the current appointment's own primary slot so the user can
    // re-select their existing time without it appearing blocked.
   const isSlotUnavailable = (date, time) => {

    const currentSplit = selected
        ? splitDT(selected.consultationDate)
        : null;

    return unavailableSlots.some((slot) => {

        const slotDate =
            (slot.blocked_date || "").split("T")[0];

        const slotTime = slot.blocked_time;

        // allow current appointment slot during reschedule
        if (
            currentSplit &&
            currentSplit.date === slotDate &&
            currentSplit.time === slotTime
        ) {
            return false;
        }

        return slotDate === date && slotTime === time;
    });
};

    // ── Handlers ──────────────────────────────────────────────────────────
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        const updated = {
            ...user,
            first_name: profileForm.firstName,
            last_name:  profileForm.lastName,
            name:       `${profileForm.firstName} ${profileForm.lastName}`,
            email:      profileForm.email,
            phone:      profileForm.phone,
        };
        localStorage.setItem("user", JSON.stringify(updated));
        await Swal.fire({ icon: "success", title: "Profile updated", confirmButtonColor: "#000000" });
        setShowProfileModal(false);
        setShowProfileDropdown(false);
    }

    async function handleCancelAppointment() {
        if (!selected) return;
        const result = await Swal.fire({
            icon: "warning",
            title: "Cancel appointment?",
            text: "This action cannot be undone.",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel it",
            cancelButtonText: "No, keep it",
            confirmButtonColor: "#000000",
        });
        if (!result.isConfirmed) return;
        try {
            await apiFetch(`/api/consultations/${selected.id}`, token, {
                method: "PUT",
                body: JSON.stringify({ status: "cancelled" }),
            });
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === selected.id
                        ? { ...a, status: "cancelled", updatedAt: new Date().toISOString() }
                        : a,
                ),
            );
            await Swal.fire({ icon: "success", title: "Appointment cancelled", confirmButtonColor: "#000000" });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#000000" });
        }
    }

    function openRescheduleModal() {
        if (!selected) return;
        const split = splitDT(selected.consultationDate);
        // Snap to nearest valid 30-min slot (or default to 09:00)
        const validTime = TIME_SLOTS.find((s) => s.value === split.time)?.value ?? "09:00";
        setRescheduleForm({
            consultationDate: split.date || MIN_RESCHEDULE_DATE,
            consultationTime: validTime,
            rescheduleReason: selected.rescheduleReason || "",
        });
        fetchUnavailableSlots().then(setUnavailableSlots);
        setShowRescheduleModal(true);
    }

    async function handleConfirmReschedule(e) {
        e.preventDefault();
        if (!rescheduleForm.consultationDate || !rescheduleForm.consultationTime || !rescheduleForm.rescheduleReason.trim()) {
            await Swal.fire({ icon: "warning", title: "Incomplete details", text: "Please fill in all reschedule fields.", confirmButtonColor: "#000000" });
            return;
        }
        const result = await Swal.fire({
            icon: "question", title: "Reschedule appointment?",
            showCancelButton: true, confirmButtonText: "Yes, reschedule",
            cancelButtonText: "Cancel", confirmButtonColor: "#000000",
        });
        if (!result.isConfirmed || !selected) return;
        const newDateTime = `${rescheduleForm.consultationDate} ${rescheduleForm.consultationTime}:00`;
        try {
            await apiFetch(`/api/consultations/${selected.id}`, token, {
                method: "PUT",
                body: JSON.stringify({
                    status:            "rescheduled",
                    consultation_date: newDateTime,
                    reschedule_reason: rescheduleForm.rescheduleReason,
                }),
            });
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === selected.id
                        ? { ...a, status: "rescheduled", consultationDate: newDateTime, rescheduleReason: rescheduleForm.rescheduleReason, updatedAt: new Date().toISOString() }
                        : a,
                ),
            );
            setShowRescheduleModal(false);
            await Swal.fire({ icon: "success", title: "Appointment rescheduled", confirmButtonColor: "#000000" });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "#000000" });
        }
    }

    if (!token || !user) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-100 [font-family:var(--font-neue)]">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Loading Dashboard</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 [font-family:var(--font-neue)]">
            <div className="flex min-h-screen">

                {/* ── Sidebar ── */}
                <aside className="hidden lg:flex w-[260px] bg-black text-white px-6 py-6 flex-col justify-between">
                    <div>
                        <div className="mb-10">
                            <div className="flex items-center gap-4 px-1 py-2">
                                <img src="/images/rmty-logo-transparent.png" alt="RMTY Logo" className="h-12 w-12 object-contain" />
                                <span className="text-[2.2rem] leading-none font-black tracking-tight text-white">RMTY</span>
                            </div>
                        </div>
                        <nav className="space-y-2">
                            <button type="button" className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left bg-neutral-700 text-white cursor-pointer">
                                <CalendarIcon className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-wide">Appointments</span>
                            </button>
                        </nav>
                    </div>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                        <LogoutIcon className="w-5 h-5" />
                        <span className="text-sm font-bold tracking-wide">Logout</span>
                    </button>
                </aside>

                {/* ── Main ── */}
                <div className="flex-1 min-w-0 bg-gray-100">

                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur border-b border-neutral-200 px-4 md:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">Today</p>
                                <p className="text-sm font-bold text-neutral-900">{today}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" className="relative w-11 h-11 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:border-neutral-300 transition-colors cursor-pointer">
                                    <BellIcon className="w-5 h-5" />
                                    {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />}
                                </button>
                                <div className="relative" ref={profileDropdownRef}>
                                    <button type="button" onClick={() => setShowProfileDropdown((p) => !p)} className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 py-2 hover:border-neutral-300 transition-colors cursor-pointer">
                                        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-black uppercase">{initials}</div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-bold text-neutral-900 leading-tight">{displayName}</p>
                                            <p className="text-[11px] font-medium text-neutral-500">Client</p>
                                        </div>
                                        <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                                    </button>
                                    <AnimatePresence>
                                        {showProfileDropdown && (
                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-3 w-[200px] rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden z-50">
                                                <button type="button" onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }} className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer">Edit Profile</button>
                                                <button type="button" onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer">Logout</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="px-4 md:px-6 lg:px-8 py-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: smoothEase }} className="space-y-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 mb-1.5">My Appointments</h2>
                                <p className="text-sm font-medium text-neutral-500">Track your consultation request and manage your schedule.</p>
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard label="Current Status"    value={selected ? fmtStatus(selected.status) : "—"}                        icon={<ActivityIcon />} />
                                <StatCard label="Consultation Date" value={selected ? fmtDate(selected.consultationDate) : "—"}                 icon={<CalendarIcon />} />
                                <StatCard label="Consultation Time" value={selected ? fmtTime(selected.consultationDate) : "—"}                 icon={<ClockIcon />} />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                                <div className="xl:col-span-2 space-y-6">

                                    {/* ── Appointment overview ── */}
                                    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                            <div>
                                                <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">Appointment Overview</h3>
                                                <p className="text-xs font-medium text-neutral-400 mt-1">Details from your submitted form</p>
                                            </div>
                                            {selected && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Consultation type badge */}
                                                    <ConsultationTypeBadge type={selected.consultationType} />
                                                    {/* Status badge */}
                                                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${statusClasses(selected.status)}`}>
                                                        {fmtStatus(selected.status)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {!selected ? (
                                            <div className="p-8 text-center">
                                                <p className="text-sm font-medium text-neutral-500 mb-4">No appointment found.</p>
                                                <button type="button" onClick={() => navigate("/appointments")} className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer">
                                                    Book a Consultation
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-6 space-y-6">

                                                {/* ── Online meeting link banner ── */}
                                                <AnimatePresence>
                                                    {isOnline && (
                                                        <motion.div
                                                            key="zoom-banner"
                                                            initial={{ opacity: 0, y: -6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6 }}
                                                            transition={{ duration: 0.25 }}
                                                            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                                    <VideoIcon className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-blue-700 mb-1">
                                                                        Online / Video Consultation
                                                                    </p>
                                                                    {selected.zoomLink ? (
                                                                        <>
                                                                            <p className="text-xs text-blue-700 mb-3 leading-relaxed">
                                                                                Your meeting link is ready. Join at the scheduled time using the button below.
                                                                            </p>
                                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                                <a
                                                                                    href={selected.zoomLink}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white hover:bg-blue-700 transition-all"
                                                                                >
                                                                                    <VideoIcon className="w-3.5 h-3.5" />
                                                                                    Join Meeting
                                                                                </a>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { navigator.clipboard.writeText(selected.zoomLink); }}
                                                                                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-blue-700 hover:bg-blue-50 transition-all cursor-pointer"
                                                                                >
                                                                                    <CopyIcon className="w-3.5 h-3.5" />
                                                                                    Copy Link
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-[10px] text-blue-500 mt-2 break-all">{selected.zoomLink}</p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-xs text-blue-700 leading-relaxed">
                                                                            Your meeting link will be sent to your email before the appointment.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <DetailCard title="Client Information">
                                                        <FieldRow label="First Name" value={selected.firstName} />
                                                        <FieldRow label="Last Name"  value={selected.lastName} />
                                                        <FieldRow label="Email"      value={selected.email} />
                                                        <FieldRow label="Phone"      value={selected.phone || "—"} />
                                                    </DetailCard>
                                                    <DetailCard title="Project Information">
                                                        <FieldRow label="Location"     value={selected.location || "—"} />
                                                        <FieldRow label="Project Type" value={selected.projectType || "—"} />
                                                        <FieldRow label="Format"       value={selected.consultationType === "online" ? "Online / Video Call" : "Onsite Visit"} />
                                                        <FieldRow label="Submitted"    value={fmtDateTime(selected.createdAt)} />
                                                    </DetailCard>
                                                </div>

                                                <DetailCard title="Project Description">
                                                    <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                                                        {selected.message?.trim() || "No description provided."}
                                                    </p>
                                                </DetailCard>

                                                <DetailCard title="Appointment Tracking">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <TimelineStep label="Submitted"     active />
                                                        <TimelineStep label="Pending Review" active />
                                                        <TimelineStep label={fmtStatus(selected.status)} active />
                                                    </div>
                                                    {selected.rescheduleReason?.trim() && (
                                                        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                                            <p className="text-[10px] font-bold tracking-[0.15em] text-blue-700 uppercase mb-2">Reschedule Reason</p>
                                                            <p className="text-sm text-blue-900 leading-relaxed">{selected.rescheduleReason}</p>
                                                        </div>
                                                    )}
                                                </DetailCard>

                                                {/* Actions */}
                                                {["pending", "accepted", "rescheduled"].includes(selected.status) && (
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button type="button" onClick={openRescheduleModal} className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer">
                                                            Reschedule
                                                        </button>
                                                        <button type="button" onClick={handleCancelAppointment} className="rounded-full border border-red-200 bg-red-50 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-red-700 hover:bg-red-100 transition-all cursor-pointer">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </section>

                                    {/* All appointments list */}
                                    {appointments.length > 1 && (
                                        <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                            <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                                <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">All Appointments</h3>
                                            </div>
                                            <div className="divide-y divide-neutral-100">
                                                {appointments.map((item) => (
                                                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${selectedId === item.id ? "bg-neutral-100" : "hover:bg-neutral-50/60"}`}>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-sm font-bold text-neutral-900">{item.projectType || "Appointment"}</p>
                                                                    <ConsultationTypeBadge type={item.consultationType} small />
                                                                </div>
                                                                <p className="text-xs font-medium text-neutral-500">{fmtDateTime(item.consultationDate)}</p>
                                                            </div>
                                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${statusClasses(item.status)}`}>
                                                                {fmtStatus(item.status)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Notifications */}
                                <div>
                                    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                        <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                            <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">Notifications</h3>
                                        </div>
                                        <div className="divide-y divide-neutral-100">
                                            {notifications.length === 0 ? (
                                                <div className="px-6 py-5 text-sm text-neutral-500">No notifications yet.</div>
                                            ) : notifications.map((n) => (
                                                <div key={n.id} className="px-6 py-4">
                                                    <p className="text-sm font-bold text-neutral-900">{n.title}</p>
                                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{n.desc}</p>
                                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-3">{n.time}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>

            {/* ── Profile Modal ── */}
            <AnimatePresence>
                {showProfileModal && (
                    <ModalShell onClose={() => setShowProfileModal(false)}>
                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-2">Profile</p>
                                <h3 className="text-2xl font-black tracking-tight text-neutral-900">Edit Profile</h3>
                            </div>
                            <DashboardInput label="First Name" value={profileForm.firstName} onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))} />
                            <DashboardInput label="Last Name"  value={profileForm.lastName}  onChange={(e) => setProfileForm((p) => ({ ...p, lastName:  e.target.value }))} />
                            <DashboardInput label="Email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
                            <DashboardInput label="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer">Save</button>
                                <button type="button" onClick={() => setShowProfileModal(false)} className="rounded-full border border-neutral-300 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer">Close</button>
                            </div>
                        </form>
                    </ModalShell>
                )}
            </AnimatePresence>

            {/* ── Reschedule Modal ── */}
            <AnimatePresence>
                {showRescheduleModal && (
                    <ModalShell onClose={() => setShowRescheduleModal(false)}>
                        <form onSubmit={handleConfirmReschedule} className="space-y-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-2">Appointments</p>
                                <h3 className="text-2xl font-black tracking-tight text-neutral-900">Reschedule</h3>
                                <p className="text-sm text-neutral-500 mt-2">Choose a new date and time, then provide your reason.</p>
                            </div>

                            <DashboardInput
                                label="New Date"
                                type="date"
                                min={MIN_RESCHEDULE_DATE}
                                value={rescheduleForm.consultationDate}
                                onChange={(e) => setRescheduleForm((p) => ({ ...p, consultationDate: e.target.value }))}
                            />

                            {/* ── 30-minute time slot grid ── */}
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">
                                    New Time
                                </label>

                                {rescheduleForm.consultationDate && (
                                    <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">
                                        Grayed slots are blocked, booked, or within another booking's 2-hour window.
                                    </p>
                                )}

                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {TIME_SLOTS.map((slot) => {
                                        const unavailable = rescheduleForm.consultationDate
                                            ? isSlotUnavailable(rescheduleForm.consultationDate, slot.value)
                                            : false;
                                        const isSelected = rescheduleForm.consultationTime === slot.value;

                                        return (
                                            <button
                                                key={slot.value}
                                                type="button"
                                                disabled={unavailable}
                                                onClick={() => !unavailable && setRescheduleForm((p) => ({ ...p, consultationTime: slot.value }))}
                                                className={`
                                                    py-2.5 px-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border transition-all text-center
                                                    ${unavailable
                                                        ? "bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through"
                                                        : isSelected
                                                        ? "bg-black text-white border-black"
                                                        : "border-neutral-200 text-neutral-700 hover:border-black cursor-pointer"
                                                    }
                                                `}
                                                title={unavailable ? "Unavailable" : slot.label}
                                            >
                                                {slot.label}
                                                {unavailable && (
                                                    <span className="block text-[8px] normal-case font-medium mt-0.5 no-underline" style={{ textDecoration: "none" }}>
                                                        Unavail.
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <DashboardTextarea
                                label="Reason for Reschedule"
                                rows={4}
                                value={rescheduleForm.rescheduleReason}
                                onChange={(e) => setRescheduleForm((p) => ({ ...p, rescheduleReason: e.target.value }))}
                            />

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer">Confirm</button>
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="rounded-full border border-neutral-300 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer">Close</button>
                            </div>
                        </form>
                    </ModalShell>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── ConsultationTypeBadge ──────────────────────────────────────────────────
function ConsultationTypeBadge({ type, small = false }) {
    const isOnline = String(type || "onsite").toLowerCase() === "online";
    const base = small
        ? "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
        : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]";

    return isOnline ? (
        <span className={`${base} border-blue-200 bg-blue-50 text-blue-700`}>
            <VideoIcon className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
            Online
        </span>
    ) : (
        <span className={`${base} border-neutral-200 bg-neutral-50 text-neutral-600`}>
            <HomeIcon className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
            Onsite
        </span>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ModalShell({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/30" />
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.25 }} className="relative w-full max-w-[560px] rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-2xl">
                {children}
            </motion.div>
        </div>
    );
}
function StatCard({ label, value, icon }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase w-2/3 leading-relaxed">{label}</p>
                <div className="text-neutral-500">{icon}</div>
            </div>
            <p className="text-2xl font-black text-neutral-900 mt-2 leading-tight break-words">{value || "—"}</p>
        </div>
    );
}
function DetailCard({ title, children }) {
    return (
        <section className="rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">{title}</h3>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </section>
    );
}
function FieldRow({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">{label}</span>
            <span className="text-sm font-medium text-neutral-700 break-words">{value}</span>
        </div>
    );
}
function TimelineStep({ label, active }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${active ? "bg-neutral-900" : "bg-neutral-300"}`} />
            <p className="text-sm font-bold text-neutral-800">{label}</p>
        </div>
    );
}
function DashboardInput({ label, type = "text", value, onChange, min }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">{label}</label>
            <input type={type} value={value} onChange={onChange} min={min} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-black transition-colors" />
        </div>
    );
}
function DashboardSelect({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">{label}</label>
            <select value={value} onChange={onChange} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-black transition-colors">
                <option value="">Select {label}</option>
                {options.map((o) => typeof o === "string"
                    ? <option key={o} value={o}>{o}</option>
                    : <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}
function DashboardTextarea({ label, value, onChange, rows = 4 }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">{label}</label>
            <textarea rows={rows} value={value} onChange={onChange} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none resize-none focus:border-black transition-colors" />
        </div>
    );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function VideoIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
}
function HomeIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function CopyIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}
function BellIcon({ className = "w-5 h-5" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}><path d="M6.3 8.8a5.7 5.7 0 1 1 11.4 0c0 6.65 2.85 7.6 2.85 7.6H3.45s2.85-.95 2.85-7.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" /></svg>;
}
function ChevronDownIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>;
}
function CalendarIcon({ className = "w-5 h-5" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function ClockIcon({ className = "w-5 h-5" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ActivityIcon({ className = "w-5 h-5" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function LogoutIcon({ className = "w-5 h-5" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
}