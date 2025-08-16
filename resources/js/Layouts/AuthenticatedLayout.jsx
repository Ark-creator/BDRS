import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import axios from 'axios';

// --- Driver.js (Para sa Tour Guide) ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- Icons ---
import {
    LayoutDashboard, Megaphone, FileText, FolderGit2, History,
    MessageSquareMore, CreditCard, PanelLeftClose, PanelLeftOpen, ChevronDown,
    BellRing, Menu, X, ArrowLeft, Users,
    HelpCircle, LogOut
} from 'lucide-react';

// --- Components ---
import NavLink from "@/Components/NavLink";
import Dropdown from "@/Components/Dropdown";

// --- Toast ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//================================================================
// SIDEBAR COMPONENT (WALANG ANIMATION)
//================================================================
function SidebarComponent({ user, navLinks, isCollapsed, setIsCollapsed, mobileOpen, isMobile, setShowAdminSidebarMobile }) {
    const [openSections, setOpenSections] = useState({
        Main: true,
        Management: true,
        Account: true
    });

    const toggleSection = (title) => {
        if (isCollapsed && !mobileOpen) return;
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // --- KINUMPLETONG DRIVER.JS TOUR FUNCTION ---
    const handleHelpTour = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }

        const driverObj = driver({
            showProgress: true,
            animate: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#sidebar-header', popover: { title: 'Header ng Sidebar', description: 'Dito makikita ang pamagat. Gamitin ang button sa kanan para i-tago o ipakita ang sidebar. ↔️', side: "right", align: 'start' }},
                { element: '#nav-item-dashboard', popover: { title: '📊 Dashboard', description: 'Ito ang iyong sentro ng impormasyon. Dito makikita ang mga summary, statistics, at mahahalagang updates.', side: "right", align: 'start' }},
                { element: '#nav-item-announcements', popover: { title: '📢 Announcements', description: 'Gumawa at mamahala ng mga anunsyo para sa lahat ng miyembro ng komunidad.', side: "right", align: 'start' }},
                { element: '#nav-item-documents', popover: { title: '📄 Documents', description: 'Pamahalaan ang mga template ng dokumento na maaaring hilingin ng mga residente.', side: "right", align: 'start' }},
                { element: '#nav-item-requests', popover: { title: '📂 Requests', description: 'Tingnan at i-proseso ang lahat ng mga papasok na hiling para sa mga dokumento mula sa mga residente.', side: "right", align: 'start' }},
                { element: '#nav-item-history', popover: { title: '📜 History', description: 'Talaan ng mga nakaraang aktibidad at transaksyon sa system.', side: "right", align: 'start' }},
                { element: '#nav-item-messages', popover: { title: '💬 Messages', description: 'Dito mo mababasa ang mga mensahe mula sa mga residente. Ang pulang tuldok ay nangangahulugang may bago kang mensahe.', side: "right", align: 'start' }},
                { element: '#nav-item-payments', popover: { title: '💳 Payments', description: 'Subaybayan ang mga transaksyon sa pagbabayad para sa mga serbisyo.', side: "right", align: 'start' }},
                { element: '#sidebar-user-profile', popover: { title: '👤 User Profile', description: 'Dito makikita kung sino ang naka-login. Pwede ka ring mag-logout dito.', side: "top", align: 'start' }},
                { element: '#help-button-container', popover: { title: '💡 Tulong at Gabay', description: 'I-click mo lang ito ulit kung gusto mong makita muli ang gabay na ito. Sana ay makatulong!', side: "top", align: 'start' }}
            ]
        });

        if (user.role === 'super_admin') {
            const usersStep = {
                element: '#nav-item-users',
                popover: { title: '👥 Users', description: 'Pamahalaan ang mga user account at ang kanilang mga tungkulin (roles) sa system.', side: "right", align: 'start' }
            };
            const currentSteps = driverObj.getConfig().steps;
            const managementIndex = currentSteps.findIndex(step => step.element === '#nav-item-requests');
            currentSteps.splice(managementIndex + 1, 0, usersStep);
            driverObj.setSteps(currentSteps);
        }

        driverObj.drive();
    };

    const NavItem = ({ link }) => {
        const badgeValue = link.badge;
        const itemId = `nav-item-${link.name.toLowerCase().replace(/\s+/g, '-')}`;
        return (
            <li className="relative" id={itemId}>
                <NavLink
                    href={link.href}
                    title={isCollapsed && !mobileOpen ? link.name : undefined}
                    className={clsx(
                        'flex w-full items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group z-10',
                        (isCollapsed && !mobileOpen) && 'justify-center',
                        link.active
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                >
                    <span className="transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
                    {!(isCollapsed && !mobileOpen) && <span className="flex-1 whitespace-nowrap">{link.name}</span>}
                    {!(isCollapsed && !mobileOpen) && badgeValue > 0 && (
                        <span className={'ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white'}>
                            {badgeValue}
                        </span>
                    )}
                </NavLink>
                {link.active && (
                    <div className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 z-0" />
                )}
            </li>
        );
    };

    const NavGroup = ({ group, id }) => (
        <div id={id}>
            {!(isCollapsed && !mobileOpen) && (
                    <div
                    onClick={() => toggleSection(group.title)}
                    className={'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
                >
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        {group.title}
                    </h3>
                    <div className={clsx("transition-transform duration-300", !openSections[group.title] && '-rotate-90')}>
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>
            )}
            <AnimatePresence>
                {(openSections[group.title] || (isCollapsed && !mobileOpen)) && (
                    <ul className="flex flex-col gap-y-1 mt-1 overflow-hidden">
                        {group.links.map((link) => (
                            <div key={link.name}><NavItem link={link} /></div>
                        ))}
                    </ul>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <aside
            className={clsx("fixed top-0 z-40 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-lg transition-all duration-300 ease-in-out",
                isMobile
                    ? (mobileOpen ? 'w-64 left-0' : 'w-0 -left-full')
                    : (isCollapsed ? 'w-[5.5rem] left-0' : 'w-64 left-0')
            )}
        >
            <div id="sidebar-header" className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800 h-16 shrink-0">
                {!(isCollapsed && !mobileOpen) && (
                   <Link href="/" className="flex items-center gap-3">
                        <img className="w-8 h-8 rounded-md" src="/images/gapanlogo.png" alt="Doconnect Logo" />
                        <span className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">Admin</span>
                    </Link>
                )}
                {!isMobile && (
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                )}
                {isMobile && (
                        <button onClick={() => setShowAdminSidebarMobile(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close sidebar">
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-3 overflow-y-auto">
                <div className="flex flex-col gap-y-4">
                    {navLinks.map((group) => (
                        <NavGroup key={group.title} group={group} id={`nav-group-${group.title.toLowerCase()}`} />
                    ))}
                </div>
            </nav>
            
            <div className="p-3 mt-auto border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                <div id="help-button-container" className="mb-2">
                    <button onClick={handleHelpTour} title="Help & Tour" className={clsx('flex w-full items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 group', 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400', (isCollapsed && !mobileOpen) && 'justify-center')}>
                        <HelpCircle size={18} />
                        {!(isCollapsed && !mobileOpen) && <span className="flex-1 whitespace-nowrap">Help & Tour</span>}
                    </button>
                </div>
                
                <div id="sidebar-user-profile" className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-circle-user text-3xl text-blue-800 dark:text-blue-400 shrink-0"></i>
                        {!(isCollapsed && !mobileOpen) && (
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                        )}
                         {!(isCollapsed && !mobileOpen) && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                        <button className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"><LogOut size={16} /></button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="top">
                                    <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                         )}
                    </div>
                </div>
            </div>

            {isMobile && mobileOpen && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <Link href={route('residents.home')} className="flex items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium group text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowAdminSidebarMobile(false)}>
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
                    </Link>
                </div>
            )}
        </aside>
    );
}

//================================================================
// MAIN AUTHENTICATED LAYOUT
//================================================================
export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const { auth: { user } } = props;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const isSuperAdmin = user.role === "super_admin";

    const [unreadMessages, setUnreadMessages] = useState([]);
    const [isBubbleVisible, setIsBubbleVisible] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [showAdminSidebarMobile, setShowAdminSidebarMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    let hoverTimeout;

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .driverjs-theme { background-color: #ffffff; color: #1e293b; border-radius: 0.5rem; } .dark .driverjs-theme { background-color: #1f2937; color: #d1d5db; }
            .driverjs-theme .driver-popover-title { font-size: 1.125rem; font-weight: 700; } .driverjs-theme .driver-popover-description { color: #475569; }
            .dark .driverjs-theme .driver-popover-description { color: #9ca3af; } .driverjs-theme .driver-popover-arrow-side-right { background-color: #ffffff; }
            .dark .driverjs-theme .driver-popover-arrow-side-right { background-color: #1f2937; } .driverjs-theme button { background-color: #3b82f6; color: #ffffff; text-shadow: none; border-radius: 0.375rem; padding: 0.5rem 1rem; }
            .driverjs-theme button:hover { background-color: #2563eb; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        const checkScreenSize = () => { setIsMobile(window.innerWidth < 768); };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    useEffect(() => {
        // Automatically collapse sidebar on mobile
        if (isMobile && isAdmin) {
            setIsSidebarCollapsed(true);
        } else if (!isMobile && isAdmin) {
             // Optional: Un-collapse sidebar if user resizes to desktop
            setIsSidebarCollapsed(false);
        }
    }, [isMobile, isAdmin]);

    useEffect(() => {
        if (isAdmin) {
            const fetchUnreadMessages = async () => {
                try {
                    const response = await axios.get(route('admin.messages.unread'));
                    setUnreadMessages(response.data.messages || []);
                } catch (error) { console.error("Error fetching unread messages:", error); }
            };
            fetchUnreadMessages();
        }
    }, [isAdmin]);

    const navLinkGroups = [
        { title: 'Main', links: [
            { name: 'Dashboard', href: route('admin.dashboard'), active: route().current('admin.dashboard'), icon: <LayoutDashboard size={18} /> },
            { name: 'Announcements', href: route('admin.announcement'), active: route().current('admin.announcement'), icon: <Megaphone size={18} /> },
        ]},
        { title: 'Management', links: [
            { name: 'Documents', href: route('admin.documents'), active: route().current('admin.documents'), icon: <FileText size={18} /> },
            { name: 'Requests', href: route('admin.request'), active: route().current('admin.request'), icon: <FolderGit2 size={18} /> },
            ...(isSuperAdmin ? [{ name: 'Users', href: route("superadmin.users.index"), active: route().current("superadmin.users.index"), icon: <Users size={18} /> }] : [])
        ]},
        { title: 'Account', links: [
            { name: 'History', href: route('admin.history'), active: route().current('admin.history'), icon: <History size={18} /> },
            { name: 'Messages', href: route('admin.messages'), active: route().current('admin.messages'), icon: <MessageSquareMore size={18} />, badge: unreadMessages.length },
            { name: 'Payments', href: route('admin.payment'), active: route().current('admin.payment'), icon: <CreditCard size={18} /> },
        ]},
    ];

    // --- NAIBALIK NA NOTIFICATIONBUBBLE COMPONENT ---
    const NotificationBubble = ({ messages }) => (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-700 shadow-lg rounded-lg border border-gray-200 dark:border-gray-600 z-50 p-4 transition-all duration-300">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Unread Messages ({messages.length})</h3>
            {messages.length > 0 ? (
                <ul className="space-y-3">
                    {messages.slice(0, 5).map((msg) => (
                        <li key={msg.id} className="border-b border-gray-100 dark:border-gray-600 pb-2 last:border-b-0">
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{msg.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.message}</p>
                        </li>
                    ))}
                </ul>
            ) : (<p className="text-gray-500 dark:text-gray-400 text-sm">No new messages.</p>)}
            <div className="mt-4"><Link href={route('admin.messages')} className="text-blue-500 hover:text-blue-700 text-sm font-medium">View All Messages →</Link></div>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-900/95 relative font-inter">
            <AnimatePresence>
                {/* BINAGO: Ang sidebar ay laging ipapakita kung ang user ay isAdmin */}
                {isAdmin && (isMobile && showAdminSidebarMobile || !isMobile) && (
                    <SidebarComponent user={user} navLinks={navLinkGroups} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} mobileOpen={isMobile && showAdminSidebarMobile} isMobile={isMobile} setShowAdminSidebarMobile={setShowAdminSidebarMobile}/>
                )}
            </AnimatePresence>

            {isMobile && showAdminSidebarMobile && (<div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setShowAdminSidebarMobile(false)} />)}

            <div
                className={clsx("flex h-full flex-col transition-all duration-300 ease-in-out",
                    // BINAGO: Ang margin ay laging naka-adjust para sa admin, maliban kung mobile
                    isMobile || !isAdmin
                        ? 'ml-0'
                        : (isSidebarCollapsed ? 'ml-[5.5rem]' : 'ml-[16rem]')
                )}
            >
                <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-2">
                                <button onClick={() => { if (isMobile) { if (isAdmin) { setShowAdminSidebarMobile(!showAdminSidebarMobile); } else { setIsMobileNavOpen(!isMobileNavOpen); }}}} className="md:hidden p-2 rounded-lg" aria-label="Toggle mobile menu">
                                    {(showAdminSidebarMobile || isMobileNavOpen) ? <X size={24} /> : <Menu size={24} />}
                                </button>
                                <Link href="/" className="flex items-center gap-2">
                                    <img className="w-10 h-10 rounded-full" src="/images/gapanlogo.png" alt="Doconnect Logo" />
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
                                    <Link href={route('admin.dashboard')} className="p-2 rounded-lg transition pr-4" title="Admin Panel">
                                        <Users size={24} className="text-gray-500 dark:text-gray-400" />
                                    </Link>
                                )}
                                {isAdmin && (
                                    <div className="relative" onMouseEnter={() => { clearTimeout(hoverTimeout); hoverTimeout = setTimeout(() => setIsBubbleVisible(true), 300); }} onMouseLeave={() => { clearTimeout(hoverTimeout); hoverTimeout = setTimeout(() => setIsBubbleVisible(false), 200); }}>
                                        <Link href={route('admin.messages')} className="p-2 rounded-lg transition relative">
                                            <BellRing size={24} className="text-gray-500 dark:text-gray-400" />
                                            {unreadMessages.length > 0 && (<span className="absolute top-6 -right-5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />)}
                                        </Link>
                                        <AnimatePresence>{isBubbleVisible && <NotificationBubble messages={unreadMessages} />}</AnimatePresence>
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
                                            <div className="font-medium text-sm text-gray-500 truncate">{user.email}</div>
                                        </div>
                                        <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isMobileNavOpen && isMobile && (
                                <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                <main className="flex-1 overflow-y-auto">
                    {header && (<header className="bg-white dark:bg-slate-800 shadow-sm"><div className="max-w-7xl mx-auto px-6 py-4">{header}</div></header>)}
                    <div className="">{children}</div>
                </main>
            </div>

            <ToastContainer position="bottom-right" autoClose={5000} theme="colored" />
        </div>
    );
}