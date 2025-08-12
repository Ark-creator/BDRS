import React, { useState } from 'react';
import NavLink from '@/Components/NavLink'; // From Inertia.js
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// --- Icons ---
import {
    LayoutDashboard, Megaphone, FileText, FolderGit2, History,
    MessageSquareMore, CreditCard, PanelLeftClose, PanelLeftOpen, ChevronDown
} from 'lucide-react';

//================================================================
// 1. NavItem Component (Para sa bawat link)
//================================================================
const NavItem = ({ link, isCollapsed }) => {
  return (
    <li className="relative">
      <NavLink
        href={link.href}
        title={isCollapsed ? link.name : undefined} // Tooltip kapag collapsed
        aria-current={link.active ? 'page' : undefined}
        className={clsx(
          'flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 group z-10',
          isCollapsed && 'justify-center', // I-center ang icon
          {
            'text-blue-600 dark:text-blue-400': link.active,
            'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800': !link.active,
          }
        )}
      >
        <span className="transition-transform duration-200 group-hover:scale-110">
          {link.icon}
        </span>
        {/* Itago ang text at badge kapag naka-collapse */}
        {!isCollapsed && <span className="flex-1 whitespace-nowrap">{link.name}</span>}
        {!isCollapsed && link.badge && (
          <span
            className={clsx(
              'ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
              {
                'bg-blue-600 text-white': link.active,
                'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200': !link.active,
              }
            )}
          >
            {link.badge}
          </span>
        )}
      </NavLink>

      {/* Animated active state indicator */}
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


//================================================================
// 2. NavGroup Component (Para sa bawat collapsible section)
//================================================================
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const NavGroup = ({ group, isOpen, onToggle, isCollapsed }) => {
  return (
    <div>
      <div
        onClick={onToggle}
        className={clsx(
          'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200',
          'hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
      >
        {/* Kung collapsed, huwag ipakita ang title */}
        {!isCollapsed && (
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {group.title}
          </h3>
        )}
        {/* Itago din ang arrow kung collapsed */}
        {!isCollapsed && (
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown size={16} className="text-slate-400" />
            </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col gap-y-1 mt-1"
          >
            {group.links.map((link) => (
              <motion.div key={link.name} variants={itemVariants}>
                <NavItem link={link} isCollapsed={isCollapsed} />
              </motion.div>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};


//================================================================
// 3. Main Sidebar Component (Ito ang i-eexport)
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

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    Main: true,
    Management: true,
    Account: true,
  });

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className={clsx("flex h-screen flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out", isCollapsed ? "w-20" : "w-64")}>
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800">
          {/* Pwede mong ilagay ang logo mo dito */}
          {!isCollapsed && <h1 className="text-lg font-bold text-slate-800 dark:text-white flex-1">AdminPanel</h1>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
              {isCollapsed ? <PanelLeftOpen size={20} className="text-slate-600 dark:text-slate-300" /> : <PanelLeftClose size={20} className="text-slate-600 dark:text-slate-300" />}
          </button>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="flex flex-col gap-y-2">
          {navLinkGroups.map((group) => (
            <NavGroup
              key={group.title}
              group={group}
              isOpen={!!openSections[group.title]} // Ensure boolean value
              onToggle={() => toggleSection(group.title)}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* INALIS NA ANG SETTINGS AT LOGOUT SECTION DITO */}
    </aside>
  );
}

export default Sidebar;