import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="w-full bg-[#d9d9d9] text-black [font-family:var(--font-neue)]">
            {/* 1. CONTAINER: 'px-6' matches the rest of the site exactly */}
            <div className="max-w-screen-2xl mx-auto px-6 py-12">
                {/* --- TOP ROW --- */}
                <div className="flex items-start justify-between">
                    {/* 2. ALIGNMENT FIX: 
              Removed '-ml-4'. 
              The logo container now aligns strictly to the left padding.
          */}
                    <div className="-ml-5">
                        <img
                            src="/images/rmty-LOGO.png"
                            alt="RMTY Designs Architects"
                            className="h-30 w-auto object-contain"
                        />
                    </div>

                    <nav className="hidden md:flex items-center gap-10 text-sm font-medium tracking-wide">
                        <Link to="/" className="hover:opacity-70 transition">
                            HOME
                        </Link>
                        <Link
                            to="/about"
                            className="hover:opacity-70 transition"
                        >
                            ABOUT
                        </Link>
                        <Link
                            to="/projects"
                            className="hover:opacity-70 transition"
                        >
                            PROJECTS
                        </Link>
                        <Link
                            to="/services"
                            className="hover:opacity-70 transition"
                        >
                            SERVICES
                        </Link>
                        <Link
                            to="/appointment"
                            className="hover:opacity-70 transition"
                        >
                            APPOINTMENT
                        </Link>
                        <Link
                            to="/contact"
                            className="hover:opacity-70 transition"
                        >
                            CONTACT
                        </Link>
                    </nav>
                </div>

                {/* --- BOTTOM ROW --- */}
                <div className="mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
                    <div className="text-[#555] leading-[0.9] font-medium tracking-wide">
                        <p className="text-2xl md:text-5xl">RMTY</p>
                        <p className="text-2xl md:text-5xl">DESIGNS</p>
                    </div>

                    <div className="md:text-right text-[#666]">
                        <p className="text-sm font-medium tracking-wide text-[#555]">
                            rmty.architects@gmail.com
                        </p>

                        <p className="mt-3 text-sm leading-relaxed tracking-wide text-[#555]">
                            MANILA, PHILIPPINES, 1008
                        </p>

                        <div className="mt-4 flex md:justify-end gap-4 text-[#444]">
                            <a
                                href="https://www.facebook.com/rmtyarchitects"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:opacity-70 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.98H8.1V12h2.34V9.8c0-2.31 1.38-3.59 3.49-3.59.99 0 2.02.18 2.02.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.41V12h2.5l-.4 2.89h-2.1v6.98A10 10 0 0 0 22 12Z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.instagram.com/rmty_architecture/"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:opacity-70 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.2-.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium tracking-wide md:hidden text-[#444]">
                    <Link to="/" className="hover:opacity-70 transition">
                        HOME
                    </Link>
                    <Link to="/about" className="hover:opacity-70 transition">
                        ABOUT
                    </Link>
                    <Link
                        to="/projects"
                        className="hover:opacity-70 transition"
                    >
                        PROJECTS
                    </Link>
                    <Link
                        to="/services"
                        className="hover:opacity-70 transition"
                    >
                        SERVICES
                    </Link>
                    <Link to="/contact" className="hover:opacity-70 transition">
                        CONTACT
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
