import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
    { label: "HOME", to: "/" },
    { label: "ABOUT", to: "/about" },
    { label: "PROJECTS", to: "/projects" },
    { label: "SERVICES", to: "/services" },
    { label: "APPOINTMENT", to: "/appointment" },
    { label: "CONTACT", to: "/contact" },
];

const menuVariants = {
    hidden: {
        y: "-100%",
        transition: { ease: [0.76, 0, 0.24, 1], duration: 0.8 },
    },
    visible: {
        y: "0%",
        transition: {
            ease: [0.76, 0, 0.24, 1],
            duration: 0.8,
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
    exit: {
        y: "-100%",
        transition: { ease: [0.76, 0, 0.24, 1], duration: 0.8 },
    },
};

const linkVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 1.0, ease: [0.25, 1, 0.5, 1] },
    },
};

const imageVariants = {
    hidden: { opacity: 0, scale: 1.1, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
        opacity: 0,
        filter: "blur(10px)",
        transition: { duration: 0.3, ease: "easeIn" },
    },
};

export default function MenuOverlay({ onClose }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-[#e6e6e6] [font-family:var(--font-neue)] flex flex-col justify-between"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
        >
            {/* --- TOP HEADER --- */}
            {/* ALIGNMENT MATCH: Used max-w-screen-2xl px-6 */}
            <div className="w-full max-w-screen-2xl mx-auto px-6 py-6 grid grid-cols-3 items-center shrink-0">
                {/* ALIGNMENT MATCH: Added 'pl-2' to match the Hero text indentation */}
                <div className="justify-self-start -ml-2">
                    <button
                        onClick={onClose}
                        className="text-black cursor-pointer block"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-12 h-10"
                        >
                            <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.31 6.3-6.31 1.41 1.42z" />
                        </svg>
                    </button>
                </div>

                <div className="justify-self-center"></div>

                <div className="justify-self-end">
                    <img
                        src="/images/rmty-logo-transparent.png"
                        alt="RMTY Designs Architects"
                        className="h-10 lg:h-16 w-auto object-contain block"
                    />
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            {/* ALIGNMENT MATCH: Used max-w-screen-2xl px-6 */}
            <div className="flex-1 max-w-screen-2xl mx-auto px-6 w-full flex items-center">
                <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    {/* LEFT: Links */}
                    {/* ALIGNMENT MATCH: Added 'pl-2' here so links align with Hero Title */}
                    <div className="md:col-span-5 pl-2">
                        <ul
                            className="space-y-4 text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-black"
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {NAV_LINKS.map((link, index) => (
                                <div
                                    key={link.label}
                                    className="overflow-hidden py-1"
                                >
                                    <motion.li
                                        variants={linkVariants}
                                        onMouseEnter={() =>
                                            setHoveredIndex(index)
                                        }
                                    >
                                        <Link
                                            to={link.to}
                                            onClick={onClose}
                                            className="block transition-all duration-500 ease-out"
                                            style={{
                                                opacity:
                                                    hoveredIndex !== null &&
                                                    hoveredIndex !== index
                                                        ? 0.3
                                                        : 1,
                                                transform:
                                                    hoveredIndex === index
                                                        ? "translateX(20px)"
                                                        : "translateX(0px)",
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.li>
                                </div>
                            ))}
                        </ul>
                    </div>

                    <div className="hidden md:block md:col-span-7 h-[400px] relative overflow-hidden rounded-lg">
                        {hoveredIndex === null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-gray-400 select-none"
                            >
                                MENU
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-screen-2xl mx-auto px-6 py-8">
                <div className="pl-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm font-medium text-black/60 uppercase tracking-widest shrink-0">
                    <div>
                        <p className="mb-1 text-black">Socials</p>
                        <ul className="space-y-1">
                            <li>
                                <a
                                    href="https://www.instagram.com/rmty_architecture/"
                                    className="hover:text-black transition-colors"
                                >
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.facebook.com/rmtyarchitects"
                                    className="hover:text-black transition-colors"
                                >
                                    Facebook
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="mb-1 text-black">Contact</p>
                        <p>rmty.architects@gmail.com</p>
                    </div>
                    <div>
                        <p className="mb-1 text-black">Location</p>
                        <p>MANILA, PHILIPPINES</p>
                    </div>
                    <div className="md:text-right">
                        <p>© 2026 RMTY Designs</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
