import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// --- Icon Imports (for the Sidebar) ---
import {
    LayoutDashboard, Megaphone, FileText, FolderGit2, History,
    MessageSquareMore, CreditCard, PanelLeftClose, PanelLeftOpen, ChevronDown
} from 'lucide-react';

// --- Other Component Imports ---
import NavLink from "@/Components/NavLink";
import Dropdown from "@/Components/Dropdown";

// --- Toast Notification Imports ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//================================================================
// SIDEBAR COMPONENT
//================================================================
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
            { name: 'Requests', href: route('admin.request'), active: route().current('admin.request'), icon: <FolderGit2 size={18} />, badge: 3 },
        ],
    },
    {
        title: 'Account',
        links: [
            { name: 'History', href: route('admin.history'), active: route().current('admin.history'), icon: <History size={18} /> },
            { name: 'Messages', href: route('admin.messages'), active: route().current('admin.messages'), icon: <MessageSquareMore size={18} />, badge: 5 },
            { name: 'Payments', href: route('admin.payment'), active: route().current('admin.payment'), icon: <CreditCard size={18} /> },
        ],
    },
];

function SidebarComponent() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState({ Main: true, Management: true, Account: true });

    const toggleSection = (title) => {
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const NavItem = ({ link, isCollapsed }) => (
        <li className="relative">
             <NavLink
                href={link.href}
                title={isCollapsed ? link.name : undefined}
                className={clsx('flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group z-10', isCollapsed && 'justify-center', {
                    'text-blue-600 dark:text-blue-400': link.active,
                    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800': !link.active,
                })}
            >
                <span className="transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
                {!isCollapsed && <span className="flex-1 whitespace-nowrap">{link.name}</span>}
                {!isCollapsed && link.badge && <span className={clsx('ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold', { 'bg-blue-600 text-white': link.active, 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200': !link.active })}>{link.badge}</span>}
            </NavLink>
            {link.active && <motion.div layoutId="active-nav-indicator" className="absolute inset-0 z-0 rounded-md bg-blue-500/10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
        </li>
    );

    const NavGroup = ({ group, isOpen, onToggle, isCollapsed }) => (
        <div>
            <div onClick={onToggle} className={clsx('flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200', 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                {!isCollapsed && <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{group.title}</h3>}
                {!isCollapsed && <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={16} className="text-slate-400" /></motion.div>}
            </div>
            <AnimatePresence>
                {isOpen && !isCollapsed && (
                    <motion.ul initial="hidden" animate="visible" exit="hidden" className="flex flex-col gap-y-1 mt-1">
                        {group.links.map((link) => (
                            <motion.div key={link.name}><NavItem link={link} isCollapsed={isCollapsed} /></motion.div>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
    
    return (
        <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className={clsx(
                "absolute top-0 left-0 z-20 flex h-screen flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800">
                {!isCollapsed && <h1 className="text-lg font-bold text-slate-800 dark:text-white flex-1">AdminPanel</h1>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                    {isCollapsed ? <PanelLeftOpen size={20} className="text-slate-600 dark:text-slate-300" /> : <PanelLeftClose size={20} className="text-slate-600 dark:text-slate-300" />}
                </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
                <div className="flex flex-col gap-y-2">
                    {navLinkGroups.map((group) => (
                        <NavGroup key={group.title} group={group} isOpen={!!openSections[group.title]} onToggle={() => toggleSection(group.title)} isCollapsed={isCollapsed} />
                    ))}
                </div>
            </nav>
        </motion.aside>
    );
}

//================================================================
// MAIN AUTHENTICATED LAYOUT COMPONENT
//================================================================
export default function AuthenticatedLayout({ header, children }) {
    const { user } = usePage().props.auth;
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    const [isSidebarVisible, setSidebarVisible] = useState(isAdmin);
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            setSidebarVisible(route().current().startsWith('admin.'));
        } else {
            setSidebarVisible(false);
        }
    }, [route().current(), isAdmin]);

    return (
        <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
            <AnimatePresence>
                {isSidebarVisible && isAdmin && <SidebarComponent />}
            </AnimatePresence>
            
          <div className={clsx(
    "flex h-full flex-col transition-[margin-left] duration-300 ease-out",
    isSidebarVisible && "ml-64"
)}>
                <nav className="bg-white dark:bg-gray-800 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* --- Logo --- */}
                            <Link href="/" className="flex items-center gap-2">
                                <img className="w-10 h-10 rounded-full" src="/images/logo1.jpg" alt="Doconnect Logo" />
                                <span className="font-bold text-lg text-blue-900 dark:text-white">Doconnect</span>
                            </Link>

                            {/* --- Desktop Menu --- */}
                            <div className="hidden md:flex gap-6">
                                <NavLink href={route("residents.home")} active={route().current("residents.home")}>Home</NavLink>
                                <NavLink href={route("residents.about")} active={route().current("residents.about")}>About</NavLink>
                                <NavLink href={route("residents.contact")} active={route().current("residents.contact")}>Contact</NavLink>
                                <NavLink href={route("residents.faq")} active={route().current("residents.faq")}>FAQ</NavLink>

                                {isAdmin && (
                                    <Link
                                        href={route('admin.dashboard')}
                                        onClick={() => setSidebarVisible(true)}
                                        className={clsx(
                                            'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none',
                                            isSidebarVisible
                                                ? 'border-blue-400 text-gray-900 dark:text-gray-100 focus:border-blue-700'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 focus:text-gray-700 focus:border-gray-300'
                                        )}
                                    >
                                        Admin
                                    </Link>
                                )}
                                {user.role === "super_admin" && (
                                    <NavLink href={route("superadmin.users.index")} active={route().current("superadmin.users.index")}>Users</NavLink>
                                )}
                            </div>

                            {/* --- User Dropdown and Mobile Menu Button --- */}
                            <div className="hidden md:flex items-center gap-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
                                            <i className="fa-solid fa-circle-user fa-xl text-blue-800"></i>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                            <button onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)} className="md:hidden p-2">
                                {/* Hamburger icon would go here */}
                            </button>
                        </div>
                    </div>
                    {showingNavigationDropdown && (
                        <div className="md:hidden">
                            {/* Responsive NavLinks would go here */}
                        </div>
                    )}
                </nav>

                <div className="flex-1 overflow-y-auto">
                    {header && (
                        <header className="bg-gray-50 dark:bg-gray-800 shadow-sm">
                            <div className="max-w-7xl mx-auto px-6 py-4">{header}</div>
                        </header>
                    )}
                    {children}
                </div>
            </div>

            <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />
        </div>
    );
}