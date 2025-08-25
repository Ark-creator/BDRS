// src/components/MessagesModal.js

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, ArrowLeft } from 'lucide-react';
import axios from 'axios'; // 👈 Import axios
import { route } from 'ziggy-js'; // 👈 Import ziggy

// Remove initialMessages array, we will get data from props

const Backdrop = ({ onClick }) => (
    <motion.div
        onClick={onClick}
        className="fixed inset-0 bg-black/50 z-50 hidden sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    />
);

// 👇 --- ACCEPT NEW PROPS --- 👇
export default function MessagesModal({ onClose, initialConversation, onNewMessage }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // 👇 --- UPDATE STATE WHEN PROPS CHANGE --- 👇
    useEffect(() => {
        setMessages(initialConversation || []);
    }, [initialConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 👇 --- REWRITE SEND MESSAGE LOGIC --- 👇
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();
        if (trimmedMessage === '') return;

        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            text: trimmedMessage,
            sender: 'user',
        };

        // Optimistically update the UI for a snappy feel
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setNewMessage('');

        try {
            // Post the new message to the backend
            await axios.post(route('residents.conversations.store'), {
                message: trimmedMessage,
            });
            // On success, trigger a refetch of all messages from the parent
            onNewMessage();
        } catch (error) {
            console.error("Failed to send message:", error);
            // Optional: Handle error, maybe show a "failed to send" indicator
            // and revert the optimistic update
            setMessages(messages); // Revert to original messages before the optimistic update
        }
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
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
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