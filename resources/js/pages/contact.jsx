import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function Contact() {
    // ── Form State ───────────────────────────────────────────
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ── CMS Content State ────────────────────────────────────
    const [content, setContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/contact-content`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((json) => setContent(json?.data || null))
            .catch(console.error)
            .finally(() => setContentLoading(false));
    }, []);

    // ── Submit Handler ───────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        // Validation Logic
        if (!firstName.trim()) newErrors.firstName = "First Name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last Name is required.";

        // Email Validation (Required + Format)
        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = "Please enter a valid email format.";
            }
        }

        if (!message.trim()) newErrors.message = "Message is required.";

        // Set the errors for the input fields
        setErrors(newErrors);

        // If there are validation errors, stop here
        if (Object.keys(newErrors).length > 0) return;

        try {
            setSubmitting(true);
            setSubmitError(""); // FIX: Change {} to "" to prevent white page crash

            const res = await fetch(`${API_BASE}/api/inquiries`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`,
                    email,
                    phone,
                    message,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit inquiry.");

            Swal.fire({
                icon: "success",
                title: "Inquiry Sent",
                text: "Thank you for reaching out. We will get back to you shortly.",
                confirmButtonColor: "#000000",
                confirmButtonText: "Close",
            });

            // Reset form and errors
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setMessage("");
            setErrors({});
        } catch (err) {
            console.error(err);
            setSubmitError(
                "An error occurred while sending your message. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const heroImageUrl = content?.hero_image
        ? `${API_BASE}/storage/${content.hero_image}`
        : "/images/PLACEHOLDER.png";

    return (
        <section className="w-full min-h-screen bg-[#f1f1f1] text-neutral-900 [font-family:var(--font-neue)]">
            <div className="mx-auto max-w-screen-2xl px-6 pt-32 pb-24 md:pt-48">
                {/* ── Top Hero Text ── */}
                <div className="mb-24 md:mb-32 w-full">
                    <h1 className="text-[3.5rem] tracking-tighter font-bold md:text-4xl lg:text-5xl leading-[0.95] mb-8 max-w-full uppercase">
                        {content?.page_heading && content.page_heading
                            ? content.page_heading
                            : "Tell us about your space."}
                    </h1>
                    <p className="text-base leading-relaxed text-neutral-800 md:text-[1.05rem] max-w-full">
                        {content?.page_description && content.page_description
                            ? content.page_description
                            : "Great architecture begins with a conversation. Share the details of your upcoming project, and the RMTY team will connect with you to turn your goals into a clear and buildable design direction."}
                    </p>
                </div>

                {/* ── Form Section ── */}
                <motion.form layout onSubmit={handleSubmit} className="w-full">
                    <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 mb-16">
                        <UnderlineInput
                            label="First Name *"
                            value={firstName}
                            onValueChange={setFirstName}
                            externalError={errors.firstName} // Passes the error down
                        />
                        <UnderlineInput
                            label="Last Name *"
                            value={lastName}
                            onValueChange={setLastName}
                            externalError={errors.lastName}
                        />
                        <UnderlineInput
                            label="Phone (optional)"
                            isPhone
                            value={phone}
                            onValueChange={setPhone}
                            externalError={errors.phone}
                        />
                        <UnderlineInput
                            label="E-Mail *"
                            value={email}
                            onValueChange={setEmail}
                            externalError={errors.email}
                        />
                    </div>

                    <div className="mb-2">
                        <GeneralMessageField
                            label="Message *"
                            value={message}
                            onValueChange={setMessage}
                            externalError={errors.message}
                        />
                    </div>

                    <div className="pt-2 mb-30">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full border border-black px-12 py-3 text-[11px] font-bold tracking-[0.2em] text-black uppercase transition-all hover:bg-black hover:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {submitting ? "SUBMITTING..." : "SUBMIT"}
                        </button>
                    </div>
                </motion.form>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────
   SHARED INPUT COMPONENTS (With Validations Retained)
────────────────────────────────────────────────────────── */

function UnderlineInput({
    label,
    type = "text",
    isPhone,
    value = "",
    onValueChange,
    externalError,
}) {
    // We consolidate everything into one 'hasError' constant
    const hasError = !!externalError;

    const handleChange = (e) => {
        let inputValue = e.target.value;

        if (label.includes("Name")) {
            inputValue = inputValue
                .replace(/[^A-Za-z\s]/g, "")
                .replace(/\s{2,}/g, " ");
        } else if (isPhone) {
            inputValue = inputValue.replace(/\D/g, "").slice(0, 11);
        }

        onValueChange?.(inputValue);

        // Optional: Clear the red error state as soon as the user starts typing again
        // This makes the UI feel much more responsive.
    };

    return (
        <div className="relative group w-full">
            {/* Label turns red based on externalError */}
            <label
                className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}
            >
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={handleChange}
                className={`w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none ${
                    hasError
                        ? "border-red-500 text-red-500"
                        : "border-neutral-300 focus:border-black text-black"
                }`}
            />

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

function GeneralMessageField({
    label = "Message *",
    value = "",
    onValueChange,
    externalError,
}) {
    const hasError = !!externalError;

    return (
        <div className="relative group w-full">
            <label
                className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}
            >
                {label}
            </label>

            <textarea
                rows={12}
                value={value}
                onChange={(e) => onValueChange?.(e.target.value)}
                className={`w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none resize-none ${
                    hasError
                        ? "border-red-500 text-red-500"
                        : "border-neutral-300 focus:border-black text-black"
                }`}
            />

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
