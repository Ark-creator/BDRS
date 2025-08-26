import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bot, X, HelpCircle } from 'lucide-react';
import { route } from 'ziggy-js';
import axios from 'axios';

// Lazily load the MessagesModal to improve initial page load performance
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
    const { props } = usePage();
    const { auth: { user } } = props;
    const isVerified = user.verification_status === 'verified';

    // State for UI control
    const [isOpen, setIsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    
    // State for conversation data
    const [conversations, setConversations] = useState([]);
    const [threadId, setThreadId] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    
    // Refs and state for drag functionality
    const constraintsRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({
        positionClasses: 'bottom-full mb-3 right-0',
        originClass: 'origin-bottom-right',
    });

    // Fetches the conversation history from the server
    const fetchConversations = async () => {
        setIsLoadingMessages(true);
        setFetchError(null); // Reset error on each fetch attempt
        try {
            const response = await axios.get(route('residents.conversations.index'));
            setConversations(response.data.messages || []); // Fallback to empty array
            setThreadId(response.data.thread_id);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            setFetchError("Couldn't load messages. Please try again later.");
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // Fetch conversations when the messages modal is opened
    useEffect(() => {
        if (isMessagesOpen) {
            fetchConversations();
        }
    }, [isMessagesOpen]);

    // Effect to initialize and manage the third-party Chatbase script
    useEffect(() => {
        window.chatbaseConfig = { chatId: "JpK2sH4Fo9CfxCa8CTn70", openOnLoad: false };
        if (!window.chatbase || window.chatbase("getState") !== "initialized") {
            window.chatbase = (...args) => { (window.chatbase.q = window.chatbase.q || []).push(args); };
            window.chatbase = new Proxy(window.chatbase, { get(target, prop) { if (prop === "q") return target.q; return (...args) => target(prop, ...args); } });
        }
        
        const setupChatbaseListeners = () => {
            // This listener syncs our component's state when the user closes the chat from inside the widget
            window.chatbase('on', 'close', () => setIsChatOpen(false));
        };

        const loadScript = () => {
            if (document.getElementById("JpK2sH4Fo9CfxCa8CTn70")) {
                setupChatbaseListeners();
                return;
            }
            const script = document.createElement("script");
            script.src = "https://www.chatbase.co/embed.min.js";
            script.id = "JpK2sH4Fo9CfxCa8CTn70";
            script.setAttribute('domain', 'www.chatbase.co');
            script.defer = true;
            script.onload = setupChatbaseListeners;
            document.body.appendChild(script);
        };

        if (document.readyState === "complete") { loadScript(); }
        else { window.addEventListener("load", loadScript); return () => window.removeEventListener("load", loadScript); }
    }, []);

    // Effect to hide the default Chatbase launcher button
    useEffect(() => {
        const launcherId = 'chatbase-bubble-button';
        const observer = new MutationObserver(() => {
            const launcher = document.getElementById(launcherId);
            if (launcher) {
                launcher.style.display = 'none';
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);
    
    const toggleMessages = () => {
        setIsMessagesOpen(prev => !prev);
        setIsOpen(false);
    };

    const openChatbot = () => {
        if (window.chatbase) {
            window.chatbase('open');
            setIsChatOpen(true); // Manually set state to ensure UI updates immediately
            setIsOpen(false);
        } else {
            console.error("Chatbase is not available.");
        }
    };
    
    // Main button handler: Closes any open overlay or toggles the menu
    const handleMainButtonClick = () => {
        if (isMessagesOpen) {
            setIsMessagesOpen(false);
        } else if (isChatOpen) {
            if (window.chatbase) {
                window.chatbase('close');
            }
            setIsChatOpen(false); // Manually set state for immediate UI feedback
        } else {
            toggleMenu();
        }
    };

    const handleTourClick = () => {
        router.get(route('residents.home', { action: 'tour' }));
        setIsOpen(false);
    };
    
    // Adjusts the menu position based on where the FAB is dragged
    const handleDragEnd = (event) => {
        const fabElement = event.target.closest('.draggable-fab');
        if (!fabElement) return;
        const { top, left, width, height } = fabElement.getBoundingClientRect();
        const y = top + height / 2;
        const x = left + width / 2;
        
        let newPosition = {};
        newPosition.positionClasses = y < window.innerHeight / 2 ? 'top-full mt-3' : 'bottom-full mb-3';
        newPosition.originClass = y < window.innerHeight / 2 
            ? (x < window.innerWidth / 2 ? 'origin-top-left' : 'origin-top-right')
            : (x < window.innerWidth / 2 ? 'origin-bottom-left' : 'origin-bottom-right');
        newPosition.positionClasses += x < window.innerWidth / 2 ? ' left-0' : ' right-0';
        
        setMenuPosition(newPosition);
    };

    const listContainerVariants = { opened: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25, when: "beforeChildren", staggerChildren: 0.07 } }, closed: { opacity: 0, scale: 0.9, y: 20, transition: { when: "afterChildren", duration: 0.25 } } };
    const listItemVariants = { opened: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }, closed: { opacity: 0, x: -20, transition: { duration: 0.2 } } };
    
    const actionButtons = [
        { icon: <Bot size={22} className="text-blue-600 dark:text-blue-400" />, action: openChatbot, title: 'Chat with AI Assistant' },
        ...(isVerified ? [{ icon: <HelpCircle size={22} className="text-blue-600 dark:text-blue-400" />, action: handleTourClick, title: 'How to Request' }] : []),
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
                    <Suspense fallback={<div />}>
                        <MessagesModal
                            onClose={() => setIsMessagesOpen(false)}
                            initialConversation={conversations}
                            threadId={threadId}
                            onNewMessage={fetchConversations}
                            isLoading={isLoadingMessages}
                            error={fetchError}
                        />
                    </Suspense>
                )}
            </AnimatePresence>

            <motion.div
                className="fixed bottom-6 right-6 z-[2147483647] cursor-grab draggable-fab"
                drag
                dragConstraints={constraintsRef}
                dragMomentum={false}
                onDragStart={() => isOpen && setIsOpen(false)}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            >
                <AnimatePresence>
                    {isOpen && !isAnyOverlayOpen && (
                        <motion.div
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
                                        <div onClick={() => { btn.action(); setIsOpen(false); }} className="flex items-center gap-4 w-full px-3 py-3 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer rounded-lg group">
                                            {btn.icon}
                                            <span className="font-semibold text-sm">{btn.title}</span>
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
                        <motion.span 
                            key={isAnyOverlayOpen || isOpen ? 'close' : 'help'} 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: 10 }} 
                            transition={{ duration: 0.2 }} 
                            className="flex items-center justify-center gap-2 w-full text-sm"
                        >
                            {isAnyOverlayOpen || isOpen ? (
                                <><span>Close</span><X size={18} strokeWidth={3} /></>
                            ) : (
                                <>
                                    <span>Help & Support</span>
                                    <motion.div 
                                        animate={{ rotate: [0, -20, 20, -20, 0] }} 
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 1 }}
                                    >
                                        <Bot size={18} strokeWidth={2.5} />
                                    </motion.div>
                                </>
                            )}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>
            </motion.div>
        </>
    );
}