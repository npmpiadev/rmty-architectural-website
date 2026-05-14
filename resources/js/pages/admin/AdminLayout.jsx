import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import CommandPalette from "./CommandPalette";

const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

/* ─────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────── */
export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-[#f7f7f8] font-sans overflow-hidden text-neutral-900">
            {/* Mobile/Tablet Backdrop Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-500 lg:hidden cursor-pointer ${
                    sidebarOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col overflow-hidden relative">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0 md:pt-0 lg:pt-0">
                    <div className="mx-auto h-full w-full transition-all">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function AdminSidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const [contentOpen, setContentOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const role = localStorage.getItem("user_role");

    const isActive = (to) => location.pathname === to;

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    const confirmLogout = () => {
        const token =
            localStorage.getItem("admin_token") ||
            localStorage.getItem("token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        const apiBase = import.meta.env.VITE_API_URL || "";
        fetch(`${apiBase}/api/admin/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }).catch(() => {});

        window.location.href = "/admin/login";
    };

    const mainNav = [
        { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon /> },
        { label: "Inquiries", to: "/admin/inquiries", icon: <InboxIcon /> },
        {
            label: "Appointments",
            to: "/admin/consultations",
            icon: <CalendarIcon />,
        },
        {
            label: "Calendar",
            to: "/admin/calendar",
            icon: <CalendarBlockIcon />,
        },
    ];

    const contentNav = [
        {
            label: "Home",
            to: "/admin/content/home",
            icon: <HomeIcon />,
        },
        {
            label: "About Us",
            to: "/admin/content/about",
            icon: <DocumentIcon />,
        },
        {
            label: "Projects",
            to: "/admin/content/projects",
            icon: <FolderIcon />,
        },
        {
            label: "Services",
            to: "/admin/content/services",
            icon: <LayersIcon />,
        },
        {
            label: "FAQ",
            to: "/admin/content/faq",
            icon: <DocumentIcon />,
        },
        {
            label: "Contact",
            to: "/admin/content/contact",
            icon: <ContactIcon />,
        },
    ];

    const systemNav = [
        {
            label: "Platform Settings",
            to: "/admin/settings",
            icon: <SettingsIcon />,
        },

        // ✅ ONLY SUPER ADMIN CAN SEE THIS
        ...(role === "super_admin"
            ? [
                  {
                      label: "User Management",
                      to: "/admin/users",
                      icon: <UsersIcon />,
                  },
              ]
            : []),

        { label: "Profile", to: "/admin/profile", icon: <UserIcon /> },
    ];

    useEffect(() => {
        if (location.pathname.startsWith("/admin/content")) {
            setContentOpen(true);
        }
    }, [location.pathname]);

    return (
        <aside
            className={`[font-family:var(--font-neue)] fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col bg-[#0A0A0A] text-[#888888] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:static lg:translate-x-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            {/* Logo Area */}
            <div className="px-8 py-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/rmty-LOGO.png"
                        alt="RMTY Logo"
                        className="h-8 w-auto object-contain"
                    />
                    <div className="text-3xl font-black tracking-tighter text-white">
                        RMTY<span></span>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-white/50 hover:text-white transition-colors outline-none cursor-pointer"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
                <div className="mb-8">
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        OVERVIEW
                    </p>
                    <nav className="space-y-1">
                        {mainNav.map((item) => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                active={isActive(item.to)}
                                icon={item.icon}
                                onClick={handleLinkClick}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}
                    </nav>
                </div>

                <div className="mb-8">
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        CONTENT
                    </p>
                    <button
                        type="button"
                        onClick={() => setContentOpen((v) => !v)}
                        className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-[#888888] transition-all duration-300 hover:bg-white/5 hover:text-[#EDEDED] cursor-pointer"
                    >
                        <span className="inline-flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
                            <ContentIcon />
                            Manage Content
                        </span>
                        <span
                            className={`text-white/30 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center origin-center ${contentOpen ? "rotate-90" : "rotate-0"}`}
                        >
                            <ChevronRight />
                        </span>
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            contentOpen
                                ? "max-h-60 opacity-100"
                                : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="mt-2 space-y-1 pl-10 pr-2">
                            {contentNav.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={handleLinkClick}
                                    className={[
                                        "flex items-center gap-3 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-300 cursor-pointer",
                                        isActive(item.to)
                                            ? "bg-white/10 text-white"
                                            : "text-[#666666] hover:bg-white/5 hover:text-white hover:translate-x-1",
                                    ].join(" ")}
                                >
                                    <span className="opacity-50">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        SETTINGS
                    </p>
                    <nav className="space-y-1">
                        {systemNav.map((item) => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                active={isActive(item.to)}
                                icon={item.icon}
                                onClick={handleLinkClick}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}

                        <button
                            type="button"
                            className="group flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-[#888888] transition-all duration-300 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            <span className="inline-flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
                                <LogoutIcon />
                                Logout
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {showLogoutConfirm && (
                        <motion.div
                            key="modal-logout-sidebar"
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-black/40 cursor-pointer"
                                onClick={() => setShowLogoutConfirm(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={springTransition}
                                className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-200 text-center pointer-events-auto"
                            >
                                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                    <LogoutIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">
                                    Sign Out?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    You are about to log out of the admin panel.
                                    You will need your credentials to return.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={confirmLogout}
                                        className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 cursor-pointer"
                                    >
                                        Sign Out
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowLogoutConfirm(false)
                                        }
                                        className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer border border-neutral-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </aside>
    );
}

/* ─────────────────────────────────────────
   TOPBAR - Minimalist Path-focused Design
───────────────────────────────────────── */
function AdminTopbar({ profile, onProfileUpdate, onMenuClick }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifItems, setNotifItems] = useState([]);
    const [notifCount, setNotifCount] = useState(0);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [fetchedUser, setFetchedUser] = useState(null);
    const [imageHash, setImageHash] = useState(Date.now());

    // 1. New State for Command Palette
    const [paletteOpen, setPaletteOpen] = useState(false);

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const notifDropdownRef = useRef(null);
    const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });

    const getPageTitle = () => {
        const pathSegments = location.pathname.split("/").filter(Boolean);
        const lastSegment =
            pathSegments[pathSegments.length - 1] || "Dashboard";
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    // 2. Keyboard Shortcut Listener (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
            if (
                notifRef.current &&
                !notifRef.current.contains(e.target) &&
                notifDropdownRef.current &&
                !notifDropdownRef.current.contains(e.target)
            ) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token =
                    localStorage.getItem("admin_token") ||
                    localStorage.getItem("token");
                const res = await fetch("/api/admin/me", {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    setFetchedUser(json?.data || null);
                }
            } catch {
                if (!cancelled) setFetchedUser(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [imageHash]);

    useEffect(() => {
        const authHeaders = () => {
            const token =
                localStorage.getItem("admin_token") ||
                localStorage.getItem("token");
            return token ? { Authorization: `Bearer ${token}` } : {};
        };

        const fetchNotifications = async () => {
            try {
                const res = await fetch(
                    "/api/inquiries?status=new&per_page=50",
                    { credentials: "include", headers: authHeaders() },
                );
                if (!res.ok) return;
                const data = await res.json();
                const list = (data.data || []).filter(
                    (inq) => inq.name !== "You",
                );

                // Group into threads using the same key logic as AdminInquiries
                const threadMap = {};
                list.forEach((inq) => {
                    const key = inq.email || inq.phone || `id_${inq.id}`;
                    if (!threadMap[key]) {
                        threadMap[key] = {
                            key,
                            name: inq.name || "Unknown",
                            subtitle:
                                inq.email || inq.phone || inq.platform || "",
                            platform: inq.platform,
                            inquiries: [],
                        };
                    }
                    threadMap[key].inquiries.push(inq);
                });

                // seenNotifs is { [threadKey]: dismissedAt ISO string }
                // Migrate from old array format if needed
                let seenMap = {};
                try {
                    const raw = JSON.parse(
                        localStorage.getItem("seenNotifs") || "{}",
                    );
                    if (raw && !Array.isArray(raw) && typeof raw === "object") {
                        seenMap = raw;
                    } else {
                        localStorage.setItem("seenNotifs", "{}");
                    }
                } catch {
                    localStorage.setItem("seenNotifs", "{}");
                }

                const unseen = Object.values(threadMap)
                    .filter((thread) => {
                        const latestTime = Math.max(
                            ...thread.inquiries.map((inq) =>
                                new Date(inq.created_at).getTime(),
                            ),
                        );
                        const seenAt = seenMap[thread.key]
                            ? new Date(seenMap[thread.key]).getTime()
                            : 0;
                        return latestTime > seenAt;
                    })
                    .map((thread) => {
                        const latest = thread.inquiries.reduce((a, b) =>
                            new Date(a.created_at) > new Date(b.created_at)
                                ? a
                                : b,
                        );
                        return {
                            id: thread.key,
                            title: thread.name,
                            subtitle: thread.subtitle,
                            threadKey: thread.key,
                            time: latest.created_at,
                        };
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.time).getTime() -
                            new Date(a.time).getTime(),
                    );

                setNotifItems(unseen);
                setNotifCount(unseen.length);
            } catch {
                // silent
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        console.log("notifOpen changed to:", notifOpen);
        console.log("notifItems:", notifItems);
        console.log("notifPos:", notifPos);
    }, [notifOpen, notifItems, notifPos]);

    const markAllSeen = () => {
        const seenMap = JSON.parse(localStorage.getItem("seenNotifs") || "{}");
        const now = new Date().toISOString();
        notifItems.forEach((item) => {
            seenMap[item.threadKey] = now;
        });
        localStorage.setItem("seenNotifs", JSON.stringify(seenMap));
        setNotifItems([]);
        setNotifCount(0);
    };

    const confirmLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        fetch("/api/admin/logout", {
            method: "POST",
            credentials: "include",
        }).catch(() => {});
        window.location.href = "/admin/login";
    };

    const activeUser = profile || fetchedUser;
    const displayName =
        activeUser?.first_name ||
        activeUser?.name?.split?.(" ")?.[0] ||
        "Admin";
    const initials = String(displayName).substring(0, 2).toUpperCase();
    const displayImage = activeUser?.profile_photo_url || null;

    return (
        <>
            <header className="h-[90px] md:h-[100px] w-full bg-transparent flex items-center z-10 shrink-0 [font-family:var(--font-neue)]">
                <div className="mx-auto flex w-full items-end justify-between px-4 md:px-6 lg:px-8 pb-2">
                    {/* Left: Hamburger (Mobile) + Dynamic Page Path/Title */}
                    <div className="flex items-end gap-3 md:gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden pb-1 pr-2 text-neutral-900 hover:text-neutral-600 transition-colors outline-none cursor-pointer"
                        >
                            <MenuIcon />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-1">
                                Current View
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
                                {getPageTitle()}
                            </h1>
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-4 md:gap-8 mb-1 md:mb-2">
                        {/* 3. NEW SEARCH TRIGGER BUTTON */}
                        <div className="hidden md:flex relative group items-center">
                            <button
                                onClick={() => setPaletteOpen(true)}
                                className="flex items-center justify-between w-56 pl-3 pr-2 py-2 bg-white border border-neutral-200 hover:border-neutral-400 rounded-full text-sm font-medium transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <SleekSearchIcon className="w-4 h-4" />
                                    <span>Search...</span>
                                </div>
                            </button>
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => {
                                    if (!notifOpen && notifRef.current) {
                                        const rect = notifRef.current.getBoundingClientRect();
                                        setNotifPos({
                                            top: rect.bottom + 12,
                                            right: window.innerWidth - rect.right,
                                        });
                                    }
                                    setNotifOpen(!notifOpen);
                                    setDropdownOpen(false);
                                }}
                                className={`relative p-2 rounded-full transition-all duration-300 outline-none cursor-pointer group ${
                                    notifOpen ? "bg-neutral-100 text-black" : "text-neutral-400 hover:text-black hover:bg-neutral-50"
                                }`}
                            >
                                <SleekBellIcon />
                                
                                {notifCount > 0 && (
                                    <>
                                        {/* Pulsing Outer Ring */}
                                        <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-[#f7f7f8]"></span>
                                        </span>
                                        
                                        {/* Optional: Small Number Badge if you prefer numbers */}
                                        {/* 
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white border-2 border-[#f7f7f8]">
                                            {notifCount > 9 ? '9+' : notifCount}
                                        </span> 
                                        */}
                                    </>
                                )}
                            </button>
                        </div>
                        {createPortal(
                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div
                                        ref={notifDropdownRef}
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                        transition={{
                                            duration: 0.2,
                                            ease: smoothEase,
                                        }}
                                        style={{
                                            position: "fixed",
                                            top: notifPos.top,
                                            right: notifPos.right,
                                            width: 280,
                                        }}
                                        className="bg-white border border-neutral-200 rounded-2xl p-4 z-[9999] shadow-xl origin-top-right"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
                                            <span className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                                Notifications
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setNotifOpen(false)
                                                }
                                                className="text-neutral-400 hover:text-neutral-900 cursor-pointer outline-none"
                                            >
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {notifItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <SleekBellIcon className="w-8 h-8 text-neutral-200 mb-2" />
                                                <p className="text-sm font-medium text-neutral-500">
                                                    You're all caught up!
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto -mx-1">
                                                    {notifItems.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                const seenMap =
                                                                    JSON.parse(
                                                                        localStorage.getItem(
                                                                            "seenNotifs",
                                                                        ) ||
                                                                            "{}",
                                                                    );
                                                                seenMap[
                                                                    item.threadKey
                                                                ] =
                                                                    new Date().toISOString();
                                                                localStorage.setItem(
                                                                    "seenNotifs",
                                                                    JSON.stringify(
                                                                        seenMap,
                                                                    ),
                                                                );
                                                                setNotifItems(
                                                                    (prev) =>
                                                                        prev.filter(
                                                                            (
                                                                                n,
                                                                            ) =>
                                                                                n.id !==
                                                                                item.id,
                                                                        ),
                                                                );
                                                                setNotifCount(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            0,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                );
                                                                navigate(
                                                                    "/admin/inquiries",
                                                                    {
                                                                        state: {
                                                                            openThreadKey:
                                                                                item.threadKey,
                                                                        },
                                                                    },
                                                                );
                                                                setNotifOpen(
                                                                    false,
                                                                );
                                                            }}
                                                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-left transition-colors cursor-pointer w-full"
                                                        >
                                                            <div className="mt-1 h-2 w-2 rounded-full shrink-0 bg-blue-500" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[12px] font-bold text-neutral-900 leading-tight truncate">
                                                                    New inquiry
                                                                    from{" "}
                                                                    {item.title}
                                                                </p>
                                                                <p className="text-[11px] text-neutral-400 truncate">
                                                                    {
                                                                        item.subtitle
                                                                    }
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={markAllSeen}
                                                    className="mt-3 pt-2.5 border-t border-neutral-100 w-full text-center text-[11px] font-bold text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                                                >
                                                    Mark all as read
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>,
                            document.body,
                        )}

                        {/* Profile Block */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setDropdownOpen(!dropdownOpen);
                                    setNotifOpen(false);
                                }}
                                className="flex items-center gap-3 group outline-none cursor-pointer"
                            >
                                {displayImage ? (
                                    <img
                                        src={`${displayImage}?h=${imageHash}`}
                                        alt="User"
                                        className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover border border-neutral-200 transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center transition-transform group-hover:scale-105">
                                        <span className="text-[11px] font-black text-neutral-900 tracking-widest">
                                            {initials}
                                        </span>
                                    </div>
                                )}
                                <div className="hidden text-left lg:block">
                                    <p className="text-sm font-bold text-neutral-900 leading-none">
                                        {displayName}
                                    </p>
                                </div>
                                <div className="hidden lg:block text-neutral-400 transition-transform group-hover:translate-y-0.5 group-hover:text-neutral-900">
                                    <ChevronDown />
                                </div>
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                        transition={{
                                            duration: 0.2,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="absolute right-0 top-[calc(100%+12px)] z-50 w-[200px] md:w-[220px] origin-top-right rounded-2xl border border-neutral-200 bg-white p-1.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                                    >
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                setEditModalOpen(true);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors cursor-pointer"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            {/* Edit Profile Modal Wrapped in Portal */}
            {createPortal(
                <AnimatePresence>
                    {editModalOpen && (
                        <EditProfileModal
                            key="edit-profile-modal"
                            profile={activeUser}
                            onClose={() => setEditModalOpen(false)}
                            onSaved={(updated) => {
                                setFetchedUser(updated);
                                setImageHash(Date.now());
                                if (onProfileUpdate) onProfileUpdate(updated);
                                setEditModalOpen(false);
                            }}
                        />
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* Logout Confirm Modal (Topbar) */}
            {createPortal(
                <AnimatePresence>
                    {showLogoutConfirm && (
                        <motion.div
                            key="modal-logout-topbar"
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-black/40 cursor-pointer"
                                onClick={() => setShowLogoutConfirm(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 300,
                                }}
                                className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-200 text-center pointer-events-auto"
                            >
                                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                    <LogoutIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">
                                    Sign Out?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    You are about to log out of the admin panel.
                                    You will need your credentials to return.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={confirmLogout}
                                        className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 cursor-pointer"
                                    >
                                        Sign Out
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowLogoutConfirm(false)
                                        }
                                        className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer border border-neutral-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* 4. THE NEW COMMAND PALETTE MOUNTED HERE */}
            <CommandPalette
                isOpen={paletteOpen}
                onClose={() => setPaletteOpen(false)}
            />
        </>
    );
}

/* ─────────────────────────────────────────
   EDIT PROFILE MODAL
───────────────────────────────────────── */
function EditProfileModal({ profile, onClose, onSaved }) {
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email: profile?.email || "",
        profile_photo: null,
    });

    const [preview, setPreview] = useState(profile?.profile_photo_url || null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((f) => ({ ...f, profile_photo: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Front-end Validation
        const errors = {};
        if (!form.first_name || !form.first_name.trim())
            errors.first_name = "First name is required";
        if (!form.last_name || !form.last_name.trim())
            errors.last_name = "Last name is required";
        if (!form.email || !form.email.trim()) {
            errors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSaving(true);
        setError(null);
        setFormErrors({});

        try {
            const token =
                localStorage.getItem("admin_token") ||
                localStorage.getItem("token");

            const fd = new FormData();
            fd.append("first_name", form.first_name.trim());
            fd.append("last_name", form.last_name.trim());
            fd.append("email", form.email.trim());

            if (form.profile_photo) {
                fd.append("profile_photo", form.profile_photo);
            }

            // REMOVED: fd.append("_method", "PUT");

            const res = await fetch("/api/admin/profile", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: fd,
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 422 && json.errors) {
                    const bErrors = {};
                    for (const key in json.errors) {
                        bErrors[key] = json.errors[key][0];
                    }
                    setFormErrors(bErrors);
                    setError("Please fix the highlighted errors.");
                } else {
                    setError(json?.message ?? "Something went wrong.");
                }
                return;
            }

            onSaved(json.data);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const initials = String(
        form.first_name || profile?.name || profile?.email || "Ad",
    )
        .substring(0, 2)
        .toUpperCase();

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div
                className="absolute inset-0 bg-black/40 cursor-pointer"
                onClick={onClose}
            />
            <motion.div
                className="relative w-full max-w-md rounded-[2rem] border border-neutral-200 bg-white overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={springTransition}
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100/60 bg-white/50 backdrop-blur-md shrink-0">
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                        Profile Settings
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 cursor-pointer"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto no-scrollbar">
                    <form
                        id="editProfileForm"
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Avatar picker with overlay */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-2xl font-black text-neutral-400 uppercase tracking-widest">
                                        {initials}
                                    </span>
                                )}

                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                                    <UploadIcon className="w-6 h-6 text-white mb-1" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                        Change
                                    </span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                        First Name *
                                    </label>
                                    {formErrors.first_name && (
                                        <span className="text-[10px] font-bold text-red-500">
                                            {formErrors.first_name}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleInputChange}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50 ${formErrors.first_name ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-900" : "border-neutral-200/60 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                        Last Name *
                                    </label>
                                    {formErrors.last_name && (
                                        <span className="text-[10px] font-bold text-red-500">
                                            {formErrors.last_name}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleInputChange}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50 ${formErrors.last_name ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-900" : "border-neutral-200/60 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                    Email Address *
                                </label>
                                {formErrors.email && (
                                    <span className="text-[10px] font-bold text-red-500">
                                        {formErrors.email}
                                    </span>
                                )}
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleInputChange}
                                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50 ${formErrors.email ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-900" : "border-neutral-200/60 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                placeholder="jane@example.com"
                            />
                        </div>

                        {error && (
                            <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-center">
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="editProfileForm"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-[#0A0A0A] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   COMPONENTS & CUSTOM MODERN ICONS
───────────────────────────────────────── */
function SidebarLink({ to, active, icon, children, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={[
                "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                active
                    ? "bg-white/10 text-[#EDEDED]"
                    : "text-[#888888] hover:bg-white/5 hover:text-[#EDEDED]",
            ].join(" ")}
        >
            <div className="transition-transform duration-300 group-hover:translate-x-1 flex items-center gap-4 w-full">
                {icon}
                {children}
            </div>
        </Link>
    );
}

function MenuIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
        </svg>
    );
}

function CloseIcon({ className = "h-6 w-6" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}

function DashboardIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}
function InboxIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
function ContentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M21 8V21H3V3H16L21 8Z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M16 3V8H21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function FolderIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function LayersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <polygon
                points="12 2 2 7 12 12 22 7 12 2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 12 12 17 22 12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 17 12 22 22 17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function DocumentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="14 2 14 8 20 8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="10"
                y1="9"
                x2="8"
                y2="9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SettingsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="9"
                cy="7"
                r="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="7"
                r="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SleekSearchIcon({ className = "h-6 w-6 text-neutral-400" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="11" cy="11" r="7" />
            <path
                d="M21 21l-4.35-4.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SleekBellIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
        </svg>
    );
}
function LogoutIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="16 17 21 12 16 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ChevronRight() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M9 18l6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ChevronDown() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M6 9l6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function UploadIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="17 8 12 3 7 8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function HomeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="9 22 9 12 15 12 15 22"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ContactIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="22,6 12,13 2,6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CalendarBlockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="9" y1="14" x2="15" y2="20" strokeLinecap="round" />
            <line x1="15" y1="14" x2="9" y2="20" strokeLinecap="round" />
        </svg>
    );
}
