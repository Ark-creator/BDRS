import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
    Users, FolderGit2, Megaphone, PlusCircle, History, Banknote, 
    MessageSquare, FilePlus, CheckCircle, XCircle, Eye, Building, FileText 
} from 'lucide-react';
import SystemStatus from '@/Components/SystemStatus';

// --- Reusable UI Components ---
const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="relative overflow-hidden bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

// --- IBALIK ANG MGA ITO PARA SA AREA CHART (1 of 2) ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="label font-semibold text-gray-800 dark:text-gray-200">{`Requests: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


// --- Main Dashboard Component ---
export default function AdminDashboard({ 
    auth, 
    stats = [], 
    pendingRequests = [], 
    documentBreakdown = [], 
    recentActivities = [] 
}) {
    // --- IBALIK ANG MGA ITO PARA SA AREA CHART (2 of 2) ---
    const [chartTimeframe, setChartTimeframe] = useState('Weekly');
    const chartData = {
        Weekly: [ { name: 'Mon', reqs: 12 }, { name: 'Tue', reqs: 19 }, { name: 'Wed', reqs: 15 }, { name: 'Thu', reqs: 25 }, { name: 'Fri', reqs: 22 }, { name: 'Sat', reqs: 32 }, { name: 'Sun', reqs: 28 } ],
        Monthly: [ { name: 'Week 1', reqs: 88 }, { name: 'Week 2', reqs: 110 }, { name: 'Week 3', reqs: 140 }, { name: 'Week 4', reqs: 125 } ]
    };


    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
    
    const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#a5b4fc'];
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <AuthenticatedLayout user={auth.user} >
            <Head title="Admin Dashboard" />
            
            <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
                <div className="absolute top-0 -left-4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-16 -right-4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div className="max-w-screen-xl mx-auto sm:px-6 lg:px-8 py-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Welcome Back, {auth.user.full_name}!</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{today}</p>
                        </div>
                        <div className="md:shrink-0">
                             <SystemStatus />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map(action => (
                            <Link key={action.label} href={action.href} className="flex items-center justify-center gap-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
                                <action.icon className="text-blue-600 dark:text-blue-400" size={20}/>
                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stats.map((stat, index) => {
                                const IconComponent = iconMap[stat.icon];
                                if (!IconComponent) {
                                    return <StatCard key={index} icon={FileText} {...stat} title={`Unknown Icon: ${stat.title}`} />;
                                }
                                return <StatCard key={index} icon={IconComponent} {...stat} />;
                            })}
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                             <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-lg">Action Required: Pending Requests</h3>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                         <tr>
                                             <th className="py-3 px-4">Resident</th>
                                             <th className="py-3 px-4">Document</th>
                                             <th className="py-3 px-4">Date</th>
                                             <th className="py-3 px-4 text-center">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {pendingRequests.map(req => (
                                             <tr key={req.id} className="border-t border-gray-200 dark:border-gray-700">
                                                 <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{req.name}</td>
                                                 <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{req.docType}</td>
                                                 <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{req.date}</td>
                                                 <td className="py-3 px-4 text-center">
                                                     <Link href={route('admin.request')} className="p-2 text-gray-500 hover:text-blue-600 transition-colors"><Eye size={16}/></Link>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Document Breakdown</h3>
                            <div className="h-56 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={documentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5}>
                                            {documentBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                             <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                             <ul className="space-y-4">
                                {recentActivities.length > 0 ? recentActivities.map((activity) => {
                                    const Icon = notificationIcons[activity.type] || notificationIcons.default;
                                    const actionText = activity.status === 'Claimed' ? 'approved' : 'rejected';
                                    const iconColor = activity.status === 'Claimed' ? 'text-green-500' : 'text-red-500';

                                    return (
                                        <li key={activity.id} className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                                <Icon className={iconColor} size={20} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{activity.processor_name}</span>
                                                    {` ${actionText} the request for `}
                                                    <span className="font-semibold text-gray-900 dark:text-white">{activity.document_name}</span>.
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                                            </div>
                                        </li>
                                    );
                                }) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities found.</p>
                                )}
                             </ul>
                        </motion.div>
                    </div>
                </div>

                {/* --- IBALIK ANG FULL-WIDTH CHART --- */}
                <motion.div variants={itemVariants} className="mt-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Request Volume</h3>
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg text-sm">
                            <button onClick={() => setChartTimeframe('Weekly')} className={`px-3 py-1 rounded-md transition-colors ${chartTimeframe === 'Weekly' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>Weekly</button>
                            <button onClick={() => setChartTimeframe('Monthly')} className={`px-3 py-1 rounded-md transition-colors ${chartTimeframe === 'Monthly' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>Monthly</button>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData[chartTimeframe]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs><linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-xs text-gray-500" />
                                <YAxis tick={{ fill: 'currentColor' }} className="text-xs text-gray-500" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="reqs" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReqs)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </motion.div>
        </AuthenticatedLayout>
    );
}