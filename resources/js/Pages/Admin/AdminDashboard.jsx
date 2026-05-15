import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Users, FolderGit2, Megaphone, PlusCircle, History, Banknote, 
    FilePlus, CheckCircle, XCircle, Eye, Building, FileText, HelpCircle,
    CalendarDays, Clock
} from 'lucide-react';
import SystemStatus from '@/Components/SystemStatus';
import {
    ResponsiveTable,
    ResponsiveTableBody,
    ResponsiveTableCell,
    ResponsiveTableEmpty,
    ResponsiveTableHead,
    ResponsiveTableHeaderCell,
    ResponsiveTableRow,
} from '@/Components/ResponsiveTable';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500 ${color?.bg || 'bg-blue-500'}`}></div>
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</p>
                <p className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
            </div>
            <div className={`p-4 rounded-3xl ${color?.bg || 'bg-blue-50'} ${color?.text || 'text-blue-600'} group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300`}>
                {Icon && <Icon size={38} strokeWidth={2} />}
            </div>
        </div>
    </div>
);

const AreaChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-blue-100 dark:border-blue-900/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {payload[0].value} <span className="text-sm font-normal text-gray-500">requests</span>
              </p>
          </div>
        </div>
      );
    }
    return null;
};

export default function AdminDashboard({ 
    auth, 
    stats = [], 
    pendingRequests = [], 
    documentBreakdown = [], 
    recentActivities = [] 
}) {
    const [chartTimeframe, setChartTimeframe] = useState('Weekly');
    const chartData = {
        Weekly: [ { name: 'Mon', reqs: 12 }, { name: 'Tue', reqs: 19 }, { name: 'Wed', reqs: 15 }, { name: 'Thu', reqs: 25 }, { name: 'Fri', reqs: 22 }, { name: 'Sat', reqs: 32 }, { name: 'Sun', reqs: 28 } ],
        Monthly: [ { name: 'Week 1', reqs: 88 }, { name: 'Week 2', reqs: 110 }, { name: 'Week 3', reqs: 140 }, { name: 'Week 4', reqs: 125 } ]
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const totalDocuments = useMemo(() => {
        return documentBreakdown.reduce((sum, item) => sum + item.value, 0);
    }, [documentBreakdown]);

    const sortedDocuments = useMemo(() => {
        return [...documentBreakdown].sort((a, b) => b.value - a.value);
    }, [documentBreakdown]);

    const iconMap = {
        'Users': Users,
        'FolderGit': FolderGit2,
        'Banknote': Banknote,
        'Building': Building
    };

    const quickActions = [
        { label: "View Requests", icon: FilePlus, href: route('admin.request') },
        { label: "Announcements", icon: Megaphone, href: route('admin.announcements.index') },
        { label: "Manage Documents", icon: PlusCircle, href: route('admin.documents') },
        { label: "View History", icon: History, href: route('admin.history') },
    ];
     
    const notificationIcons = {
        request_completed: CheckCircle,
        request_rejected: XCircle,
        default: FileText,
    };
    
    const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
    
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
    
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#dashboard-header', popover: { title: 'Welcome!', description: 'This is your main dashboard overview.' } },
                { element: '#document-breakdown-card', popover: { title: 'Document Breakdown', description: 'See which documents are the most requested.' } },
                { element: '#request-volume-chart', popover: { title: 'Request Volume', description: 'Analyze the trend of your document requests.' } }
            ]
        });
        driverObj.drive();
    };

    return (
        <AuthenticatedLayout user={auth.user} >
            <Head title="Admin Dashboard" />
            
            <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
                <div className="absolute top-0 -left-4 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-16 -right-4 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div className="max-w-screen-xl mx-auto sm:px-6 lg:px-8 py-8" variants={containerVariants} initial="hidden" animate="visible">
                
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end gap-5 mb-8" id="dashboard-header">
                        <div className="text-center md:text-left w-full md:w-auto">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white tracking-tight">Welcome Back, {auth.user.full_name}!</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{today}</p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-2 rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm w-full md:w-auto">
                             <div className="flex-1 flex justify-center md:justify-start pl-2">
                                 <SystemStatus />
                             </div>
                             
                             <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block mx-1"></div>
                             
                             <button 
                                onClick={startTour} 
                                className="flex items-center justify-center gap-2 p-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold text-sm shadow-sm"
                             >
                                 <HelpCircle size={18} />
                                 <span className="hidden sm:inline">Help</span>
                             </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="quick-actions">
                        {quickActions.map(action => (
                            <Link key={action.label} href={action.href} className="group flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all text-center sm:text-left">
                                <div className="p-2.5 bg-blue-50 dark:bg-gray-700 rounded-xl group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-all">
                                    <action.icon className="text-blue-600 dark:text-blue-400" size={22}/>
                                </div>
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6" id="stats-cards">
                            {stats
                                .filter(stat => !stat.title.toLowerCase().includes('revenue') && !stat.title.toLowerCase().includes('system status'))
                                .map((stat, index) => {
                                    let iconName = stat.icon;
                                    if (stat.title.toLowerCase().includes('resident')) iconName = 'Users';
                                    if (stat.title.toLowerCase().includes('pending')) iconName = 'Clock';
                                    
                                    const IconComponent = iconName === 'Clock' ? Clock : (iconMap[iconName] || FileText);
                                    
                                    let customColor = stat.color;
                                    if (stat.title.toLowerCase().includes('resident')) {
                                        customColor = { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
                                    }
                                    if (stat.title.toLowerCase().includes('pending')) {
                                        customColor = { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-500 dark:text-amber-400' };
                                    }

                                    return <StatCard key={index} icon={IconComponent} title={stat.title} value={stat.value} color={customColor} />;
                                })
                            }
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700" id="pending-requests-card">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                                 <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Action Required</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and process new document requests</p>
                                 </div>
                                 <span className="inline-flex w-max items-center gap-1.5 bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 dark:border-red-500/30">
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                     </span>
                                     {pendingRequests.length} Pending
                                 </span>
                             </div>
                             
                             <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 overflow-hidden bg-white dark:bg-gray-800">
                                 <ResponsiveTable className="mb-0">
                                     <ResponsiveTableHead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                                         <tr>
                                             <ResponsiveTableHeaderCell className="py-4 text-[11px] font-bold tracking-widest text-gray-500">Resident</ResponsiveTableHeaderCell>
                                             <ResponsiveTableHeaderCell className="py-4 text-[11px] font-bold tracking-widest text-gray-500">Document Type</ResponsiveTableHeaderCell>
                                             <ResponsiveTableHeaderCell className="py-4 text-[11px] font-bold tracking-widest text-gray-500">Date Requested</ResponsiveTableHeaderCell>
                                             <ResponsiveTableHeaderCell className="py-4 text-[11px] font-bold tracking-widest text-gray-500 text-center">Action</ResponsiveTableHeaderCell>
                                         </tr>
                                     </ResponsiveTableHead>
                                     <ResponsiveTableBody>
                                         {pendingRequests.length > 0 ? pendingRequests.map((req, index) => (
                                             <ResponsiveTableRow key={req.id} className={`md:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200 ${index !== pendingRequests.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}`}>
                                                 
                                                 <ResponsiveTableCell label="Resident">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm border border-blue-100 dark:border-gray-700">
                                                            {req.name.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{req.name}</span>
                                                    </div>
                                                 </ResponsiveTableCell>

                                                 <ResponsiveTableCell label="Document">
                                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 text-xs font-medium border border-gray-100 dark:border-gray-600/50">
                                                        <FileText size={14} className="text-blue-500 dark:text-blue-400"/> 
                                                        {req.docType}
                                                     </span>
                                                 </ResponsiveTableCell>

                                                 <ResponsiveTableCell label="Date">
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                                        <CalendarDays size={15} className="text-gray-400 dark:text-gray-500"/>
                                                        {req.date}
                                                    </div>
                                                 </ResponsiveTableCell>

                                                 <ResponsiveTableCell label="Actions" className="md:text-center" contentClassName="flex justify-end md:justify-center">
                                                     <Link 
                                                        href={route('admin.request')} 
                                                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-white border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/30 transition-all duration-300"
                                                     >
                                                         <Eye size={16}/>
                                                         <span className="hidden sm:inline">Review</span>
                                                     </Link>
                                                 </ResponsiveTableCell>

                                             </ResponsiveTableRow>
                                         )) : (
                                             <ResponsiveTableEmpty colSpan="4" className="py-12">
                                                 <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-3">
                                                        <CheckCircle size={36} className="text-green-500"/>
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">All Caught Up!</h4>
                                                    <p className="text-sm text-center">There are no pending requests right now.</p>
                                                 </div>
                                             </ResponsiveTableEmpty>
                                         )}
                                     </ResponsiveTableBody>
                                 </ResponsiveTable>
                             </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full" id="document-breakdown-card">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Document Breakdown</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Most requested document types</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-0.5">Total</span>
                                    <span className="text-lg font-black text-blue-700 dark:text-blue-300 leading-none">{totalDocuments}</span>
                                </div>
                            </div>
                            
                            {sortedDocuments.length > 0 ? (
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                    {sortedDocuments.map((item, index) => {
                                        const percent = totalDocuments > 0 ? ((item.value / totalDocuments) * 100).toFixed(1) : 0;
                                        const barColor = COLORS[index % COLORS.length];

                                        return (
                                            <div key={index} className="group">
                                                <div className="flex justify-between items-end mb-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: barColor }}></div>
                                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-black text-gray-900 dark:text-white">{item.value}</span>
                                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-10 text-right">{percent}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                                        className="h-full rounded-full" 
                                                        style={{ backgroundColor: barColor }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                                    No document data available.
                                </div>
                            )}
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex-1" id="recent-activity-card">
                             <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 text-lg">Recent Activity</h3>
                             <ul className="space-y-5">
                                {recentActivities.length > 0 ? recentActivities.map((activity) => {
                                    const Icon = notificationIcons[activity.type] || notificationIcons.default;
                                    const actionText = activity.status === 'Claimed' ? 'approved' : 'rejected';
                                    const iconColor = activity.status === 'Claimed' ? 'text-green-500' : 'text-red-500';
                                    const bgColor = activity.status === 'Claimed' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10';

                                    return (
                                        <li key={activity.id} className="flex items-start gap-4 group">
                                            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${bgColor} ring-4 ring-white dark:ring-gray-800 group-hover:scale-110 transition-transform`}>
                                                <Icon className={iconColor} size={18} />
                                            </div>
                                            <div className="flex-grow pt-1">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                                    <span className="font-bold text-gray-900 dark:text-white">{activity.processor_name}</span>
                                                    {` ${actionText} the request for `}
                                                    <span className="font-medium text-gray-900 dark:text-white">{activity.document_name}</span>.
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                                            </div>
                                        </li>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                                        <History size={24} className="mb-2 opacity-50"/>
                                        <p>No recent activities found.</p>
                                    </div>
                                )}
                             </ul>
                        </motion.div>
                    </div>
                </div>

                <motion.div variants={itemVariants} className="mt-8 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700" id="request-volume-chart">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Request Volume</h3>
                            <p className="text-sm text-blue-500 dark:text-blue-400 font-medium">Tracking total documents processed</p>
                        </div>
                        
                        <div className="flex bg-gray-50 dark:bg-gray-900/80 p-1 rounded-xl text-sm border border-gray-100 dark:border-gray-700 w-full sm:w-auto">
                            <button 
                                onClick={() => setChartTimeframe('Weekly')} 
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg transition-all duration-300 font-semibold ${chartTimeframe === 'Weekly' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                            >
                                Weekly
                            </button>
                            <button 
                                onClick={() => setChartTimeframe('Monthly')} 
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg transition-all duration-300 font-semibold ${chartTimeframe === 'Monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                    
                    <div className="h-64 sm:h-80 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData[chartTimeframe]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                        <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" dark:stroke="#374151" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={15} 
                                />
                                <YAxis 
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dx={-10}
                                />
                                <Tooltip content={<AreaChartTooltip />} cursor={{ stroke: '#93c5fd', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="reqs" 
                                    stroke="#2563eb" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorReqs)" 
                                    activeDot={{ r: 7, strokeWidth: 3, stroke: '#ffffff', fill: '#2563eb', className: "shadow-md" }} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </motion.div>
        </AuthenticatedLayout>
    );
}