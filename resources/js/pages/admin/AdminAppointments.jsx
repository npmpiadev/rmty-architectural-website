import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 6;

const PROJECT_TYPES = [
    { id: "", name: "All Projects" },
    { id: "Residential", name: "Residential" },
    { id: "Commercial", name: "Commercial" },
    { id: "Master Planning", name: "Master Planning" },
    { id: "Interior Architecture", name: "Interior Architecture" },
];

/* ---------------- ANIMATION PRESETS ---------------- */
const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const drawerTransition = { type: "spring", damping: 30, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

/* ---------------- HELPERS ---------------- */
const isArchivedConsultation = (consultation) =>
    consultation?.is_published === 0 ||
    consultation?.is_published === false ||
    String(consultation?.status || "").toLowerCase() === "archived";

const getBookingStatus = (consultation) => {
    if (isArchivedConsultation(consultation)) return "archived";
    const raw = String(consultation?.status || "").trim().toLowerCase();
    if (raw === "accepted" || raw === "cancelled" || raw === "rescheduled" || raw === "pending") {
        return raw;
    }
    return "pending";
};

const parseConsultationDate = (value) => {
    if (!value) return null;
    const raw = String(value)
        .replace(" ", "T")
        .replace(/\.\d+Z$/i, "")
        .replace(/Z$/i, "")
        .replace(/[+-]\d{2}:\d{2}$/, "");
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (value) => {
    const parsed = parseConsultationDate(value);
    if (!parsed) return "Not Specified";
    return parsed.toLocaleDateString(undefined, {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
};

const formatTimeOnly = (value) => {
    const parsed = parseConsultationDate(value);
    if (!parsed) return "";
    return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
};

const getDateRelativeLabel = (value) => {
    const parsed = parseConsultationDate(value);
    if (!parsed) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diffDays = Math.round((dateOnly - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: "Past", className: "text-red-500 bg-red-50 border-red-200" };
    if (diffDays === 0) return { text: "Today", className: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diffDays === 1) return { text: "Tomorrow", className: "text-blue-600 bg-blue-50 border-blue-200" };
    if (diffDays <= 7) return { text: `In ${diffDays} days`, className: "text-blue-600 bg-blue-50 border-blue-200" };
    return null;
};

const isPastConsultation = (consultation) => {
    const parsed = parseConsultationDate(consultation?.consultation_date);
    if (!parsed) return false;
    return parsed < new Date();
};

const toDateTimeLocalValue = (value) => {
    const parsed = parseConsultationDate(value);
    if (!parsed) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const isUpcomingConsultation = (consultation) => {
    const status = getBookingStatus(consultation);
    if (status === "cancelled" || status === "archived") return false;
    const parsed = parseConsultationDate(consultation?.consultation_date);
    if (!parsed) return false;
    return parsed >= new Date();
};

const getStatusMeta = (status) => {
    switch (status) {
        case "accepted":    return { label: "Accepted",    className: "border-emerald-200 bg-emerald-50 text-emerald-700",  dotClassName: "bg-emerald-500" };
        case "cancelled":   return { label: "Cancelled",   className: "border-red-200 bg-red-50 text-red-700",              dotClassName: "bg-red-500" };
        case "rescheduled": return { label: "Rescheduled", className: "border-blue-200 bg-blue-50 text-blue-700",           dotClassName: "bg-blue-500" };
        case "archived":    return { label: "Archived",    className: "border-neutral-200 bg-neutral-100 text-neutral-500", dotClassName: "bg-neutral-400" };
        default:            return { label: "Pending",     className: "border-amber-200 bg-amber-50 text-amber-700",        dotClassName: "bg-amber-500" };
    }
};

const getConsultationTypeMeta = (type) => {
    const t = String(type || "onsite").toLowerCase();
    if (t === "online") return { label: "Online", className: "border-violet-200 bg-violet-50 text-violet-700", icon: "🎥" };
    return { label: "On-site", className: "border-teal-200 bg-teal-50 text-teal-700", icon: "📍" };
};

const getErrorMessage = async (res) => {
    try {
        const data = await res.json();
        return data?.message || data?.error || data?.errors?.[Object.keys(data.errors)[0]]?.[0] || `Request failed with status ${res.status}`;
    } catch {
        return `Request failed with status ${res.status}`;
    }
};

/* ---------------- ANIMATED SELECT ---------------- */
const AnimatedSelect = ({ value, onChange, options, placeholder, error, label, required, className = "py-3" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <div className="flex justify-between mb-1.5">
                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">{label} {required && "*"}</label>
                    {error && <span className="text-[10px] font-bold text-red-500 uppercase">{error}</span>}
                </div>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`group w-full rounded-xl border px-4 bg-white text-sm font-medium outline-none transition-all cursor-pointer flex items-center justify-between select-none ${className} ${error ? "border-red-400 bg-red-50/50 text-red-900" : isOpen ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"}`}
            >
                <span className={`capitalize transition-colors whitespace-nowrap truncate mr-3 ${selectedOption && selectedOption.id !== "" ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-900"}`}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: smoothEase }} className="flex items-center justify-center w-4 h-4 shrink-0 origin-center">
                    <ChevronDown className={`w-4 h-4 transition-colors ${error ? "text-red-400" : "text-neutral-400 group-hover:text-neutral-900"}`} />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.4, ease: smoothEase }} className="absolute top-full left-0 z-[60] w-full mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-lg shadow-neutral-200/20">
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                            {options.map((opt) => (
                                <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); }} className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black cursor-pointer transition-colors capitalize whitespace-nowrap truncate">
                                    {opt.name}
                                </div>
                            ))}
                            {options.length === 0 && <div className="px-4 py-3 text-xs text-neutral-400">No options found</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ---------------- ZOOM LINK MANAGER MODAL ---------------- */
const ZoomLinkModal = ({ currentLink, onSave, onClose, saving }) => {
    const [value, setValue] = useState(currentLink || "");

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 border border-neutral-100 pointer-events-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                            <VideoIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-neutral-900">Zoom Link Settings</h3>
                            <p className="text-sm font-medium text-neutral-500">Default link used for online consultations.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Zoom / Meeting URL</label>
                        <input
                            type="url"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="https://zoom.us/j/..."
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder-neutral-400"
                        />
                        <p className="mt-2 text-[11px] text-neutral-400 font-medium">This link is shared with clients who book online consultations.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 mt-8">
                    <button onClick={() => onSave(value)} disabled={saving} className="w-full rounded-full bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-50 cursor-pointer">
                        {saving ? "Saving..." : "Save Zoom Link"}
                    </button>
                    <button onClick={onClose} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Cancel</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function AdminBookingConsultations() {
    const location = useLocation();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [archiveTarget, setArchiveTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({ consultation_date: "", reschedule_reason: "" });

    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState(null);

    const [activeTab, setActiveTab] = useState("all");
    const [successMessage, setSuccessMessage] = useState("");
    const [updating, setUpdating] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [remindingId, setRemindingId] = useState(null);

    // Zoom link state
    const [zoomLink, setZoomLink] = useState("");
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [savingZoom, setSavingZoom] = useState(false);

    const selected = useMemo(
        () => consultations.find((c) => String(c.id) === String(selectedId)) || null,
        [consultations, selectedId]
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filters, setFilters] = useState({ search: "", type: "" });
    const hasProcessedNavState = useRef(false);

    useEffect(() => {
        const stateId = location.state?.openAppointmentId;
        if (stateId && consultations.length > 0 && !loading && !hasProcessedNavState.current) {
            const found = consultations.find(c => String(c.id) === String(stateId));
            if (found) {
                hasProcessedNavState.current = true;
                setSelectedId(found.id);
                const status = getBookingStatus(found);
                const isArchived = isArchivedConsultation(found);
                const isPast = isPastConsultation(found);
                if (isArchived) setActiveTab("archived");
                else if (isPast && status !== "cancelled") setActiveTab("past");
                else if (["accepted", "rescheduled", "cancelled"].includes(status)) setActiveTab(status);
                else setActiveTab("all");
                window.history.replaceState(null, document.title);
            }
        }
    }, [location.state, consultations, loading]);

    const setFilter = (key, val) => {
        setFilters((prev) => ({ ...prev, [key]: val }));
        setPage(1);
        if (key === "search") setSearchTerm(val);
        else if (key === "type") setFilterType(val);
    };

    const toastTimeoutRef = useRef(null);
    const showToast = (message) => {
        setSuccessMessage(message);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 3000);
    };
    useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);

    const fetchConsultations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/consultations", { credentials: "include", headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await getErrorMessage(res));
            const data = await res.json();
            const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setConsultations(list);
        } catch (err) {
            console.error(err);
            setConsultations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchZoomLink = async () => {
        try {
            const res = await fetch("/api/settings/zoom-link", { credentials: "include", headers: getAuthHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            setZoomLink(data?.zoom_link || "");
        } catch (err) {
            console.error("Failed to fetch zoom link:", err);
        }
    };

    const handleSaveZoomLink = async (link) => {
        setSavingZoom(true);
        try {
            const res = await fetch("/api/settings/zoom-link", {
                method: "PUT",
                credentials: "include",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ zoom_link: link }),
            });
            if (!res.ok) throw new Error(await getErrorMessage(res));
            setZoomLink(link);
            setShowZoomModal(false);
            showToast("Zoom link updated successfully");
        } catch (err) {
            alert(err.message || "Failed to save Zoom link.");
        } finally {
            setSavingZoom(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try { await fetch("/sanctum/csrf-cookie", { credentials: "include" }); } catch (err) { console.error(err); }
            await Promise.all([fetchConsultations(), fetchZoomLink()]);
        };
        init();
    }, []);

    useEffect(() => { setSelectedIds([]); }, [activeTab, page, searchTerm, filterType]);

    /* ---------------- REMIND ---------------- */
    const handleRemind = async (consultation, e) => {
        e?.stopPropagation();
        if (!consultation?.id) { showToast("Invalid consultation selected."); return; }
        if (!consultation?.phone) { showToast("No phone number on file."); return; }
        setRemindingId(consultation.id);
        try {
            const res = await fetch(`/api/consultations/${consultation.id}/remind`, {
                method: "POST",
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `SMS failed with status ${res.status}`);
            showToast(data.sms_sent ? `Reminder sent to ${consultation.first_name || "client"}` : data.message || "Reminder could not be sent.");
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to send reminder.");
        } finally {
            setRemindingId(null);
        }
    };

    /* ---------------- DATA GROUPING ---------------- */
    const nonArchivedConsultations = consultations.filter((c) => !isArchivedConsultation(c));
    const acceptedConsultations    = nonArchivedConsultations.filter((c) => getBookingStatus(c) === "accepted");
    const rescheduledConsultations = nonArchivedConsultations.filter((c) => getBookingStatus(c) === "rescheduled");
    const cancelledConsultations   = nonArchivedConsultations.filter((c) => getBookingStatus(c) === "cancelled");
    const archivedConsultations    = consultations.filter((c) => isArchivedConsultation(c));
    const pastConsultations        = nonArchivedConsultations.filter((c) => {
        const status = getBookingStatus(c);
        return status !== "cancelled" && status !== "archived" && isPastConsultation(c);
    });

    let displayedConsultations = [];
    switch (activeTab) {
        case "accepted":    displayedConsultations = acceptedConsultations; break;
        case "rescheduled": displayedConsultations = rescheduledConsultations; break;
        case "cancelled":   displayedConsultations = cancelledConsultations; break;
        case "archived":    displayedConsultations = archivedConsultations; break;
        case "past":        displayedConsultations = pastConsultations; break;
        default:            displayedConsultations = nonArchivedConsultations; break;
    }

    displayedConsultations = [...displayedConsultations].sort((a, b) => {
        const dateA = parseConsultationDate(a.consultation_date);
        const dateB = parseConsultationDate(b.consultation_date);
        const now = new Date();
        const aPast = dateA ? dateA < now : true;
        const bPast = dateB ? dateB < now : true;
        if (aPast !== bPast) return aPast ? 1 : -1;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return aPast ? dateB - dateA : dateA - dateB;
    });

    if (searchTerm.trim() !== "") {
        const lower = searchTerm.toLowerCase();
        displayedConsultations = displayedConsultations.filter((c) => {
            const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
            return (
                fullName.includes(lower) ||
                String(c.email || "").toLowerCase().includes(lower) ||
                String(c.phone || "").toLowerCase().includes(lower) ||
                getBookingStatus(c).toLowerCase().includes(lower) ||
                String(c.reference_id || "").toLowerCase().includes(lower)
            );
        });
    }

    if (filterType !== "") {
        displayedConsultations = displayedConsultations.filter((c) => String(c.project_type || "") === String(filterType));
    }

    const totalPages = Math.max(1, Math.ceil(displayedConsultations.length / PAGE_SIZE));
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const paginated       = displayedConsultations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalBookings   = nonArchivedConsultations.length;
    const upcomingBookings  = nonArchivedConsultations.filter((c) => isUpcomingConsultation(c)).length;
    const cancelledBookings = cancelledConsultations.length;
    const onlineBookings    = nonArchivedConsultations.filter((c) => String(c.consultation_type || "").toLowerCase() === "online").length;

    const statCards = [
        { label: "Total Bookings",    value: totalBookings,    icon: <CalendarIcon className="w-5 h-5 text-black" /> },
        { label: "Upcoming Bookings", value: upcomingBookings, icon: <ClockIcon className="w-5 h-5 text-blue-600" /> },
        { label: "Online Sessions",   value: onlineBookings,   icon: <VideoIcon className="w-5 h-5 text-violet-600" /> },
        { label: "Cancelled",         value: cancelledBookings,icon: <BanIcon className="w-5 h-5 text-red-600" /> },
    ];

    const tabs = [
        { id: "all",        label: "All Bookings", count: nonArchivedConsultations.length },
        { id: "accepted",   label: "Accepted",     count: acceptedConsultations.length },
        { id: "rescheduled",label: "Rescheduled",  count: rescheduledConsultations.length },
        { id: "cancelled",  label: "Cancelled",    count: cancelledConsultations.length },
        { id: "past",       label: "Past",         count: pastConsultations.length },
        { id: "archived",   label: "Archived",     count: archivedConsultations.length },
    ];

    const sendUpdateRequest = async (id, payload) => {
        const res = await fetch(`/api/consultations/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            credentials: "include",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json", "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(await getErrorMessage(res));
        return res.json();
    };

    const updateConsultationRecord = async ({ id, payload, successText, afterSuccess }) => {
        setUpdating(true);
        try {
            await sendUpdateRequest(id, payload);
            await fetchConsultations();
            showToast(successText);
            if (afterSuccess) afterSuccess();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong.");
        } finally {
            setUpdating(false);
        }
    };

    /* ---------------- BULK SELECTION ---------------- */
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(paginated.map((c) => c.id));
        else setSelectedIds([]);
    };
    const handleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

    /* ---------------- BULK ACTIONS ---------------- */
    const confirmBulkAction = async () => {
        setUpdating(true);
        try {
            if (bulkAction === "archive" || bulkAction === "restore") {
                const payload = bulkAction === "restore" ? { is_published: 1, status: "pending" } : { is_published: 0, status: "archived" };
                await Promise.all(selectedIds.map((id) => sendUpdateRequest(id, payload)));
                await fetchConsultations();
                showToast(bulkAction === "restore" ? "Records restored successfully" : "Records archived successfully");
            } else if (bulkAction === "cancel") {
                await Promise.all(selectedIds.map((id) => sendUpdateRequest(id, { status: "cancelled", is_published: 1 })));
                await fetchConsultations();
                showToast("Selected bookings cancelled");
            } else if (bulkAction === "delete") {
                await Promise.all(selectedIds.map((id) =>
                    fetch(`/api/consultations/${id}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() })
                        .then(async (res) => { if (!res.ok) throw new Error(await getErrorMessage(res)); })
                ));
                await fetchConsultations();
                showToast("Records deleted permanently");
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "An error occurred during bulk action.");
        } finally {
            setUpdating(false);
            setBulkAction(null);
            setSelectedIds([]);
            if (selected && selectedIds.includes(selected.id)) setSelectedId(null);
        }
    };

    /* ---------------- SINGLE ACTIONS ---------------- */
    const confirmCancel = async () => {
        if (!cancelTarget) return;
        await updateConsultationRecord({
            id: cancelTarget.id,
            payload: { status: "cancelled", is_published: 1 },
            successText: "Booking cancelled successfully",
            afterSuccess: () => setCancelTarget(null),
        });
    };

    const openRescheduleModal = (consultation) => {
        setRescheduleTarget(consultation);
        setRescheduleForm({
            consultation_date: toDateTimeLocalValue(consultation?.consultation_date),
            reschedule_reason: consultation?.reschedule_reason || "",
        });
    };

    const confirmReschedule = async () => {
        if (!rescheduleTarget) return;
        if (!rescheduleForm.consultation_date) { alert("Please select the new consultation date and time."); return; }
        await updateConsultationRecord({
            id: rescheduleTarget.id,
            payload: { status: "rescheduled", is_published: 1, consultation_date: rescheduleForm.consultation_date, reschedule_reason: rescheduleForm.reschedule_reason },
            successText: "Booking rescheduled successfully",
            afterSuccess: () => { setRescheduleTarget(null); setRescheduleForm({ consultation_date: "", reschedule_reason: "" }); },
        });
    };

    const confirmArchive = async () => {
        if (!archiveTarget) return;
        await updateConsultationRecord({
            id: archiveTarget.id,
            payload: { is_published: 0, status: "archived" },
            successText: "Record archived successfully",
            afterSuccess: () => { if (selected?.id === archiveTarget.id) setSelectedId(null); setArchiveTarget(null); },
        });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/consultations/${deleteTarget.id}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await getErrorMessage(res));
            await fetchConsultations();
            showToast("Record deleted permanently");
            if (selected?.id === deleteTarget.id) setSelectedId(null);
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong.");
        } finally {
            setUpdating(false);
        }
    };

    const handleRestore = async (consultation) => {
        await updateConsultationRecord({
            id: consultation.id,
            payload: { is_published: 1, status: "pending" },
            successText: "Record restored successfully",
            afterSuccess: () => { if (selected?.id === consultation.id) setSelectedId(null); },
        });
    };

    const areAllCurrentPageSelected = paginated.length > 0 && paginated.every((item) => selectedIds.includes(item.id));

    return (
        <div className="flex flex-col h-full [font-family:var(--font-neue)] relative pb-10">
            {/* STAT CARDS */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">Manage all consultation booking submissions.</p>
                    {/* Zoom Link Manager Button */}
                    <button
                        onClick={() => setShowZoomModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100 transition-all cursor-pointer self-start md:self-auto"
                    >
                        <VideoIcon className="w-4 h-4" />
                        <span>Zoom Link</span>
                        {zoomLink ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-200 text-violet-800 text-[9px] font-bold uppercase tracking-wide">Set</span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-500 text-[9px] font-bold uppercase tracking-wide">Not set</span>
                        )}
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px] hover:border-neutral-300">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">{s.label}</p>
                                <div className="text-neutral-300">{s.icon}</div>
                            </div>
                            <p className="text-3xl font-black text-neutral-900 mt-2">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* TABS & SEARCH */}
            <div className="flex flex-col xl:flex-row gap-4 border-b border-neutral-200 pb-6 mb-6 items-start xl:items-center w-full">
                <div className="flex overflow-x-auto no-scrollbar w-full xl:w-auto gap-2 shrink-0 pb-1 xl:pb-0">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1); setSelectedId(null); }}
                            className={`whitespace-nowrap shrink-0 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer flex-1 md:flex-none text-center ${activeTab === tab.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"}`}>
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                <div className="w-full flex-1 min-w-0 flex">
                    <AnimatePresence mode="wait">
                        {selectedIds.length > 0 ? (
                            <motion.div key="bulk-actions" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2, ease: smoothEase }}
                                className="flex flex-col sm:flex-row items-center gap-3 w-full bg-neutral-50 px-4 py-2.5 sm:py-0 sm:h-[42px] rounded-xl border border-neutral-200 xl:justify-end">
                                <span className="text-sm font-bold text-neutral-700 sm:mr-2 whitespace-nowrap">{selectedIds.length} Selected</span>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button onClick={() => setBulkAction("cancel")} className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap">Cancel Selected</button>
                                    <button onClick={() => setBulkAction("archive")} className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-700 hover:border-black hover:text-black transition-all cursor-pointer whitespace-nowrap">Archive Selected</button>
                                    <button onClick={() => setSelectedIds([])} className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer rounded-lg hover:bg-neutral-200 ml-1 shrink-0" title="Clear Selection">
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="filters" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: smoothEase }} className="flex flex-col sm:flex-row items-center w-full">
                                <motion.div layout className="relative w-full flex-1 min-w-0">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input type="text" placeholder="Search by client, email, or Reference ID..." value={filters.search} onChange={(e) => setFilter("search", e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium placeholder-neutral-400 text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 [font-family:inherit]" />
                                </motion.div>
                                <motion.div layout className="w-full sm:w-auto min-w-[11rem] sm:max-w-[50%] shrink-0 mt-3 sm:mt-0 sm:ml-3">
                                    <AnimatedSelect value={filterType} placeholder="All Projects" options={PROJECT_TYPES} className="py-2.5" onChange={(id) => { setFilterType(id); setPage(1); }} />
                                </motion.div>
                                <motion.div layout className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3 shrink-0">
                                    <AnimatePresence>
                                        {(searchTerm || filterType !== "") && (
                                            <motion.div layout initial={{ opacity: 0, height: 0, width: 0 }} animate={{ opacity: 1, height: "auto", width: "auto" }} exit={{ opacity: 0, height: 0, width: 0 }} transition={{ duration: 0.25, ease: smoothEase }} className="overflow-hidden self-stretch sm:self-auto shrink-0 sm:!h-[42px]">
                                                <motion.div initial={{ x: -20 }} animate={{ x: 0 }} exit={{ x: -20 }} transition={{ duration: 0.25, ease: smoothEase }} className="pb-3 sm:pb-0 sm:pr-3 w-full h-full">
                                                    <button onClick={() => { setSearchTerm(""); setFilterType(""); setPage(1); }} className="w-full sm:w-auto text-red-400 rounded-xl bg-white border border-neutral-200 h-[42px] hover:border-neutral-300 px-6 text-sm hover:text-red-600 font-medium transition-colors active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center">Clear</button>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <motion.button layout transition={{ duration: 0.25, ease: smoothEase }} onClick={fetchConsultations}
                                        className="w-full sm:w-[42px] h-[42px] shrink-0 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-black transition-colors flex justify-center items-center cursor-pointer overflow-hidden hover:border-neutral-300" title="Refresh Table">
                                        <RefreshIcon className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`} />
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white relative overflow-hidden">
                    <AnimatePresence>
                        {loading && (
                            <motion.div key="table-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4 rounded-2xl">
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Fetching Records</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-x-auto pb-4">
                        {!loading && paginated.length === 0 ? (
                            <div className="flex flex-col h-full min-h-[400px] items-center justify-center text-center p-8 gap-4">
                                <CalendarIcon className="w-12 h-12 text-neutral-300" />
                                <div>
                                    <p className="text-base font-bold text-neutral-900">No appointments found</p>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">{searchTerm || filterType !== "" ? "No records match your current filters." : "There are no records in this table yet."}</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-neutral-50 border-b border-neutral-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-5 w-12 align-middle">
                                            <input type="checkbox" checked={areAllCurrentPageSelected} onChange={handleSelectAll} className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer" />
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Client</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Reference</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Project Type</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Mode</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-center">Schedule</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-center">Status</th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginated.map((c) => {
                                        const status = getBookingStatus(c);
                                        const statusMeta = getStatusMeta(status);
                                        const typeMeta = getConsultationTypeMeta(c.consultation_type);
                                        const isReminding = remindingId === c.id;

                                        return (
                                            <tr key={c.id} onClick={() => setSelectedId(c.id)}
                                                className={`group cursor-pointer transition-colors hover:bg-neutral-50 min-h-[73px] ${String(selectedId) === String(c.id) ? "bg-neutral-50" : ""} ${isPastConsultation(c) && getBookingStatus(c) !== "cancelled" && getBookingStatus(c) !== "archived" ? "opacity-60" : ""}`}>
                                                <td className="py-4 px-5 align-middle" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => handleSelect(c.id)} className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer" />
                                                </td>
                                                <td className="py-4 px-5 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${c.first_name || ""} ${c.last_name || ""}`)}&background=f3f4f6&color=000000&rounded=true`} alt="Avatar" className="w-8 h-8 rounded-full object-cover hidden sm:block" />
                                                        <div>
                                                            <p className="text-sm font-bold text-neutral-900 truncate max-w-[180px]">{c.first_name} {c.last_name}</p>
                                                            <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[220px] mt-0.5 tracking-wide">{c.email}</p>
                                                            {c.phone && <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[220px] mt-0.5 tracking-wide">{c.phone}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 align-middle">
                                                    <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{c.reference_id ?? "—"}</span>
                                                </td>
                                                <td className="py-4 px-5 align-middle">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">{c.project_type || "N/A"}</span>
                                                </td>
                                                {/* Consultation Type column */}
                                                <td className="py-4 px-5 align-middle">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeMeta.className}`}>
                                                        <span>{typeMeta.icon}</span>
                                                        {typeMeta.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 align-middle text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <p className={`text-sm font-bold leading-tight ${isPastConsultation(c) && getBookingStatus(c) !== "cancelled" ? "text-red-400" : "text-neutral-900"}`}>{formatDateOnly(c.consultation_date)}</p>
                                                        {formatTimeOnly(c.consultation_date) && <p className="text-[11px] font-medium text-neutral-400">{formatTimeOnly(c.consultation_date)}</p>}
                                                        {(() => { const rel = getDateRelativeLabel(c.consultation_date); return rel ? <span className={`inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${rel.className}`}>{rel.text}</span> : null; })()}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 align-middle text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusMeta.className}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClassName}`} />
                                                        {statusMeta.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-nowrap justify-end gap-2 overflow-x-auto no-scrollbar">
                                                        {activeTab === "archived" ? (
                                                            <>
                                                                <button onClick={() => handleRestore(c)} disabled={updating} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:border-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Restore</button>
                                                                <button onClick={() => setDeleteTarget(c)} disabled={updating} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Delete</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setCancelTarget(c)} disabled={updating || status === "cancelled"} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Cancel</button>
                                                                <button onClick={() => openRescheduleModal(c)} disabled={updating} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:border-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Reschedule</button>
                                                                <button onClick={(e) => handleRemind(c, e)} disabled={updating || isReminding || !c.phone || status === "cancelled"} title={!c.phone ? "No phone number on file" : "Send SMS reminder"} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-500 transition-all hover:border-amber-400 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                                                    {isReminding ? <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <BellIcon className="w-4 h-4" />}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 mt-auto rounded-b-2xl gap-4 sm:gap-0">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase text-center sm:text-left">
                                {displayedConsultations.length} Consultation{displayedConsultations.length !== 1 ? "s" : ""}{" · "}{paginated.length} shown on this page
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 hover:text-black cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 hover:text-black cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DETAIL DRAWER */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div key="detail-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-[70] cursor-pointer" onClick={() => setSelectedId(null)} />
                        <motion.div key="detail-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={drawerTransition} className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-white z-[80] flex flex-col border-l border-neutral-200 [font-family:var(--font-neue)]">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Consultation Details</h3>
                                <button onClick={() => setSelectedId(null)} className="text-neutral-400 hover:text-black transition-colors outline-none cursor-pointer"><CloseIcon className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                {selected.reference_id && (
                                    <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { navigator.clipboard.writeText(selected.reference_id); showToast("Reference ID Copied"); }} title="Click to copy">
                                        <span className="font-mono text-[10px] text-neutral-400 tracking-wider">{selected.reference_id}</span>
                                        <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">Client</p>
                                    <p className="text-2xl font-black text-neutral-900 leading-tight">{selected.first_name} {selected.last_name}</p>
                                    <p className="text-sm font-medium text-neutral-600 mt-1">{selected.email}</p>
                                    {selected.phone && <p className="text-sm font-medium text-neutral-600 mt-1">{selected.phone}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Project Type</p>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">{selected.project_type || "N/A"}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Location</p>
                                        <span className="text-sm font-medium text-neutral-700">{selected.location || "N/A"}</span>
                                    </div>
                                </div>

                                {/* Consultation Type + Zoom Link in drawer */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Consultation Mode</p>
                                        {(() => {
                                            const typeMeta = getConsultationTypeMeta(selected.consultation_type);
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeMeta.className}`}>
                                                    <span>{typeMeta.icon}</span>
                                                    {typeMeta.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Booking Status</p>
                                        {(() => { const status = getBookingStatus(selected); const meta = getStatusMeta(status); return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />{meta.label}
                                            </span>
                                        ); })()}
                                    </div>
                                </div>

                                {/* Zoom link section — shown for online consultations */}
                                {String(selected.consultation_type || "").toLowerCase() === "online" && (
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Meeting Link</p>
                                        {(selected.zoom_link || zoomLink) ? (
                                            <a
                                                href={selected.zoom_link || zoomLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100 transition-all cursor-pointer max-w-full"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <VideoIcon className="w-4 h-4 shrink-0" />
                                                <span className="truncate text-xs">{selected.zoom_link || zoomLink}</span>
                                                <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                                                <VideoIcon className="w-4 h-4 text-neutral-400" />
                                                <span className="text-xs font-medium text-neutral-400">No Zoom link set.</span>
                                                <button onClick={() => setShowZoomModal(true)} className="ml-auto text-[10px] font-bold text-violet-600 hover:text-violet-800 uppercase tracking-wide cursor-pointer">Set Link</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Date</p>
                                        <span className={`text-sm font-bold ${isPastConsultation(selected) && getBookingStatus(selected) !== "cancelled" ? "text-red-500" : "text-neutral-900"}`}>{formatDateOnly(selected.consultation_date)}</span>
                                        {(() => { const rel = getDateRelativeLabel(selected.consultation_date); return rel ? <span className={`inline-block ml-2 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${rel.className}`}>{rel.text}</span> : null; })()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Time</p>
                                        <span className="text-sm font-bold text-neutral-900">{formatTimeOnly(selected.consultation_date) || "Not Specified"}</span>
                                    </div>
                                </div>

                                {selected.reschedule_reason && (
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Reschedule Note</p>
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                            <p className="text-sm font-medium text-blue-900 leading-relaxed whitespace-pre-wrap">{selected.reschedule_reason}</p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Message / Details</p>
                                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                                        <p className="text-sm font-medium text-neutral-800 leading-relaxed whitespace-pre-wrap">{selected.message || selected.content || "No additional message provided by client."}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 space-y-3 shrink-0">
                                {activeTab === "archived" ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRestore(selected)} disabled={updating} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3.5 text-xs font-bold text-blue-600 uppercase tracking-wider transition-all hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                            <RestoreIcon className="w-4 h-4" />Restore Record
                                        </button>
                                        <button onClick={() => setDeleteTarget(selected)} disabled={updating} className="flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" title="Delete Permanently">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar">
                                            <button onClick={() => setCancelTarget(selected)} disabled={updating || getBookingStatus(selected) === "cancelled"} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-bold text-red-600 uppercase tracking-wider transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap">
                                                <BanIcon className="w-4 h-4" />Cancel
                                            </button>
                                            <button onClick={() => openRescheduleModal(selected)} disabled={updating} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-bold text-blue-600 uppercase tracking-wider transition-all hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap">
                                                <ClockIcon className="w-4 h-4" />Reschedule
                                            </button>
                                        </div>
                                        <button onClick={() => handleRemind(selected)} disabled={updating || remindingId === selected.id || !selected.phone || getBookingStatus(selected) === "cancelled"} title={!selected.phone ? "No phone number on file" : "Send SMS reminder to client"} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 uppercase tracking-wider transition-all hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                            {remindingId === selected.id ? <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <BellIcon className="w-4 h-4" />}
                                            {remindingId === selected.id ? "Sending..." : "Send SMS Reminder"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <AnimatePresence>
                {cancelTarget && (
                    <motion.div key="modal-cancel" className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={() => setCancelTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><BanIcon className="w-6 h-6" /></div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">Cancel Booking?</h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">This will mark the booking as cancelled and notify the client by email.</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={confirmCancel} disabled={updating} className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 cursor-pointer">{updating ? "Cancelling..." : "Yes, cancel it"}</button>
                                <button onClick={() => setCancelTarget(null)} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Back</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {rescheduleTarget && (
                    <motion.div key="modal-reschedule" className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={() => setRescheduleTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-lg rounded-[2rem] bg-white p-8 border border-neutral-100 pointer-events-auto">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><ClockIcon className="w-6 h-6" /></div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">Reschedule Booking</h3>
                                <p className="text-sm font-medium text-neutral-500">Update the client's consultation schedule.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">New Schedule</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" value={rescheduleForm.consultation_date?.split("T")[0] || ""} onChange={(e) => setRescheduleForm((prev) => ({ ...prev, consultation_date: `${e.target.value}T${prev.consultation_date?.split("T")[1] || "09:00"}` }))} min={new Date().toISOString().split("T")[0]} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900" />
                                        <select value={rescheduleForm.consultation_date?.split("T")[1] || ""} onChange={(e) => setRescheduleForm((prev) => ({ ...prev, consultation_date: `${prev.consultation_date?.split("T")[0] || ""}T${e.target.value}` }))} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900">
                                            <option value="" disabled hidden>Select Time</option>
                                            {Array.from({ length: 17 }).map((_, i) => {
                                                const totalMinutes = 9 * 60 + i * 30;
                                                const hours = Math.floor(totalMinutes / 60);
                                                const minutes = totalMinutes % 60;
                                                const h12 = hours % 12 === 0 ? 12 : hours % 12;
                                                const ampm = hours < 12 ? "AM" : "PM";
                                                const label = `${h12}:${minutes === 0 ? "00" : minutes} ${ampm}`;
                                                const val = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                                                return <option key={val} value={val}>{label}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Reason / Note</label>
                                    <textarea rows={4} value={rescheduleForm.reschedule_reason} onChange={(e) => setRescheduleForm((prev) => ({ ...prev, reschedule_reason: e.target.value }))} placeholder="Optional note for the reschedule..." className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 resize-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-8">
                                <button onClick={confirmReschedule} disabled={updating} className="w-full rounded-full bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{updating ? "Saving..." : "Save rescheduled booking"}</button>
                                <button onClick={() => setRescheduleTarget(null)} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {archiveTarget && (
                    <motion.div key="modal-archive" className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={() => setArchiveTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/20 text-amber-600"><ArchiveIcon className="w-6 h-6" /></div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">Archive Record?</h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">This record will be hidden. You can restore it later from the archived tab.</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={confirmArchive} disabled={updating} className="w-full rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">{updating ? "Archiving..." : "Yes, archive it"}</button>
                                <button onClick={() => setArchiveTarget(null)} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <motion.div key="modal-delete" className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={() => setDeleteTarget(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><TrashIcon className="w-6 h-6" /></div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">Delete Permanently?</h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">This action cannot be undone and will permanently remove this record.</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={confirmDelete} disabled={updating} className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 cursor-pointer">{updating ? "Deleting..." : "Yes, delete it"}</button>
                                <button onClick={() => setDeleteTarget(null)} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {bulkAction && (
                    <motion.div key="modal-bulk" className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/20 cursor-pointer" onClick={() => setBulkAction(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={springTransition} className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto">
                            <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${bulkAction === "delete" ? "bg-red-50 text-red-600" : bulkAction === "archive" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                                {bulkAction === "delete" ? <TrashIcon className="w-6 h-6" /> : bulkAction === "archive" ? <ArchiveIcon className="w-6 h-6" /> : <RestoreIcon className="w-6 h-6" />}
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2 capitalize">{bulkAction} {selectedIds.length} items?</h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">{bulkAction === "delete" ? "This action cannot be undone and will permanently remove these items." : bulkAction === "archive" ? "These items will be hidden from the active tables." : "These items will be restored to the bookings table."}</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={confirmBulkAction} disabled={updating} className={`w-full rounded-full px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer ${bulkAction === "delete" ? "bg-red-600 hover:bg-red-700" : bulkAction === "archive" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}>{updating ? "Processing..." : `Yes, ${bulkAction} all`}</button>
                                <button onClick={() => setBulkAction(null)} className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ZOOM LINK MODAL */}
            <AnimatePresence>
                {showZoomModal && (
                    <ZoomLinkModal
                        currentLink={zoomLink}
                        onSave={handleSaveZoomLink}
                        onClose={() => setShowZoomModal(false)}
                        saving={savingZoom}
                    />
                )}
            </AnimatePresence>

            {/* TOAST */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div key="toast-success" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={springTransition} className="fixed bottom-10 right-10 z-[110] pointer-events-none [font-family:var(--font-neue)]">
                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border bg-black text-white border-black">
                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5">{successMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function BellIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function CalendarIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function ClockIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
}
function BanIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M5.64 5.64l12.72 12.72" /></svg>;
}
function ArchiveIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>;
}
function RestoreIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
}
function ChevronDown({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9l6 6 6-6" /></svg>;
}
function ChevronLeft({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 18l-6-6 6-6" /></svg>;
}
function ChevronRight({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 18l6-6-6-6" /></svg>;
}
function CloseIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function TrashIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
}
function CheckIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>;
}
function SearchIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
}
function RefreshIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>;
}
function VideoIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
}
function ExternalLinkIcon({ className = "w-4 h-4" }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}