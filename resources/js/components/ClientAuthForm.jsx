import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";

export default function ClientAuthForm({
    onSuccess,
    prefillEmail     = "",
    prefillFirstName = "",
    prefillLastName  = "",
}) {
    const [mode, setMode] = useState("login"); // login | register | otp
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: prefillFirstName,
        lastName:  prefillLastName,
        email:     prefillEmail,
        password:  "",
    });

    const [otpValue, setOtpValue] = useState("");
    const [errors,   setErrors]   = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            delete next[toSnakeCase(field)];
            delete next.general;
            return next;
        });
    };

    const toSnakeCase = (str) =>
        str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

    // Map Laravel snake_case validation errors → camelCase state keys
    const normalizeErrors = (apiErrors) => {
        const map = {
            first_name: "firstName",
            last_name:  "lastName",
            email:      "email",
            password:   "password",
        };
        const normalized = {};
        for (const [key, val] of Object.entries(apiErrors)) {
            const frontendKey = map[key] ?? key;
            normalized[frontendKey] = Array.isArray(val) ? val[0] : val;
        }
        return normalized;
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setErrors({});
        setOtpValue("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (mode === "login") {
                const res = await axios.post("/client/login", {
                    email:    formData.email,
                    password: formData.password,
                });

                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));

                if (typeof onSuccess === "function") onSuccess();
                return;
            }

            if (mode === "register") {
                await axios.post("/client/register", {
                    first_name: formData.firstName,
                    last_name:  formData.lastName,
                    email:      formData.email,
                    password:   formData.password,
                });

                setMode("otp");
                setOtpValue("");
                return;
            }

        } catch (err) {
            const status  = err.response?.status;
            const data    = err.response?.data ?? {};
            const apiMessage = data.message || data.error || "Something went wrong.";
            const apiErrors  = data.errors;

            if (status === 403 && data.requires_otp) {
                setFormData((prev) => ({ ...prev, email: data.email ?? prev.email }));
                setMode("otp");
                setOtpValue("");
                return;
            }

            if (apiErrors && typeof apiErrors === "object") {
                setErrors(normalizeErrors(apiErrors));
            } else {
                setErrors({ general: apiMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setErrors({});

        try {
            const res = await axios.post("/client/verify-otp", {
                email: formData.email,
                otp:   otpValue,
            });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            if (typeof onSuccess === "function") onSuccess();

        } catch (err) {
            setErrors({
                otp:
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Invalid or expired OTP.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="[font-family:var(--font-neue)] w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                <AnimatePresence mode="wait">

                    {/* ── OTP Screen ── */}
                    {mode === "otp" ? (
                        <motion.div
                            key="otp-fields"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-7"
                        >
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                A verification code was sent to{" "}
                                <strong className="text-black">{formData.email}</strong>
                            </p>

                            <FormInput
                                label="OTP Code"
                                value={otpValue}
                                onChange={setOtpValue}
                                error={errors.otp}
                            />

                            {errors.general && (
                                <p className="text-[10px] tracking-wide text-red-500 uppercase">
                                    {errors.general}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="mt-6 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Verify & Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setMode("register"); setErrors({}); }}
                                className="text-[10px] font-medium tracking-[0.1em] text-gray-400 hover:text-black uppercase transition-colors cursor-pointer text-center"
                            >
                                ← Back to registration
                            </button>
                        </motion.div>

                    /* ── Login Screen ── */
                    ) : mode === "login" ? (
                        <motion.div
                            key="login-fields"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-7"
                        >
                            <FormInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(val) => handleChange("email", val)}
                                error={errors.email}
                            />
                            <FormInput
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(val) => handleChange("password", val)}
                                error={errors.password}
                                showPasswordToggle
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                isPasswordVisible={showPassword}
                                forgotLink="/client/forgot-password"
                            />
                        </motion.div>

                    /* ── Register Screen ── */
                    ) : (
                        <motion.div
                            key="register-fields"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-7"
                        >
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <FormInput
                                        label="First Name"
                                        value={formData.firstName}
                                        onChange={(val) => handleChange("firstName", val)}
                                        error={errors.firstName}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <FormInput
                                        label="Last Name"
                                        value={formData.lastName}
                                        onChange={(val) => handleChange("lastName", val)}
                                        error={errors.lastName}
                                    />
                                </div>
                            </div>
                            <FormInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(val) => handleChange("email", val)}
                                error={errors.email}
                            />
                            <FormInput
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(val) => handleChange("password", val)}
                                error={errors.password}
                                showPasswordToggle
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                isPasswordVisible={showPassword}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* General error */}
                <AnimatePresence>
                    {errors.general && mode !== "otp" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-[10px] tracking-wide text-red-500 uppercase border border-red-500/20 bg-red-500/5 p-3">
                                {errors.general}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit + toggle — hidden on OTP screen */}
                {mode !== "otp" && (
                    <div className="flex flex-col gap-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading
                                ? "Processing..."
                                : mode === "login"
                                ? "Sign In"
                                : "Create Profile"}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-[10px] font-medium tracking-[0.1em] text-gray-400 hover:text-black uppercase transition-colors cursor-pointer"
                            >
                                {mode === "login"
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

/* ── Form Input Component (Styled to match Admin AuthForm) ────────────────── */
function FormInput({ 
    label, 
    type = "text", 
    value, 
    onChange, 
    error, 
    showPasswordToggle, 
    onTogglePassword, 
    isPasswordVisible,
    forgotLink
}) {
    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                <span>{label}</span>
                {forgotLink && (
                    <Link
                        to={forgotLink}
                        className="text-[10px] text-gray-400 hover:text-black transition-colors"
                    >
                        Forgot?
                    </Link>
                )}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                    className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
                        ${error ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                    `}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                    >
                        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden uppercase"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// Minimal SVG Icons
function EyeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
        >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
        >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );
}
