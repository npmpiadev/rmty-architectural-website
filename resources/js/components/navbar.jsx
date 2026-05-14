import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar({ onOpenMenu }) {
    const { scrollY } = useScroll();
    const location = useLocation();

    const [hidden, setHidden] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // 1. Track if the user is physically scrolling the page
    const isUserScrolling = useRef(false);

    useEffect(() => {
        let timeout;
        const handleInteraction = () => {
            isUserScrolling.current = true;
            clearTimeout(timeout);
            // Reset state to false when they stop scrolling for 300ms
            timeout = setTimeout(() => {
                isUserScrolling.current = false;
            }, 300);
        };

        const handleKeyDown = (e) => {
            // Only trigger if they press keys that actually scroll the page
            const scrollKeys = [
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
                "Space",
                "Home",
                "End",
            ];
            if (scrollKeys.includes(e.code)) {
                handleInteraction();
            }
        };

        // 2. Listen ONLY for actual scrolling actions.
        // NOTICE: "mousedown" has been completely removed so clicks don't trigger it!
        window.addEventListener("wheel", handleInteraction, { passive: true });
        window.addEventListener("touchmove", handleInteraction, {
            passive: true,
        });
        window.addEventListener("keydown", handleKeyDown, { passive: true });

        return () => {
            window.removeEventListener("wheel", handleInteraction);
            window.removeEventListener("touchmove", handleInteraction);
            window.removeEventListener("keydown", handleKeyDown);
            clearTimeout(timeout);
        };
    }, []);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        setIsScrolled(latest > 50);

        // 3. ONLY hide/show the navbar if the user is physically scrolling!
        // This makes it completely ignore the smooth automatic scroll of the FAQ closing.
        if (isUserScrolling.current) {
            setHidden(latest > previous && latest > 150);
        }
    });

    // Handle transparent tops on specific pages
    const transparentPages = [
        "/about",
        "/services",
        "/appointment",
        "/contact",
    ];
    const isTransparentPage = transparentPages.includes(location.pathname);

    const navStyle = isScrolled
        ? "bg-[#e6e6e6] text-black"
        : isTransparentPage
          ? "bg-transparent text-black"
          : "bg-[#e6e6e6] text-black";

    return (
        <motion.header
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className={`fixed top-0 left-0 w-full z-40 transition-colors duration-300 py-6 ${navStyle}`}
        >
            <nav className="max-w-screen-2xl mx-auto px-6 grid grid-cols-3 items-center [font-family:var(--font-neue)]">
                <div className="justify-self-start -ml-2">
                    <button
                        onClick={onOpenMenu}
                        aria-label="Open menu"
                        className="block"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-12 h-10 cursor-pointer"
                        >
                            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                        </svg>
                    </button>
                </div>

                {/* Center: Logo */}
                <div className="justify-self-center">
                    <Link
                        to="/"
                        className="text-2xl md:text-5xl font-medium tracking-tight"
                    >
                        <img
                            src="/images/rmty-LOGO.png"
                            alt="RMTY Designs Architects"
                            className="h-10 lg:h-16 w-auto object-contain block"
                        />
                    </Link>
                </div>

                {/* Right: CTA */}
                <div className="justify-self-end">
                    <div className="flex items-center gap-4 md:gap-6 text-sm md:text-xl tracking-wide font-medium">
                        <Link
                            to="/projects"
                            className="hover:opacity-70 transition-opacity"
                        >
                            PROJECTS
                        </Link>
                    </div>
                </div>
            </nav>
        </motion.header>
    );
}
