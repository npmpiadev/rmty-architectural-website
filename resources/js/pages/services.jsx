import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function ImagePlaceholder({ className = "", label = "Image" }) {
    return (
        <div
            className={`flex items-center justify-center bg-black text-white w-full h-full ${className}`}
        >
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">
                {label}
            </div>
        </div>
    );
}

function ImageWithLoader({ src, alt, className }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        key="image-loading"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-10"
                    >
                        <div className="w-8 h-8 border-4 border-neutral-300 border-t-black rounded-full animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            <img
                src={src}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                className={`${className} transition-opacity duration-500 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                }`}
            />
        </div>
    );
}

function getLastBySortOrder(data, sortOrder) {
    const matches = data.filter(
        (s) => Number(s.sort_order) === Number(sortOrder),
    );
    return matches.length > 0 ? matches[matches.length - 1] : {};
}

function parseBulletContent(content = "") {
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-•*]\s*/, ""));
}

export default function Services() {
    const [openIndex, setOpenIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    const [hero, setHero] = useState({});
    const [section, setSection] = useState({});
    const [cta, setCta] = useState({});
    const [services, setServices] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/services`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch services');
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setHero(getLastBySortOrder(data, 0));
                    setSection(getLastBySortOrder(data, 1));
                    setCta(getLastBySortOrder(data, 2));
                    setServices(
                        data
                            .filter(
                                (s) =>
                                    Number(s.sort_order) >= 3 &&
                                    Number(s.is_published) === 1,
                            )
                            .sort(
                                (a, b) =>
                                    Number(a.sort_order) - Number(b.sort_order),
                            ),
                    );
                }
            })
            .catch((err) => {
                console.error('Error fetching services:', err);
                setServices([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="w-full bg-white [font-family:var(--font-neue)]">
            <div className="w-full bg-[#f7f7f8]">
                <div className="mx-auto max-w-screen-2xl px-6 pt-36 pb-20 md:pt-44 md:pb-24 min-h-[400px] md:min-h-[400px]">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl uppercase whitespace-pre-line">
                                {hero.title || "DESIGNING WITH INTENTIONS"}
                            </h1>
                        </div>

                        <p className="max-w-2xl text-sm leading-relaxed text-gray-500 md:justify-self-end mt-2 md:mt-4 whitespace-pre-wrap text-justify">
                            {hero.content ||
                                "RMTY delivers architecture and design services grounded in strategy, technical precision, and contextual thinking. We shape each solution around project goals, constraints, and long-term value."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full bg-white border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-start">
                        <div className="relative overflow-hidden rounded-none bg-gray-100 h-[380px] md:h-[500px]">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loader"
                                        className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-30"
                                    >
                                        <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                    </motion.div>
                                ) : section.image ? (
                                    <ImageWithLoader
                                        key="image"
                                        src={`${API_BASE}/storage/${section.image}`}
                                        alt="Project"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0"
                                    >
                                        <ImagePlaceholder label="PROJECT IMAGE" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold text-black bg-white/60 backdrop-blur-sm py-2 mx-4 border border-white/40 z-20">
                                <span className="opacity-80">📍</span>
                                <span>
                                    {section.locationTag || "Tagaytay City"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-normal tracking-tight text-black md:text-4xl whitespace-pre-line">
                                {section.title || "RMTY | ARCHITECTS"}
                            </h3>

                            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-500 whitespace-pre-wrap text-justify">
                                {section.content ||
                                    "Our studio supports clients from concept design to construction documentation, ensuring that every decision is aligned with function, aesthetics, and buildability."}
                            </p>

                            <div className="mt-12 border-t border-gray-200">
                                {loading ? (
                                    <p className="text-[10px] tracking-widest uppercase text-gray-400 py-6">
                                        Loading services…
                                    </p>
                                ) : services.length === 0 ? (
                                    <p className="text-[10px] tracking-widest uppercase text-gray-400 py-6">
                                        No services available.
                                    </p>
                                ) : (
                                    services.map((item, idx) => {
                                        const isOpen = openIndex === idx;
                                        const bulletItems = parseBulletContent(
                                            item.content,
                                        );

                                        return (
                                            <div
                                                key={item.id ?? idx}
                                                className="border-b border-gray-200"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenIndex(
                                                            isOpen ? null : idx,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between py-5 text-left outline-none group"
                                                >
                                                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-black transition-colors group-hover:text-gray-500">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xl font-light text-black transition-colors group-hover:text-gray-500">
                                                        {isOpen ? "–" : "+"}
                                                    </span>
                                                </button>

                                                <AnimatePresence
                                                    initial={false}
                                                >
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                height: "auto",
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: "easeInOut",
                                                            }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pb-6 pr-8">
                                                                {bulletItems.length >
                                                                0 ? (
                                                                    <ul className="list-disc pl-5 space-y-2 text-[13px] leading-relaxed text-gray-500">
                                                                        {bulletItems.map(
                                                                            (
                                                                                point,
                                                                                pointIndex,
                                                                            ) => (
                                                                                <li
                                                                                    key={
                                                                                        pointIndex
                                                                                    }
                                                                                    className="text-justify"
                                                                                >
                                                                                    {
                                                                                        point
                                                                                    }
                                                                                </li>
                                                                            ),
                                                                        )}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-[13px] leading-relaxed text-gray-500 text-justify">
                                                                        No
                                                                        details
                                                                        available.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full bg-white border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                    <div className="relative overflow-hidden rounded-none bg-gray-100 h-[300px] md:h-[400px]">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="cta-loader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-30"
                                >
                                    <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                </motion.div>
                            ) : cta.image ? (
                                <ImageWithLoader
                                    src={`${API_BASE}/storage/${cta.image}`}
                                    alt="Other projects"
                                    className="h-full w-full object-cover opacity-70"
                                />
                            ) : (
                                <ImagePlaceholder
                                    label=" "
                                    className="h-full w-full"
                                />
                            )}
                        </AnimatePresence>

                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Link
                                to="/projects"
                                className="bg-white px-10 py-4 text-[10px] font-bold tracking-[0.25em] uppercase text-black transition-colors duration-300 hover:bg-white hover:text-black"
                            >
                                {cta.title || "SEE OTHER PROJECTS"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}