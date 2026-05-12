import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const DEFAULT_FAQ_ITEMS = [
    {
        category: "Scope",
        question: "What types of projects does RMTY handle?",
        answer: "RMTY handles residential, commercial, interior architecture, and planning-focused projects. We tailor each design to the client’s goals, budget, and site conditions.",
    },
    {
        category: "Getting Started",
        question: "How do I start a project with RMTY?",
        answer: "You can start by sending an inquiry through the Contact page or booking a consultation through the Appointment page. We then schedule a discussion to understand your requirements.",
    },
    {
        category: "Process",
        question: "Do you offer full design-to-construction support?",
        answer: "Yes. RMTY can support your project from concept development and design documentation up to construction coordination, depending on your selected scope.",
    },
    {
        category: "Timeline",
        question: "How long does a typical design process take?",
        answer: "Timelines vary by project size and complexity. Smaller residential work can move faster, while larger or multi-phase projects require longer planning and approvals.",
    },
    {
        category: "Process",
        question: "Can I request revisions during the design process?",
        answer: "Yes. Revisions are part of the process. We align design options with your feedback while maintaining technical and planning feasibility.",
    },
    {
        category: "Consultation",
        question: "How are consultations scheduled?",
        answer: "Consultations are scheduled through the Appointment page. Once submitted, our team confirms your preferred schedule through email or phone.",
    },
];

export default function FAQ() {
    const [items, setItems] = useState(DEFAULT_FAQ_ITEMS);
    const [openKey, setOpenKey] = useState(
        DEFAULT_FAQ_ITEMS[0]?.question ?? null,
    );

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/faqs`, {
                    headers: { Accept: "application/json" },
                });

                if (!res.ok) return;

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) return;

                const normalized = data
                    .map((item) => ({
                        category: item.category || "General",
                        question: item.question || "",
                        answer: item.answer || "",
                        sort_order: Number(item.sort_order ?? 0),
                    }))
                    .filter((item) => item.question && item.answer)
                    .sort((a, b) => a.sort_order - b.sort_order);

                if (normalized.length > 0) {
                    setItems(normalized);
                    setOpenKey(normalized[0].question);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
            }
        };

        fetchFaqs();
    }, []);

    return (
        <section className="relative w-full min-h-screen bg-[#efefed] text-black [font-family:var(--font-neue)] overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#d8d8d2] blur-3xl opacity-70" />
            <div className="pointer-events-none absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-[#e2e1dc] blur-3xl opacity-70" />

            <div className="relative mx-auto max-w-screen-2xl px-6 pt-32 pb-24 md:pt-44">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-14">
                    <div className="lg:col-span-8">
                        <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-neutral-500 font-bold">
                            Support & Information
                        </p>
                        <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight uppercase leading-[0.92]">
                            Frequently Asked Questions
                        </h1>
                        <p className="mt-5 text-sm md:text-base leading-relaxed text-neutral-600 max-w-3xl">
                            Find clear answers about working with RMTY, from
                            project scope and timelines to consultations and
                            design development. If you need more details, our
                            team is ready to assist directly.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-2.5">
                            <span className="inline-flex px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] border border-neutral-300 bg-white/60 text-neutral-600">
                                {items.length} Core Questions
                            </span>
                            <span className="inline-flex px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] border border-neutral-300 bg-white/60 text-neutral-600">
                                Fast Client Guidance
                            </span>
                        </div>
                    </div>

                    <div className="lg:col-span-4 lg:justify-self-end w-full lg:max-w-sm border border-neutral-800 bg-neutral-900 text-white p-6 md:p-7 shadow-xl">
                        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/65">
                            Need direct help?
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white/85">
                            For project-specific concerns, send us your details
                            and we will guide you on the next steps.
                        </p>
                        <div className="mt-5 flex gap-2.5">
                            <Link
                                to="/contact"
                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] border border-white bg-white text-black hover:bg-transparent hover:text-white transition-colors"
                            >
                                Contact
                            </Link>
                            <Link
                                to="/appointment"
                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] border border-white/30 text-white hover:border-white transition-colors"
                            >
                                Appointment
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-3"
                    >
                        {items.map((item, index) => {
                            const isOpen = openKey === item.question;
                            const contentId = `faq-panel-${item.question
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")}`;

                            return (
                                <motion.div
                                    key={item.question}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.24,
                                        delay: index * 0.05,
                                    }}
                                    className={`rounded-xl border transition-all ${
                                        isOpen
                                            ? "border-neutral-400 bg-white shadow-sm"
                                            : "border-neutral-300/90 bg-white/65 hover:bg-white/85"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenKey(
                                                isOpen ? null : item.question,
                                            )
                                        }
                                        aria-expanded={isOpen}
                                        aria-controls={contentId}
                                        className="w-full text-left px-5 md:px-6 py-5 md:py-6 flex items-center justify-between gap-8 cursor-pointer group"
                                    >
                                        <div className="space-y-2.5">
                                            <span className="inline-flex w-fit px-2.5 py-1 text-[10px] tracking-[0.16em] font-bold uppercase border border-neutral-300 text-neutral-500 bg-white/70">
                                                {item.category}
                                            </span>
                                            <p className="text-base md:text-xl font-medium tracking-tight group-hover:opacity-70 transition-opacity">
                                                {item.question}
                                            </p>
                                        </div>

                                        {/* PERFECTLY CENTERED SVG ICON */}
                                        <motion.div
                                            animate={{
                                                rotate: isOpen ? 180 : 0,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeInOut",
                                            }}
                                            className="flex items-center justify-center shrink-0 h-9 w-9 rounded-full border border-neutral-300 text-neutral-500 bg-white"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </motion.div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                id={contentId}
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.24 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="px-5 md:px-6 pb-6 md:pb-7 text-sm md:text-base leading-relaxed text-neutral-600 max-w-4xl pr-10">
                                                    {item.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
