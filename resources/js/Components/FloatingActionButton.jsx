// src/components/FloatingActionButton.js

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bot, X, HelpCircle } from 'lucide-react';
import { route } from 'ziggy-js';

const MessagesModal = lazy(() => import('./MessagesModal'));

const Backdrop = ({ onClick }) => (
    <motion.div
        onClick={onClick}
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
    />
);

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const constraintsRef = useRef(null);

    // <-- BAGONG STATE para sa pwesto ng menu
    const [menuPosition, setMenuPosition] = useState({
        positionClasses: 'bottom-full mb-3 right-0',
        originClass: 'origin-bottom-right',
    });

    // ... (Walang binago sa useEffect hooks, i-keep lang sila)
    useEffect(() => {
        window.chatbaseConfig = { chatId: "JpK2sH4Fo9CfxCa8CTn70", openOnLoad: false };
        if (!window.chatbase || window.chatbase("getState") !== "initialized") {
            window.chatbase = (...args) => { (window.chatbase.q = window.chatbase.q || []).push(args); };
            window.chatbase = new Proxy(window.chatbase, { get(target, prop) { if (prop === "q") return target.q; return (...args) => target(prop, ...args); } });
        }
        window.chatbase('on', 'open', () => { setIsChatOpen(true); setIsOpen(false); });
        window.chatbase('on', 'close', () => { setIsChatOpen(false); });
        const loadScript = () => {
            if (document.getElementById("JpK2sH4Fo9CfxCa8CTn70")) return;
            const script = document.createElement("script");
            script.src = "https://www.chatbase.co/embed.min.js";
            script.id = "JpK2sH4Fo9CfxCa8CTn70";
            script.setAttribute('domain', 'www.chatbase.co');
            script.defer = true;
            document.body.appendChild(script);
        };
        if (document.readyState === "complete") { loadScript(); }
        else { window.addEventListener("load", loadScript); return () => window.removeEventListener("load", loadScript); }
    }, []);
    useEffect(() => {
        const launcherId = 'chatbase-bubble-button';
        const observer = new MutationObserver(() => {
            const launcher = document.getElementById(launcherId);
            if (launcher) { launcher.style.display = 'none'; observer.disconnect(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    // ... (Walang binago sa mga toggle functions, i-keep lang sila)
    const toggleMenu = () => setIsOpen(!isOpen);
    const toggleMessages = () => setIsMessagesOpen(!isMessagesOpen);
    const toggleChatbot = () => { if (window.chatbase) { if (isChatOpen) { window.chatbase('close'); setIsChatOpen(false); } else { window.chatbase('open'); setIsChatOpen(true); setIsOpen(false); } } else { console.error("Chatbase is not available."); } };
    const handleMainButtonClick = () => { if (isMessagesOpen) { setIsMessagesOpen(false); return; } if (isChatOpen) { toggleChatbot(); } else { toggleMenu(); } };
    const handleTourClick = () => { router.get(route('residents.home', { action: 'tour' })); setIsOpen(false); };

    // <-- BAGONG FUNCTION para i-calculate ang pwesto ng menu
    const handleDragEnd = (event, info) => {
        const fabElement = event.target.closest('.draggable-fab');
        if (!fabElement) return;

        const fabRect = fabElement.getBoundingClientRect();
        const y = fabRect.top + fabRect.height / 2;
        const x = fabRect.left + fabRect.width / 2;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let newPosition = {};

        // Vertical check (opens down if on top half, up if on bottom half)
        if (y < viewportHeight / 2) {
            newPosition.positionClasses = 'top-full mt-3';
        } else {
            newPosition.positionClasses = 'bottom-full mb-3';
        }

        // Horizontal check (aligns left/right)
        if (x < viewportWidth / 2) {
            newPosition.positionClasses += ' left-0';
            newPosition.originClass = (y < viewportHeight / 2) ? 'origin-top-left' : 'origin-bottom-left';
        } else {
            newPosition.positionClasses += ' right-0';
            newPosition.originClass = (y < viewportHeight / 2) ? 'origin-top-right' : 'origin-bottom-right';
        }

        setMenuPosition(newPosition);
    };

    const listContainerVariants = { opened: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25, when: "beforeChildren", staggerChildren: 0.07 } }, closed: { opacity: 0, scale: 0.9, y: 20, transition: { when: "afterChildren", duration: 0.25 } } };
    const listItemVariants = { opened: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }, closed: { opacity: 0, x: -20, transition: { duration: 0.2 } } };
    const actionButtons = [
        { icon: <Bot size={22} className="text-blue-600 dark:text-blue-400" />, action: toggleChatbot, title: 'Chat with AI Assistant' },
        { icon: <HelpCircle size={22} className="text-blue-600 dark:text-blue-400" />, action: handleTourClick, title: 'How to Request' },
        { icon: <MessageSquare size={22} className="text-blue-600 dark:text-blue-400" />, action: toggleMessages, title: 'Messages' },
    ];
    const isAnyOverlayOpen = isChatOpen || isMessagesOpen;

    return (
        <>
            <motion.div ref={constraintsRef} className="fixed inset-6 pointer-events-none z-[2147483646]" />
            <AnimatePresence>
                {isOpen && !isAnyOverlayOpen && <Backdrop onClick={() => setIsOpen(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {isMessagesOpen && (
                    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/20 z-[2147483647]"><div className="text-white font-bold">Loading Chat...</div></div>}>
                        <MessagesModal onClose={() => setIsMessagesOpen(false)} />
                    </Suspense>
                )}
            </AnimatePresence>

            <motion.div
                className="fixed bottom-6 right-6 z-[2147483647] cursor-grab draggable-fab" // <-- Nagdagdag ng class name
                drag
                dragConstraints={constraintsRef}
                dragMomentum={false}
                onDragStart={() => isOpen && setIsOpen(false)}
                onDragEnd={handleDragEnd} // <-- Gagamitin ang bagong function
                whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            >
                <AnimatePresence>
                    {isOpen && !isAnyOverlayOpen && (
                        <motion.div
                            // <-- DITO GINAMIT ANG DYNAMIC CLASSES
                            className={`absolute w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 ${menuPosition.positionClasses} ${menuPosition.originClass}`}
                            initial="closed"
                            animate="opened"
                            exit="closed"
                            variants={listContainerVariants}
                        >
                            <div className="p-4 bg-blue-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-base text-blue-800 dark:text-blue-200">How can we help?</h3>
                            </div>
                            <ul className="flex flex-col p-2">
                                {actionButtons.map((btn) => (
                                    <motion.li key={btn.title} variants={listItemVariants}>
                                        <div onClick={() => { btn.action(); setIsOpen(false); }}>
                                            <div className="flex items-center gap-4 w-full px-3 py-3 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer rounded-lg group">
                                                {btn.icon}<span className="font-semibold text-sm">{btn.title}</span>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button
                    onTap={handleMainButtonClick}
                    className={`${isMessagesOpen ? 'hidden' : 'relative flex'} items-center justify-center gap-3 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 z-50 w-44`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ userSelect: 'none' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span key={isAnyOverlayOpen ? 'close' : (isOpen ? 'closeMenu' : 'help')} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className="flex items-center justify-center gap-2 w-full text-sm">
                            {isAnyOverlayOpen || isOpen ? (<><span>Close</span><X size={18} strokeWidth={3} /></>) : (<><span>Help & Support</span><motion.div animate={{ rotate: [0, -20, 20, -20, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 1 }}><Bot size={18} strokeWidth={2.5} /></motion.div></>)}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>
            </motion.div>
        </>
    );
}