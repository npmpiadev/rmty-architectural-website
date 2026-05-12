import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import Navbar from "../components/Navbar"; // Adjust this import path if Navbar is in a different folder
import Faq from "./Faq";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Reusable Placeholder
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

export default function Home() {
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    // State to handle opening the menu from the Navbar
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let loadedContent = null;

                // 1. Fetch Home Content
                const contentRes = await fetch(`${API_BASE}/api/home-content`);
                if (contentRes.ok) {
                    const contentData = await contentRes.json();
                    loadedContent = contentData.data;
                    setContent(loadedContent);
                }

                // 2. Fetch Projects
                const projectsRes = await fetch(`${API_BASE}/api/projects`);
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setFeaturedProjects(projectsData.slice(0, 3));
                }

                // 3. Preload the first hero image
                if (
                    loadedContent &&
                    loadedContent.hero_image_1 &&
                    loadedContent.hero_image_1.trim() !== ""
                ) {
                    await new Promise((resolve) => {
                        const img = new Image();
                        img.src = `${API_BASE}/storage/${loadedContent.hero_image_1}`;
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }
            } catch (error) {
                console.error("Failed to fetch home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, []);

    const activeHeroImages = [
        content?.hero_image_1 && content.hero_image_1.trim() !== ""
            ? `${API_BASE}/storage/${content.hero_image_1}`
            : null,
        content?.hero_image_2 && content.hero_image_2.trim() !== ""
            ? `${API_BASE}/storage/${content.hero_image_2}`
            : null,
        content?.hero_image_3 && content.hero_image_3.trim() !== ""
            ? `${API_BASE}/storage/${content.hero_image_3}`
            : null,
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex(
                (prevIndex) => (prevIndex + 1) % activeHeroImages.length,
            );
        }, 5000);
        return () => clearInterval(timer);
    }, [activeHeroImages.length]);

    const handleOpenMenu = () => {
        setIsMenuOpen(true);
        // You can add logic here to open your actual sidebar/menu component
    };

    return (
        <>
            {/* --- HERO SECTION --- */}
            <section className="relative w-full h-[80vh] bg-black overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black">
                    {/* USER'S LOADING OVERLAY FOR HERO */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                key="hero-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 gap-4"
                            >
                                <div className="w-8 h-8 border-4 border-neutral-800 border-t-white rounded-full animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="popLayout">
                        {!loading && activeHeroImages[currentImageIndex] ? (
                            <motion.img
                                key={`img-${currentImageIndex}`}
                                src={activeHeroImages[currentImageIndex]}
                                alt={`RMTY Hero ${currentImageIndex + 1}`}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 1.5,
                                    ease: "easeInOut",
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : !loading ? (
                            <motion.div
                                key={`placeholder-${currentImageIndex}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 w-full h-full"
                            >
                                <ImagePlaceholder
                                    label={`HERO IMAGE ${currentImageIndex + 1}`}
                                    className="w-full h-full"
                                />
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/30 z-10" />
                </div>

                <div className="relative z-10 w-full h-full max-w-screen-2xl mx-auto px-6 pb-12 flex flex-col justify-end">
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="text-white [font-family:var(--font-neue)] mb-6 md:mb-12">
                                <h1 className="text-[45px] font-bold tracking-tighter uppercase leading-none">
                                    {content?.hero_title_1 || "RMTY"}
                                </h1>
                                <h2 className="text-[30px] font-normal tracking-tight leading-none mt-2">
                                    {content?.hero_title_2 ||
                                        "Architectural Design Studio"}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex items-end mt-2 md:justify-center">
                        <div className="w-full md:w-1/2 border-b-2 border-white"></div>
                    </div>
                </div>
            </section>

            {/* --- FEATURED PROJECTS SECTION --- */}
            <section className="w-full bg-white py-24 [font-family:var(--font-neue)] text-black">
                <div className="max-w-screen-2xl mx-auto px-6">
                    <div className="mb-16 max-w-2xl">
                        <h3 className="text-[35px] font-bold uppercase tracking-tight mb-6">
                            {content?.featured_heading || "Design With Purpose"}
                        </h3>
                        <p className="text-gray-600 text-[24px] md:text-base leading-relaxed whitespace-pre-wrap">
                            {content?.featured_description ||
                                "RMTY approaches each project with a balance of architectural clarity and practical execution. Our featured works demonstrate how we translate site context, client goals, and technical requirements into spaces that are purposeful and enduring."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {/* FEATURED PROJECTS OVERLAY */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    key="projects-loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="col-span-full h-64 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4 rounded-2xl"
                                >
                                    <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                        Fetching Projects
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!loading &&
                            featuredProjects.map((project) => (
                                <div
                                    key={project.id || project.slug}
                                    className={project.colSpan || "col-span-1"}
                                >
                                    <ProjectCard
                                        title={project.title}
                                        category={
                                            project.category?.name ||
                                            project.location
                                        }
                                        slug={project.slug || project.id}
                                        image={project.image}
                                        aspectRatio={
                                            project.aspect || "aspect-[4/3]"
                                        }
                                    />
                                </div>
                            ))}
                    </div>

                    <div className="mt-20 flex justify-center">
                        <Link
                            to="/projects"
                            className="group inline-flex flex-col items-center"
                        >
                            <span className="text-xl font-bold tracking-tight uppercase hover:opacity-70 transition-opacity">
                                See All Works.
                            </span>
                            <span className="w-full h-[2px] bg-black mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- CONTACT SECTION --- */}
            <section className="w-full bg-[#111] py-24 [font-family:var(--font-neue)] text-white">
                <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="flex flex-col items-start justify-center h-full">
                        <h2 className="text-4xl md:text-5xl font-normal tracking-tight mb-12">
                            {content?.contact_heading || "Partner with us."}
                        </h2>
                        <div className="space-y-8 w-full max-w-md">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">
                                    {content?.contact_email_label || "Email"}
                                </p>
                                <a
                                    href={`mailto:${content?.contact_email || "rmty.architects@gmail.com"}`}
                                    className="text-lg md:text-xl font-medium hover:text-gray-300 transition-colors"
                                >
                                    {content?.contact_email ||
                                        "rmty.architects@gmail.com"}
                                </a>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">
                                    {content?.contact_address_label ||
                                        "Address"}
                                </p>
                                <p className="text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                                    {content?.contact_address ||
                                        "Manila, Philippines"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-sm relative">
                            {/* USER'S LOADING OVERLAY FOR CONTACT IMAGE */}
                            <AnimatePresence>
                                {loading && (
                                    <motion.div
                                        key="contact-loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-8 gap-4"
                                    >
                                        <div className="w-8 h-8 border-4 border-neutral-800 border-t-white rounded-full animate-spin" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!loading && (
                                <div className="relative w-full h-full group">
                                    {content?.contact_image &&
                                    content.contact_image.trim() !== "" ? (
                                        <img
                                            src={`${API_BASE}/storage/${content.contact_image}`}
                                            alt="Contact"
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    ) : (
                                        <ImagePlaceholder
                                            label="CONTACT IMAGE"
                                            className="w-full h-full"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <Link
                                to="/contact"
                                className="group inline-flex items-center gap-3 text-2xl md:text-3xl font-normal hover:opacity-80 transition-opacity"
                            >
                                <span className="border-b border-transparent group-hover:border-white transition-all text-2xl">
                                    {content?.contact_cta || "Let’s Talk!"}
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 transform group-hover:translate-x-2 transition-transform duration-300"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <Faq />
        </>
    );
}
