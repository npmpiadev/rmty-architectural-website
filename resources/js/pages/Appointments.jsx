import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import CalendarScheduler from "../components/CalendarScheduler";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const DRAFT_KEY = "appointment_draft";
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// ─── Time slots: every 30 minutes from 9:00 AM to 5:00 PM ───────────────────
// This matches the admin calendar exactly. Once a consultation is confirmed,
// the backend marks that slot + the next 3 slots (2-hour window) as unavailable,
// so users cannot book into an ongoing consultation's window.
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

export default function Appointments() {
    const navigate = useNavigate();
    const captchaRef = useRef(null);

    const [captchaToken, setCaptchaToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token"),
    );
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [checkingActive, setCheckingActive] = useState(false);
    const [activeConsult, setActiveConsult] = useState(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [projectType, setProjectType] = useState("");
    const [appointmentMessage, setAppointmentMessage] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");

    // Consultation type — "onsite" | "online"
    const [consultationType, setConsultationType] = useState("onsite");

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [unavailableSlots, setUnavailableSlots] = useState([]);

    // ─── Fetch unavailable slots (admin-blocked + booked + 2-hr buffers) ──────
    // The backend's /api/booked-slots already expands each confirmed booking
    // into 4 × 30-min slots, so we just combine both lists here as before.
    const fetchUnavailableSlots = async () => {
        try {
            const [blockedRes, bookedRes] = await Promise.all([
                fetch(`${API_BASE}/api/blocked-slots`),
                fetch(`${API_BASE}/api/booked-slots`, {
    headers: {
        Accept: "application/json",
    },
})
            ]);

            const blocked = blockedRes.ok ? await blockedRes.json() : [];
            const booked  = bookedRes.ok  ? await bookedRes.json() : [];

            setUnavailableSlots([
                ...(Array.isArray(blocked) ? blocked : []),
                ...(Array.isArray(booked)  ? booked  : []),
            ]);
        } catch {
            // silent fail — calendar will simply show all slots as available
        }
    };

    useEffect(() => {
        const user  = JSON.parse(localStorage.getItem("user") ?? "null");
        const token = localStorage.getItem("token");

        if (user) {
            setEmail(user.email ?? "");
            const parts = (user.name ?? "").split(" ");
            setFirstName(parts[0] ?? "");
            setLastName(parts.slice(1).join(" ") ?? "");
        }

        if (token && user) {
            setIsLoggedIn(true);
            checkActiveConsultation(token);
        }

        fetchUnavailableSlots();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");

        if (token && draft) {
            setFirstName(draft.firstName ?? "");
            setLastName(draft.lastName ?? "");
            setEmail(draft.email ?? "");
            setPhone(draft.phone ?? "");
            setLocation(draft.location ?? "");
            setProjectType(draft.projectType ?? "");
            setAppointmentMessage(draft.appointmentMessage ?? "");
            setAppointmentDate(draft.appointmentDate ?? "");
            setAppointmentTime(draft.appointmentTime ?? "");
            setConsultationType(draft.consultationType ?? "onsite");
            setIsLoggedIn(true);

            sessionStorage.removeItem(DRAFT_KEY);

            setTimeout(async () => {
                const hasActive = await checkActiveConsultation(token);
                if (!hasActive) {
                    submitForm(draft, token);
                }
            }, 400);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkActiveConsultation = async (token) => {
        try {
            setCheckingActive(true);

            const res = await fetch(`${API_BASE}/api/consultations/my`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.has_active) {
                setActiveConsult(data.consultation);
                return true;
            }

            setActiveConsult(null);
            return false;
        } catch {
            return false;
        } finally {
            setCheckingActive(false);
        }
    };

    const submitForm = async (values, authToken) => {
        const {
            firstName: fn,
            lastName: ln,
            email: em,
            phone: ph,
            location: loc,
            projectType: pt,
            appointmentMessage: msg,
            appointmentDate: date,
            appointmentTime: time,
            captchaToken: ct,
            consultationType: ctype,
        } = values;

        try {
            setSubmitting(true);
            setSubmitError("");

            const res = await fetch(`${API_BASE}/api/consultations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
<<<<<<< HEAD
                    first_name:          fn,
                    last_name:           ln,
                    email:               em,
                    phone:               ph,
                    location:            loc,
                    project_type:        pt,
                    captcha_token:       ct ?? null,
                    message:             msg ?? "",
                    consultation_date:   `${date} ${time}:00`,
                    consultation_type:   ctype ?? "onsite",
=======
                    first_name:        fn,
                    last_name:         ln,
                    email:             em,
                    phone:             ph,
                    location:          loc,
                    project_type:      pt,
                    captcha_token:     ct ?? null,
                    message:           msg ?? "",
                    consultation_date: `${date} ${time}:00`,
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.status === 409) {
                setActiveConsult(data.consultation ?? {});
                return;
            }

            if (!res.ok) {
                throw new Error(data.message || "Submission failed.");
            }

            const referenceId =
                data?.reference_id ?? data?.data?.reference_id ?? null;

            await Swal.fire({
                icon: "success",
                title: "Session Confirmed",
                html: referenceId
                    ? `<p style="color:#555;font-size:14px;margin-bottom:8px;">A confirmation email has been sent to you.</p>
                       <div style="background:#f5f5f5;border-left:3px solid #000;padding:12px 16px;text-align:left;margin-top:12px;">
                           <p style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#888;margin:0 0 4px;">Your Reference Number</p>
                           <p style="font-size:20px;font-weight:800;color:#000;margin:0;font-family:monospace;">${referenceId}</p>
                       </div>
                       <p style="font-size:12px;color:#aaa;margin-top:10px;">Keep this number for follow-ups and rescheduling.</p>`
                    : "We will contact you shortly to confirm your consultation schedule.",
                confirmButtonColor: "#000000",
                confirmButtonText: "Go to Dashboard",
            });

            navigate("/user/dashboard");
        } catch (err) {
            setSubmitError(
                err.message || "An error occurred. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!firstName.trim()) newErrors.firstName = "First Name is required.";
        if (!lastName.trim())  newErrors.lastName  = "Last Name is required.";

        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email format.";
        }

        if (!phone.trim()) {
            newErrors.phone = "Contact number is required.";
        } else if (!/^09\d{9}$/.test(phone)) {
            newErrors.phone = "Enter a valid PH number (e.g. 09XXXXXXXXX).";
        }

<<<<<<< HEAD
        if (!location.trim())  newErrors.location  = "Location is required.";
        if (!projectType)      newErrors.projectType = "Project Type is required.";
        if (!appointmentDate)  newErrors.appointmentDate = "Date is required.";
        if (!appointmentTime)  newErrors.appointmentTime = "Time is required.";
=======
        if (!location.trim())  newErrors.location    = "Location is required.";
        if (!projectType)      newErrors.projectType = "Project Type is required.";
        if (!appointmentDate)  newErrors.appointmentDate = "Date is required.";
        if (!appointmentTime)  newErrors.appointmentTime = "Time is required.";

        // Double-check the chosen slot wasn't taken between page load and submit
        if (appointmentDate && appointmentTime && isTimeSlotUnavailable(appointmentDate, appointmentTime)) {
            newErrors.appointmentTime =
                "This time slot is no longer available. Please choose another.";
        }
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c

        if (!RECAPTCHA_SITE_KEY) {
            newErrors.captcha = "Captcha site key is missing. Please check your .env file.";
        } else if (!captchaToken) {
            newErrors.captcha = "Please complete the Captcha verification.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        const token = localStorage.getItem("token");

        if (!token) {
            sessionStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    location,
                    projectType,
                    appointmentMessage,
                    appointmentDate,
                    appointmentTime,
                    captchaToken,
                    consultationType,
                }),
            );
            setShowAuthModal(true);
            return;
        }

        const hasActive = await checkActiveConsultation(token);
        if (hasActive) return;

        await submitForm(
            {
                firstName,
                lastName,
                email,
                phone,
                location,
                projectType,
                appointmentMessage,
                appointmentDate,
                appointmentTime,
                captchaToken,
                consultationType,
            },
            token,
        );
    };

    // ─── Check if a specific time slot is unavailable ────────────────────────
    // Works for both admin-blocked slots and booked/buffer slots returned by
    // the backend — all share the same { blocked_date, blocked_time } shape.
   const isDateFullyBooked = (date) => {

    const slotsForDate = unavailableSlots.filter((slot) => {

        const slotDate =
            slot.blocked_date?.split("T")[0] ||
            slot.blocked_date;

        return slotDate === date;
    });

    return slotsForDate.length >= 16;
};

const isTimeSlotUnavailable = (date, time) => {

    if (!date || !time) return false;

    const dateSlots = unavailableSlots
        .filter((slot) => {

            const slotDate =
                slot.blocked_date?.split("T")[0] ||
                slot.blocked_date;

            return slotDate === date;
        });

    // exact blocked slot
    const exactMatch = dateSlots.some((slot) => {

        return slot.blocked_time === time;
    });

    if (exactMatch) return true;

    // latest booked slot for the day
    const bookedOnly = dateSlots
        .filter((s) => s.type === "booked")
        .sort((a, b) =>
            a.blocked_time.localeCompare(b.blocked_time)
        );

    if (bookedOnly.length === 0) {
        return false;
    }

    const latestBooking =
        bookedOnly[bookedOnly.length - 1];

    const latest = new Date(
        `${date}T${latestBooking.blocked_time}:00`
    );

    const nextAvailable =
        new Date(latest.getTime() + (2 * 60 * 60 * 1000));

    const requested =
        new Date(`${date}T${time}:00`);

    // anything before next available is blocked
    return requested < nextAvailable;
};

    if (checkingActive) {
        return (
            <section className="w-full bg-[#f1f1f1] text-black min-h-screen flex items-center justify-center [font-family:var(--font-neue)]">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 animate-pulse">
                    Checking your consultations...
                </p>
            </section>
        );
    }

    if (activeConsult) {
        return (
            <OngoingConsultationBlock
                consultation={activeConsult}
                onDashboard={() => navigate("/user/dashboard")}
            />
        );
    }

    return (
        <section className="w-full bg-[#f1f1f1] text-black min-h-screen [font-family:var(--font-neue)]">
            <AuthRequiredModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAction={() => {
                    setShowAuthModal(false);
                    navigate(
                        `/auth?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(
                            firstName,
                        )}&lastName=${encodeURIComponent(lastName)}`,
                    );
                }}
            />

            <div className="mx-auto max-w-screen-2xl px-6 pt-32 pb-16 md:pt-48 border-b border-neutral-300">
                <div className="flex flex-col gap-8 md:gap-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-end">
                        <h1 className="lg:col-span-8 text-5xl leading-[0.85] font-bold tracking-tighter uppercase">
                            Schedule A Session.
                        </h1>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:items-start">
                    <div className="lg:col-span-7">
                        <form
                            onSubmit={handleAppointmentSubmit}
                            className="w-full"
                        >
<<<<<<< HEAD
                            {/* ── Section 01: Client Details ── */}
=======
                            {/* ── 01 Client Details ── */}
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                            <div className="mb-20">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Client Details
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        01
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <UnderlineInput
                                        label="First Name *"
                                        value={firstName}
                                        onValueChange={setFirstName}
                                        externalError={errors.firstName}
                                    />
                                    <UnderlineInput
                                        label="Last Name *"
                                        value={lastName}
                                        onValueChange={setLastName}
                                        externalError={errors.lastName}
                                    />
                                    <UnderlineInput
                                        label="E-Mail *"
                                        type="email"
                                        value={email}
                                        onValueChange={setEmail}
                                        externalError={errors.email}
                                    />
                                    <UnderlineInput
                                        label="Phone *"
                                        type="tel"
                                        isPhone
                                        value={phone}
                                        onValueChange={setPhone}
                                        externalError={errors.phone}
                                    />
                                </div>
                            </div>

<<<<<<< HEAD
                            {/* ── Section 02: Project Specs ── */}
=======
                            {/* ── 02 Project Specs ── */}
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                            <div className="mb-20">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Project Specs
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        02
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                    <UnderlineInput
                                        label="Location *"
                                        value={location}
                                        onValueChange={setLocation}
                                        externalError={errors.location}
                                    />
                                    <UnderlineInput
                                        label="Project Type *"
                                        options={[
                                            "Residential",
                                            "Commercial",
                                            "Master Planning",
                                            "Interior Architecture",
                                        ]}
                                        value={projectType}
                                        onValueChange={setProjectType}
                                        externalError={errors.projectType}
                                    />
                                </div>

                                <AppointmentMessageField
                                    label="Brief Description (Optional)"
                                    value={appointmentMessage}
                                    onValueChange={setAppointmentMessage}
                                />
                            </div>

<<<<<<< HEAD
                            {/* ── Section 03: Consultation Format ── */}
                            <div className="mb-20">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Consultation Format
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        03
                                    </span>
                                </div>

                                <ConsultationTypeToggle
                                    value={consultationType}
                                    onChange={setConsultationType}
                                />
                            </div>

                            {/* ── Section 04: Scheduling ── */}
=======
                            {/* ── 03 Scheduling ── */}
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                            <div className="mb-10">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Scheduling
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        04
                                    </span>
                                </div>

                                <div className="w-full">
                                    <label
                                        className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-2 transition-colors ${
                                            errors.appointmentDate ||
                                            errors.appointmentTime
                                                ? "text-red-500"
                                                : "text-neutral-800"
                                        }`}
                                    >
                                        Select Date & Time *
                                    </label>

                                    {/* Hint so users understand the 2-hour session block */}
                                    <p className="text-[10px] tracking-wide text-neutral-400 mb-6 uppercase font-medium">
                                        Each session occupies a 2-hour window. Adjacent slots will be unavailable after booking.
                                    </p>

                                   <CalendarScheduler
                                        selectedDate={appointmentDate}
                                        onDateChange={setAppointmentDate}
                                        selectedTime={appointmentTime}
                                        onTimeChange={setAppointmentTime}
                                        unavailableSlots={unavailableSlots}
                                        timeSlots={TIME_SLOTS}
                                        isDateFullyBooked={isDateFullyBooked}
                                    />

                                    {(errors.appointmentDate ||
                                        errors.appointmentTime) && (
                                        <p className="text-[10px] tracking-wide text-red-500 mt-4 uppercase font-bold">
                                            {errors.appointmentDate ||
                                                errors.appointmentTime}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── reCAPTCHA ── */}
                            <div className="mb-10">
                                {RECAPTCHA_SITE_KEY ? (
                                    <ReCAPTCHA
                                        ref={captchaRef}
                                        sitekey={RECAPTCHA_SITE_KEY}
                                        onChange={(token) => {
                                            setCaptchaToken(token);
                                            setErrors((prev) => ({
                                                ...prev,
                                                captcha: undefined,
                                            }));
                                        }}
                                        onExpired={() => setCaptchaToken(null)}
                                        onErrored={() => {
                                            setCaptchaToken(null);
                                            setErrors((prev) => ({
                                                ...prev,
                                                captcha:
                                                    "Captcha failed to load. Please check your reCAPTCHA key and domain settings.",
                                            }));
                                        }}
                                    />
                                ) : (
                                    <div className="border border-red-500 bg-red-50 px-4 py-3">
                                        <p className="text-[11px] tracking-wide text-red-500 uppercase font-bold">
                                            Missing VITE_RECAPTCHA_SITE_KEY in .env file.
                                        </p>
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {errors.captcha && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden uppercase font-bold"
                                        >
                                            {errors.captcha}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <AnimatePresence>
                                {submitError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="mb-10 flex items-center gap-4 border-l-2 border-red-500 py-1 pl-4"
                                    >
                                        <span className="text-[11px] font-bold tracking-[0.15em] text-red-500 uppercase">
                                            {submitError}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full border border-black px-14 py-4 text-[11px] font-bold tracking-[0.2em] text-black uppercase transition-all hover:bg-black hover:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {submitting ? "PROCESSING..." : "REQUEST SCHEDULE"}
                            </button>
                        </form>
                    </div>

                    <div className="hidden lg:block lg:col-span-5 relative h-[750px] bg-neutral-200 overflow-hidden sticky top-32">
                        <img
                            src="/images/home-hero.webp"
                            alt="Appointment Header"
                            className="h-full w-full object-cover grayscale-[15%] transition-transform duration-[3s] hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
}

<<<<<<< HEAD
/* ──────────────────────────────────────────────────────────────────────────── */
/*  Consultation Type Toggle                                                     */
/* ──────────────────────────────────────────────────────────────────────────── */
function ConsultationTypeToggle({ value, onChange }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {[
                    {
                        id: "onsite",
                        label: "Onsite Visit",
                        sub: "Meet at our studio",
                        icon: (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        ),
                    },
                    {
                        id: "online",
                        label: "Online / Video",
                        sub: "Join via video call",
                        icon: (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                        ),
                    },
                ].map((opt) => {
                    const active = value === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChange(opt.id)}
                            className={`group flex flex-col items-start gap-3 p-5 border-2 transition-all text-left cursor-pointer ${
                                active
                                    ? "border-black bg-black text-white"
                                    : "border-neutral-200 bg-white text-black hover:border-neutral-400"
                            }`}
                        >
                            <span className={`transition-colors ${active ? "text-white" : "text-neutral-500 group-hover:text-black"}`}>
                                {opt.icon}
                            </span>
                            <span className="text-[11px] font-bold tracking-[0.15em] uppercase leading-none">
                                {opt.label}
                            </span>
                            <span className={`text-[11px] tracking-wide leading-none ${active ? "text-neutral-400" : "text-neutral-400"}`}>
                                {opt.sub}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Online notice */}
            <AnimatePresence mode="wait">
                {value === "online" && (
                    <motion.div
                        key="online-notice"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="border-l-2 border-blue-500 bg-blue-50 pl-4 py-3 pr-4"
                    >
                        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-700 mb-1">
                            Video Call
                        </p>
                        <p className="text-[12px] text-blue-800 leading-relaxed">
                            A meeting link will be included in your confirmation email. Please be ready at the scheduled time.
                        </p>
                    </motion.div>
                )}

                {value === "onsite" && (
                    <motion.div
                        key="onsite-notice"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="border-l-2 border-black bg-neutral-50 pl-4 py-3 pr-4"
                    >
                        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-neutral-700 mb-1">
                            Studio Address
                        </p>
                        <p className="text-[12px] text-neutral-600 leading-relaxed">
                            911 Josefina 2 Sampaloc, Manila, Philippines 1008<br />
                            (+63) 915 896 2275
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  OngoingConsultationBlock                                                     */
/* ──────────────────────────────────────────────────────────────────────────── */
=======
// ─── Ongoing Consultation Block ───────────────────────────────────────────────

>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
function OngoingConsultationBlock({ consultation, onDashboard }) {
    const statusColors = {
        pending: {
            bg: "bg-amber-50",
            border: "border-amber-400",
            text: "text-amber-700",
            label: "Pending Review",
        },
        accepted: {
            bg: "bg-green-50",
            border: "border-green-500",
            text: "text-green-700",
            label: "Confirmed",
        },
        rescheduled: {
            bg: "bg-blue-50",
            border: "border-blue-400",
            text: "text-blue-700",
            label: "Rescheduled",
        },
    };

    const s = statusColors[consultation?.status] ?? statusColors.pending;

    const formattedDate = consultation?.consultation_date
        ? new Date(
              String(consultation.consultation_date).replace(" ", "T"),
          ).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "To be confirmed";

    const formattedTime = consultation?.consultation_date
        ? new Date(
              String(consultation.consultation_date).replace(" ", "T"),
          ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
          })
        : "";

    const isOnline = String(consultation?.consultation_type ?? "onsite").toLowerCase() === "online";

    const rows = [
        ...(consultation?.reference_id
            ? [{ label: "Reference No.", value: consultation.reference_id, mono: true }]
            : []),
        { label: "Project Type", value: consultation?.project_type ?? "—" },
<<<<<<< HEAD
        { label: "Location",     value: consultation?.location ?? "—" },
        { label: "Format",       value: isOnline ? "Online / Video Call" : "Onsite Visit" },
        { label: "Date",         value: formattedDate },
        { label: "Time",         value: formattedTime || "—" },
        { label: "Status",       value: s.label, highlight: true, color: s.text },
=======
        { label: "Location",     value: consultation?.location     ?? "—" },
        { label: "Date",         value: formattedDate },
        { label: "Time",         value: formattedTime || "—" },
        {
            label: "Status",
            value: s.label,
            highlight: true,
            color: s.text,
        },
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
    ];

    return (
        <section className="w-full bg-[#f1f1f1] text-black min-h-screen [font-family:var(--font-neue)]">
            <div className="mx-auto max-w-screen-2xl px-6 pt-32 pb-16 md:pt-48 border-b border-neutral-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-end">
                    <h1 className="lg:col-span-8 text-[3.5rem] md:text-[6rem] lg:text-[6.5rem] leading-[0.85] font-bold tracking-tighter uppercase">
                        Schedule <br /> A Session.
                    </h1>
                    <div className="lg:col-span-4 lg:pb-3 border-l border-neutral-300 pl-6 md:pl-10">
                        <p className="text-[15px] font-medium leading-relaxed text-neutral-600">
                            Reserve a formal consultation with our principal architects.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:items-start">
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="mb-12"
                        >
                            <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                    Active Consultation
                                </h2>
<<<<<<< HEAD
                                <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 ${s.bg} ${s.text} border ${s.border}`}>
=======
                                <span
                                    className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 ${s.bg} ${s.text} border ${s.border}`}
                                >
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                                    {s.label}
                                </span>
                            </div>

                            <p className="text-[14px] leading-relaxed text-neutral-600 mb-10">
                                You currently have an ongoing consultation request. A new
                                appointment cannot be scheduled until your current one is
                                resolved. Visit your dashboard to view details, track its
                                status, or contact us for assistance.
                            </p>

                            <div className="border border-neutral-200 bg-white mb-10">
                                <div className="bg-black px-6 py-4">
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                                        Current Booking
                                    </p>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {rows.map(({ label, value, highlight, color, mono }) => (
<<<<<<< HEAD
                                        <div key={label} className="flex justify-between items-center px-6 py-4">
                                            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-400">
                                                {label}
                                            </span>
                                            <span className={`text-[13px] font-semibold ${highlight ? color : "text-neutral-800"} ${mono ? "font-mono tracking-wider" : ""}`}>
=======
                                        <div
                                            key={label}
                                            className="flex justify-between items-center px-6 py-4"
                                        >
                                            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-400">
                                                {label}
                                            </span>
                                            <span
                                                className={`text-[13px] font-semibold ${
                                                    highlight ? color : "text-neutral-800"
                                                } ${mono ? "font-mono tracking-wider" : ""}`}
                                            >
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Show Zoom link for online consultations */}
                            {isOnline && consultation?.zoom_link && (
                                <div className="mb-10 border-l-2 border-blue-500 bg-blue-50 pl-4 py-3 pr-4">
                                    <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-700 mb-2">
                                        Your Video Call Link
                                    </p>
                                    <a
                                        href={consultation.zoom_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[12px] text-blue-700 underline break-all hover:text-blue-900"
                                    >
                                        {consultation.zoom_link}
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={onDashboard}
                                    className="bg-black text-white px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 cursor-pointer"
                                >
                                    Go to Dashboard
                                </button>
                                <a
                                    href="mailto:hello@rmty.com"
                                    className="border border-black px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white text-center cursor-pointer"
                                >
                                    Contact Us
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    <div className="hidden lg:block lg:col-span-5 relative h-[750px] bg-neutral-200 overflow-hidden sticky top-32">
                        <img
                            src="/images/home-hero.webp"
                            alt="Appointment Header"
                            className="h-full w-full object-cover grayscale-[15%]"
                        />
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
}

<<<<<<< HEAD
/* ──────────────────────────────────────────────────────────────────────────── */
/*  AuthRequiredModal                                                            */
/* ──────────────────────────────────────────────────────────────────────────── */
=======
// ─── Auth Required Modal ──────────────────────────────────────────────────────

>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
function AuthRequiredModal({ isOpen, onClose, onAction }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-full max-w-[420px] bg-white p-12 md:p-14 flex flex-col items-center text-center"
                    >
                        <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-6">
                            One More Step
                        </span>
                        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-neutral-900 mb-4">
                            Sign in to submit.
                        </h2>
                        <p className="text-sm leading-relaxed text-neutral-500 mb-10 max-w-[280px]">
                            Your booking details are saved. Sign in or create a profile —
                            your appointment will be submitted automatically.
                        </p>
                        <div className="flex flex-col w-full gap-2">
                            <button
                                onClick={onAction}
                                className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-70 cursor-pointer"
                            >
                                Sign In / Create Profile
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase hover:text-black cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

<<<<<<< HEAD
/* ──────────────────────────────────────────────────────────────────────────── */
/*  UnderlineInput                                                               */
/* ──────────────────────────────────────────────────────────────────────────── */
=======
// ─── Shared Form Components ───────────────────────────────────────────────────

>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c
function UnderlineInput({
    label,
    type = "text",
    options,
    isPhone,
    placeholder,
    value,
    onValueChange,
    externalError,
}) {
    const hasError = !!externalError;

    const handleChange = (e) => {
        let val = e.target.value;
        if (label.includes("Name")) {
            val = val.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
        } else if (isPhone) {
            val = val.replace(/\D/g, "").slice(0, 11);
        }
        onValueChange?.(val);
    };

    const inputClass = `w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none appearance-none ${
        hasError
            ? "border-red-500 text-red-500"
            : "border-neutral-300 focus:border-black text-black"
    }`;

    return (
        <div className="relative group w-full">
            <label className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}>
                {label}
            </label>

            {options ? (
                <select value={value} onChange={handleChange} className={inputClass}>
                    <option value="" disabled hidden>
                        Select {label.replace("*", "")}
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="text-black">
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputClass}
                />
            )}

            <AnimatePresence mode="wait">
                {externalError && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden uppercase font-bold"
                    >
                        {externalError}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  AppointmentMessageField                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */
function AppointmentMessageField({ label, value, onValueChange, externalError }) {
    const hasError = !!externalError;
    return (
        <div className="relative group w-full">
            <label className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}>
                {label}
            </label>
            <textarea
                rows={4}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className={`w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none resize-none ${
                    hasError
                        ? "border-red-500 text-red-500"
                        : "border-neutral-300 focus:border-black text-black"
                }`}
            />
        </div>
    );
}