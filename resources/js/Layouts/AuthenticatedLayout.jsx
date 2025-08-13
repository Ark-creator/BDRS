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
    BellRing, Menu, X, ArrowLeft, Users
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
                    title={isCollapsed && !mobileOpen ? link.name : undefined}
                    className={clsx(
                        'flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group z-10',
                        (isCollapsed && !mobileOpen) && 'justify-center',
                        link.active
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                >
                    <span className="transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
                    {!(isCollapsed && !mobileOpen) && <span className="flex-1 whitespace-nowrap">{link.name}</span>}
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
            <div
                onClick={() => toggleSection(group.title)}
                className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    (isCollapsed && !mobileOpen) && 'justify-center'
                )}
            >
                {!(isCollapsed && !mobileOpen) && (
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        {group.title}
                    </h3>
                )}
                {!(isCollapsed && !mobileOpen) && (
                    <motion.div animate={{ rotate: openSections[group.title] ? 180 : 0 }}>
                        <ChevronDown size={16} className="text-slate-400" />
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {(openSections[group.title] || (isCollapsed && !mobileOpen)) && (
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
            initial={false}
            animate={{ width: isMobile ? '16rem' : (isCollapsed ? '5rem' : '16rem'), x: isMobile ? (mobileOpen ? '0%' : '-100%') : '0%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className={clsx(
                "fixed top-0 z-40 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
                "left-0"
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 h-16">
                {!(isCollapsed && !mobileOpen) && (
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">Admin Panel</h1>
                )}
                {!isMobile && (
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
            {isMobile && mobileOpen && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <Link
                        href={route('residents.home')}
                        className="flex items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => setShowAdminSidebarMobile(false)}
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
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
    const { props } = usePage();
    const { user } = props.auth;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const isSuperAdmin = user.role === "super_admin";

    // NEW: Check if the current page is an admin page. This is the core logic for the requested change.
    const isAdminPage = isAdmin && route().current()?.startsWith('admin.');

    const [unreadMessages, setUnreadMessages] = useState([]);
    const [isBubbleVisible, setIsBubbleVisible] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [showAdminSidebarMobile, setShowAdminSidebarMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    let hoverTimeout; // For notification bubble hover delay

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                if (isMobileNavOpen) setIsMobileNavOpen(false);
                if (showAdminSidebarMobile) setShowAdminSidebarMobile(false);
            }
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, [isMobileNavOpen, showAdminSidebarMobile]);

    useEffect(() => {
        if (isAdmin) {
            const fetchUnreadMessages = async () => {
                try {
                    const response = await axios.get(route('admin.messages.unread'));
                    setUnreadMessages(response.data.messages || []);
                } catch (error) {
                    console.error("Error fetching unread messages:", error);
                    setUnreadMessages([]);
                }
            };
            fetchUnreadMessages();
        }
    }, [isAdmin]);

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
                { name: 'Requests', href: route('admin.request'), active: route().current('admin.request'), icon: <FolderGit2 size={18} />, },
                ...(isSuperAdmin ? [{ name: 'Users', href: route("superadmin.users.index"), active: route().current("superadmin.users.index"), icon: <Users size={18} /> }] : [])
            ],
        },
        {
            title: 'Account',
            links: [
                { name: 'History', href: route('admin.history'), active: route().current('admin.history'), icon: <History size={18} /> },
                { name: 'Messages', href: route('admin.messages'), active: route().current('admin.messages'), icon: <MessageSquareMore size={18} />, badge: unreadMessages.length },
                { name: 'Payments', href: route('admin.payment'), active: route().current('admin.payment'), icon: <CreditCard size={18} /> },
            ],
        },
    ];

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
                    {messages.slice(0, 5).map((msg) => (
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
            {/* CHANGED: Sidebar now only renders on admin pages */}
            <AnimatePresence>
                {isAdminPage && (
                    <SidebarComponent
                        navLinks={navLinkGroups}
                        isCollapsed={isSidebarCollapsed}
                        setIsCollapsed={setIsSidebarCollapsed}
                        mobileOpen={isMobile && showAdminSidebarMobile}
                        isMobile={isMobile}
                        setShowAdminSidebarMobile={setShowAdminSidebarMobile}
                    />
                )}
            </AnimatePresence>

            <motion.div
                animate={{
                    // CHANGED: Margin is now applied only on admin pages
                    marginLeft: isMobile || !isAdminPage ? '0rem' : (isSidebarCollapsed ? '5rem' : '16rem')
                }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="flex h-full flex-col"
            >
                <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (isMobile) {
                                            // CHANGED: Simplified mobile menu logic
                                            if (isAdminPage) {
                                                setShowAdminSidebarMobile(!showAdminSidebarMobile);
                                            } else {
                                                setIsMobileNavOpen(!isMobileNavOpen);
                                            }
                                        }
                                    }}
                                    className="md:hidden p-2 rounded-lg"
                                    aria-label="Toggle mobile menu"
                                >
                                    {(showAdminSidebarMobile || isMobileNavOpen) ? <X size={24} /> : <Menu size={24} />}
                                </button>
                                <Link href="/" className="flex items-center gap-2">
                                    <img className="w-10 h-10 rounded-full" src="/images/logo1.jpg" alt="Doconnect Logo" />
                                    <span className="font-bold text-lg text-blue-900 dark:text-white hidden sm:inline">Doconnect</span>
                                </Link>
                            </div>

                            <div className="hidden md:flex gap-6">
                                <NavLink href={route("residents.home")} active={route().current("residents.home")}>Home</NavLink>
                                <NavLink href={route("residents.about")} active={route().current("residents.about")}>About</NavLink>
                                <NavLink href={route("residents.contact")} active={route().current("residents.contact")}>Contact</NavLink>
                                <NavLink href={route("residents.faq")} active={route().current("residents.faq")}>FAQ</NavLink>
                            </div>

                            <div className="flex items-center gap-1">
                                {isAdmin && (
                                    <div
                                        className="relative"
                                        // UX IMPROVEMENT: Added delay on hover
                                        onMouseEnter={() => {
                                            clearTimeout(hoverTimeout);
                                            hoverTimeout = setTimeout(() => setIsBubbleVisible(true), 300);
                                        }}
                                        onMouseLeave={() => {
                                            clearTimeout(hoverTimeout);
                                            hoverTimeout = setTimeout(() => setIsBubbleVisible(false), 200);
                                        }}
                                    >
                                        <Link href={route('admin.messages')} className="p-2 rounded-lg transition relative">
                                            <BellRing size={24} className="text-gray-500 dark:text-gray-400" />
                                            {unreadMessages.length > 0 && (
                                                <span className="absolute top-6 -right-5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                                            )}
                                        </Link>
                                        <AnimatePresence>
                                            {isBubbleVisible && <NotificationBubble messages={unreadMessages} />}
                                        </AnimatePresence>
                                    </div>
                                )}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg transition">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{user.name}</span>
                                            <i className="fa-solid fa-circle-user text-2xl text-blue-800 dark:text-blue-400"></i>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                            <div className="font-medium text-base text-gray-800 dark:text-gray-200">{user.name}</div>
                                            <div className="font-medium text-sm text-gray-500">{user.email}</div>
                                        </div>
                                        {isAdmin && (
                                            <Dropdown.Link href={route('admin.dashboard')}>Admin Panel</Dropdown.Link>
                                        )}
                                        <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isMobileNavOpen && isMobile && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex flex-col space-y-1 p-2">
                                        <NavLink href={route("residents.home")} active={route().current("residents.home")} onClick={() => setIsMobileNavOpen(false)}>Home</NavLink>
                                        <NavLink href={route("residents.about")} active={route().current("residents.about")} onClick={() => setIsMobileNavOpen(false)}>About</NavLink>
                                        <NavLink href={route("residents.contact")} active={route().current("residents.contact")} onClick={() => setIsMobileNavOpen(false)}>Contact</NavLink>
                                        <NavLink href={route("residents.faq")} active={route().current("residents.faq")} onClick={() => setIsMobileNavOpen(false)}>FAQ</NavLink>
                                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-1">
                                            {isAdmin && <NavLink href={route('admin.dashboard')} onClick={() => setIsMobileNavOpen(false)}>Admin Panel</NavLink>}
                                            <NavLink href={route("profile.edit")} onClick={() => setIsMobileNavOpen(false)}>Profile</NavLink>
                                            <NavLink href={route("logout")} method="post" as="button" onClick={() => setIsMobileNavOpen(false)}>Log Out</NavLink>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {header && (
                        <header className="bg-white dark:bg-slate-800 shadow-sm">
                            <div className="max-w-7xl mx-auto px-6 py-4">{header}</div>
                        </header>
                    )}
                    <div className="">
                        {children}
                    </div>
                </main>
            </motion.div>

            <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />

            {isMobile && (showAdminSidebarMobile) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => {
                        if (showAdminSidebarMobile) setShowAdminSidebarMobile(false);
                    }}
                />
            )}
        </div>
    );
}