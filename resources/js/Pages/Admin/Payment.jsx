import React, { useState, useEffect, useRef, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useDebounce } from 'use-debounce';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from 'lucide-react';

// Icons
import { Search, DollarSign, FileText, CalendarDays, Eye, FileQuestion, X, CheckCircle2, Clock, XCircle, UserCheck } from 'lucide-react';

// --- StatusBadge and Modal components remain the same ---

const StatusBadge = ({ status }) => {
    const config = {
        'Paid': { classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: <CheckCircle2 size={14} /> },
        'Pending Payment': { classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: <Clock size={14} /> },
        'Rejected': { classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: <XCircle size={14} /> },
    };
    const currentStatus = config[status] || { classes: 'bg-gray-200', icon: <DollarSign size={14} /> };
    return <span className={clsx('px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-x-1.5', currentStatus.classes)}>{currentStatus.icon}{status}</span>;
};


const Modal = ({ show, onClose, children, title }) => {
    useEffect(() => { const handleEsc = (e) => e.keyCode === 27 && onClose(); window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, [onClose]);
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3><button onClick={onClose} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1.5"><X size={20} /></button></div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};


export default function Payment({ payments = { data: [], links: [] }, filters = {} }) {
    const isInitialMount = useRef(true);
    const [filter, setFilter] = useState({ search: filters.search || '', status: filters.status || 'All' });
    const [debouncedFilter] = useDebounce(filter, 300);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // --- Tour function remains the same ---
     const startTour = () => {
        const driverObj = driver({
            showProgress: true, popoverClass: 'driverjs-theme',
            steps: [
                { element: '#payment-header', popover: { title: 'Payment History', description: 'Dito mo makikita ang lahat ng transaksyon.' } },
                { element: '#payment-search-input', popover: { title: 'Search Transactions', description: 'Maghanap gamit ang pangalan ng residente.' } },
                { element: '#payment-status-filter', popover: { title: 'Filter by Status', description: 'I-filter ang listahan sa "Paid" o "Unpaid".' } },
                { element: '#payment-list-container', popover: { title: 'Transaction Records', description: 'Ito ang listahan ng mga transaksyon.' } },
                { element: '#first-receipt-button', popover: { title: 'View Receipt', description: 'I-click ang icon na ito para makita ang resibo.', side: "left" } },
            ]
        });
        driverObj.drive();
    };


    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        router.get(route('admin.payment'), debouncedFilter, { preserveState: true, replace: true });
    }, [debouncedFilter]);

    const openReceiptModal = (payment) => { setSelectedPayment(payment); setShowReceiptModal(true); };
    
    // The paymentData prop already contains all data from the controller, so no changes needed here.
    const paymentData = useMemo(() => payments.data || [], [payments.data]);
    
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <AuthenticatedLayout>
            <Head title="Payment History" />
            <style>{`.driverjs-theme { background-color: #ffffff; color: #1f2937; border-radius: 0.5rem; } .dark .driverjs-theme { background-color: #1f2937; color: #f9fafb; } .driverjs-popover-arrow { border-color: transparent; } .driverjs-theme .driverjs-popover-title { font-size: 1.25rem; }`}</style>
            
            <div className="py-12 bg-slate-100 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
                    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-lg sm:rounded-xl">
                        
                        {/* --- Header and Search/Filter UI remain the same --- */}
                        <div id="payment-header" className="p-6 flex flex-col md:flex-row gap-4 justify-between md:items-center border-b border-slate-200 dark:border-slate-700">
                             <div>
                                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Payment Transactions</h1>
                                 <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">History of all paid and unpaid transactions.</p>
                             </div>
                             <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                 <div className="relative flex-grow md:flex-grow-0">
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
                                     <input id="payment-search-input" type="text" placeholder="Search..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="block w-full md:w-64 pl-10 pr-3 py-2 border-slate-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                 </div>
                                  <button onClick={startTour} className="flex items-center gap-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" aria-label="Start tour">
                                     <HelpCircle className="h-5 w-5" />
                                     <span className="hidden sm:inline text-xs">Need Help?</span>
                                 </button>
                             </div>
                         </div>
                         <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                             <div id="payment-status-filter" className="flex items-center gap-6">
                                 {['All', 'Paid', 'Unpaid'].map(status => (
                                     <button 
                                         key={status} 
                                         onClick={() => setFilter({ ...filter, status })} 
                                         className={clsx('px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200', 
                                             filter.status === status 
                                             ? 'bg-blue-600 text-white shadow-md' 
                                             : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white'
                                         )}
                                     >
                                         {status}
                                     </button>
                                 ))}
                             </div>
                         </div>
                        
                        <motion.div id="payment-list-container" variants={containerVariants} initial="hidden" animate="visible">
                            {paymentData.length > 0 ? (
                                <>
                                    {/* UPDATED: Mobile View now includes Document Type and Amount */}
                                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                                        {paymentData.map((payment, index) => (
                                            <motion.div variants={itemVariants} key={payment.id} className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{payment.requestor_name}</div>
                                                        <div className="text-sm text-slate-500">{payment.document_name}</div>
                                                    </div>
                                                    <StatusBadge status={payment.status} />
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-3">
                                                    <p className="flex justify-between items-center"><span className='flex items-center gap-2'><DollarSign size={14} /> Amount</span> <span className='font-semibold'>₱{Number(payment.amount).toFixed(2)}</span></p>
                                                    <p className="flex justify-between items-center"><span className='flex items-center gap-2'><CalendarDays size={14} /> Date</span> <span>{payment.date}</span></p>
                                                    <p className="flex justify-between items-center"><span className='flex items-center gap-2'><UserCheck size={14} /> Processed By</span> <span>{payment.processed_by || 'N/A'}</span></p>
                                                </div>
                                                {payment.payment_receipt_url && (<button id={index === 0 ? 'first-receipt-button' : undefined} onClick={() => openReceiptModal(payment)} className="w-full flex justify-center items-center gap-2 text-center mt-2 p-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900"><Eye size={16}/> View Receipt</button>)}
                                            </motion.div>
                                        ))}
                                    </div>
                                    
                                    {/* UPDATED: Desktop Table now includes Document Type and Amount columns */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Requestor</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Document</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Processed By</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Receipt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                                {paymentData.map((payment, index) => (
                                                    <motion.tr variants={itemVariants} key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="font-medium text-gray-900 dark:text-white">{payment.requestor_name}</div>
                                                            <div className="text-slate-500 mt-1"><StatusBadge status={payment.status} /></div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{payment.document_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">₱{Number(payment.amount).toFixed(2)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{payment.date}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{payment.processed_by || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {payment.payment_receipt_url && (<button id={index === 0 ? 'first-receipt-button' : undefined} onClick={() => openReceiptModal(payment)} className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-full transition"><Eye className="w-5 h-5" /></button>)}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-20"><FileQuestion className="mx-auto h-16 w-16 text-slate-400" /><h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No Transactions Found</h3><p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter.</p></div>
                            )}
                        </motion.div>
                        
                        {/* --- Pagination and Modal remain the same --- */}
                        {paymentData.length > 0 && (
                             <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700 gap-4">
                                 <p className="text-sm text-slate-700 dark:text-slate-400">Showing <span className="font-medium">{payments.from || 0}</span> to <span className="font-medium">{payments.to || 0}</span> of <span className="font-medium">{payments.total || 0}</span> results</p>
                                 {payments.links && payments.links.length > 3 && (
                                     <nav className="flex items-center gap-1 flex-wrap justify-center">
                                         {payments.links.map((link, index) => {
                                             const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');
                                             return <Link key={index} href={link.url || '#'} preserveScroll className={clsx('px-3 py-2 text-sm rounded-md leading-4 transition-colors', !link.url ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-slate-700', link.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white dark:bg-slate-800')}>{label}</Link>;
                                         })}
                                     </nav>
                                 )}
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <Modal show={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Receipt">
                {selectedPayment?.payment_receipt_url ? ( <img src={selectedPayment.payment_receipt_url} alt="Payment Receipt" className="w-full h-auto rounded-lg" /> ) : ( <p className="text-center text-slate-500">Receipt not available.</p> )}
            </Modal>
        </AuthenticatedLayout>
    );
}