import React from "react";
import { useSearchParams } from "react-router-dom";
import ClientAuthForm from "../components/ClientAuthForm";

export default function ClientAuthPage() {
    const [searchParams] = useSearchParams();

    // Pre-fill values passed from the appointment form
    const prefillEmail = searchParams.get("email") ?? "";
    const prefillFirstName = searchParams.get("firstName") ?? "";
    const prefillLastName = searchParams.get("lastName") ?? "";

    return (
        <section className="min-h-screen w-full [font-family:var(--font-neue)]">
            <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
                {/* LEFT: Image holder */}
                <div className="hidden md:flex items-center justify-center relative bg-neutral-200">
                    <img
                        src="/images/home-hero.webp"
                        alt="Architectural Visual"
                        className="w-full h-full object-cover grayscale-[15%]"
                    />
                    <div className="absolute inset-0 bg-black/10 z-10" />
                </div>

                {/* RIGHT: Auth panel */}
                <div className="flex items-center justify-center bg-[#f5f5f5] px-6 py-16 lg:px-24 relative">
                    <div className="w-full max-w-sm">
                        {/* Heading Area */}
                        <div className="mb-12">
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase leading-none mb-3">
                                {prefillEmail ? (
                                    <>Almost There.</>
                                ) : (
                                    <>Welcome Back.</>
                                )}
                            </h1>

                            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
                                {prefillEmail
                                    ? "Sign in or create an account to submit your booking."
                                    : "Authenticate to access your dashboard."}
                            </p>
                        </div>

                        <ClientAuthForm
                            prefillEmail={prefillEmail}
                            prefillFirstName={prefillFirstName}
                            prefillLastName={prefillLastName}
                            onSuccess={() => {
                                const hasDraft =
                                    !!sessionStorage.getItem(
                                        "appointment_draft",
                                    );
                                window.location.href = hasDraft
                                    ? "/appointment"
                                    : "/user/dashboard";
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
