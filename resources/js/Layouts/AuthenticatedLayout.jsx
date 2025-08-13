import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import axios from 'axios';

// --- Icons ---
import {
    LayoutDashboard, Megaphone, FileText, FolderGit2, History,
    MessageSquareMore, CreditCard, PanelLeftClose, PanelLeftOpen, ChevronDown,
    BellRing, Menu, X, ArrowLeft
} from 'lucide-react';

// --- Components ---
import NavLink from "@/Components/NavLink";
import Dropdown from "@/Components/Dropdown";

// --- Toast ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//================================================================
// SIDEBAR COMPONENT (Desktop Collapse & Mobile Overlay)
//================================================================
// Ang component na ito ay humahawak sa desktop admin sidebar (collapsible) at sa
// mobile admin sidebar (overlay na nag-slide in/out).
function SidebarComponent({ navLinks, isCollapsed, setIsCollapsed, mobileOpen, isMobile, setShowAdminSidebarMobile }) {
    const [openSections, setOpenSections] = useState({
        Main: true,
        Management: true,
        Account: true
    });

    const toggleSection = (title) => {
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const NavItem = ({ link }) => {
        const badgeValue = link.badge;
        return (
            <li className="relative">
                <NavLink
                    href={link.href}
                    // Ipakita ang title bilang tooltip kapag naka-collapse, kung hindi, ipakita ang pangalan
                    title={isCollapsed && !mobileOpen ? link.name : undefined}
                    className={clsx(
                        'flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group z-10',
                        (isCollapsed && !mobileOpen) && 'justify-center', // I-center ang content kapag naka-collapse (desktop lang)
                        link.active
                            ? 'text-blue-600 dark:text-blue-400' // Styling para sa active link
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800' // Styling para sa inactive link
                    )}
                >
                    <span className="transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
                    {/* Itago ang text kapag naka-desktop collapse O kapag nasa mobile at hindi pa bukas (overlay) */}
                    {!(isCollapsed && !mobileOpen) && <span className="flex-1 whitespace-nowrap">{link.name}</span>}
                    {/* Badge para sa unread messages/requests etc. */}
                    {!(isCollapsed && !mobileOpen) && badgeValue > 0 && (
                        <span
                            className={clsx(
                                'ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                                link.active
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                            )}
                        >
                            {badgeValue}
                        </span>
                    )}
                </NavLink>
                {/* Active link indicator gamit ang framer-motion layoutId para sa smooth transition */}
                {link.active && (
                    <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute inset-0 z-0 rounded-md bg-blue-500/10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                )}
            </li>
        );
    };

    const NavGroup = ({ group }) => (
        <div>
            {/* Header ng section para sa navigation groups */}
            <div
                onClick={() => toggleSection(group.title)}
                className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    (isCollapsed && !mobileOpen) && 'justify-center' // I-center ang header kapag naka-collapse (desktop lang)
                )}
            >
                {/* Itago ang title kapag naka-collapse (desktop lang) */}
                {!(isCollapsed && !mobileOpen) && (
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        {group.title}
                    </h3>
                )}
                {/* Itago ang chevron kapag naka-collapse (desktop lang) */}
                {!(isCollapsed && !mobileOpen) && (
                    <motion.div animate={{ rotate: openSections[group.title] ? 180 : 0 }}>
                        <ChevronDown size={16} className="text-slate-400" />
                    </motion.div>
                )}
            </div>

            {/* Collapsible section links */}
            <AnimatePresence>
                {/* Ipakita lang kapag bukas ang section at hindi naka-collapse (desktop) O kapag mobileOpen (mobile) */}
                {(openSections[group.title] && !(isCollapsed && !mobileOpen)) && (
                    <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-y-1 mt-1 overflow-hidden"
                    >
                        {group.links.map((link) => (
                            <motion.div key={link.name}>
                                <NavItem link={link} />
                            </motion.div>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <motion.aside
            // Animation para sa desktop width change AT mobile slide-in/out
            initial={{ x: isMobile ? '-100%' : (isCollapsed ? '4rem' : '16rem'), width: isMobile ? '16rem' : (isCollapsed ? '4rem' : '16rem') }}
            animate={{ x: isMobile ? (mobileOpen ? '0%' : '-100%') : '0%', width: isMobile ? '16rem' : (isCollapsed ? '4rem' : '16rem') }}
            transition={{ type: 'tween', duration: 0.3 }}
            className={clsx(
                "fixed top-0 z-40 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
                "left-0" // Siguraduhin na nagsisimula sa kaliwa 0
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                {/* Ipakita ang AdminPanel title kung hindi naka-desktop collapse O kung mobile open */}
                {!(isCollapsed && !mobileOpen) && (
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">AdminPanel</h1>
                )}
                {/* Button para i-collapse/expand ang sidebar - desktop lang ito */}
                {!isMobile && ( // Itago ang button na ito kapag mobile (burger button sa header ang magko-kontrol)
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                )}
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
                <div className="flex flex-col gap-y-2">
                    {navLinks.map((group) => (
                        <NavGroup key={group.title} group={group} />
                    ))}
                </div>
            </nav>
            {/* "Back as a Residents" link para sa mobile admin sidebar */}
            {isMobile && mobileOpen && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <Link
                        href={route('residents.home')}
                        className="flex items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => setShowAdminSidebarMobile(false)} // Isara ang mobile admin sidebar kapag nag-click
                    >
                        <ArrowLeft size={18} />
                        <span>Back as a Resident</span>
                    </Link>
                </div>
            )}
        </motion.aside>
    );
}

//================================================================
// MAIN AUTHENTICATED LAYOUT (Responsive for All Devices)
//================================================================
export default function AuthenticatedLayout({ header, children }) {
    const { user } = usePage().props.auth;
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    const [unreadMessages, setUnreadMessages] = useState([]);
    const [isBubbleVisible, setIsBubbleVisible] = useState(false);
    // State para sa desktop sidebar collapse (true = naka-collapse, false = naka-expand)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // State para sa mobile top-navigation menu visibility (para sa public pages)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    // State para sa mobile admin sidebar visibility (nag-o-overlay)
    const [showAdminSidebarMobile, setShowAdminSidebarMobile] = useState(false);
    // State para malaman kung mobile size ang current viewport
    const [isMobile, setIsMobile] = useState(false);

    // Effect para ma-detect ang pagbabago sa screen size
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Kung nagre-resize mula mobile patungong desktop, isara ang mobile nav at admin sidebar kung bukas
            if (!mobile) {
                if (isMobileNavOpen) setIsMobileNavOpen(false);
                if (showAdminSidebarMobile) setShowAdminSidebarMobile(false);
            }
        };

        checkScreenSize(); // Initial check
        window.addEventListener("resize", checkScreenSize); // Mag-listen sa resize events
        return () => window.removeEventListener("resize", checkScreenSize); // I-cleanup ang listener
    }, [isMobileNavOpen, showAdminSidebarMobile]); // Re-run kapag nagbago ang mobile nav/admin sidebar state

    // Effect para kunin ang unread messages (para lang sa admins)
    useEffect(() => {
        if (isAdmin) {
            const fetchUnreadMessages = async () => {
                try {
                    // Assuming 'admin.messages.unread' is the correct route
                    const response = await axios.get(route('admin.messages.unread'));
                    setUnreadMessages(response.data.messages || []);
                } catch (error) {
                    console.error("Error fetching unread messages:", error);
                    setUnreadMessages([]);
                }
            };

            fetchUnreadMessages();
        }
    }, [isAdmin]); // Re-run kung nagbago ang admin status

    // Navigation links na naka-grupo para sa sidebar at mobile menu
    const navLinkGroups = [
        {
            title: 'Main',
            links: [
                { name: 'Dashboard', href: route('admin.dashboard'), active: route().current('admin.dashboard'), icon: <LayoutDashboard size={18} /> },
                { name: 'Announcements', href: route('admin.announcement'), active: route().current('admin.announcement'), icon: <Megaphone size={18} /> },
            ],
        },
        {
            title: 'Management',
            links: [
                { name: 'Documents', href: route('admin.documents'), active: route().current('admin.documents'), icon: <FileText size={18} /> },
                // Halimbawa na may static badge value, pwede itong gawing dynamic
                { name: 'Requests', href: route('admin.request'), active: route().current('admin.request'), icon: <FolderGit2 size={18} />, badge: 3 },
            ],
        },
        {
            title: 'Account',
            links: [
                { name: 'History', href: route('admin.history'), active: route().current('admin.history'), icon: <History size={18} /> },
                // Dynamic badge para sa unread messages
                { name: 'Messages', href: route('admin.messages'), active: route().current('admin.messages'), icon: <MessageSquareMore size={18} />, badge: unreadMessages.length },
                { name: 'Payments', href: route('admin.payment'), active: route().current('admin.payment'), icon: <CreditCard size={18} /> },
            ],
        },
    ];

    // Notification bubble component para sa messages
    const NotificationBubble = ({ messages }) => (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-700 shadow-lg rounded-lg border border-gray-200 dark:border-gray-600 z-50 p-4"
        >
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                Unread Messages ({messages.length})
            </h3>
            {messages.length > 0 ? (
                <ul className="space-y-3">
                    {messages.map((msg) => (
                        <li key={msg.id} className="border-b border-gray-100 dark:border-gray-600 pb-2 last:border-b-0">
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{msg.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.message}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No new messages.</p>
            )}
            <div className="mt-4">
                <Link href={route('admin.messages')} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                    View All Messages →
                </Link>
            </div>
        </motion.div>
    );

    return (
        <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 relative font-inter">
            {/* Sidebar (para lang sa admin) */}
            <AnimatePresence>
                {isAdmin && ( // Palaging i-render kung admin, hayaan ang internal logic na humawak sa mobile/desktop
                    <SidebarComponent
                        navLinks={navLinkGroups}
                        isCollapsed={isSidebarCollapsed} // Ito ay para sa desktop collapse
                        setIsCollapsed={setIsSidebarCollapsed}
                        mobileOpen={isMobile && showAdminSidebarMobile} // Ipasa ang mobile state
                        isMobile={isMobile} // Ipasa ang isMobile sa sidebar component
                        setShowAdminSidebarMobile={setShowAdminSidebarMobile} // Ipasa ang setter function
                    />
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div
                className={clsx(
                    "flex h-full flex-col transition-all duration-300 ease-out",
                    // Ilapat ang left margin batay sa sidebar state para lang sa desktop admins
                    isAdmin && !isMobile && !isSidebarCollapsed && "ml-64", // Desktop, expanded sidebar
                    isAdmin && !isMobile && isSidebarCollapsed && "ml-16",  // Desktop, collapsed sidebar
                    isMobile && "ml-0" // Sa mobile, ang content ay palaging nagsisimula sa 0, nag-o-overlay ang mobile nav/sidebar
                )}
            >
                {/* Top Navigation Bar */}
                <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">

                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2">
                                {/* Gumagamit ng placeholder image para sa demonstration */}
                                <img className="w-10 h-10 rounded-full" src="https://placehold.co/40x40/E0F2F7/0288D1?text=Logo" alt="Doconnect Logo" />
                                <span className="font-bold text-lg text-blue-900 dark:text-white">Doconnect</span>
                            </Link>

                            {/* Desktop Navigation Links */}
                            <div className="hidden md:flex gap-6">
                                <NavLink href={route("residents.home")} active={route().current("residents.home")}>Home</NavLink>
                                <NavLink href={route("residents.about")} active={route().current("residents.about")}>About</NavLink>
                                <NavLink href={route("residents.contact")} active={route().current("residents.contact")}>Contact</NavLink>
                                <NavLink href={route("residents.faq")} active={route().current("residents.faq")}>FAQ</NavLink>

                                {/* Link ng Admin na palaging nakikita para sa admins, nagna-navigate sa dashboard */}
                                {isAdmin && (
                                    <NavLink href={route('admin.dashboard')} active={route().current()?.startsWith('admin.')}>
                                        Admin
                                    </NavLink>
                                )}
                                {/* Link ng Super admin para sa pamamahala ng mga user */}
                                {user.role === "super_admin" && (
                                    <NavLink href={route("superadmin.users.index")} active={route().current("superadmin.users.index")}>
                                        Users
                                    </NavLink>
                                )}
                            </div>

                            {/* Kanang Bahagi: Notifications & User Dropdown */}
                            <div className="flex items-center gap-3">
                                {/* Messages Bell (para lang sa admin) */}
                                {isAdmin && (
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setIsBubbleVisible(true)}
                                        onMouseLeave={() => setIsBubbleVisible(false)}
                                    >
                                        <Link href={route('admin.messages')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                            <BellRing size={24} className="text-gray-500 dark:text-gray-400" />
                                        </Link>
                                        {unreadMessages.length > 0 && (
                                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-gray-800">
                                                {unreadMessages.length}
                                            </span>
                                        )}
                                        <AnimatePresence>
                                            {isBubbleVisible && unreadMessages.length > 0 && (
                                                <NotificationBubble messages={unreadMessages} />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* User Profile Dropdown */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
                                            {/* Halimbawa ng user icon gamit ang placeholder image */}
                                            <img className="w-8 h-8 rounded-full" src="https://placehold.co/32x32/FFD166/000000?text=U" alt="User Icon" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* Mobile Menu Toggle Button (nakatago sa desktop) */}
                                <button
                                    onClick={() => {
                                        if (isMobile) {
                                            if (isAdmin && route().current()?.startsWith('admin.')) {
                                                setShowAdminSidebarMobile(!showAdminSidebarMobile);
                                                setIsMobileNavOpen(false); // Siguraduhin na sarado ang public mobile nav
                                            } else {
                                                setIsMobileNavOpen(!isMobileNavOpen);
                                                setShowAdminSidebarMobile(false); // Siguraduhin na sarado ang admin sidebar mobile
                                            }
                                        }
                                    }}
                                    className="md:hidden p-2 rounded-lg"
                                    aria-label="Toggle mobile menu"
                                >
                                    {(isMobile && isAdmin && route().current()?.startsWith('admin.') && showAdminSidebarMobile) || (isMobile && !isAdmin && isMobileNavOpen) || (isMobile && isAdmin && !route().current()?.startsWith('admin.') && isMobileNavOpen)
                                        ? <X size={24} /> // Ipakita ang X kung ang mobile admin sidebar O mobile public nav ay bukas
                                        : <Menu size={24} /> // Ipakita ang Menu kung hindi
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Mobile Dropdown Navigation Menu (para sa public pages) */}
                        <AnimatePresence>
                            {isMobileNavOpen && isMobile && ( // Ipakita lang kung mobile menu ay bukas at nasa mobile
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 fixed top-16 w-full z-20" // Fixed position sa ilalim ng header
                                >
                                    <div className="flex flex-col space-y-2 px-4">
                                        {/* Main navigation links */}
                                        <NavLink href={route("residents.home")} active={route().current("residents.home")} onClick={() => setIsMobileNavOpen(false)}>Home</NavLink>
                                        <NavLink href={route("residents.about")} active={route().current("residents.about")} onClick={() => setIsMobileNavOpen(false)}>About</NavLink>
                                        <NavLink href={route("residents.contact")} active={route().current("residents.contact")} onClick={() => setIsMobileNavOpen(false)}>Contact</NavLink>
                                        <NavLink href={route("residents.faq")} active={route().current("residents.faq")} onClick={() => setIsMobileNavOpen(false)}>FAQ</NavLink>
                                        {/* Admin specific links para sa mobile nav (kung admin at nasa public page) */}
                                        {isAdmin && <NavLink href={route('admin.dashboard')} active={route().current()?.startsWith('admin.')} onClick={() => setIsMobileNavOpen(false)}>Admin</NavLink>}
                                        {user.role === "super_admin" && <NavLink href={route("superadmin.users.index")} active={route().current("superadmin.users.index")} onClick={() => setIsMobileNavOpen(false)}>Users</NavLink>}
                                        {/* User profile at logout links para sa mobile nav */}
                                        <Link href={route("profile.edit")} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md" onClick={() => setIsMobileNavOpen(false)}>Profile</Link>
                                        <Link href={route("logout")} method="post" as="button" className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md" onClick={() => setIsMobileNavOpen(false)}>Log Out</Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {header && (
                        <header className="bg-gray-50 dark:bg-gray-800 shadow-sm">
                            <div className="max-w-7xl mx-auto px-6 py-4">{header}</div>
                        </header>
                    )}
                    <div className="">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Toast Notifications */}
            <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />

            {/* Overlay kapag bukas ang mobile nav O mobile admin sidebar */}
            {isMobile && (isMobileNavOpen || showAdminSidebarMobile) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" // z-index na mas mababa sa mobile nav/sidebar
                    onClick={() => {
                        if (isMobileNavOpen) setIsMobileNavOpen(false);
                        if (showAdminSidebarMobile) setShowAdminSidebarMobile(false);
                    }}
                />
            )}
        </div>
    );
}

