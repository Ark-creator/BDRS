// src/components/MessagesModal.js

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, ArrowLeft } from 'lucide-react';

const initialMessages = [
    { id: 1, text: "Hello! Paano po kami makakatulong sa inyo ngayon?", sender: 'admin' },
    { id: 2, text: "Hi, gusto ko lang po magtanong tungkol sa status ng aking request.", sender: 'user' },
    { id: 3, text: "Sige po. Paki-provide lang po ang inyong request tracking number.", sender: 'admin' },
];

const Backdrop = ({ onClick }) => (
    <motion.div
        onClick={onClick}
        className="fixed inset-0 bg-black/50 z-50 hidden sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    />
);

export default function MessagesModal({ onClose }) {
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        const userMessage = { id: messages.length + 1, text: newMessage, sender: 'user' };
        setMessages([...messages, userMessage]);
        setNewMessage('');
        setTimeout(() => {
            const adminReply = { id: messages.length + 2, text: "Salamat sa iyong mensahe. Babalikan ka namin sa lalong madaling panahon.", sender: 'admin' };
            setMessages(prevMessages => [...prevMessages, adminReply]);
        }, 1500);
    };

    const modalVariants = {
        hidden: { opacity: 0, y: "100%" },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: "100%" },
    };

    const desktopModalVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    return (
        <>
            <Backdrop onClick={onClose} />
            <motion.div
                className="fixed inset-0 z-[2147483647] bg-white dark:bg-slate-900 flex flex-col
                           sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[550px]
                           sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700 sm:dark:bg-slate-800"
                variants={isMobile ? modalVariants : desktopModalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
                <div className="flex items-center justify-between p-4 bg-blue-600 text-white flex-shrink-0 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                         <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-700 transition-colors sm:hidden">
                            <ArrowLeft size={22} />
                        </button>
                        <h3 className="font-bold text-lg">Support Messages</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-700 transition-colors hidden sm:block">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                    <div className="flex flex-col gap-3">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 sm:rounded-b-2xl">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </>
    );
}