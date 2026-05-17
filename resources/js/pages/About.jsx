import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function imageUrl(path) {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_BASE}/storage/${path}`;
}

function ImagePlaceholder({ className = "", label = "Image" }) {
    return (
        <div
            className={`grid place-items-center bg-black text-neutral-500 ${className}`}
        >
            <div className="text-xs text-white font-medium tracking-[0.2em] uppercase">
                {label}
            </div>
        </div>
    );
}

// Reusable Loading Overlay Component
function ImageLoadingOverlay({ loading }) {
    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    key="image-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4"
                >
                    <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function About() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/about`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch about sections');
                return res.json();
            })
            .then((data) => setSections(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error('Error fetching about sections:', err);
                setSections([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const bySort = (i) =>
        sections.find((s) => Number(s.sort_order) === i) ?? null;
    const hero = bySort(0);
    const purposeLeft = bySort(1);
    const purposeCenter = bySort(2);
    const purposeImage = bySort(3);
    const mission = bySort(4);
    const vision = bySort(5);
    const artist = bySort(6);

    const defaultHeroText =
        "RMTY is a Manila-based architectural studio focused on designing spaces that respond to people, place, and purpose. Our process balances clear planning, strong design intent, and practical execution.";
    const defaultPurposeShort =
        "We create architecture that is contextual, buildable, and human-centered.";
    const defaultPurposeLong =
        "From early concept to final detailing, RMTY translates client vision into spaces that are refined, functional, and lasting. We approach each project with discipline, collaboration, and sensitivity to site conditions.";
    const defaultBlockText =
        "Our team is committed to delivering thoughtful design solutions through research-driven planning, technical precision, and transparent communication throughout the project lifecycle.";
    const defaultArtistParagraph =
        "RMTY was built on the belief that architecture should be both meaningful and measurable—shaping daily life while meeting real project constraints with clarity and care.";

    return (
        <main className="min-h-screen bg-white text-neutral-900">
            <div className="pt-28 md:pt-32">
                <div className="mx-auto max-w-screen-2xl px-5 md:px-8">
                    {/* HERO */}
                    <section className="pb-10">
                        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                            {hero?.title || "ABOUT US"}
                        </h1>

                        <div className="relative mt-8 overflow-hidden rounded-sm h-[240px] md:h-[320px] w-full">
                            <ImageLoadingOverlay loading={loading} />

                            {!loading &&
                                (hero?.image ? (
                                    <img
                                        src={imageUrl(hero.image)}
                                        alt={hero?.title || "Hero"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImagePlaceholder
                                        label="HERO IMAGE"
                                        className="h-full w-full"
                                    />
                                ))}
                        </div>

                        <div className="mt-6 flex items-start justify-between gap-8">
                            <p className="max-w-lg text-xs leading-relaxed text-neutral-700 md:text-sm">
                                {hero?.content || defaultHeroText}
                            </p>
                            <span className="shrink-0 text-xs text-neutral-700 md:text-sm">
                                2024
                            </span>
                        </div>
                    </section>

                    {/* PURPOSE */}
                    <section className="py-14">
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            Our Purpose
                        </h2>

                        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
                            <div className="md:col-span-3">
                                <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                                    {purposeLeft?.content ||
                                        defaultPurposeShort}
                                </p>
                            </div>

                            <div className="md:col-span-4">
                                <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                                    {purposeCenter?.content ||
                                        defaultPurposeLong}
                                </p>
                            </div>

                            <div className="md:col-span-5">
                                <div className="relative overflow-hidden rounded-sm h-[180px] md:h-[210px] w-full">
                                    <ImageLoadingOverlay loading={loading} />

                                    {!loading &&
                                        (purposeImage?.image ? (
                                            <img
                                                src={imageUrl(
                                                    purposeImage.image,
                                                )}
                                                alt={
                                                    purposeImage.title ||
                                                    "Purpose"
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                label="PURPOSE IMAGE"
                                                className="h-full w-full"
                                            />
                                        ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* MISSION / VISION */}
                    <section className="py-10">
                        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                            <div>
                                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                                    MISSION
                                </h3>

                                <div className="relative mt-6 overflow-hidden rounded-sm h-[170px] md:h-[190px] w-full">
                                    <ImageLoadingOverlay loading={loading} />

                                    {!loading &&
                                        (mission?.image ? (
                                            <img
                                                src={imageUrl(mission.image)}
                                                alt="Mission"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                label="MISSION IMAGE"
                                                className="h-full w-full"
                                            />
                                        ))}
                                </div>

                                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                                    {mission?.content || defaultBlockText}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                                    VISION
                                </h3>

                                <div className="relative mt-6 overflow-hidden rounded-sm h-[170px] md:h-[190px] w-full">
                                    <ImageLoadingOverlay loading={loading} />

                                    {!loading &&
                                        (vision?.image ? (
                                            <img
                                                src={imageUrl(vision.image)}
                                                alt="Vision"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                label="VISION IMAGE"
                                                className="h-full w-full"
                                            />
                                        ))}
                                </div>

                                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                                    {vision?.content || defaultBlockText}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ABOUT THE ARTIST */}
                    <section className="py-16">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 items-start">
                            <div className="md:col-span-5">
                                <div className="relative overflow-hidden rounded-sm h-[320px] md:h-[360px] w-full">
                                    <ImageLoadingOverlay loading={loading} />

                                    {!loading &&
                                        (artist?.image ? (
                                            <img
                                                src={imageUrl(artist.image)}
                                                alt={
                                                    artist.title || "Architect"
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                label="ARTIST IMAGE"
                                                className="h-full w-full"
                                            />
                                        ))}
                                </div>
                            </div>

                            <div className="md:col-span-7">
                                <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                    {artist?.title || "ABOUT THE ARCHITECT."}
                                </h3>

                                <div className="mt-8 space-y-6">
                                    <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                                        {artist?.content
                                            ? artist.content.split("\n\n")[0] ||
                                              defaultArtistParagraph
                                            : defaultArtistParagraph}
                                    </p>

                                    <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                                        {artist?.content
                                            ? artist.content.split("\n\n")[1] ||
                                              defaultArtistParagraph
                                            : defaultArtistParagraph}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}