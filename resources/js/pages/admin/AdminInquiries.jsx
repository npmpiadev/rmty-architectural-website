import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}/api${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {}),
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

const PLATFORM_LABELS = {
    gmail: "Gmail",
    facebook: "Facebook",
    instagram: "Instagram",
    website: "Website",
};

const PLATFORM_COLORS = {
    gmail: "bg-red-50 text-red-600 border-red-100",
    facebook: "bg-blue-50 text-blue-600 border-blue-100",
    instagram: "bg-pink-50 text-pink-600 border-pink-100",
    website: "bg-gray-50 text-gray-600 border-gray-100",
};

const STATUS_COLORS = {
    new: "bg-blue-50 text-blue-600 border-blue-100",
    replied: "bg-emerald-50 text-emerald-600 border-emerald-100",
    archived: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

/* ---------------- ANIMATION PRESETS ---------------- */
const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const drawerTransition = { type: "spring", damping: 30, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

/* ---------------- ANIMATED SELECT COMPONENT ---------------- */
const AnimatedSelect = ({
    value,
    onChange,
    options,
    placeholder,
    error,
    label,
    required,
    className = "py-3",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            )
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedOption = options.find(
        (opt) => opt.id.toString() === value.toString(),
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <div className="flex justify-between mb-1.5">
                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                        {label} {required && "*"}
                    </label>
                    {error && (
                        <span className="text-[10px] font-bold text-red-500 uppercase">
                            {error}
                        </span>
                    )}
                </div>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`group w-full rounded-xl border px-4 bg-white text-sm font-medium outline-none transition-all cursor-pointer flex items-center justify-between select-none ${className} ${
                    error
                        ? "border-red-400 bg-red-50/50 text-red-900"
                        : isOpen
                          ? "border-neutral-900 ring-1 ring-neutral-900"
                          : "border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
            >
                <span
                    className={`capitalize transition-colors whitespace-nowrap truncate mr-3 ${
                        selectedOption && selectedOption.id !== ""
                            ? "text-black"
                            : "text-neutral-400 group-hover:text-black"
                    }`}
                >
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: smoothEase }}
                    className="flex items-center justify-center w-4 h-4 shrink-0 origin-center"
                >
                    <ChevronDown
                        className={`w-4 h-4 transition-colors ${error ? "text-red-400" : "text-neutral-400 group-hover:text-black"}`}
                    />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: smoothEase }}
                        className="absolute top-full left-0 z-[60] w-full mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-lg shadow-neutral-200/20"
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                    }}
                                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black cursor-pointer transition-colors capitalize whitespace-nowrap truncate"
                                >
                                    {opt.name.toLowerCase()}
                                </div>
                            ))}
                            {options.length === 0 && (
                                <div className="px-4 py-3 text-xs text-neutral-400">
                                    No options found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ---------------- COMPONENT ---------------- */
const PAGE_SIZE = 6;

export default function AdminInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        platform: "",
        status: "new",
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});

    const location = useLocation();
    const [selectedThreadKey, setSelectedThreadKey] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState(null);

    // Single Actions
    const [deleteId, setDeleteId] = useState(null);
    const [archiveId, setArchiveId] = useState(null);

    // Reply
    const [replyId, setReplyId] = useState(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replying, setReplying] = useState(false);
    const [toast, setToast] = useState(null);

    const [readIds, setReadIds] = useState(() => {
        try {
            return new Set(
                JSON.parse(localStorage.getItem("inquiry_read_ids") || "[]"),
            );
        } catch {
            return new Set();
        }
    });

    const markAsRead = useCallback((id) => {
        setReadIds((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            try {
                localStorage.setItem(
                    "inquiry_read_ids",
                    JSON.stringify([...next]),
                );
            } catch {}
            return next;
        });
    }, []);

    const searchTimer = useRef(null);
    const pollTimer = useRef(null);
    const pendingMarkReadKey = useRef(null);
    const hasProcessedNavState = useRef(false);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // Safely check if we can reply in-app
    function canReply(inquiry) {
        if (!inquiry || !inquiry.platform) return false;
        const platform = String(inquiry.platform).toLowerCase().trim();

        if (platform === "sms" && inquiry.phone) return true;
        if (["gmail", "website", "email"].includes(platform) && inquiry.email)
            return true;
        if (["facebook", "instagram", "viber", "messenger"].includes(platform))
            return true;
        return false;
    }

    // Smart External Linking based on Platform
    function getExternalReplyLink(inquiry) {
        if (!inquiry) return "#";
        const platform = String(inquiry.platform).toLowerCase().trim();
        const email = inquiry.email || "";
        const phone = inquiry.phone || "";
        const subject = encodeURIComponent(
            `Re: ${inquiry.subject || "Your Inquiry"}`,
        );

        if (platform === "facebook" || platform === "messenger") {
            return (
                inquiry.thread_url ||
                "https://business.facebook.com/latest/inbox/messenger"
            );
        }
        if (platform === "instagram" || platform === "ig") {
            return (
                inquiry.thread_url ||
                "https://business.facebook.com/latest/inbox/instagram"
            );
        }
        if (platform === "sms") {
            return `sms:${phone}`;
        }
        if (platform === "viber") {
            return `viber://chat?number=${phone}`;
        }
        if (platform === "gmail") {
            return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`;
        }
        return `mailto:${email}?subject=${subject}`;
    }

    function getExternalReplyLabel(platform) {
        const p = String(platform).toLowerCase().trim();
        if (p === "facebook" || p === "messenger")
            return "Open Meta Business Suite";
        if (p === "instagram" || p === "ig") return "Open IG Business Suite";
        if (p === "sms") return "Reply via SMS App";
        if (p === "viber") return "Reply via Viber";
        if (p === "gmail") return "Reply in Gmail";
        return "Reply via Default Email";
    }

    const load = useCallback(
        async (p = 1, f = filters, silent = false) => {
            try {
                if (!silent) setLoading(true);
                // Increased per_page to ensure we have all data for client-side thread pagination
                const params = new URLSearchParams({ page: 1, per_page: 200 });
                if (f.platform) params.set("platform", f.platform);
                if (f.search) params.set("search", f.search);
                const [data, statsData] = await Promise.all([
                    apiFetch(`/inquiries?${params}`),
                    apiFetch("/inquiries/stats"),
                ]);
                setInquiries(data.data || []);
                setMeta(data);
                setStats(statsData);
                setError(null);
            } catch (e) {
                setError("Failed to load inquiries.");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [filters],
    );

    const allThreads = useMemo(() => {
        const map = {};
        const sorted = [...inquiries].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
        sorted.forEach((inq) => {
            const key = inq.email || inq.phone || `id_${inq.id}`;
            if (!map[key]) {
                map[key] = {
                    key,
                    name: inq.name || inq.first_name || "Unknown",
                    email: inq.email,
                    phone: inq.phone,
                    platform: inq.platform,
                    messages: [],
                };
            }
            map[key].messages.push(inq);
        });
        return Object.values(map)
            .map((t) => ({
                ...t,
                latestMsg: t.messages[t.messages.length - 1],
                hasNew: t.messages.some((m) => m.status === "new"),
                hasReplied:
                    t.messages.every(
                        (m) =>
                            m.status === "replied" || m.status === "archived",
                    ) && t.messages.some((m) => m.status === "replied"),
                isArchived: t.messages.every((m) => m.status === "archived"),
                allIds: t.messages.map((m) => m.id),
            }))
            .sort(
                (a, b) =>
                    new Date(b.latestMsg.created_at) -
                    new Date(a.latestMsg.created_at),
            );
    }, [inquiries]);

    const threads = useMemo(() => {
        return allThreads.filter((t) => {
            if (filters.status === "new") return t.hasNew;
            if (filters.status === "replied") return !t.hasNew && t.hasReplied;
            if (filters.status === "archived") return t.isArchived;
            return true;
        });
    }, [allThreads, filters.status]);

    const paginatedThreads = useMemo(() => {
        return threads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }, [threads, page]);

    const totalPages = Math.ceil(threads.length / PAGE_SIZE) || 1;

    const selectedThread = useMemo(
        () => allThreads.find((t) => t.key === selectedThreadKey) ?? null,
        [allThreads, selectedThreadKey],
    );

    useEffect(() => {
        load(1, filters);
        pollTimer.current = setInterval(() => load(page, filters, true), 30000);
        return () => clearInterval(pollTimer.current);
    }, []); // eslint-disable-line

    useEffect(() => {
        const key = location.state?.openThreadKey;
        if (key && allThreads.length > 0 && !hasProcessedNavState.current) {
            const thread = allThreads.find((t) => t.key === key);
            if (thread) {
                hasProcessedNavState.current = true;
                setSelectedThreadKey(key);
                // Switch tab to the correct status
                if (thread.isArchived) {
                    if (filters.status !== "archived")
                        setFilter("status", "archived");
                } else if (thread.hasNew) {
                    if (filters.status !== "new") setFilter("status", "new");
                } else if (thread.hasReplied) {
                    if (filters.status !== "replied")
                        setFilter("status", "replied");
                }
                pendingMarkReadKey.current = key;
                window.history.replaceState(null, document.title);
            }
        }
    }, [location.state, allThreads, filters.status]);

    useEffect(() => {
        if (!pendingMarkReadKey.current) return;
        const thread = allThreads.find(
            (t) => t.key === pendingMarkReadKey.current,
        );
        if (thread) {
            thread.messages.forEach((m) => markAsRead(m.id));
            pendingMarkReadKey.current = null;
        }
    }, [allThreads]);

    useEffect(() => {
        setSelectedIds([]);
        setPage(1);
    }, [filters]);

    function setFilter(key, val) {
        const f = { ...filters, [key]: val };
        setFilters(f);
        setPage(1);
        if (key === "search") {
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => load(1, f), 400);
        } else {
            load(1, f);
        }
    }

    /* ---------------- PAGINATION HANDLERS ---------------- */
    const handlePrevPage = () => {
        if (page > 1) {
            setPage((p) => p - 1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage((p) => p + 1);
        }
    };

    /* ---------------- BULK SELECTION ---------------- */
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(threads.flatMap((t) => t.allIds));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectThread = (thread) => {
        const ids = thread.allIds;
        const allSelected = ids.every((id) => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    /* ---------------- BULK ACTIONS ---------------- */
    const confirmBulkAction = async () => {
        setUpdating(true);
        try {
            if (bulkAction === "archive" || bulkAction === "restore") {
                const status = bulkAction === "archive" ? "archived" : "new";
                await Promise.all(
                    selectedIds.map((id) =>
                        apiFetch(`/inquiries/${id}`, {
                            method: "PUT",
                            body: JSON.stringify({ status }),
                        }),
                    ),
                );
                showToast(
                    `Inquiries ${bulkAction === "restore" ? "Restored" : "Archived"} Successfully`,
                );
            } else if (bulkAction === "delete") {
                await Promise.all(
                    selectedIds.map((id) =>
                        apiFetch(`/inquiries/${id}`, { method: "DELETE" }),
                    ),
                );
                showToast("Inquiries Deleted Permanently");
            }

            setInquiries((prev) =>
                prev.filter((i) => !selectedIds.includes(i.id)),
            );
            if (
                selectedThread &&
                selectedThread.allIds.some((id) => selectedIds.includes(id))
            )
                setSelectedThreadKey(null);

            await load(page, filters, true);
        } catch (e) {
            console.error(e);
            showToast("An error occurred during bulk action.", "error");
        } finally {
            setUpdating(false);
            setBulkAction(null);
            setSelectedIds([]);
        }
    };

    /* ---------------- SINGLE ACTIONS ---------------- */
    async function handleStatus(id, status) {
        setUpdating(true);
        try {
            await apiFetch(`/inquiries/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status }),
            });

            setInquiries((prev) =>
                prev.map((i) => (i.id === id ? { ...i, status } : i)),
            );

            const formattedStatus =
                status.charAt(0).toUpperCase() + status.slice(1);
            showToast(`Marked as ${formattedStatus}`);
            await load(page, filters, true);
        } catch {
            setError("Failed to update.");
        } finally {
            setUpdating(false);
        }
    }

    async function confirmArchive() {
        if (!archiveId) return;
        await handleStatus(archiveId, "archived");
        setArchiveId(null);
    }

    async function handleDelete(deleteTargetId) {
        setUpdating(true);
        try {
            await apiFetch(`/inquiries/${deleteTargetId}`, {
                method: "DELETE",
            });

            setInquiries((prev) => prev.filter((i) => i.id !== deleteTargetId));
            if (
                selectedThread?.allIds.length === 1 &&
                selectedThread.allIds[0] === deleteTargetId
            ) {
                setSelectedThreadKey(null);
            }
            setDeleteId(null);
            showToast("Inquiry deleted.");
            await load(page, filters, true);
        } catch {
            setError("Failed to delete.");
        } finally {
            setUpdating(false);
        }
    }

    async function handleReply(id) {
        setReplying(true);
        try {
            await apiFetch(`/inquiries/${id}/reply`, {
                method: "POST",
                body: JSON.stringify({ message: replyMsg }),
            });

            // Mark ALL new messages in the same thread as replied (not just the one being replied to)
            const thread = allThreads.find((t) => t.allIds.includes(id));
            const threadNewIds = thread
                ? thread.messages
                      .filter((m) => m.status === "new")
                      .map((m) => m.id)
                : [id];

            setInquiries((prev) =>
                prev.map((i) =>
                    i.id === id
                        ? {
                              ...i,
                              status: "replied",
                              admin_reply: replyMsg,
                              replied_at: new Date().toISOString(),
                          }
                        : i,
                ),
            );

            setReplyId(null);
            setReplyMsg("");
            showToast("Replied successfully");
            await load(page, filters, true);
        } catch {
            showToast("Failed to send reply.", "error");
        } finally {
            setReplying(false);
        }
    }

    const statCards = [
        {
            label: "Total Inquiries",
            value: stats.total ?? 0,
            icon: <InboxIcon className="w-5 h-5 text-black" />,
        },
        {
            label: "New Messages",
            value: stats.new ?? 0,
            icon: <SparklesIcon className="w-5 h-5 text-emerald-600" />,
        },
        {
            label: "Replied",
            value: stats.replied ?? 0,
            icon: <ReplyIcon className="w-5 h-5 text-blue-600" />,
        },
        {
            label: "Archived",
            value: stats.archived ?? 0,
            icon: <ArchiveIcon className="w-5 h-5 text-amber-600" />,
        },
    ];

    return (
        <div className="flex flex-col h-full [font-family:var(--font-neue)] relative pb-10">
            {/* Header & Stats */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Manage all incoming communications across platforms.
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
                            <p className="text-3xl font-black text-neutral-900 mt-2">
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
                {/* TABS (Left Side) */}
                <div className="flex flex-wrap gap-2.5 w-full xl:w-auto shrink-0">
                    <button
                        onClick={() => setFilter("status", "new")}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer whitespace-nowrap ${
                            filters.status === "new"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                        }`}
                    >
                        New ({stats.new ?? 0})
                    </button>
                    <button
                        onClick={() => setFilter("status", "replied")}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer whitespace-nowrap ${
                            filters.status === "replied"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                        }`}
                    >
                        Replied ({stats.replied ?? 0})
                    </button>
                    <button
                        onClick={() => setFilter("status", "archived")}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer whitespace-nowrap ${
                            filters.status === "archived"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                        }`}
                    >
                        Archived ({stats.archived ?? 0})
                    </button>
                </div>

                {/* FILTERS OR BULK ACTIONS (Right Side) */}
                <div className="flex flex-col sm:flex-row items-center w-full flex-1 justify-end">
                    <AnimatePresence mode="wait">
                        {selectedIds.length > 0 ? (
                            <motion.div
                                key="bulk-actions"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2, ease: smoothEase }}
                                className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto bg-neutral-50 px-4 py-2.5 sm:py-0 sm:h-[42px] rounded-xl border border-neutral-200 justify-end"
                            >
                                <span className="text-sm font-bold text-neutral-700 sm:mr-2 whitespace-nowrap">
                                    {selectedIds.length} Selected
                                </span>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {filters.status !== "archived" ? (
                                        <button
                                            onClick={() =>
                                                setBulkAction("archive")
                                            }
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            Archive All
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setBulkAction("restore")
                                                }
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                Restore All
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setBulkAction("delete")
                                                }
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                Delete All
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer rounded-lg hover:bg-neutral-200 ml-1 shrink-0"
                                        title="Clear Selection"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="filters"
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: smoothEase }}
                                className="flex flex-col sm:flex-row items-center w-full gap-3 justify-end"
                            >
                                {/* SEARCH BAR */}
                                <motion.div
                                    layout
                                    className="relative w-full flex-1 min-w-0 mt-3 sm:mt-0"
                                >
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search messages or Reference ID..."
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilter("search", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium placeholder-neutral-400 text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 [font-family:inherit]"
                                    />
                                </motion.div>

                                {/* PLATFORM DROPDOWN */}
                                <motion.div
                                    layout
                                    className="w-full sm:w-44 shrink-0"
                                >
                                    <AnimatedSelect
                                        value={filters.platform}
                                        placeholder="All Platforms"
                                        options={Object.entries(
                                            PLATFORM_LABELS,
                                        ).map(([k, v]) => ({ id: k, name: v }))}
                                        className="py-2.5"
                                        onChange={(id) =>
                                            setFilter("platform", id)
                                        }
                                    />
                                </motion.div>

                                {/* CLEAR FILTERS */}
                                <AnimatePresence>
                                    {(filters.search || filters.platform) && (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{
                                                opacity: 1,
                                                width: "auto",
                                            }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{
                                                duration: 0.25,
                                                ease: smoothEase,
                                            }}
                                            className="overflow-hidden self-stretch sm:self-auto shrink-0 sm:!h-[42px] mt-3 sm:mt-0 w-full sm:w-auto"
                                        >
                                            <motion.div
                                                initial={{ x: -20 }}
                                                animate={{ x: 0 }}
                                                exit={{ x: -20 }}
                                                transition={{
                                                    duration: 0.25,
                                                    ease: smoothEase,
                                                }}
                                                className="pb-3 sm:pb-0 sm:pr-3 w-full h-full"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setFilters({
                                                            ...filters,
                                                            search: "",
                                                            platform: "",
                                                        });
                                                        load(1, {
                                                            ...filters,
                                                            search: "",
                                                            platform: "",
                                                        });
                                                    }}
                                                    className="w-full sm:w-auto text-red-400 rounded-xl bg-white border border-neutral-200 h-[42px] px-6 text-sm hover:text-red-600 font-medium transition-colors active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center hover:border-neutral-300"
                                                >
                                                    Clear
                                                </button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* REFRESH BUTTON */}
                                <motion.button
                                    layout
                                    transition={{
                                        duration: 0.25,
                                        ease: smoothEase,
                                    }}
                                    onClick={() => load(page, filters)}
                                    className="w-full sm:w-[42px] h-[42px] shrink-0 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50 transition-all flex justify-center items-center cursor-pointer overflow-hidden hover:border-neutral-300"
                                    title="Refresh Table"
                                >
                                    <RefreshIcon
                                        className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`}
                                    />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 mb-6">
                    {error}
                </div>
            )}

            {/* Table & Detail Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                {/* Table Area */}
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white relative overflow-hidden">
                    <AnimatePresence>
                        {loading && inquiries.length === 0 && (
                            <motion.div
                                key="table-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4 rounded-2xl"
                            >
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                    Fetching Inquiries
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-auto pb-4">
                        {!loading && threads.length === 0 ? (
                            <div className="flex flex-col h-full min-h-[400px] items-center justify-center p-8 text-center gap-4">
                                <InboxIcon className="w-12 h-12 text-neutral-300" />
                                <div>
                                    <p className="text-base font-bold text-neutral-900">
                                        No inquiries found
                                    </p>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">
                                        Try adjusting your filters or check back
                                        later.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100 z-10">
                                    <tr>
                                        <th className="px-5 py-4 w-12 align-middle">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    threads.length > 0 &&
                                                    threads.every((t) =>
                                                        t.allIds.every((id) =>
                                                            selectedIds.includes(
                                                                id,
                                                            ),
                                                        ),
                                                    )
                                                }
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Sender
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Platform
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Reference
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 hidden md:table-cell w-1/3">
                                            Latest Message
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Messages
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 text-right">
                                            Last Activity
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginatedThreads.map((thread) => {
                                        const isUnread =
                                            thread.hasNew &&
                                            !thread.messages.every((m) =>
                                                readIds.has(m.id),
                                            );
                                        const isActive =
                                            selectedThread?.key === thread.key;
                                        const threadSelected =
                                            thread.allIds.every((id) =>
                                                selectedIds.includes(id),
                                            );
                                        return (
                                            <tr
                                                key={thread.key}
                                                onClick={() => {
                                                    setSelectedThreadKey(
                                                        isActive
                                                            ? null
                                                            : thread.key,
                                                    );
                                                    if (!isActive)
                                                        thread.messages.forEach(
                                                            (m) =>
                                                                markAsRead(
                                                                    m.id,
                                                                ),
                                                        );
                                                }}
                                                className={`group cursor-pointer transition-colors hover:bg-neutral-50 h-[73px] ${
                                                    isActive
                                                        ? "bg-neutral-50"
                                                        : isUnread
                                                          ? "bg-blue-50/20"
                                                          : ""
                                                }`}
                                            >
                                                <td
                                                    className="px-5 py-4 align-middle"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={threadSelected}
                                                        onChange={() =>
                                                            handleSelectThread(
                                                                thread,
                                                            )
                                                        }
                                                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <div>
                                                        <p
                                                            className={`text-sm truncate max-w-[200px] ${isUnread ? "font-black text-black" : "font-normal text-neutral-500"}`}
                                                        >
                                                            {thread.name}
                                                        </p>
                                                        {thread.phone && (
                                                            <p className="text-[11px] font-bold text-neutral-600 truncate max-w-[200px] mt-0.5 tracking-wide">
                                                                {thread.phone}
                                                            </p>
                                                        )}
                                                        {thread.email && (
                                                            <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[200px] mt-0.5 tracking-wide">
                                                                {thread.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PLATFORM_COLORS[thread.platform] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}
                                                    >
                                                        {PLATFORM_LABELS[
                                                            thread.platform
                                                        ] ?? thread.platform}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    {thread.latestMsg
                                                        .reference_id && (
                                                        <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                                                            {
                                                                thread.latestMsg
                                                                    .reference_id
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 align-middle hidden md:table-cell">
                                                    <p
                                                        className={`text-[12px] truncate max-w-[220px] xl:max-w-[320px] inline ${isUnread ? "font-semibold text-neutral-800" : "font-normal text-neutral-400"}`}
                                                    >
                                                        {thread.latestMsg
                                                            .admin_reply
                                                            ? `You: ${thread.latestMsg.admin_reply}`
                                                            : thread.latestMsg
                                                                  .message ||
                                                              "—"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600">
                                                            {
                                                                thread.messages
                                                                    .length
                                                            }
                                                        </span>
                                                        {thread.hasNew && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-600 border-blue-100">
                                                                new
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-middle text-right">
                                                    <p className="text-xs font-medium text-neutral-500">
                                                        {thread.latestMsg
                                                            .created_at
                                                            ? new Date(
                                                                  thread
                                                                      .latestMsg
                                                                      .created_at,
                                                              ).toLocaleDateString(
                                                                  undefined,
                                                                  {
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      year: "numeric",
                                                                  },
                                                              )
                                                            : "—"}
                                                    </p>
                                                </td>
                                                <td
                                                    className="px-5 py-4 align-middle text-right"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedThreadKey(
                                                                    thread.key,
                                                                );
                                                                thread.messages.forEach(
                                                                    (m) =>
                                                                        markAsRead(
                                                                            m.id,
                                                                        ),
                                                                );
                                                            }}
                                                            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:border-black hover:text-black cursor-pointer"
                                                        >
                                                            Open
                                                        </button>
                                                        {filters.status !==
                                                        "archived" ? (
                                                            <button
                                                                onClick={() =>
                                                                    setArchiveId(
                                                                        thread
                                                                            .latestMsg
                                                                            .id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 transition-all hover:border-amber-400 hover:text-amber-700 cursor-pointer"
                                                            >
                                                                Archive
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleStatus(
                                                                            thread
                                                                                .latestMsg
                                                                                .id,
                                                                            "new",
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:border-blue-400 hover:text-blue-700 cursor-pointer"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteId(
                                                                            thread
                                                                                .latestMsg
                                                                                .id,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 cursor-pointer"
                                                                >
                                                                    Delete
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

                    {/* TABLE SUMMARY & PAGINATION FOOTER */}
                    {threads.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 mt-auto rounded-b-2xl gap-4 sm:gap-0">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase text-center sm:text-left">
                                {threads.length} Conversation
                                {threads.length !== 1 ? "s" : ""}
                                {" · "}
                                {inquiries.length} Message
                                {inquiries.length !== 1 ? "s" : ""}
                            </p>

                            {/* PAGINATION CONTROLS */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={page <= 1}
                                    className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 hover:text-black cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={page >= totalPages}
                                    className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 hover:text-black cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>{" "}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CHAT THREAD DRAWER */}
            <AnimatePresence>
                {selectedThread && (
                    <>
                        <motion.div
                            key="thread-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[70] cursor-pointer"
                            onClick={() => {
                                setSelectedThreadKey(null);
                                setReplyId(null);
                                setReplyMsg("");
                            }}
                        />
                        <motion.div
                            key="thread-drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={drawerTransition}
                            className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-white z-[80] flex flex-col border-l border-neutral-200 [font-family:var(--font-neue)]"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-neutral-900 truncate">
                                        {selectedThread.name}
                                    </p>
                                    {selectedThread.email && (
                                        <p className="text-[11px] font-medium text-neutral-400 truncate">
                                            {selectedThread.email}
                                        </p>
                                    )}
                                    {selectedThread.phone && (
                                        <p className="text-[11px] font-medium text-neutral-400 truncate">
                                            {selectedThread.phone}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PLATFORM_COLORS[selectedThread.platform] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}
                                    >
                                        {PLATFORM_LABELS[
                                            selectedThread.platform
                                        ] ?? selectedThread.platform}
                                    </span>
                                    {selectedThread.latestMsg?.reference_id && (
                                        <span
                                            className="ml-2 font-mono text-[10px] font-bold text-neutral-400 tracking-wider cursor-pointer hover:text-neutral-700 transition-colors"
                                            title="Click to copy"
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    selectedThread.latestMsg
                                                        .reference_id,
                                                )
                                            }
                                        >
                                            {
                                                selectedThread.latestMsg
                                                    .reference_id
                                            }
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedThreadKey(null);
                                            setReplyId(null);
                                            setReplyMsg("");
                                        }}
                                        className="text-neutral-400 hover:text-black transition-colors outline-none cursor-pointer"
                                    >
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Timeline */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
                                {selectedThread.messages.map((msg, idx) => {
                                    return (
                                        <div key={msg.id} className="space-y-2">
                                            {/* Date separator */}
                                            {(idx === 0 ||
                                                new Date(
                                                    msg.created_at,
                                                ).toDateString() !==
                                                    new Date(
                                                        selectedThread.messages[
                                                            idx - 1
                                                        ].created_at,
                                                    ).toDateString()) && (
                                                <div className="flex items-center gap-3 my-3">
                                                    <div className="flex-1 h-px bg-neutral-100" />
                                                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase whitespace-nowrap">
                                                        {new Date(
                                                            msg.created_at,
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </span>
                                                    <div className="flex-1 h-px bg-neutral-100" />
                                                </div>
                                            )}

                                            {/* User message bubble (left) */}
                                            <div className="flex items-end gap-2">
                                                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-[10px] font-black text-neutral-600 uppercase">
                                                    {
                                                        (selectedThread.name ||
                                                            "?")[0]
                                                    }
                                                </div>
                                                <div className="max-w-[78%]">
                                                    {msg.subject && (
                                                        <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1 ml-1">
                                                            {msg.subject}
                                                        </p>
                                                    )}
                                                    <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3">
                                                        <p className="text-sm font-medium text-neutral-800 leading-relaxed whitespace-pre-wrap">
                                                            {msg.message || "—"}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-neutral-400 mt-1 ml-1">
                                                        {new Date(
                                                            msg.created_at,
                                                        ).toLocaleTimeString(
                                                            undefined,
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                        {msg.status ===
                                                            "archived" && (
                                                            <span className="ml-2 text-amber-500">
                                                                archived
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Admin reply bubble (right) */}
                                            {msg.admin_reply && (
                                                <div className="flex items-end gap-2 justify-end">
                                                    <div className="max-w-[78%]">
                                                        <div className="bg-black rounded-2xl rounded-br-sm px-4 py-3">
                                                            <p className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap">
                                                                {
                                                                    msg.admin_reply
                                                                }
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] font-medium text-neutral-400 mt-1 mr-1 text-right">
                                                            {msg.replied_at
                                                                ? new Date(
                                                                      msg.replied_at,
                                                                  ).toLocaleTimeString(
                                                                      undefined,
                                                                      {
                                                                          hour: "2-digit",
                                                                          minute: "2-digit",
                                                                      },
                                                                  )
                                                                : "Sent"}{" "}
                                                            · You
                                                        </p>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 text-[10px] font-black text-white uppercase">
                                                        A
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Box */}
                            {(() => {
                                const latestNew = [...selectedThread.messages]
                                    .reverse()
                                    .find((m) => m.status === "new");
                                if (!latestNew || !canReply(latestNew))
                                    return (
                                        <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                                            <a
                                                href={getExternalReplyLink(
                                                    selectedThread.latestMsg,
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 cursor-pointer"
                                            >
                                                <ExternalLinkIcon className="w-4 h-4" />
                                                {getExternalReplyLabel(
                                                    selectedThread.latestMsg
                                                        .platform,
                                                )}
                                            </a>
                                        </div>
                                    );
                                return (
                                    <div className="border-t border-neutral-100 bg-white shrink-0 p-4 space-y-3">
                                        <textarea
                                            rows={3}
                                            placeholder={`Reply to ${selectedThread.name}...`}
                                            value={replyMsg}
                                            onChange={(e) => {
                                                setReplyMsg(e.target.value);
                                                setReplyId(latestNew.id);
                                            }}
                                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 resize-none [font-family:inherit]"
                                        />
                                        <div className="flex gap-2">
                                            <a
                                                href={getExternalReplyLink(
                                                    latestNew,
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider transition-all hover:bg-neutral-50 cursor-pointer shrink-0"
                                                title={getExternalReplyLabel(
                                                    latestNew.platform,
                                                )}
                                            >
                                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() =>
                                                    handleReply(latestNew.id)
                                                }
                                                disabled={
                                                    replying || !replyMsg.trim()
                                                }
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                                            >
                                                {replying ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <ReplyIcon className="w-4 h-4" />{" "}
                                                        Send Reply
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Footer actions */}
                            <div className="px-4 pb-4 flex gap-2 shrink-0">
                                {selectedThread.hasNew && (
                                    <button
                                        onClick={() => {
                                            const newIds =
                                                selectedThread.messages
                                                    .filter(
                                                        (m) =>
                                                            m.status === "new",
                                                    )
                                                    .map((m) => m.id);
                                            Promise.all(
                                                newIds.map((id) =>
                                                    apiFetch(
                                                        `/inquiries/${id}`,
                                                        {
                                                            method: "PUT",
                                                            body: JSON.stringify(
                                                                {
                                                                    status: "replied",
                                                                },
                                                            ),
                                                        },
                                                    ),
                                                ),
                                            ).then(() => {
                                                showToast("Marked as Replied");
                                                load(page, filters, true);
                                            });
                                        }}
                                        disabled={updating}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider transition-all hover:border-blue-400 disabled:opacity-50 cursor-pointer"
                                    >
                                        <CheckIcon className="w-3.5 h-3.5" />{" "}
                                        Mark Replied
                                    </button>
                                )}
                                {filters.status !== "archived" ? (
                                    <button
                                        onClick={() =>
                                            setArchiveId(
                                                selectedThread.latestMsg.id,
                                            )
                                        }
                                        disabled={updating}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider transition-all hover:border-amber-400 disabled:opacity-50 cursor-pointer"
                                    >
                                        <ArchiveIcon className="w-3.5 h-3.5" />{" "}
                                        Archive
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleStatus(
                                                selectedThread.latestMsg.id,
                                                "new",
                                            )
                                        }
                                        disabled={updating}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider transition-all hover:border-blue-400 disabled:opacity-50 cursor-pointer"
                                    >
                                        <RestoreIcon className="w-3.5 h-3.5" />{" "}
                                        Restore
                                    </button>
                                )}
                                <button
                                    onClick={() =>
                                        setDeleteId(selectedThread.latestMsg.id)
                                    }
                                    className="flex items-center justify-center rounded-xl border border-red-200 text-red-600 transition-all hover:border-red-400 px-3 py-2.5 cursor-pointer"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* SINGLE ARCHIVE MODAL */}
            <AnimatePresence>
                {typeof archiveId !== "undefined" && archiveId !== null && (
                    <motion.div
                        key="modal-archive"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setArchiveId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto shadow-2xl"
                        >
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                <ArchiveIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">
                                Archive Inquiry?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                This message will be moved to the archives. You
                                can restore it later.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={
                                        typeof confirmArchive !== "undefined"
                                            ? confirmArchive
                                            : () => {}
                                    }
                                    disabled={updating}
                                    className="w-full rounded-full bg-amber-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {updating
                                        ? "Archiving..."
                                        : "Yes, archive it"}
                                </button>
                                <button
                                    onClick={() => setArchiveId(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SINGLE DELETE PERMANENTLY MODAL */}
            <AnimatePresence>
                {typeof deleteId !== "undefined" && deleteId !== null && (
                    <motion.div
                        key="modal-delete"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setDeleteId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto shadow-2xl"
                        >
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <TrashIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">
                                Delete Permanently?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                This action cannot be undone and will
                                permanently remove this record.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={
                                        typeof handleDelete !== "undefined"
                                            ? () => handleDelete(deleteId)
                                            : () => {}
                                    }
                                    disabled={updating}
                                    className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {updating
                                        ? "Deleting..."
                                        : "Yes, delete it"}
                                </button>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BULK ACTION MODAL */}
            <AnimatePresence>
                {bulkAction && (
                    <motion.div
                        key="modal-bulk"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setBulkAction(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto"
                        >
                            <div
                                className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
                                    bulkAction === "delete"
                                        ? "bg-red-50 text-red-600"
                                        : bulkAction === "archive"
                                          ? "bg-amber-50 text-amber-600"
                                          : "bg-blue-50 text-blue-600"
                                }`}
                            >
                                {bulkAction === "delete" ? (
                                    <TrashIcon className="w-6 h-6" />
                                ) : bulkAction === "archive" ? (
                                    <ArchiveIcon className="w-6 h-6" />
                                ) : (
                                    <RestoreIcon className="w-6 h-6" />
                                )}
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2 capitalize">
                                {bulkAction} {selectedIds.length} items?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                {bulkAction === "delete"
                                    ? "This action cannot be undone and will permanently remove these items."
                                    : bulkAction === "archive"
                                      ? "These items will be hidden from the active view."
                                      : "These items will be restored to the active view."}
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={
                                        typeof confirmBulkAction !== "undefined"
                                            ? confirmBulkAction
                                            : () => {}
                                    }
                                    disabled={updating}
                                    className={`w-full rounded-full px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer ${
                                        bulkAction === "delete"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : bulkAction === "archive"
                                              ? "bg-amber-600 hover:bg-amber-700"
                                              : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {updating
                                        ? "Processing..."
                                        : `Yes, ${bulkAction} all`}
                                </button>
                                <button
                                    onClick={() => setBulkAction(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast-alert"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={springTransition}
                        className="fixed bottom-10 right-10 z-[110] pointer-events-none [font-family:var(--font-neue)]"
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success" ? "bg-black text-white border-black" : "bg-red-600 text-white border-red-700"}`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <CloseIcon className="w-4 h-4 text-white" />
                            )}
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5">
                                {toast.msg || toast.message}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Minimal UI Icons
// ============================================================================

function SparklesIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}

function RefreshIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    );
}

function SearchIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

function InboxIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    );
}

function CloseIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ReplyIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
    );
}

function ArchiveIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    );
}

function RestoreIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

function ChevronDown({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

function ChevronLeft({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function ChevronRight({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

function TrashIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}

function CheckIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function ExternalLinkIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}
